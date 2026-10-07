import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { TranslateModule } from '@ngx-translate/core';
import { AgGridModule } from '@ag-grid-community/angular';

import { SharedModule } from 'src/app/shared/shared.module';
import { LocationPaymentModule } from '../location-payment/location-payment.module';
import { AssignLocationModule } from '../assign-location/assign-location.module';
import { PropertiesRoutingModule } from './properties-routing.module';

import { AddPropertyComponent } from './add-property/add-property.component';
import { ListPropertyComponent } from './list-property/list-property.component';
import { UpdatePropertyComponent } from './update-property/update-property.component';
import { HomePropertyComponent } from './home-property/home-property.component';
import { PropertyDetailsCompleteComponent } from './property-details-complete/property-details-complete.component';
import { PropertyOverviewCardComponent } from './components/property-overview-card/property-overview-card.component';
import { PropertyTenantsComponent } from './components/property-tenants/property-tenants.component';
import { PropertyHistoryComponent } from './components/property-history/property-history.component';
import { PropertyFinancesComponent } from './components/property-finances/property-finances.component';
import { PropertyOverviewComponent } from './components/property-overview/property-overview.component';
import { PropertyUnitsListComponent } from './components/property-units-list/property-units-list.component';
import { ModernFinancialDashboardComponent } from './components/modern-financial-dashboard/modern-financial-dashboard.component';
import { TenantDetailsPanelComponent } from './components/tenant-details-panel/tenant-details-panel.component';
import { FinancialOverviewComponent } from './components/property-finances/components/financial-overview/financial-overview.component';
import { DepositsSummaryComponent } from './components/property-finances/components/deposits-summary/deposits-summary.component';
import { MonthlyRevenueAnalysisComponent } from './components/property-finances/components/monthly-revenue-analysis/monthly-revenue-analysis.component';
import { TenantPaymentTrackingComponent } from './components/property-finances/components/tenant-payment-tracking/tenant-payment-tracking.component';
import { UnitDetailsPanelComponent } from './components/unit-details-panel/unit-details-panel.component';
import { UnitPaymentsTabComponent } from './components/unit-details-panel/components/unit-payments-tab/unit-payments-tab.component';
import { AddPaymentModalComponent } from './components/unit-details-panel/components/add-payment-modal/add-payment-modal.component';
import { GeneratePaymentLinkModalComponent } from './components/generate-payment-link-modal/generate-payment-link-modal.component';
import { ContractViewerModalComponent } from './components/contract-viewer-modal/contract-viewer-modal.component';
import { PropertyGalleryComponent } from './components/property-gallery/property-gallery.component';
import { AssignManagerModalComponent } from './components/property-managers/assign-manager-modal/assign-manager-modal.component';
import { ManagersListComponent } from './components/property-managers/managers-list/managers-list.component';
import { RevokeConfirmModalComponent } from './components/property-managers/revoke-confirm-modal/revoke-confirm-modal.component';
import { EditPermissionsModalComponent } from './components/property-managers/edit-permissions-modal/edit-permissions-modal.component';
import { PropertiesSharedModule } from './properties-shared.module';

import { Error404Component } from '../errors/error404/error404.component';

@NgModule({
  imports: [
    CommonModule,
    PropertiesRoutingModule,
    SharedModule,
    MatDialogModule,
    NgxExtendedPdfViewerModule,
    LocationPaymentModule,
    AgGridModule,
    AssignLocationModule,
    PropertiesSharedModule,
    TranslateModule,
    AddPropertyComponent,
    ListPropertyComponent,
    UpdatePropertyComponent,
    HomePropertyComponent,
    PropertyDetailsCompleteComponent,
    PropertyOverviewCardComponent,
    PropertyTenantsComponent,
    PropertyHistoryComponent,
    PropertyFinancesComponent,
    PropertyOverviewComponent,
    PropertyUnitsListComponent,
    ModernFinancialDashboardComponent,
    TenantDetailsPanelComponent,
    FinancialOverviewComponent,
    DepositsSummaryComponent,
    MonthlyRevenueAnalysisComponent,
    TenantPaymentTrackingComponent,
    UnitDetailsPanelComponent,
    UnitPaymentsTabComponent,
    AddPaymentModalComponent,
    GeneratePaymentLinkModalComponent,
    ContractViewerModalComponent,
    PropertyGalleryComponent,
    AssignManagerModalComponent,
    ManagersListComponent,
    RevokeConfirmModalComponent,
    EditPermissionsModalComponent,
    Error404Component
  ]
})
export class PropertiesPageModule {}
