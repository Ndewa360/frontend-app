import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from '../shared/shared.module';
import { OnboardingStepperComponent } from './onboarding-stepper/onboarding-stepper.component';
import { OnboardingRoutingModule } from './onboarding-routing.module';

@NgModule({
  declarations: [
    OnboardingStepperComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    TranslateModule,
    SharedModule,
    OnboardingRoutingModule,
  ],
})
export class OnboardingModule {}
