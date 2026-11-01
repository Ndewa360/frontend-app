import { trackByFn } from '../../../../shared/utils/track-by.util';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';

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
import { environment } from 'src/environments/environment';
import { RealtimeService } from 'src/app/core/realtime';
import { NgIf, NgClass, NgSwitch, NgSwitchCase, NgFor, UpperCasePipe, SlicePipe, DatePipe } from '@angular/common';
import { isAllowedRedirect } from 'src/app/shared/utils/safe-redirect';

declare let Stripe: any;

@Component({
  selector: 'app-payment-page',
  templateUrl: './payment-page.component.html',
  styleUrls: ['./payment-page.component.scss'],
  standalone: true,
  imports: [NgIf, NgClass, NgSwitch, NgSwitchCase, FormsModule, ReactiveFormsModule, NgFor, UpperCasePipe, SlicePipe, DatePipe, TranslatePipe]
})
export class PaymentPageComponent implements OnInit, OnDestroy {
  trackByFn = trackByFn;


  private destroy$ = new Subject<void>();
  private lang = 'fr';

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
  readonly MAX_POLLING = 24;
  readonly MAX_NETWORK_ERRORS = 5;
  /** Code USSD affiché pour Mobile Money */
  ussdCode: string | null = null;
  /** Date d'expiration de la demande Mobile Money */
  expiresAt: string | null = null;

  quickAmounts = [25000, 50000, 75000, 100000, 150000, 200000];

  /** État du téléchargement du reçu (RENT uniquement) */
  isDownloadingReceipt = false;
  receiptDownloaded = false;
  receiptError: string | null = null;

  /** Fix #10 : mis à jour au moment réel du succès, pas à l'instanciation */
  today = new Date();

