import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core'
import {CommonModule} from '@angular/common'
import {YoupezModule} from "../../@youpez/youpez.module"
import { DummyTableRichComponent } from "./components/dummy-table-rich/dummy-table-rich.component";
import { DummyTablePaginationComponent } from './components/dummy-table-pagination/dummy-table-pagination.component'
import { DummyTableExpansionComponent } from './components/dummy-table-expansion/dummy-table-expansion.component'
import { DummyTableAdvancedComponent } from './components/dummy-table-advanced/dummy-table-advanced.component'
import { DebugTokenPanelComponent } from './components/debug-token-panel/debug-token-panel.component'
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
  GlobalState,
  ContractTemplateState

} from './store';

import { NgxsRouterPluginModule } from '@ngxs/router-plugin';
import { RouterModule } from '@angular/router';
import { NgxsStoragePluginModule, StorageOption } from '@ngxs/storage-plugin';
import { NoDataComponent } from './components/no-data/no-data.component';
import { SmartNotificationsComponent } from './components/smart-notifications/smart-notifications.component';
import { ToastrModule } from 'ngx-toastr';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { LocationPaymentState } from './store/payment-location';
import { LocalizedDatePipe } from './pipes/localized-date.pipe';
import { MaxPipe } from './pipes/max.pipe';
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
import { ContractTemplateSelectorComponent } from './components/contract-template-selector/contract-template-selector.component';
import { ScrollRevealDirective } from './directives/scroll-reveal/scroll-reveal.directive';
import { LoadingOverlayComponent } from './components/loading-overlay/loading-overlay.component';
import { CountUpDirective } from './directives/counter-up/counter-up.directive';
import { ProspectionState } from './store/prospection/prospection.state';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';

// Factory function pour le loader de traduction
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}




@NgModule({
  imports: [
    CommonModule,
    YoupezModule,
    MatDialogModule,

    FormsModule,
    ReactiveFormsModule,
    //Ngxs module
    NgxsModule.forFeature(
      [
        GlobalState,
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
        ProspectionState,
        ContractTemplateState
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
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        }
      }),
  ],
  declarations: [
    DummyTableRichComponent,
    DummyTablePaginationComponent,
    DummyTableExpansionComponent,
    DummyTableAdvancedComponent,
    NoDataComponent,
    LocalizedDatePipe,
    MaxPipe,
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
    CountUpDirective,
    SmartNotificationsComponent,
    LoadingOverlayComponent,
    DebugTokenPanelComponent,
    ContractTemplateSelectorComponent
  ],
  exports: [
    YoupezModule,
    NgxsRouterPluginModule,
    NoDataComponent,
    NgxsModule,
    RouterModule,
    ToastrModule,
    MatDialogModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    LocalizedDatePipe,
    MaxPipe,
    FileUploadComponent,
    GaleryImageComponent,
    GaleryVideoComponent,
    GaleryVideo360Component,
    GaleryVideo360ItemComponent,
    SliderComponentGaleryComponent,
    FullScreenGaleryComponent,
    SinglePageScreenGaleryComponent,
    ScrollRevealDirective,
    CountUpDirective,
    SmartNotificationsComponent,
    LoadingOverlayComponent,
    DebugTokenPanelComponent,
    ContractTemplateSelectorComponent
  ],
  providers: [
    // Nouveaux services ajoutés
    // ErrorHandlerService est déjà fourni via providedIn: 'root'
    // NotificationManagerService sera ajouté plus tard
  ],
  schemas: [
      CUSTOM_ELEMENTS_SCHEMA
      ],
})
export class SharedModule {
  constructor() {

  }
}
