import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { UserProfileInfosComponent } from './components/user-profile-infos/user-profile-infos.component';
import { LocalizationSettingsComponent } from './components/localization-settings/localization-settings.component';

const routes: Routes = [
  { 
    path: '', 
    component: UserProfileComponent,
      children: [
        { path: 'infos', component: UserProfileInfosComponent },
        { path: 'localization', component: LocalizationSettingsComponent },
        { path: '', redirectTo: 'infos', pathMatch: 'full' },
      ]
    },
    {
      path: '**',
      redirectTo: 'infos',
      pathMatch: 'full'
    }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserProfileRoutingModule { }
