import { trackByFn } from '../../../../shared/utils/track-by.util';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject, throwError, timer } from 'rxjs';
import { retry, takeUntil } from 'rxjs/operators';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';

import {
  UnifiedPaymentService,
  PaymentMethod,
  PaymentStatus,
  PaymentContext,
  InitiatePaymentDto
} from '../../services/unified-payment.service';
import { PaymentLinkService, PaymentLinkDetails } from '../../services/payment-link.service';
import { AnonymousUserService } from 'src/app/shared/services/anonymous-user.service';
import { LocationPaymentService } from 'src/app/shared/store/payment-location/location-payment.service';
import { RealtimeService } from 'src/app/core/realtime';
import { NgIf, NgClass, NgSwitch, NgSwitchCase, NgFor, UpperCasePipe, SlicePipe, DatePipe, DecimalPipe } from '@angular/common';
import { isAllowedRedirect } from 'src/app/shared/utils/safe-redirect';

@Component({
  selector: 'app-payment-page',
  templateUrl: './payment-page.component.html',
  styleUrls: ['./payment-page.component.scss'],
  standalone: true,
  imports: [RouterLink,NgIf, NgClass, NgSwitch, NgSwitchCase, FormsModule, ReactiveFormsModule, NgFor, UpperCasePipe, SlicePipe, DatePipe, DecimalPipe, TranslatePipe]
})
export class PaymentPageComponent implements OnInit, OnDestroy {
  trackByFn = trackByFn;
  currentDate = new Date();


  private destroy$ = new Subject<void>();
  lang = 'fr';
  

  token = '';
  paymentDetails: PaymentLinkDetails | null = null;
  pageLoading = true;
  pageError: string | null = null;

  currentStep: 'method' | 'details' | 'processing' | 'result' = 'method';
  selectedMethod: PaymentMethod | null = null;

  amountForm: FormGroup;
  mobileForm: FormGroup;

  paymentStatus: PaymentStatus = 'idle';
  paymentError: string | null = null;
  /** externalRef retourné par POST /payment/initiate */
  externalRef: string | null = null;
  pollingAttempts = 0;
  /** Compteur d'erreurs réseau consécutives pendant le polling (Fix #8) */
  networkErrors = 0;
  /** 15 contrôles à 4 s puis 15 à 8 s : environ 3 min, comme avant. */
  readonly MAX_POLLING = 30;
  readonly MAX_NETWORK_ERRORS = 5;
  /** Code USSD affiché pour Mobile Money */
  ussdCode: string | null = null;
  /** Date d'expiration de la demande Mobile Money */
  expiresAt: string | null = null;

  /** Montants proposés (selon le contexte : loyer mensuel, dépôt…). */
  quickAmounts: number[] = [];

  /** Limites de l'agrégateur Mobile Money (identiques au serveur). */
  readonly MOBILE_MIN = 500;
  readonly MOBILE_MAX = 500_000;
  readonly CARD_MIN = 100;
  readonly CARD_MAX = 10_000_000;

  /** État du téléchargement du reçu (RENT uniquement) */
  isDownloadingReceipt = false;
  receiptDownloaded = false;
  receiptError: string | null = null;

