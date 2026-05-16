import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OnboardingStepperComponent } from './onboarding-stepper/onboarding-stepper.component';

const routes: Routes = [
  {
    path: '',
    component: OnboardingStepperComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OnboardingRoutingModule {}
