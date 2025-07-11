import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-payment-error',
  templateUrl: './payment-error.component.html',
  styleUrls: ['./payment-error.component.scss']
})
export class PaymentErrorComponent implements OnInit {
  token: string = '';
  errorMessage: string = 'Une erreur est survenue lors du traitement de votre paiement.';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
  }

  retryPayment(): void {
    if (this.token) {
      window.location.href = `/payment/${this.token}`;
    }
  }
}
