import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {YoupezModule} from '../../@youpez/youpez.module';
import { ClickOutsideDirective } from './directives/click-outside.directive';
import { NgxsModule } from '@ngxs/store';
import {
  UserProfileState, UserState, PropertyState, RoomState, LocataireState,
  AuthTokenState, LocationState, StatisticState, SouscriptionState,
  SouscriptionPeriodState, CityState, CountryState, SearchState, ContractState,
  HistoryLocationPaymentState, GlobalState, ContractTemplateState,
  SubscriptionLimitState, SubscriptionPaymentState, PremiumAccessState
} from './store';
import { WalletState } from './store/wallet';
import { NgxsRouterPluginModule } from '@ngxs/router-plugin';
import { RouterModule } from '@angular/router';
import { NgxsStoragePluginModule } from '@ngxs/storage-plugin';
import { NoDataComponent } from './components/no-data/no-data.component';
import { SmartNotificationsComponent } from './components/smart-notifications/smart-notifications.component';
import { ToastrModule } from 'ngx-toastr';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { LocationPaymentState } from './store/payment-location';
import { FileSizePipe } from './pipes/file-size.pipe';
import { FileUploadComponent } from './components/file-upload/file-upload.component';
import { UploadFilesState } from './store/files-upload';
import { ContractTemplateSelectorComponent } from './components/contract-template-selector/contract-template-selector.component';
import { ScrollRevealDirective } from './directives/scroll-reveal/scroll-reveal.directive';
import { LoadingOverlayComponent } from './components/loading-overlay/loading-overlay.component';
import { CountUpDirective } from './directives/counter-up/counter-up.directive';
import { NavProgressBarComponent } from './components/nav-progress-bar/nav-progress-bar.component';
import { SubscriptionLimitModalComponent } from './components/subscription-limit-modal/subscription-limit-modal.component';
import { SubscriptionStatusWidgetComponent } from './components/subscription-status-widget/subscription-status-widget.component';
import { ProspectionState } from './store/prospection/prospection.state';
import { TranslateModule } from '@ngx-translate/core';
import { PropertyManagerState } from './store/property-manager/property-manager.state';
import { EmailConfirmationBannerComponent } from './components/email-confirmation-banner/email-confirmation-banner.component';

const DECLARATIONS = [
  NoDataComponent, FileSizePipe, FileUploadComponent,
  ScrollRevealDirective, CountUpDirective,
  SmartNotificationsComponent, LoadingOverlayComponent,
  ContractTemplateSelectorComponent, SubscriptionLimitModalComponent,
  SubscriptionStatusWidgetComponent, ClickOutsideDirective,
  NavProgressBarComponent, EmailConfirmationBannerComponent
];

@NgModule({
  imports: [
    CommonModule,
    YoupezModule,
    MatDialogModule,
    FormsModule,
    ReactiveFormsModule,
    NgxsModule.forFeature([
      GlobalState, UserProfileState, UserState, PropertyState, RoomState,
      LocataireState, LocationState, AuthTokenState, LocationPaymentState,
      HistoryLocationPaymentState, StatisticState, SouscriptionState,
      SouscriptionPeriodState, CityState, CountryState, SearchState,
      UploadFilesState, ContractState, ProspectionState, ContractTemplateState,
      SubscriptionLimitState, SubscriptionPaymentState, PremiumAccessState,
      WalletState,
      PropertyManagerState
    ]),
    NgxsStoragePluginModule.forRoot({ key: ['ndewa360_auth_token'] }),
    NgxsRouterPluginModule.forRoot(),
    ToastrModule.forRoot({
      progressBar: true, closeButton: true,
      preventDuplicates: true, maxOpened: 3, autoDismiss: true
    }),
    TranslateModule.forChild(),
    ...DECLARATIONS
  ],
  exports: [
    YoupezModule, NgxsRouterPluginModule, NoDataComponent, NgxsModule,
    RouterModule, ToastrModule, MatDialogModule, FormsModule, ReactiveFormsModule,
    TranslateModule,
    ...DECLARATIONS
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SharedModule {}
