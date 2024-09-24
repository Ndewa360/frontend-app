import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LocationPaymentRoutingModule } from './location-payment-routing.module';
import { AddPaymentComponent } from './components/add-payment/add-payment.component';
import { AgGridModule } from '@ag-grid-community/angular';
import { ChartsModule } from 'src/@youpez';
import { SharedModule } from 'src/app/shared/shared.module';
import { YoupezModule } from 'src/@youpez/youpez.module';


@NgModule({
  declarations: [
    AddPaymentComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    ChartsModule,
    YoupezModule,
    AgGridModule,
    LocationPaymentRoutingModule
  ],
  exports: [
    AddPaymentComponent
  ]
})
export class LocationPaymentModule { }
