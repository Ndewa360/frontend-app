import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserProfileRoutingModule } from './user-profile-routing.module';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { UserProfileInfosComponent } from './components/user-profile-infos/user-profile-infos.component';
import { LocalizationSettingsComponent } from './components/user-profile-infos/localization-settings.component';
import { MonthlyReportsComponent } from './components/monthly-reports/monthly-reports.component';
import { AgentContactDisplaySettingsComponent } from './components/agent-contact-display/agent-contact-display.component';


@NgModule({
  declarations: [
    UserProfileComponent,
    UserProfileInfosComponent,
    LocalizationSettingsComponent,
    MonthlyReportsComponent,
    AgentContactDisplaySettingsComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    UserProfileRoutingModule
  ]
})
export class UserProfileModule { }
