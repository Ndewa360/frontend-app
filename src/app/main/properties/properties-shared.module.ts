import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { LocationPaymentModule } from '../location-payment/location-payment.module';

// Import des composants modals
import { AddPropertyRoomComponent } from './components/add-property-room/add-property-room.component';
import { UpdateRoomComponent } from '../room/components/update-room/update-room.component';

@NgModule({
  declarations: [
    // Les composants sont déjà déclarés dans MainModule, on les exporte juste ici
  ],
  imports: [
    CommonModule,
    SharedModule,
    LocationPaymentModule // Pour avoir accès aux modals de paiement
  ],
  exports: [
    LocationPaymentModule // Exporter pour que les composants puissent utiliser les modals de paiement
  ]
})
export class PropertiesSharedModule { }
