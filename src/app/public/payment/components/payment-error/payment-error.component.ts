import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-payment-error',
  templateUrl: './payment-error.component.html',
  styleUrls: ['./payment-error.component.scss'],
  standalone: true,
  imports: [RouterLink,DatePipe, TranslatePipe]
})
export class PaymentErrorComponent implements OnInit {
  token: string = '';
  errorMessage: string = 'Une erreur est survenue lors du traitement de votre paiement.';
  currentDate = new Date();
  lang = 'fr';

  constructor(private route: ActivatedRoute,private translate: TranslateService,) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    this.lang = this.route.snapshot.paramMap.get('lang') || 'fr';

  }

  retryPayment(): void {
    if (this.token) {
      window.location.href = `/payment/${this.token}`;
    }
  }
}
