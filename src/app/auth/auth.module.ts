import {NgModule} from '@angular/core'
import {CommonModule} from '@angular/common'
import {SharedModule} from "../shared/shared.module"

import {AuthRoutingModule} from './auth-routing.module'
import {AuthLoginComponent} from './auth-login/auth-login.component'
import {AuthSignupComponent} from './auth-signup/auth-signup.component'
import {AuthConfirmationComponent} from './auth-confirmation/auth-confirmation.component'
import {AuthForgotPasswordComponent} from './auth-forgot-password/auth-forgot-password.component'
import {AuthResetPasswordComponent} from './auth-reset-password/auth-reset-password.component'
import { RouterModule } from '@angular/router';
import { AuthAsktoValidEmailComponent } from './auth-askto-valid-email/auth-askto-valid-email.component';
import { AuthValidatingAccountComponent } from './auth-validating-account/auth-validating-account.component'


@NgModule({
  declarations: [
    AuthLoginComponent,
    AuthSignupComponent,
    AuthConfirmationComponent,
    AuthForgotPasswordComponent,
    AuthResetPasswordComponent,
    AuthAsktoValidEmailComponent,
    AuthValidatingAccountComponent
  ],
  imports: [
    CommonModule,
    AuthRoutingModule,
    RouterModule,
    SharedModule,
  ]
})
export class AuthModule {
}
