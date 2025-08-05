import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Routing
import { MobileContractsRoutingModule } from './mobile-contracts-routing.module';

// Pages
import { MobileContractsListPageComponent } from './pages/mobile-contracts-list-page/mobile-contracts-list-page.component';
// import { MobileContractDetailsPageComponent } from './pages/mobile-contract-details-page/mobile-contract-details-page.component';
// import { MobileCreateContractPageComponent } from './pages/mobile-create-contract-page/mobile-create-contract-page.component';

// Components
// import { MobileContractCardComponent } from './components/mobile-contract-card/mobile-contract-card.component';
// import { MobileContractFormComponent } from './components/mobile-contract-form/mobile-contract-form.component';
// import { MobileContractStatusComponent } from './components/mobile-contract-status/mobile-contract-status.component';
// import { MobileContractTimelineComponent } from './components/mobile-contract-timeline/mobile-contract-timeline.component';
// import { MobileTenantInfoComponent } from './components/mobile-tenant-info/mobile-tenant-info.component';

// Shared Mobile Components


@NgModule({
  declarations: [
    // Pages
    MobileContractsListPageComponent,
    // MobileContractDetailsPageComponent,
    // MobileCreateContractPageComponent,

    // Components
    // MobileContractCardComponent,
    // MobileContractFormComponent,
    // MobileContractStatusComponent,
    // MobileContractTimelineComponent,
    // MobileTenantInfoComponent - Temporairement commenté
  ],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    ReactiveFormsModule,
    MobileContractsRoutingModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MobileContractsModule { }
