import {NgModule} from '@angular/core'
import {CommonModule} from '@angular/common'

import {SharedModule} from "../shared/shared.module"
import {LayoutModule} from "../layout/layout.module"
import {ChartsModule} from '../../@youpez'
import {MainRoutingModule} from './main-routing.module'


import {FaqComponent} from './application/faq/faq.component'
import {ManualComponent} from './application/manual/manual.component'
import {SupportComponent} from './application/support/support.component'
import {ChangelogComponent} from './application/changelog/changelog.component'
import {WelcomeComponent} from './welcome/welcome.component'
import {GettingStartedComponent} from './application/getting-started/getting-started.component'
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
import { AssignLocationComponent } from './properties/components/assign-location/assign-location.component';
import { AssignLocationFormComponent } from './properties/components/assign-location-form/assign-location-form.component';
import { AssignLocationListClientComponent } from './properties/components/assign-location-list-client/assign-location-list-client.component';
import { RemoveLocataireRoomComponent } from './properties/components/remove-locataire-room/remove-locataire-room.component'
import { LocationPaymentModule } from './location-payment/location-payment.module'
import { LocatairesModule } from './locataires/locataires.module'
import { StatisticsModule } from './statistics/statistics.module'
import { RoomModule } from './room/room.module';
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

ModuleRegistry.registerModules([
  ClientSideRowModelModule, 
  InfiniteRowModelModule, 
  CsvExportModule
  // ExcelExportModule
]);

@NgModule({
  declarations: [
    ChangelogComponent,
    FaqComponent,
    GettingStartedComponent,
    ManualComponent,
    SupportComponent,
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
    AssignLocationComponent,
    AssignLocationFormComponent,
    AssignLocationListClientComponent,
    RemoveLocataireRoomComponent,
    GaleryPropertyComponent,
    CustomHistoryFinanceCellActionComponent,
    HomePropertyComponent,
    HomePropertyRecapFinanceComponent,
    HomePropertyRecapFinanceYearComponent,
    HomePropertyRecapFinanceMonthComponent,
    
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
    LocatairesModule,
    RoomModule,
    StatisticsModule
  ]
})
export class MainModule {
}
