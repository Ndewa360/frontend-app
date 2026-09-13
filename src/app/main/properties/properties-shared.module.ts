import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { LocationPaymentModule } from '../location-payment/location-payment.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    // Les composants sont déjà déclarés dans MainModule, on les exporte juste ici
  ],
  imports: [
    CommonModule,
    SharedModule,
    LocationPaymentModule,
    TranslateModule
  ],
  exports: [
    LocationPaymentModule
  ]
})
export class PropertiesSharedModule { }
