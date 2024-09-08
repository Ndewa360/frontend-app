import {NgModule} from '@angular/core'
import {CommonModule} from '@angular/common'
import {YoupezModule} from "../../@youpez/youpez.module"
// import { DummyTableRichComponent } from "./components/dummy-table-rich/dummy-table-rich.component";
// import { DummyTablePaginationComponent } from './components/dummy-table-pagination/dummy-table-pagination.component'
// import { DummyTableExpansionComponent } from './components/dummy-table-expansion/dummy-table-expansion.component'
// import { DummyTableAdvancedComponent } from './components/dummy-table-advanced/dummy-table-advanced.component'
import { NgxsModule } from '@ngxs/store';
import { UserProfileState, UserState, PropertyState, RoomState, LocataireState, AuthTokenState } from './store';
import { RouterModule } from '@angular/router';
import { NgxsStoragePluginModule, StorageOption } from '@ngxs/storage-plugin';
import { NoDataComponent } from './components/no-data/no-data.component';
import { ToastrModule } from 'ngx-toastr';
@NgModule({
  imports: [
    CommonModule,
    YoupezModule,

    //Ngxs module
    NgxsModule.forFeature(
      [
        UserProfileState,
        UserState,
        PropertyState,
        RoomState,
        LocataireState,
        AuthTokenState
      ]),
      NgxsStoragePluginModule.forRoot({
        key:"auth_token",
        storage:StorageOption.SessionStorage
      }),
      ToastrModule.forRoot(),
  ],
  declarations: [
    // DummyTableRichComponent,
    // DummyTablePaginationComponent,
    // DummyTableExpansionComponent,
    // DummyTableAdvancedComponent,
    NoDataComponent
  ],
  exports: [
    YoupezModule,
    // DummyTableRichComponent,
    // DummyTablePaginationComponent,
    // DummyTableExpansionComponent,
    // DummyTableAdvancedComponent,
    NoDataComponent,
    NgxsModule,
    RouterModule,
    ToastrModule
  ]
})
export class SharedModule {
  constructor() {

  }
}
