import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Composants
import { MobileProfilePageComponent } from './pages/mobile-profile-page/mobile-profile-page.component';
// import { MobileEditProfilePageComponent } from './pages/mobile-edit-profile-page/mobile-edit-profile-page.component';
// import { MobileSettingsPageComponent } from './pages/mobile-settings-page/mobile-settings-page.component';
// import { MobileNotificationsPageComponent } from './pages/mobile-notifications-page/mobile-notifications-page.component';

const routes: Routes = [
  {
    path: '',
    component: MobileProfilePageComponent
  },
  // {
  //   path: 'edit',
  //   component: MobileEditProfilePageComponent
  // },
  // {
  //   path: 'settings',
  //   component: MobileSettingsPageComponent
  // },
  // {
  //   path: 'notifications',
  //   component: MobileNotificationsPageComponent
  // }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MobileProfileRoutingModule { }
