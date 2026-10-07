import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';

import { LocationPaymentRoutingModule } from './location-payment-routing.module';
// Anciens composants supprimés - remplacés par les modals modernes
import { AgGridModule } from '@ag-grid-community/angular';
import { SharedModule } from 'src/app/shared/shared.module';
import { YoupezModule } from 'src/@youpez/youpez.module';


@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    YoupezModule,
    AgGridModule,
    MatDialogModule,
    LocationPaymentRoutingModule
  ],
  exports: []
})
export class LocationPaymentModule { }
