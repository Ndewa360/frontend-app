import {NgModule} from '@angular/core'
import {CommonModule} from '@angular/common'
import { MatDialogModule } from '@angular/material/dialog'
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer'
import { TranslateModule } from '@ngx-translate/core'

import {SharedModule} from "../shared/shared.module"
import {LayoutModule} from "../layout/layout.module"
import {ChartsModule} from '../../@youpez'
import {MainRoutingModule} from './main-routing.module'

import {WelcomeComponent} from './welcome/welcome.component'
import { AgGridModule } from '@ag-grid-community/angular';
import { LocationPaymentModule } from './location-payment/location-payment.module'
import { StatisticsModule } from './statistics/statistics.module'
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model'
import { ModuleRegistry } from '@ag-grid-community/core'
import { CsvExportModule } from '@ag-grid-community/csv-export';
import { InfiniteRowModelModule } from '@ag-grid-community/infinite-row-model'
import { GaleryComponent } from './room/components/galery/galery.component'
import { DetailsRoomGaleryComponent } from './room/components/details-room-galery/details-room-galery.component'
import { AssignLocationModule } from './assign-location/assign-location.module'

ModuleRegistry.registerModules([
  ClientSideRowModelModule, 
  InfiniteRowModelModule, 
  CsvExportModule
]);

@NgModule({
  declarations: [
    WelcomeComponent,
    GaleryComponent,
    DetailsRoomGaleryComponent,
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
    TranslateModule
  ]
})
export class MainModule {
}
