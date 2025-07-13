import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';

import { LocationPaymentRoutingModule } from './location-payment-routing.module';
import { AddPaymentComponent } from './components/add-payment/add-payment.component';
import { AgGridModule } from '@ag-grid-community/angular';
import { ChartsModule } from 'src/@youpez';
import { SharedModule } from 'src/app/shared/shared.module';
import { YoupezModule } from 'src/@youpez/youpez.module';
import { PaymentListTypePropertyComponent } from './components/payment-list-type-property/payment-list-type-property.component';
import { PaymentListRecapTotalComponent } from './components/payment-list-recap-total/payment-list-recap-total.component';
import { DeletePaymentComponent } from './components/delete-payment/delete-payment.component';
import { UpdatePaymentComponent } from './components/update-payment/update-payment.component';


@NgModule({
  declarations: [
    AddPaymentComponent,
    PaymentListTypePropertyComponent,
    PaymentListRecapTotalComponent,
    DeletePaymentComponent,
    UpdatePaymentComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    ChartsModule,
    YoupezModule,
    AgGridModule,
    MatDialogModule,
    LocationPaymentRoutingModule
  ],
  exports: [
    AddPaymentComponent,
    PaymentListTypePropertyComponent,
    PaymentListRecapTotalComponent,
    DeletePaymentComponent,
    UpdatePaymentComponent
  ]
})
export class LocationPaymentModule { }
