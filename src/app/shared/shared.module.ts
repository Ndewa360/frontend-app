import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core'
import {CommonModule} from '@angular/common'
import {YoupezModule} from "../../@youpez/youpez.module"
import { DummyTableRichComponent } from "./components/dummy-table-rich/dummy-table-rich.component";
import { DummyTablePaginationComponent } from './components/dummy-table-pagination/dummy-table-pagination.component'
import { DummyTableExpansionComponent } from './components/dummy-table-expansion/dummy-table-expansion.component'
import { DummyTableAdvancedComponent } from './components/dummy-table-advanced/dummy-table-advanced.component'
import { NgxsModule } from '@ngxs/store';
import { 
  UserProfileState, 
  UserState, 
  PropertyState, 
  RoomState, 
  LocataireState, 
  AuthTokenState, 
  LocationState, 
  StatisticState, 
  SouscriptionState, 
  SouscriptionPeriodState,
  CityState,
  CountryState,
  SearchState,
  ContractState,
  HistoryLocationPaymentState,

} from './store';

import { NgxsRouterPluginModule } from '@ngxs/router-plugin';
import { RouterModule } from '@angular/router';
import { NgxsStoragePluginModule, StorageOption } from '@ngxs/storage-plugin';
import { NoDataComponent } from './components/no-data/no-data.component';
import { ToastrModule } from 'ngx-toastr';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LocationPaymentState } from './store/payment-location';
import { LocalizedDatePipe } from './pipes/localized-date.pipe';
import { FileUploadComponent } from './components/file-upload/file-upload.component';
import { UploadFilesState } from './store/files-upload';
import { GaleryImageComponent } from './components/galery-image/galery-image.component';
import { GaleryVideoComponent } from './components/galery-video/galery-video.component';
import { GaleryVideo360Component } from './components/galery-video360/galery-video360.component';
import { GaleryVideo360ItemComponent } from './components/galery-video360-item/galery-video360-item.component';
import { SliderComponentGaleryComponent } from './components/slider-component-galery/slider-component-galery.component';
import { FullScreenGaleryComponent } from './components/full-screen-galery/full-screen-galery.component';
import { SinglePageScreenGaleryComponent } from './components/single-page-screen-galery/single-page-screen-galery.component';
import { SwiperDirective } from './directives';
import { BrowserModule } from '@angular/platform-browser';
import { ScrollRevealDirective } from './directives/scroll-reveal/scroll-reveal.directive';
import { CountUpDirective } from './directives/counter-up/counter-up.directive';
import { ProspectionState } from './store/prospection/prospection.state';




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
        SouscriptionState,
        SouscriptionPeriodState,
        CityState,
        CountryState,
        SearchState,
        UploadFilesState,
        ContractState,
        ProspectionState
      ]),
      NgxsStoragePluginModule.forRoot({
        key:["ndewa360_auth_token"]
        // key:"auth_token",
        // storage:StorageOption.SessionStorage
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
    LocalizedDatePipe,
    FileUploadComponent,
    GaleryImageComponent,
    GaleryVideoComponent,
    GaleryVideo360Component,
    GaleryVideo360ItemComponent,
    SliderComponentGaleryComponent,
    FullScreenGaleryComponent,
    SinglePageScreenGaleryComponent,
    SwiperDirective,
    ScrollRevealDirective,
    CountUpDirective
  ],
  exports: [
    YoupezModule,
    NgxsRouterPluginModule,
    NoDataComponent,
    NgxsModule,
    RouterModule,
    ToastrModule,
    FormsModule,
    ReactiveFormsModule,
    LocalizedDatePipe,
    FileUploadComponent,
    GaleryImageComponent,
    GaleryVideoComponent,
    GaleryVideo360Component,
    SliderComponentGaleryComponent,
    FullScreenGaleryComponent,
    SinglePageScreenGaleryComponent,
    ScrollRevealDirective,
    CountUpDirective,

  ],
  schemas: [
      CUSTOM_ELEMENTS_SCHEMA
      ],
})
export class SharedModule {
  constructor() {

  }
}