  /** Fix #10 : mis à jour au moment réel du succès, pas à l'instanciation */
  today = new Date();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private paymentService: UnifiedPaymentService,
    private paymentLinkService: PaymentLinkService,
    private anonymousUserService: AnonymousUserService,
    private locationPaymentService: LocationPaymentService,
    private translate: TranslateService,
    private realtime: RealtimeService,
  ) {
    this.amountForm = this.fb.group({
      amount: [null, [Validators.required, Validators.min(this.MOBILE_MIN), Validators.max(this.MOBILE_MAX)]]
    });
    this.mobileForm = this.fb.group({
      // Numéro camerounais du bon opérateur (MTN : 67X, 68X, 650-654 ; Orange : 69X, 655-659, 66X).
      phone: ['', [Validators.required, (control: AbstractControl) => this.phoneValidator(control)]]
    });
  }

  ngOnInit(): void {
    this.lang = this.route.snapshot.paramMap.get('lang') || 'fr';
    this.token = this.route.snapshot.paramMap.get('token') || '';

    const qp = this.route.snapshot.queryParams;
    if (qp['payment'] === 'success' && qp['session_id']) {
      this.handleStripeReturn(qp['session_id']);
      return;
    }
    if (qp['payment'] === 'cancelled' && this.token === 'stripe-return') {
      this.paymentStatus = 'cancelled';
      this.currentStep = 'result';
      this.pageLoading = false;
      return;
    }
    if (qp['payment'] === 'cancelled') {
      this.paymentStatus = 'cancelled';
      this.currentStep = 'result';
      this.pageLoading = false;
      return;
    }

    if (!this.token) {
      this.pageError = this.t('PAYMENT_PAGE.ERRORS.INVALID_LINK');
      this.pageLoading = false;
      return;
    }

    this.loadPaymentDetails();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Chargement des détails ────────────────────────────────────────────────

  /**
   * Détails du paiement, toujours vérifiés par le serveur (signature et
   * expiration d'une session, lien de loyer actif). La page ne décode plus le
   * jeton elle-même : un jeton modifié (montant, redirections) était accepté.
   */
  loadPaymentDetails(): void {
    this.paymentLinkService.getPaymentDetails(this.token)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.paymentDetails = res.data;
          this.pageLoading = false;
          this.applyPaymentDetailsConfig();
        },
        error: (err) => {
          const status = err?.status;
          this.pageError = status === 401 || status === 404
            ? this.t('PAYMENT_PAGE.ERRORS.LINK_EXPIRED')
            : this.serverMessage(err) || this.t('PAYMENT_PAGE.ERRORS.LOAD_DETAILS');
          this.pageLoading = false;
        }
      });
  }

  private applyPaymentDetailsConfig(): void {
    if (!this.paymentDetails) return;
    if (this.paymentDetails.amount && !this.paymentDetails.amountEditable) {
      this.amountForm.patchValue({ amount: this.paymentDetails.amount });
      this.amountForm.get('amount')?.disable();
    } else if (this.paymentDetails.amount) {
      this.amountForm.patchValue({ amount: this.paymentDetails.amount });
    }
    this.quickAmounts = this.buildQuickAmounts();
  }

  /** Raccourcis de montant adaptés : multiples du loyer, paliers de dépôt ; aucun pour un montant fixé. */
  private buildQuickAmounts(): number[] {
    const base = Number(this.paymentDetails?.amount) || 0;
    const within = (values: number[]) => values.filter((v) => v >= this.MOBILE_MIN && v <= this.MOBILE_MAX);
    if (this.context === 'RENT' && base > 0) return within([base, base * 2, base * 3]);
    if (this.context === 'WALLET_DEPOSIT') return within([5_000, 10_000, 25_000, 50_000, 100_000]);
    return [];
  }

  // ─── Getters contexte ─────────────────────────────────────────────────────

  get context(): PaymentContext {
    return (this.paymentDetails?.context?.toUpperCase() as PaymentContext) || 'RENT';
  }

  get contextMeta(): { title: string; icon: string; color: string } {
    const icons: Record<string, string> = {
      RENT:           'fa-home',
      SUBSCRIPTION:   'fa-star',
      PREMIUM_ACCESS: 'fa-crown',
      WALLET_DEPOSIT: 'fa-wallet'
    };
    const colors: Record<string, string> = {
      RENT:           '#2563eb',
      SUBSCRIPTION:   '#059669',
      PREMIUM_ACCESS: '#d97706',
      WALLET_DEPOSIT: '#7c3aed'
    };
    const titleKeys: Record<string, string> = {
      RENT:           'PAYMENT_PAGE.CONTEXT.RENT_TITLE',
      SUBSCRIPTION:   'PAYMENT_PAGE.CONTEXT.SUBSCRIPTION_TITLE',
      PREMIUM_ACCESS: 'PAYMENT_PAGE.CONTEXT.PREMIUM_TITLE',
      WALLET_DEPOSIT: 'PAYMENT_PAGE.CONTEXT.WALLET_TITLE'
    };
    return {
      title: this.translate.instant(titleKeys[this.context] || 'PAYMENT_PAGE.CONTEXT.RENT_TITLE'),
      icon:  icons[this.context]  || 'fa-home',
      color: colors[this.context] || '#2563eb'
    };
  }

  get isAmountFixed(): boolean {
    return !!(this.paymentDetails?.amount && !this.paymentDetails?.amountEditable);
  }

  // ─── Navigation étapes ────────────────────────────────────────────────────

  selectMethod(method: PaymentMethod): void {
    this.selectedMethod = method;
    // Limites de montant du moyen choisi (Mobile Money : 500 à 500 000 FCFA).
    const amount = this.amountForm.get('amount');
    amount?.setValidators(method === 'card'
      ? [Validators.required, Validators.min(this.CARD_MIN), Validators.max(this.CARD_MAX)]
      : [Validators.required, Validators.min(this.MOBILE_MIN), Validators.max(this.MOBILE_MAX)]);
    amount?.updateValueAndValidity();
    this.mobileForm.get('phone')?.updateValueAndValidity();
    this.currentStep = 'details';
    this.paymentError = null;
  }

  backToMethod(): void {
    this.currentStep = 'method';
    this.selectedMethod = null;
    this.paymentError = null;
    this.mobileForm.reset();
  }

  setQuickAmount(amount: number): void {
    this.amountForm.patchValue({ amount });
  }

  // ─── Soumission paiement ──────────────────────────────────────────────────

  async submitPayment(): Promise<void> {
    if (this.amountForm.invalid) return;
    const amount = this.amountForm.getRawValue().amount;

    if (this.selectedMethod === 'card') {
      await this.payWithCard(amount);
    } else {
      this.payWithMobileMoney(amount);
    }
  }

  private get isPublicPayment(): boolean {
    return this.context === 'PREMIUM_ACCESS' || this.context === 'RENT';
  }

  // ─── Stripe ───────────────────────────────────────────────────────────────

  private async payWithCard(amount: number): Promise<void> {
    this.currentStep = 'processing';
    this.paymentStatus = 'processing';
    this.paymentError = null;

    const base = `${window.location.origin}/${this.lang}/payment`;
    const dto: InitiatePaymentDto = {
      context: this.context,
      provider: 'STRIPE',
      amount,
      currency: this.paymentDetails?.currency || 'XAF',
      description: this.paymentDetails?.description || 'Paiement Ndewa360°',
      userEmail: this.paymentDetails?.userEmail,
      // Le serveur ajoute lui-même session_id et la référence de transaction
      // (ext) à cette URL : le client ne connaît pas encore la référence.
      successUrl: `${base}/${this.token}?payment=success`,
      cancelUrl: `${base}/${this.token}?payment=cancelled`,
      ...this.buildContextIds()
    };

    this.paymentService.initiatePayment(dto, this.isPublicPayment)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (res) => {
          this.externalRef = res.data.externalRef;
          if (res.data.redirectUrl) {
            const finalUrl = res.data.redirectUrl;
            if (isAllowedRedirect(finalUrl)) {
              window.location.href = finalUrl;
            } else {
              this.paymentError = this.t('PAYMENT_PAGE.ERRORS.STRIPE_REDIRECT');
              this.paymentStatus = 'failed';
              this.currentStep = 'result';
            }
          } else {
            this.paymentError = this.t('PAYMENT_PAGE.ERRORS.STRIPE_URL');
            this.paymentStatus = 'failed';
            this.currentStep = 'result';
          }
        },
        error: (err) => {
          this.paymentError = this.serverMessage(err) || this.t('PAYMENT_PAGE.ERRORS.SESSION_CREATE');
          this.paymentStatus = 'failed';
          this.currentStep = 'result';
        }
      });
  }

  // ─── Mobile Money (MTN / Orange / EasyTransact) ───────────────────────────

  private payWithMobileMoney(amount: number): void {
    if (this.mobileForm.invalid) return;

    this.currentStep = 'processing';
    this.paymentStatus = 'processing';
    this.paymentError = null;

    const phone = this.paymentService.normalizePhone(this.mobileForm.value.phone);
    const provider = this.paymentService.methodToProvider(this.selectedMethod!);

    const dto: InitiatePaymentDto = {
      context: this.context,
      provider,
      amount,
      currency: this.paymentDetails?.currency || 'XAF',
      phoneNumber: phone,
      description: this.paymentDetails?.description || 'Paiement Ndewa360°',
      userEmail: this.paymentDetails?.userEmail,
      ...this.buildContextIds()
    };

    this.paymentService.initiatePayment(dto, this.isPublicPayment)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.externalRef = res.data.externalRef;
          this.paymentStatus = 'pending_confirmation';
          this.startPolling();
        },
        error: (err) => {
          this.paymentError = this.serverMessage(err) || this.t('PAYMENT_PAGE.ERRORS.INITIATE');
          this.paymentStatus = 'failed';
          this.currentStep = 'result';
        }
      });
  }

  // ─── Polling avec backoff exponentiel (Fix #3 + #8) ──────────────────────

  /**
   * Applique un statut reçu (socket ou polling). Retourne vrai si le paiement
   * est terminé. Idempotent : un statut final n'est appliqué qu'une fois.
   */
  private applyPaymentStatus(status: string): boolean {
    if (this.paymentStatus === 'success' || this.paymentStatus === 'failed') return true;
    if (status === 'SUCCESS') {
      this.paymentStatus = 'success';
      this.currentStep = 'result';
      this.today = new Date(); // Fix #10 : date réelle du paiement
      this.handlePostPaymentSuccess();
      return true;
    }
    if (['FAILED', 'CANCELLED', 'EXPIRED'].includes(status)) {
      this.paymentError = this.t('PAYMENT_PAGE.ERRORS.REFUSED');
      this.paymentStatus = 'failed';
      this.currentStep = 'result';
      return true;
    }
    return false;
  }

  /**
   * Fin d'attente sans réponse définitive : le paiement n'est PAS déclaré en
   * échec. L'opérateur peut encore le confirmer (le serveur continue de
   * vérifier pendant deux heures) ; afficher « échec » poussait le locataire
   * à payer une seconde fois.
   */
  private markUnconfirmed(): void {
    if (this.paymentStatus === 'success' || this.paymentStatus === 'failed') return;
    this.paymentStatus = 'unconfirmed';
    this.currentStep = 'result';
  }

  /** « Vérifier à nouveau » : relance l'attente sur la même transaction (aucun nouveau paiement). */
  checkAgain(): void {
    if (!this.externalRef) return;
    this.paymentError = null;
    this.paymentStatus = 'pending_confirmation';
    this.currentStep = 'processing';
    this.startPolling(false);
  }

  private realtimeWatched: string | null = null;

  private startPolling(firstStart = true): void {
    this.pollingAttempts = 0;
    this.networkErrors = 0;

    // Temps réel : le serveur pousse le statut dès le callback de l'opérateur.
    // L'abonnement reste actif après la fin de l'attente : une confirmation
    // tardive met encore la page à jour.
    if (this.realtimeWatched !== this.externalRef) {
      this.realtimeWatched = this.externalRef;
      this.realtime.watchPayment(this.externalRef!)
        .pipe(takeUntil(this.destroy$))
        .subscribe((update) => {
          if (this.paymentStatus === 'unconfirmed') this.paymentStatus = 'pending_confirmation';
          this.applyPaymentStatus(update.status);
        });
    }

    // Le polling reste nécessaire : chaque vérification interroge aussi
    // l'opérateur côté serveur, au cas où son callback n'arriverait jamais.
    // Il est ralenti quand le socket est connecté.
    // Toutes les 4 s pendant la première minute (validation sur le téléphone),
    // puis toutes les 8 s. Le délai n'est plus doublé quand le temps réel est
    // connecté : un événement manqué (réseau mobile instable) retardait
    // l'affichage du succès jusqu'à 24 s.
    const getDelay = (attempt: number): number => (attempt <= 15 ? 4_000 : 8_000);

    const poll = () => {
      if (this.paymentStatus === 'success' || this.paymentStatus === 'failed') return;
      if (this.pollingAttempts >= this.MAX_POLLING) {
        this.markUnconfirmed();
        return;
      }

      this.pollingAttempts++;
      this.paymentService.checkPaymentStatus(this.externalRef!)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            this.networkErrors = 0;
            if (!this.applyPaymentStatus(res.data.status)) {
              // Toujours PENDING — planifier le prochain tick avec backoff
              timer(getDelay(this.pollingAttempts))
                .pipe(takeUntil(this.destroy$))
                .subscribe(() => poll());
            }
          },
          // Fix #8 : retry sur erreur réseau — ne pas abandonner sur coupure momentanée
          error: () => {
            this.networkErrors++;
            if (this.networkErrors >= this.MAX_NETWORK_ERRORS) {
              this.markUnconfirmed();
              return;
            }
            // Réessayer après un délai doublé en cas d'erreur réseau
            timer(getDelay(this.pollingAttempts) * 2)
              .pipe(takeUntil(this.destroy$))
              .subscribe(() => poll());
          }
        });
    };

    // Premier contrôle après 3 s (immédiat pour « Vérifier à nouveau »)
    timer(firstStart ? 3_000 : 0).pipe(takeUntil(this.destroy$)).subscribe(() => poll());
  }

  // ─── Retour Stripe ────────────────────────────────────────────────────────

  private handleStripeReturn(sessionId: string): void {
    this.pageLoading = false;
    this.currentStep = 'processing';
    this.paymentStatus = 'processing';

    // ext = externalRef de notre transaction, toujours présent depuis la correction Bug #6
    const extRef = this.route.snapshot.queryParams['ext'] || null;

    // Page de retour générique (paiement lancé depuis le mobile) : pas de détails à charger.
    if (this.token !== 'stripe-return') this.loadPaymentDetails();

    if (!extRef) {
      // Fallback : pas d'externalRef — impossible de vérifier le statut
      this.paymentError = this.t('PAYMENT_PAGE.ERRORS.MISSING_REF');
      this.paymentStatus = 'failed';
      this.currentStep = 'result';
      return;
    }

    this.paymentService.checkPaymentStatus(extRef)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.data.status === 'SUCCESS') {
            this.externalRef = extRef;
            if (res.data.amount && !this.amountForm.getRawValue().amount) {
              this.amountForm.patchValue({ amount: res.data.amount });
            }
            this.paymentStatus = 'success';
            this.currentStep = 'result';
            this.today = new Date();
            this.handlePostPaymentSuccess();
          } else {
            this.externalRef = extRef;
            this.paymentStatus = 'pending_confirmation';
            this.startPolling();
          }
        },
        error: () => {
          // Statut invérifiable pour l'instant (réseau) : ce n'est pas un échec.
          this.externalRef = extRef;
          this.markUnconfirmed();
        }
      });
  }

  // ─── Post-paiement ────────────────────────────────────────────────────────

  private handlePostPaymentSuccess(): void {
    if (this.context === 'PREMIUM_ACCESS') {
      const meta = this.paymentDetails?.metadata || {};
      const ownerId = meta['ownerId'] || '';
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 1);
      this.anonymousUserService.savePremiumAccess({
        accessId: this.externalRef || this.token,
        transactionId: this.externalRef || this.token,
        ownerId,
        expiryDate: expiryDate.toISOString(),
        phone: this.mobileForm.value.phone || '',
        paymentMethod: this.selectedMethod || 'card',
        paidAt: new Date().toISOString()
      });
      // Redirection automatique vers la page de recherche avec les params premium
      // sans attendre que l'utilisateur clique sur un bouton
      this.autoRedirectAfterPremiumSuccess();
    }
  }

  private autoRedirectAfterPremiumSuccess(): void {
    const path = this.internalPath(this.paymentDetails?.successRedirectPath);
    if (path) {
      // Délai court pour que l'utilisateur voie l'écran de succès (1.5s)
      timer(1500).pipe(takeUntil(this.destroy$)).subscribe(() => {
        window.location.href = path;
      });
    }
  }

  redirectAfterSuccess(): void {
    const path = this.internalPath(this.paymentDetails?.successRedirectPath);
    if (path) {
      window.location.href = path;
    } else {
      this.router.navigate([`/${this.lang}/home`]);
    }
  }

  redirectAfterCancel(): void {
    const path = this.internalPath(this.paymentDetails?.cancelRedirectPath);
    if (path) {
      window.location.href = path;
    } else {
      window.history.back();
    }
  }

  retry(): void {
    this.paymentStatus = 'idle';
    this.paymentError = null;
    this.externalRef = null;
    this.pollingAttempts = 0;
    this.networkErrors = 0;
    this.currentStep = 'method';
    this.selectedMethod = null;
    this.mobileForm.reset();
    this.receiptDownloaded = false;
    this.receiptError = null;
  }

  downloadReceipt(): void {
    if (!this.externalRef || this.isDownloadingReceipt) return;

    this.isDownloadingReceipt = true;
    this.receiptError = null;

    this.locationPaymentService.downloadReceiptByTransaction(this.externalRef)
      .pipe(
        // 409 : paiement confirmé, reçu encore en préparation → nouvel essai
        // toutes les 2 s (jusqu'à environ 20 s).
        retry({ count: 10, delay: (err) => (err?.status === 409 || err?.status === 404 ? timer(2_000) : throwError(() => err)) }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (blob: Blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const refLabel = this.externalRef?.slice(0, 8) || 'recu';
          a.download = `recu_${refLabel}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          this.receiptDownloaded = true;
          this.isDownloadingReceipt = false;
        },
        error: () => {
          this.receiptError = this.t('PAYMENT_PAGE.ERRORS.RECEIPT_DOWNLOAD');
          this.isDownloadingReceipt = false;
        }
      });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private buildContextIds(): Partial<InitiatePaymentDto> {
    if (!this.paymentDetails) return {};
    const meta = this.paymentDetails.metadata || {};

    if (this.context === 'RENT') {
      // Bail, logement, locataire et bien sont lus par le serveur dans le lien.
      return { paymentLinkId: this.paymentDetails.token };
    }
    // Session signée : le serveur vérifie que le paiement lui correspond.
    const session: Partial<InitiatePaymentDto> = { sessionToken: this.token };
    if (this.context === 'PREMIUM_ACCESS') {
      return {
        ...session,
        visitorId: meta['visitorId'] || undefined,
        ownerId: meta['ownerId'] || undefined
      };
    }
    if (this.context === 'SUBSCRIPTION') {
      return {
        ...session,
        periodId:       meta['periodId']       || this.paymentDetails.reference,
        subscriptionId: meta['subscriptionId']
      };
    }
    return session;
  }

  /** Chemin interne sûr (« /fr/… »), ou null : jamais d'URL externe ni de « javascript: ». */
  private internalPath(path?: string | null): string | null {
    if (!path || !path.startsWith('/') || path.startsWith('//') || /[\\\u0000-\u001f]/.test(path)) return null;
    return isAllowedRedirect(path) ? path : null;
  }

  /** Numéro camerounais du bon opérateur pour le moyen choisi. */
  private phoneValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    return this.paymentService.isValidPhoneFor(control.value, this.selectedMethod) ? null : { phone: true };
  }

  private serverMessage(err: any): string | null {
    const message = err?.error?.message;
    return Array.isArray(message) ? message[0] : message || null;
  }

  private t(key: string): string {
    return this.translate.instant(key);
  }

  isI18nKey(value: string): boolean {
    return /^[A-Z_]+(\.[A-Z_]+)+$/.test(value?.trim() || '');
  }

  get amount(): number {
    return this.amountForm.getRawValue().amount || 0;
  }

  get paidAmount(): number {
    return this.amountForm.getRawValue().amount || this.paymentDetails?.amount || 0;
  }

  get isAmountValid(): boolean {
    return this.amountForm.valid || this.amountForm.disabled;
  }

  get isMobileFormValid(): boolean {
    return this.mobileForm.valid;
  }

  get pollingProgress(): number {
    return Math.min(100, (this.pollingAttempts / this.MAX_POLLING) * 100);
  }

  formatAmount(amount: number): string {
    return this.paymentService.formatAmount(amount, 'XAF', this.translate.currentLang);
  }

  getMethodLabel(method: PaymentMethod): string {
    const keys: Record<PaymentMethod, string> = {
      orange_money:  'PAYMENT_PAGE.METHODS.ORANGE_MONEY',
      mtn_money:     'PAYMENT_PAGE.METHODS.MTN_MONEY',
      card:          'PAYMENT_PAGE.METHODS.CARD',
      easy_transact: 'PAYMENT_PAGE.METHODS.EASY_TRANSACT'
    };
    return this.translate.instant(keys[method] || 'PAYMENT_PAGE.METHODS.CARD');
  }
}
