import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {YoupezModule} from '../../@youpez/youpez.module';
import { ClickOutsideDirective } from './directives/click-outside.directive';
import { NgxsModule } from '@ngxs/store';
import { RouterModule } from '@angular/router';
import { NoDataComponent } from './components/no-data/no-data.component';
import { SmartNotificationsComponent } from './components/smart-notifications/smart-notifications.component';
import { ToastrModule } from 'ngx-toastr';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { FileSizePipe } from './pipes/file-size.pipe';
import { FileUploadComponent } from './components/file-upload/file-upload.component';
import { ContractTemplateSelectorComponent } from './components/contract-template-selector/contract-template-selector.component';
import { ScrollRevealDirective } from './directives/scroll-reveal/scroll-reveal.directive';
import { LoadingOverlayComponent } from './components/loading-overlay/loading-overlay.component';
import { CountUpDirective } from './directives/counter-up/counter-up.directive';
import { NavProgressBarComponent } from './components/nav-progress-bar/nav-progress-bar.component';
import { SubscriptionLimitModalComponent } from './components/subscription-limit-modal/subscription-limit-modal.component';
import { SubscriptionStatusWidgetComponent } from './components/subscription-status-widget/subscription-status-widget.component';
import { TranslateModule } from '@ngx-translate/core';
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
    TranslateModule.forChild(),
    ...DECLARATIONS
  ],
  exports: [
    YoupezModule, NoDataComponent, NgxsModule,
    RouterModule, ToastrModule, MatDialogModule, FormsModule, ReactiveFormsModule,
    TranslateModule,
    ...DECLARATIONS
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SharedModule {}