  private stripe: any;
  /** Fix #5 : Stripe chargé en lazy — seulement si l'utilisateur choisit la carte */
  private stripeLoaded = false;

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
      amount: [null, [Validators.required, Validators.min(100), Validators.max(10000000)]]
    });
    this.mobileForm = this.fb.group({
      // Accepte : 6XXXXXXXX | 6XX XX XX XX | +2376XXXXXXXX | 00237 6XXXXXXXX
      phone: ['', [Validators.required, Validators.pattern(/^(\+237|00237)?\s?6[0-9\s]{8,11}$/)]]
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

    // Fix #5 : Stripe NON chargé ici — chargé en lazy dans selectMethod() si carte choisie
    this.loadPaymentDetails();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Chargement des détails ────────────────────────────────────────────────

  /** Fix #5 : charge le SDK Stripe (~300KB) seulement si l'utilisateur choisit la carte */
  private loadStripe(): void {
    if (this.stripeLoaded) return;
    this.stripeLoaded = true;
    if ((window as any).Stripe) {
      if (environment.stripePublicKey) this.stripe = (window as any).Stripe(environment.stripePublicKey);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.onload = () => {
      if (environment.stripePublicKey) this.stripe = (window as any).Stripe(environment.stripePublicKey);
    };
    document.head.appendChild(script);
  }

  loadPaymentDetails(): void {
    // Essayer d'abord de décoder comme un token JWT de session (sans appel réseau)
    const sessionPayload = this.decodeSessionToken(this.token);
    if (sessionPayload) {
      this.paymentDetails = sessionPayload;
      this.pageLoading = false;
      this.applyPaymentDetailsConfig();
      return;
    }

    // Fallback : lien de paiement persistant (appel backend GET /payment-link/details/:token)
    this.paymentLinkService.getPaymentDetails(this.token)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.paymentDetails = res.data;
          this.pageLoading = false;
          this.applyPaymentDetailsConfig();
        },
        error: (err) => {
          this.pageError = err.error?.message || this.t('PAYMENT_PAGE.ERRORS.LOAD_DETAILS');
          this.pageLoading = false;
        }
      });
  }

  private decodeSessionToken(token: string): PaymentLinkDetails | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '=='.slice(0, (4 - base64.length % 4) % 4);
      // Fix #7 : TextDecoder au lieu de escape() déprécié — compatible tous navigateurs mobiles
      const bytes = Uint8Array.from(atob(padded), c => c.charCodeAt(0));
      const payload = JSON.parse(new TextDecoder().decode(bytes));
      if (!payload.context) return null;
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        this.pageError = this.t('PAYMENT_PAGE.ERRORS.LINK_EXPIRED');
        this.pageLoading = false;
        return null;
      }
      return { ...payload, usageCount: 0 } as PaymentLinkDetails;
    } catch {
      return null;
    }
  }

  private applyPaymentDetailsConfig(): void {
    if (!this.paymentDetails) return;
    if (this.paymentDetails.amount && !this.paymentDetails.amountEditable) {
      this.amountForm.patchValue({ amount: this.paymentDetails.amount });
      this.amountForm.get('amount')?.disable();
    } else if (this.paymentDetails.amount) {
      this.amountForm.patchValue({ amount: this.paymentDetails.amount });
    }
    if (this.context === 'PREMIUM_ACCESS') {
      this.quickAmounts = [];
    }
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
    // Fix #5 : charger Stripe en lazy seulement si l'utilisateur choisit la carte
    if (method === 'card') this.loadStripe();
    this.selectedMethod = method;
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
          this.paymentError = err.error?.message || this.t('PAYMENT_PAGE.ERRORS.SESSION_CREATE');
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
          this.paymentError = err.error?.message || this.t('PAYMENT_PAGE.ERRORS.INITIATE');
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
    // Fix #3 : backoff exponentiel — Tentatives 1-4 : 5s | 5-8 : 8s | 9+ : 12s
    const getDelay = (attempt: number): number => {
      const base = attempt <= 4 ? 5_000 : attempt <= 8 ? 8_000 : 12_000;
      return this.realtime.connected$.value ? base * 2 : base;
    };

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

    // Premier tick après 5s (immédiat pour « Vérifier à nouveau »)
    timer(firstStart ? 5_000 : 0).pipe(takeUntil(this.destroy$)).subscribe(() => poll());
  }

  // ─── Retour Stripe ────────────────────────────────────────────────────────

  private handleStripeReturn(sessionId: string): void {
    this.pageLoading = false;
    this.currentStep = 'processing';
    this.paymentStatus = 'processing';

    // ext = externalRef de notre transaction, toujours présent depuis la correction Bug #6
    const extRef = this.route.snapshot.queryParams['ext'] || null;

    this.loadStripe();
    this.loadPaymentDetails();

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
    const path = this.paymentDetails?.successRedirectPath;
    if (path) {
      // Délai court pour que l'utilisateur voie l'écran de succès (1.5s)
      timer(1500).pipe(takeUntil(this.destroy$)).subscribe(() => {
        window.location.href = path;
      });
    }
  }

  redirectAfterSuccess(): void {
    const path = this.paymentDetails?.successRedirectPath;
    if (path) {
      window.location.href = path;
    } else {
      this.router.navigate([`/${this.lang}/home`]);
    }
  }

  redirectAfterCancel(): void {
    const path = this.paymentDetails?.cancelRedirectPath;
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
      .pipe(takeUntil(this.destroy$))
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

    if (this.context === 'PREMIUM_ACCESS') {
      return {
        visitorId: meta['visitorId'] || this.paymentDetails.userId,
        // ownerId DOIT être transmis pour que PremiumAccessPaymentHandler puisse créer l'accès
        ownerId: meta['ownerId'] || ''
      };
    }
    if (this.context === 'SUBSCRIPTION') {
      return {
        periodId:       meta['periodId']       || this.paymentDetails.reference,
        subscriptionId: meta['subscriptionId']
      };
    }
    if (this.context === 'WALLET_DEPOSIT') {
      return {};
    }
    // RENT
    return {
      locationId:    meta['locationId']   || this.paymentDetails.location?._id,
      locataireId:   meta['locataireId']  || this.paymentDetails.locataire?._id,
      roomId:        meta['roomId']       || this.paymentDetails.room?._id,
      propertyId:    meta['propertyId']   || this.paymentDetails.property?._id,
      paymentLinkId: this.paymentDetails.token
    };
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
    return this.paymentService.formatAmount(amount);
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
