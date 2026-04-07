import {NgModule} from '@angular/core'
import {CommonModule} from '@angular/common'
import { MatDialogModule } from '@angular/material/dialog'
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer'
import { TranslateModule } from '@ngx-translate/core'

import {SharedModule} from "../shared/shared.module"
import {LayoutModule} from "../layout/layout.module"
import {ChartsModule} from '../../@youpez'
import {MainRoutingModule} from './main-routing.module'


// import {FaqComponent} from './application/faq/faq.component'
// import {ManualComponent} from './application/manual/manual.component'
// import {SupportComponent} from './application/support/support.component'
// import {ChangelogComponent} from './application/changelog/changelog.component'
import {WelcomeComponent} from './welcome/welcome.component'
// import {GettingStartedComponent} from './application/getting-started/getting-started.component'
import { AddPropertyComponent } from './properties/add-property/add-property.component'
import { ListPropertyComponent } from './properties/list-property/list-property.component'
import { AgGridModule } from '@ag-grid-community/angular';

import { UpdatePropertyComponent } from './properties/update-property/update-property.component';
// import { AssignLocationComponent } from './assign-location/assign-location/assign-location.component';
// import { AssignLocationFormComponent } from './assign-location/assign-location-form/assign-location-form.component';
// Anciens modals supprimés - remplacés par les modals modernes
import { LocationPaymentModule } from './location-payment/location-payment.module'
import { StatisticsModule } from './statistics/statistics.module'
import { ModernModalsModule } from './properties/components/modern-modals/modern-modals.module'
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'
import { ModuleRegistry } from '@ag-grid-community/core'
import { CsvExportModule } from '@ag-grid-community/csv-export';
import { InfiniteRowModelModule } from '@ag-grid-community/infinite-row-model'
import { FilterModule } from '@ag-grid-community/core/dist/types/src/filter/filterModule';
import { HomePropertyComponent } from './properties/home-property/home-property.component';
import { AssignLocationModule } from './assign-location/assign-location.module'
// import { HomeComponent as SupportHome} from '../support/home/home.component'
import { GaleryComponent } from './room/components/galery/galery.component'
import { DetailsRoomGaleryComponent } from './room/components/details-room-galery/details-room-galery.component'

import { PropertyOverviewCardComponent } from './properties/components/property-overview-card/property-overview-card.component'

// Nouveaux composants modernes
import { PropertyDetailsCompleteComponent } from './properties/property-details-complete/property-details-complete.component'
import { PropertyTenantsComponent } from './properties/components/property-tenants/property-tenants.component'
import { PropertyHistoryComponent } from './properties/components/property-history/property-history.component'
// import { PropertyFinancesComponent } from './properties/components/property-finances/property-finances.component'
import { PropertyFinancesComponent } from './properties/components/property-finances/property-finances.component'
import { PropertyOverviewComponent } from './properties/components/property-overview/property-overview.component'

// Sous-composants de PropertyFinances
import { FinancialOverviewComponent } from './properties/components/property-finances/components/financial-overview/financial-overview.component'
import { TenantPaymentAnalysisComponent } from './properties/components/property-finances/components/tenant-payment-analysis/tenant-payment-analysis.component'
import { DepositsSummaryComponent } from './properties/components/property-finances/components/deposits-summary/deposits-summary.component'
import { MonthlyRevenueAnalysisComponent } from './properties/components/property-finances/components/monthly-revenue-analysis/monthly-revenue-analysis.component'

import { TenantPaymentTrackingComponent } from './properties/components/property-finances/components/tenant-payment-tracking/tenant-payment-tracking.component'
import { ActualRevenueAnalysisComponent } from './properties/components/property-finances/components/actual-revenue-analysis/actual-revenue-analysis.component'
import { AdvancedFinancialDashboardComponent } from './properties/components/property-finances/components/advanced-financial-dashboard/advanced-financial-dashboard.component'
import { TenantDetailsPanelComponent } from './properties/components/tenant-details-panel/tenant-details-panel.component'
import { PropertyUnitsListComponent } from './properties/components/property-units-list/property-units-list.component'
import { ModernFinancialDashboardComponent } from './properties/components/modern-financial-dashboard/modern-financial-dashboard.component';



