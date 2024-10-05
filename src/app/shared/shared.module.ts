import {NgModule} from '@angular/core'
import {CommonModule} from '@angular/common'
import {YoupezModule} from "../../@youpez/youpez.module"
import { DummyTableRichComponent } from "./components/dummy-table-rich/dummy-table-rich.component";
import { DummyTablePaginationComponent } from './components/dummy-table-pagination/dummy-table-pagination.component'
import { DummyTableExpansionComponent } from './components/dummy-table-expansion/dummy-table-expansion.component'
import { DummyTableAdvancedComponent } from './components/dummy-table-advanced/dummy-table-advanced.component'
import { NgxsModule } from '@ngxs/store';
import { UserProfileState, UserState, PropertyState, RoomState, LocataireState, AuthTokenState, LocationState, StatisticState } from './store';
import { NgxsRouterPluginModule } from '@ngxs/router-plugin';
import { RouterModule } from '@angular/router';
import { NgxsStoragePluginModule, StorageOption } from '@ngxs/storage-plugin';
import { NoDataComponent } from './components/no-data/no-data.component';
import { ToastrModule } from 'ngx-toastr';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LocationPaymentState } from './store/payment-location';
import { HistoryLocationPaymentState } from './store/history-payment-location';
import { LocalizedDatePipe } from './pipes/localized-date.pipe';
@NgModule({
  imports: [
    CommonModule,
    YoupezModule,
    
    FormsModule,
    ReactiveFormsModule,
    //Ngxs module
    NgxsModule.forFeature(
      [
        UserProfileState,
        UserState,
        PropertyState,
        RoomState,
        LocataireState,
        LocationState,
        AuthTokenState,
        LocationPaymentState,
        HistoryLocationPaymentState,
        StatisticState,
      ]),
      NgxsStoragePluginModule.forRoot({
        key:"auth_token",
        storage:StorageOption.SessionStorage
      }),
      NgxsRouterPluginModule.forRoot(),
      ToastrModule.forRoot({
        progressBar:true,
        closeButton:true
      }),
  ],
  declarations: [
    DummyTableRichComponent,
    DummyTablePaginationComponent,
    DummyTableExpansionComponent,
    DummyTableAdvancedComponent,
    NoDataComponent,
    LocalizedDatePipe
  ],
  exports: [
    YoupezModule,
    // DummyTableRichComponent,
    // DummyTablePaginationComponent,
    // DummyTableExpansionComponent,
    // DummyTableAdvancedComponent,
    NgxsRouterPluginModule,
    NoDataComponent,
    NgxsModule,
    RouterModule,
    ToastrModule,
    FormsModule,
    ReactiveFormsModule,
    LocalizedDatePipe
  ],
})
export class SharedModule {
  constructor() {

  }
}
