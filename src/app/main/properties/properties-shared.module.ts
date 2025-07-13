import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { LocationPaymentModule } from '../location-payment/location-payment.module';

// Import des nouveaux modals modernes
import { ModernModalsModule } from './components/modern-modals/modern-modals.module';

@NgModule({
  declarations: [
    // Les composants sont déjà déclarés dans MainModule, on les exporte juste ici
  ],
  imports: [
    CommonModule,
    SharedModule,
    LocationPaymentModule, // Pour avoir accès aux modals de paiement
    ModernModalsModule // Nouveaux modals modernes
  ],
  exports: [
    LocationPaymentModule, // Exporter pour que les composants puissent utiliser les modals de paiement
    ModernModalsModule // Exporter les nouveaux modals
  ]
})
export class PropertiesSharedModule { }
