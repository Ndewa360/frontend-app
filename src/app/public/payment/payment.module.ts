import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';

import { PaymentPageComponent } from './components/payment-page/payment-page.component';
import { PaymentSuccessComponent } from './components/payment-success/payment-success.component';
import { PaymentErrorComponent } from './components/payment-error/payment-error.component';
import { PaymentLoadingComponent } from './components/payment-loading/payment-loading.component';
import { UnifiedPaymentService } from './services/unified-payment.service';
import { AnonymousUserService } from 'src/app/shared/services/anonymous-user.service';
import { LocationPaymentService } from 'src/app/shared/store/payment-location/location-payment.service';

const routes = [
  {
    path: ':token',
    component: PaymentPageComponent
  },
  {
    path: 'success/:token',
    component: PaymentSuccessComponent
  },
  {
    path: 'error/:token',
    component: PaymentErrorComponent
  }
];

@NgModule({
  declarations: [
    PaymentPageComponent,
    PaymentSuccessComponent,
    PaymentErrorComponent,
    PaymentLoadingComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    TranslateModule,
    RouterModule.forChild(routes)
  ],
  providers: [
    DatePipe,
    UnifiedPaymentService,
    AnonymousUserService,
    LocationPaymentService,
  ]
})
export class PaymentModule { }
