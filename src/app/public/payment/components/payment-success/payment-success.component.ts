import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PaymentLinkService } from '../../services/payment-link.service';

@Component({
  selector: 'app-payment-success',
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.scss']
})
export class PaymentSuccessComponent implements OnInit {
  token: string = '';
  sessionId: string = '';
  loading = true;
  paymentDetails: any = null;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private paymentService: PaymentLinkService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    this.sessionId = this.route.snapshot.queryParamMap.get('session_id') || '';
    
    if (this.token && this.sessionId) {
      this.confirmPayment();
    } else {
      this.error = 'Paramètres de paiement manquants';
      this.loading = false;
    }
  }

  private confirmPayment(): void {
    // La confirmation Stripe est gérée par le webhook backend via POST /payment/callback/stripe
    // Ici on charge juste les détails pour l'affichage
    this.loadPaymentDetails();
  }

  private loadPaymentDetails(): void {
    this.paymentService.getPaymentDetails(this.token).subscribe({
      next: (response) => {
        this.paymentDetails = response.data;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des détails:', error);
      }
    });
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount);
  }

  getPaymentTypeLabel(): string {
    if (!this.paymentDetails) return '';

    switch (this.paymentDetails.paymentType) {
      case 'LOCATION':
        return 'Loyer';
      case 'CAUTION':
        return 'Caution';
      default:
        return 'Paiement';
    }
  }

  getCurrentDate(): Date {
    return new Date();
  }

  downloadReceipt(): void {
    // TODO: Implémenter le téléchargement du reçu
    console.log('Téléchargement du reçu...');
  }
}
