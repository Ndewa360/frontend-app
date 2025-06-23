import {NgModule} from '@angular/core'
import {CommonModule} from '@angular/common'

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
import { AddPropertyLocataireComponent } from './properties/components/add-property-locataire/add-property-locataire.component'
import { AddPropertyRoomComponent } from './properties/components/add-property-room/add-property-room.component'
import { FinancialHistoryComponent } from './properties/components/financial-history/financial-history.component'
import { PropertyFinanceComponent } from './properties/components/property-finance/property-finance.component'
import { PropertyLocataireComponent } from './properties/components/property-locataire/property-locataire.component'
import { PropertyRoomComponent } from './properties/components/property-room/property-room.component'
import { ListPropertyComponent } from './properties/list-property/list-property.component'
import { ShowPropertyComponent } from './properties/show-property/show-property.component'
import { LocatairePropertyModule } from './properties/components/locataire-property/locataire-property.module'
import { AgGridModule } from '@ag-grid-community/angular';

import { UpdatePropertyComponent } from './properties/components/update-property/update-property.component';
import { SeeLocationsComponent } from './properties/components/see-locations/see-locations.component';
// import { AssignLocationComponent } from './assign-location/assign-location/assign-location.component';
// import { AssignLocationFormComponent } from './assign-location/assign-location-form/assign-location-form.component';
import { AssignLocationListClientComponent } from './properties/components/assign-location-list-client/assign-location-list-client.component';
import { RemoveLocataireRoomComponent } from './properties/components/remove-locataire-room/remove-locataire-room.component'
import { LocationPaymentModule } from './location-payment/location-payment.module'
import { StatisticsModule } from './statistics/statistics.module'
import { GaleryPropertyComponent } from './properties/components/galery-property/galery-property.component'
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'
import { ModuleRegistry } from '@ag-grid-community/core'
import { CsvExportModule } from '@ag-grid-community/csv-export';
import { InfiniteRowModelModule } from '@ag-grid-community/infinite-row-model'
import { FilterModule } from '@ag-grid-community/core/dist/types/src/filter/filterModule';
import { CustomHistoryFinanceCellActionComponent } from './properties/components/custom-history-finance-cell-action/custom-history-finance-cell-action.component';
import { HomePropertyComponent } from './properties/home-property/home-property.component';
import { HomePropertyRecapFinanceComponent } from './properties/components/home-property-recap-finance/home-property-recap-finance.component';
import { HomePropertyRecapFinanceYearComponent } from './properties/components/home-property-recap-finance-year/home-property-recap-finance-year.component';
import { HomePropertyRecapFinanceMonthComponent } from './properties/components/home-property-recap-finance-month/home-property-recap-finance-month.component'
import { AssignLocationModule } from './assign-location/assign-location.module'
import { LayoutComponent as RoomLayout } from './room/components/layout/layout.component'
// import { HomeComponent as SupportHome} from '../support/home/home.component'
import { DeleteRoomComponent } from './room/components/delete-room/delete-room.component'
import { GaleryComponent } from './room/components/galery/galery.component'
import { LayoutListComponent } from './room/components/layout-list/layout-list.component'
import { UpdateRoomComponent } from './room/components/update-room/update-room.component';
import { DetailsRoomComponent } from './room/components/details-room/details-room.component';
import { CurrentLocataireComponent } from './room/components/current-locataire/current-locataire.component';
import { DetailsPaymentRoomComponent } from './room/components/details-payment-room/details-payment-room.component';
import { DetailsRoomGaleryComponent } from './room/components/details-room-galery/details-room-galery.component'
import { HistoryPaymentComponent } from './locataires/components/history-payment/history-payment.component'
import { HistoryRoomComponent } from './locataires/components/history-room/history-room.component'
import { HistoryComponent } from './locataires/components/history/history.component'
import { LocataireProfilComponent } from './locataires/components/locataire-profil/locataire-profil.component'
import { LocataireRoomListComponent } from './locataires/components/locataire-room-list/locataire-room-list.component'
import { UpdateLocataireComponent } from './locataires/components/update-locataire/update-locataire.component'
import { LocatairePageComponent } from './locataires/locataire-page/locataire-page.component'
import { LayoutListComponent as LayoutLocataireListComponent } from './locataires/components/layout-list/layout-list.component';
import { LayoutComponent as LayoutLocataireComponent } from './locataires/components/layout/layout.component';
import { DetailsLocataireComponent } from './locataires/components/details-locataire/details-locataire.component';
import { CurrentRoomComponent } from './locataires/components/current-room/current-room.component';
import { DetailsPaymentLocataireComponent } from './locataires/components/details-payment-locataire/details-payment-locataire.component';
import { PropertyOverviewCardComponent } from './dashboard/components/property-overview-card/property-overview-card.component'

// Nouveaux composants modernes
import { PropertyDetailsCompleteComponent } from './properties/property-details-complete/property-details-complete.component'
import { PropertyUnitsComponent } from './properties/components/property-units/property-units.component'
import { PropertyTenantsComponent } from './properties/components/property-tenants/property-tenants.component'
import { PropertyHistoryComponent } from './properties/components/property-history/property-history.component'
import { PropertyFinancesComponent } from './properties/components/property-finances/property-finances.component'
import { ModernFinancialDashboardComponent } from './properties/components/modern-financial-dashboard/modern-financial-dashboard.component';



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
    ShowPropertyComponent,
    AddPropertyComponent,
    PropertyRoomComponent,
    PropertyFinanceComponent,
    PropertyLocataireComponent,
    AddPropertyRoomComponent,
    AddPropertyLocataireComponent,
    FinancialHistoryComponent,
    UpdatePropertyComponent,
    SeeLocationsComponent,
    // AssignLocationComponent,
    // AssignLocationFormComponent,
    AssignLocationListClientComponent,
    RemoveLocataireRoomComponent,
    GaleryPropertyComponent,
    CustomHistoryFinanceCellActionComponent,
    HomePropertyComponent,
    HomePropertyRecapFinanceComponent,
    HomePropertyRecapFinanceYearComponent,
    HomePropertyRecapFinanceMonthComponent,
    UpdateRoomComponent,
    GaleryComponent,
    DeleteRoomComponent,
    // SupportHome,
    RoomLayout,
    LayoutListComponent,
    DetailsRoomComponent,
    CurrentLocataireComponent,
    DetailsPaymentRoomComponent,
    DetailsRoomGaleryComponent,

    LocatairePageComponent,
    LocataireProfilComponent,
    LocataireRoomListComponent,
    HistoryPaymentComponent,
    HistoryRoomComponent,
    HistoryComponent,
    UpdateLocataireComponent,
    LayoutLocataireListComponent,
    LayoutLocataireComponent,
    DetailsLocataireComponent,
    CurrentRoomComponent,
    DetailsPaymentLocataireComponent,
    PropertyOverviewCardComponent,

    // Nouveaux composants modernes
    PropertyDetailsCompleteComponent,
    PropertyUnitsComponent,
    PropertyTenantsComponent,
    PropertyHistoryComponent,
    PropertyFinancesComponent,
    ModernFinancialDashboardComponent

  ],
  imports: [
    CommonModule,
    MainRoutingModule,
    LayoutModule,
    SharedModule,
    ChartsModule,
    LocationPaymentModule,
    AgGridModule,
    LocatairePropertyModule,
    StatisticsModule,
    AssignLocationModule
  ]
})
export class MainModule {
}
