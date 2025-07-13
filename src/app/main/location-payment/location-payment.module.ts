import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';

import { LocationPaymentRoutingModule } from './location-payment-routing.module';
// Anciens composants supprimés - remplacés par les modals modernes
import { AgGridModule } from '@ag-grid-community/angular';
import { ChartsModule } from 'src/@youpez';
import { SharedModule } from 'src/app/shared/shared.module';
import { YoupezModule } from 'src/@youpez/youpez.module';
import { PaymentListTypePropertyComponent } from './components/payment-list-type-property/payment-list-type-property.component';
import { PaymentListRecapTotalComponent } from './components/payment-list-recap-total/payment-list-recap-total.component';


@NgModule({
  declarations: [
    PaymentListTypePropertyComponent,
    PaymentListRecapTotalComponent
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
    PaymentListTypePropertyComponent,
    PaymentListRecapTotalComponent
  ]
})
export class LocationPaymentModule { }
