import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';

import { MobileFallbackComponent } from '../../shared/components/mobile-fallback/mobile-fallback.component';

const routes: Routes = [
  {
    path: '',
    component: MobileFallbackComponent
  }
];

@NgModule({
  declarations: [
    MobileFallbackComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MobileFallbackModule { }
