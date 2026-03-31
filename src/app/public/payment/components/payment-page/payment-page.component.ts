import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, interval } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

import {
  UnifiedPaymentService,
  PaymentMethod,
  PaymentStatus,
  PaymentContext
} from '../../services/unified-payment.service';
import { PaymentLinkService, PaymentLinkDetails } from '../../services/payment-link.service';
import { AnonymousUserService } from 'src/app/shared/services/anonymous-user.service';
import { environment } from 'src/environments/environment';

declare var Stripe: any;

// ─── Labels par contexte ────────────────────────────────────────────────────
const CONTEXT_LABELS: Record<string, { title: string; icon: string; color: string }> = {
  rent:           { title: 'Paiement de loyer',        icon: 'fa-home',          color: '#2563eb' },
  deposit:        { title: 'Caution',                  icon: 'fa-shield-alt',    color: '#7c3aed' },
  premium_access: { title: 'Accès Premium',            icon: 'fa-crown',         color: '#d97706' },
  subscription:   { title: 'Souscription Ndewa360°',   icon: 'fa-star',          color: '#059669' },
};

@Component({
  selector: 'app-payment-page',
  templateUrl: './payment-page.component.html',
  styleUrls: ['./payment-page.component.scss']
})
export class PaymentPageComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();
  private lang = 'fr';

  // ─── État général ──────────────────────────────────────────────────────────
  token = '';
  paymentDetails: PaymentLinkDetails | null = null;
  pageLoading = true;
  pageError: string | null = null;

  // ─── Étapes : method → details → processing → result ──────────────────────
  currentStep: 'method' | 'details' | 'processing' | 'result' = 'method';

  // ─── Méthode sélectionnée ─────────────────────────────────────────────────
  selectedMethod: PaymentMethod | null = null;

  // ─── Formulaires ──────────────────────────────────────────────────────────
  amountForm: FormGroup;
  mobileForm: FormGroup;

  // ─── Statut paiement ──────────────────────────────────────────────────────
  paymentStatus: PaymentStatus = 'idle';
  paymentError: string | null = null;
  transactionId: string | null = null;
  pollingAttempts = 0;
  readonly MAX_POLLING = 24;
  ussdCode: string | null = null;
  expiresAt: string | null = null;

  // ─── Montants rapides (loyer) ─────────────────────────────────────────────
  quickAmounts = [25000, 50000, 75000, 100000, 150000, 200000];

  // ─── Stripe ───────────────────────────────────────────────────────────────
  private stripe: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private paymentService: UnifiedPaymentService,
    private paymentLinkService: PaymentLinkService,
    private anonymousUserService: AnonymousUserService,
    private cdr: ChangeDetectorRef
  ) {
    this.amountForm = this.fb.group({
      amount: [null, [Validators.required, Validators.min(100), Validators.max(10000000)]]
    });
    this.mobileForm = this.fb.group({
      phone: ['', [Validators.required, Validators.pattern(/^(\+237)?6[0-9]{8}$/)]]
    });
  }

  ngOnInit(): void {
    this.lang = this.route.snapshot.paramMap.get('lang') || 'fr';
    this.token = this.route.snapshot.paramMap.get('token') || '';

    // Retour Stripe
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
      this.pageError = 'Lien de paiement invalide ou expiré.';
      this.pageLoading = false;
      return;
    }

    this.loadStripe();
    this.loadPaymentDetails();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Chargement des détails ────────────────────────────────────────────────

  private loadStripe(): void {
    if (!(window as any).Stripe) {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = () => {
        if (environment.stripePublicKey) {
          this.stripe = (window as any).Stripe(environment.stripePublicKey);
        }
      };
      document.head.appendChild(script);
    } else if (environment.stripePublicKey) {
      this.stripe = (window as any).Stripe(environment.stripePublicKey);
    }
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

    // Fallback : ancien système de lien de loyer (appel backend)
    this.paymentLinkService.getPaymentDetails(this.token)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.paymentDetails = res.data;
          this.pageLoading = false;
          this.applyPaymentDetailsConfig();
        },
        error: (err) => {
          this.pageError = err.error?.message || 'Impossible de charger les détails du paiement.';
          this.pageLoading = false;
        }
      });
  }

  // Décoder un token JWT de session sans clé (lecture seule du payload base64)
  private decodeSessionToken(token: string): PaymentLinkDetails | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      // Décoder le payload (partie centrale)
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '=='.slice(0, (4 - base64.length % 4) % 4);
      const payload = JSON.parse(decodeURIComponent(escape(atob(padded))));

      // Doit avoir un contexte pour être un token de session
      if (!payload.context) return null;

      // Vérifier l'expiration
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        this.pageError = 'Ce lien de paiement a expiré.';
        this.pageLoading = false;
        return null;
      }

      return payload as PaymentLinkDetails;
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
    if (this.context === 'premium_access') {
      this.quickAmounts = [];
    }
  }

  // ─── Getters contexte ─────────────────────────────────────────────────────

  get context(): PaymentContext {
    return (this.paymentDetails?.context as PaymentContext) || 'rent';
  }

  get contextMeta(): { title: string; icon: string; color: string } {
    return CONTEXT_LABELS[this.context] || CONTEXT_LABELS['rent'];
  }

  get isAmountFixed(): boolean {
    return !!(this.paymentDetails?.amount && !this.paymentDetails?.amountEditable);
  }

  // ─── Navigation étapes ────────────────────────────────────────────────────

  selectMethod(method: PaymentMethod): void {
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
    } else if (this.selectedMethod === 'orange_money') {
      this.payWithMobileMoney('orange', amount);
    } else if (this.selectedMethod === 'mtn_money') {
      this.payWithMobileMoney('mtn', amount);
    }
  }

  // ─── Stripe ───────────────────────────────────────────────────────────────

  private async payWithCard(amount: number): Promise<void> {
    this.currentStep = 'processing';
    this.paymentStatus = 'processing';

    const base = `${window.location.origin}/${this.lang}/payment`;

    this.paymentService.createStripeSession({
      amount,
      reference: this.token,
      context: this.context,
      description: this.paymentDetails?.description || 'Paiement Ndewa360°',
      successUrl: `${base}/${this.token}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${base}/${this.token}?payment=cancelled`,
      metadata: { token: this.token, context: this.context, ...this.paymentDetails?.metadata }
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: async (res) => {
        if (this.stripe) {
          const { error } = await this.stripe.redirectToCheckout({ sessionId: res.data.sessionId });
          if (error) {
            this.paymentStatus = 'failed';
            this.paymentError = error.message;
            this.currentStep = 'result';
            this.cdr.detectChanges();
          }
        } else {
          window.location.href = res.data.sessionUrl;
        }
      },
      error: (err) => {
        this.paymentStatus = 'failed';
        this.paymentError = err.error?.message || 'Erreur lors de la création de la session.';
        this.currentStep = 'result';
        this.cdr.detectChanges();
      }
    });
  }

  // ─── Mobile Money ─────────────────────────────────────────────────────────

  private payWithMobileMoney(operator: 'orange' | 'mtn', amount: number): void {
    if (this.mobileForm.invalid) return;

    this.currentStep = 'processing';
    this.paymentStatus = 'processing';

    const phone = this.paymentService.normalizePhone(this.mobileForm.value.phone);
    const payload = {
      phone,
      operator,
      amount,
      reference: this.token,
      description: this.paymentDetails?.description || 'Paiement Ndewa360°'
    };

    const initiate$ = operator === 'orange'
      ? this.paymentService.initiateOrangeMoney(payload)
      : this.paymentService.initiateMtnMoney(payload);

    initiate$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.transactionId = res.data.transactionId;
        this.ussdCode = res.data.ussdCode || null;
        this.expiresAt = res.data.expiresAt || null;
        this.paymentStatus = 'pending_confirmation';
        this.startPolling(operator);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.paymentStatus = 'failed';
        this.paymentError = err.error?.message || 'Erreur lors de l\'initiation du paiement.';
        this.currentStep = 'result';
        this.cdr.detectChanges();
      }
    });
  }

  // ─── Polling ──────────────────────────────────────────────────────────────

  private startPolling(operator: 'orange' | 'mtn'): void {
    this.pollingAttempts = 0;

    interval(5000).pipe(
      takeUntil(this.destroy$),
      switchMap(() => {
        this.pollingAttempts++;
        return operator === 'orange'
          ? this.paymentService.checkOrangeMoneyStatus(this.transactionId!)
          : this.paymentService.checkMtnMoneyStatus(this.transactionId!);
      })
    ).subscribe({
      next: (res) => {
        if (res.data.status === 'success') {
          this.paymentStatus = 'success';
          this.currentStep = 'result';
          this.handlePostPaymentSuccess();
          this.destroy$.next();
          this.cdr.detectChanges();
        } else if (res.data.status === 'failed') {
          this.paymentStatus = 'failed';
          this.paymentError = 'Le paiement a été refusé ou annulé.';
          this.currentStep = 'result';
          this.destroy$.next();
          this.cdr.detectChanges();
        } else if (this.pollingAttempts >= this.MAX_POLLING) {
          this.paymentStatus = 'failed';
          this.paymentError = 'Délai dépassé. Vérifiez votre téléphone et réessayez.';
          this.currentStep = 'result';
          this.destroy$.next();
          this.cdr.detectChanges();
        }
      },
      error: () => { /* ignorer erreurs réseau polling */ }
    });
  }

  // ─── Retour Stripe ────────────────────────────────────────────────────────

  private handleStripeReturn(sessionId: string): void {
    this.pageLoading = false;
    this.currentStep = 'processing';
    this.paymentStatus = 'processing';

    this.paymentService.confirmStripePayment(sessionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.paymentStatus = 'success';
          this.currentStep = 'result';
          this.handlePostPaymentSuccess();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.paymentStatus = 'failed';
          this.paymentError = err.error?.message || 'Erreur lors de la confirmation.';
          this.currentStep = 'result';
          this.cdr.detectChanges();
        }
      });
  }

  // ─── Post-paiement : actions spécifiques au contexte ─────────────────────

  private handlePostPaymentSuccess(): void {
    if (this.context === 'premium_access') {
      // Sauvegarder l'accès premium localement (3 jours)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 3);
      this.anonymousUserService.savePremiumAccess({
        accessId: this.token,
        transactionId: this.transactionId || this.token,
        expiryDate: expiryDate.toISOString(),
        phone: this.mobileForm.value.phone || '',
        paymentMethod: this.selectedMethod || 'card',
        paidAt: new Date().toISOString()
      });
    }
  }

  // ─── Redirection après résultat ───────────────────────────────────────────

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

  // ─── Retry ────────────────────────────────────────────────────────────────

  retry(): void {
    this.paymentStatus = 'idle';
    this.paymentError = null;
    this.transactionId = null;
    this.ussdCode = null;
    this.pollingAttempts = 0;
    this.currentStep = 'method';
    this.selectedMethod = null;
    this.mobileForm.reset();
  }

  // ─── Utilitaires template ─────────────────────────────────────────────────

  get amount(): number {
    return this.amountForm.getRawValue().amount || 0;
  }

  get isAmountValid(): boolean {
    return this.amountForm.valid;
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
    const labels: Record<PaymentMethod, string> = {
      orange_money: 'Orange Money',
      mtn_money: 'MTN Mobile Money',
      card: 'Carte bancaire'
    };
    return labels[method];
  }
}
