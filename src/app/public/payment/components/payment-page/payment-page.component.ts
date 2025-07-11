import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PaymentLinkService, PaymentLinkDetails } from '../../services/payment-link.service';
import { environment } from 'src/environments/environment';

declare var Stripe: any;

@Component({
  selector: 'app-payment-page',
  templateUrl: './payment-page.component.html',
  styleUrls: ['./payment-page.component.scss']
})
export class PaymentPageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  token: string = '';
  paymentDetails: PaymentLinkDetails | null = null;
  loading = true;
  error: string | null = null;
  processing = false;
  amountError: string | null = null;

  // Montants rapides suggérés
  quickAmounts = [50000, 100000, 150000, 200000, 250000, 300000];

  private stripe: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentLinkService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    
    if (!this.token) {
      this.error = 'Token de paiement invalide';
      this.loading = false;
      return;
    }

    this.loadStripe();
    this.loadPaymentDetails();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadStripe(): void {
    if (!(window as any).Stripe) {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = () => {
        this.stripe = (window as any).Stripe(environment.stripePublicKey);
      };
      document.head.appendChild(script);
    } else {
      this.stripe = (window as any).Stripe(environment.stripePublicKey);
    }
  }

  loadPaymentDetails(): void {
    this.paymentService.getPaymentDetails(this.token)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.paymentDetails = response.data;
          this.loading = false;
        },
        error: (error) => {
          this.error = error.error?.message || 'Erreur lors du chargement des détails de paiement';
          this.loading = false;
        }
      });
  }

  async processPayment(amount: number): Promise<void> {
    if (!this.paymentDetails || !this.stripe || !amount || amount < 1000) {
      this.error = 'Veuillez saisir un montant valide (minimum 1000 FCFA)';
      return;
    }

    this.processing = true;
    this.error = null;

    try {
      // Créer une session Stripe
      const sessionResponse = await this.paymentService.createStripeSession(
        this.token,
        amount
      ).toPromise();

      // Rediriger vers Stripe Checkout
      const { error } = await this.stripe.redirectToCheckout({
        sessionId: sessionResponse.sessionId
      });

      if (error) {
        this.error = error.message;
        this.processing = false;
      }
    } catch (error: any) {
      this.error = error.error?.message || 'Erreur lors du traitement du paiement';
      this.processing = false;
    }
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount);
  }

  onAmountChange(amount: number): void {
    this.amountError = null;

    if (amount && amount < 1000) {
      this.amountError = 'Le montant minimum est de 1 000 FCFA';
    } else if (amount && amount > 10000000) {
      this.amountError = 'Le montant maximum est de 10 000 000 FCFA';
    }
  }

  setQuickAmount(amount: number, input: HTMLInputElement): void {
    input.value = amount.toString();
    this.onAmountChange(amount);
  }

  isAmountValid(amount: number): boolean {
    return amount >= 1000 && amount <= 10000000 && !this.amountError;
  }
}
