import {NgModule} from '@angular/core'
import {Routes, RouterModule} from '@angular/router'
import {AuthLoginComponent} from "./auth-login/auth-login.component"

import {
  AppLayoutDividedFullComponent} from "src/@youpez/index"

import {AuthSignupComponent} from "./auth-signup/auth-signup.component"
import {AuthForgotPasswordComponent} from "./auth-forgot-password/auth-forgot-password.component"
import {AuthResetPasswordComponent} from "./auth-reset-password/auth-reset-password.component"
import {AuthConfirmationComponent} from "./auth-confirmation/auth-confirmation.component"
import { AuthAsktoValidEmailComponent } from './auth-askto-valid-email/auth-askto-valid-email.component'
import { AuthValidatingAccountComponent } from './auth-validating-account/auth-validating-account.component'

const routes: Routes = [
  
  { 
    path: '',
    component: AppLayoutDividedFullComponent,
    children: [
      {
        path: 'signin',
        component: AuthLoginComponent,
      },
      {
        path: 'signup',
        component: AuthSignupComponent,
      },
      {
        path: 'reset-password',
        component: AuthResetPasswordComponent,
      },
      {
        path: 'forgot-password',
        component: AuthForgotPasswordComponent,
      },
      {
        path: 'confirmation/:email',
        component: AuthConfirmationComponent,
      },
      {
        path: 'link-receive',
        component: AuthValidatingAccountComponent,
      },
      {
        path: 'askto-valid-email',
        component: AuthAsktoValidEmailComponent,
      },
      {
        path: '**',
        redirectTo: 'signin',
        pathMatch: 'full',
      },
    ],
  },

]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule {
}