// Composant panneau latéral
import { UnitDetailsPanelComponent } from './properties/components/unit-details-panel/unit-details-panel.component';
import { ModernUnitDetailsPanelComponent } from './properties/components/modern-unit-details-panel/modern-unit-details-panel.component';

// Nouveaux composants modulaires
import { UnitHeaderComponent } from './properties/components/unit-details-panel/components/unit-header/unit-header.component';
import { UnitPaymentsTabComponent } from './properties/components/unit-details-panel/components/unit-payments-tab/unit-payments-tab.component';
import { AddPaymentModalComponent } from './properties/components/unit-details-panel/components/add-payment-modal/add-payment-modal.component';
import { GeneratePaymentLinkModalComponent } from './properties/components/generate-payment-link-modal/generate-payment-link-modal.component';
import { ContractViewerModalComponent } from './properties/components/contract-viewer-modal/contract-viewer-modal.component';
import { PropertyGalleryComponent } from './properties/components/property-gallery/property-gallery.component';
import { PropertiesSharedModule } from './properties/properties-shared.module';
import { Error404Component } from './errors/error404/error404.component';
import { Error500Component } from './errors/error500/error500.component';
import { TourHelpButtonComponent } from './properties/components/tour-help-button/tour-help-button.component';
import { AssignManagerModalComponent } from './properties/components/property-managers/assign-manager-modal/assign-manager-modal.component';
import { ManagersListComponent } from './properties/components/property-managers/managers-list/managers-list.component';
import { RevokeConfirmModalComponent } from './properties/components/property-managers/revoke-confirm-modal/revoke-confirm-modal.component';
import { EditPermissionsModalComponent } from './properties/components/property-managers/edit-permissions-modal/edit-permissions-modal.component';

// Import du module de paiement (déjà importé plus haut)



ModuleRegistry.registerModules([
  ClientSideRowModelModule, 
  InfiniteRowModelModule, 
  CsvExportModule
  // ExcelExportModule
]);

@NgModule({
  declarations: [
    // ChangelogComponent,
    // FaqComponent,
    // GettingStartedComponent,
    // ManualComponent,
    // SupportComponent,
    WelcomeComponent,
    ListPropertyComponent,
    AddPropertyComponent,
    UpdatePropertyComponent,
    // AssignLocationComponent,
    // AssignLocationFormComponent,
    // RemoveLocataireRoomComponent, // Supprimé - remplacé par ModernContractTerminationModalComponent
    HomePropertyComponent,
    GaleryComponent,
    // SupportHome,
    DetailsRoomGaleryComponent,

    PropertyOverviewCardComponent,

    // Nouveaux composants modernes
    PropertyDetailsCompleteComponent,
    PropertyTenantsComponent,
    PropertyHistoryComponent,
    PropertyFinancesComponent,
    PropertyOverviewComponent,
    PropertyUnitsListComponent,
    ModernFinancialDashboardComponent,
    TenantDetailsPanelComponent,

    // Sous-composants de PropertyFinances
    FinancialOverviewComponent,
    TenantPaymentAnalysisComponent,
    DepositsSummaryComponent,
    MonthlyRevenueAnalysisComponent,
    TenantPaymentTrackingComponent,
    ActualRevenueAnalysisComponent,
    AdvancedFinancialDashboardComponent,


    // Composant panneau latéral
    UnitDetailsPanelComponent,
    ModernUnitDetailsPanelComponent,

    // Nouveaux composants modulaires
    UnitHeaderComponent,
    UnitPaymentsTabComponent,
    AddPaymentModalComponent,
    GeneratePaymentLinkModalComponent,
    ContractViewerModalComponent,
    PropertyGalleryComponent,
    Error404Component,
    Error500Component,
    TourHelpButtonComponent,
    AssignManagerModalComponent,
    ManagersListComponent,
    RevokeConfirmModalComponent,
    EditPermissionsModalComponent,

  ],
  imports: [
    CommonModule,
    MainRoutingModule,
    LayoutModule,
    SharedModule,
    ChartsModule,
    MatDialogModule,
    NgxExtendedPdfViewerModule,
    LocationPaymentModule,
    AgGridModule,
    StatisticsModule,
    AssignLocationModule,
    PropertiesSharedModule,
    ModernModalsModule,
    TranslateModule
  ]
})
export class MainModule {
}
