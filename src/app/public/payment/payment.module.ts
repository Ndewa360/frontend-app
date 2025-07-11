import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { PaymentPageComponent } from './components/payment-page/payment-page.component';
import { PaymentSuccessComponent } from './components/payment-success/payment-success.component';
import { PaymentErrorComponent } from './components/payment-error/payment-error.component';
import { PaymentLoadingComponent } from './components/payment-loading/payment-loading.component';

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
    RouterModule.forChild(routes)
  ],
  providers: [DatePipe]
})
export class PaymentModule { }
