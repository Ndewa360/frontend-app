import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MobileLoginPageComponent } from './pages/mobile-login-page/mobile-login-page.component';
// import { MobileRegisterPageComponent } from './pages/mobile-register-page/mobile-register-page.component';
// import { MobileForgotPasswordPageComponent } from './pages/mobile-forgot-password-page/mobile-forgot-password-page.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: MobileLoginPageComponent
  },
  // {
  //   path: 'register',
  //   component: MobileRegisterPageComponent
  // },
  // {
  //   path: 'forgot-password',
  //   component: MobileForgotPasswordPageComponent
  // }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MobileAuthRoutingModule { }
