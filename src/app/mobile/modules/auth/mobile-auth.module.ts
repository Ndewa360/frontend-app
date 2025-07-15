import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Routing
import { MobileAuthRoutingModule } from './mobile-auth-routing.module';

// Components
import { MobileLoginPageComponent } from './pages/mobile-login-page/mobile-login-page.component';
import { MobileRegisterPageComponent } from './pages/mobile-register-page/mobile-register-page.component';
import { MobileForgotPasswordPageComponent } from './pages/mobile-forgot-password-page/mobile-forgot-password-page.component';
// import { MobileAuthFormComponent } from './components/mobile-auth-form/mobile-auth-form.component';
// import { MobileSocialLoginComponent } from './components/mobile-social-login/mobile-social-login.component';

// Shared Mobile Components
import { MobileModule } from '../../mobile.module';

@NgModule({
  declarations: [
    MobileLoginPageComponent,
    MobileRegisterPageComponent,
    MobileForgotPasswordPageComponent,
    // MobileAuthFormComponent,
    // MobileSocialLoginComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    ReactiveFormsModule,
    MobileAuthRoutingModule,
    MobileModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MobileAuthModule { }
