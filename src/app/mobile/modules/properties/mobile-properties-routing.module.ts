import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MobilePropertiesListPageComponent } from './pages/mobile-properties-list-page/mobile-properties-list-page.component';
import { MobilePropertyDetailsPageComponent } from './pages/mobile-property-details-page/mobile-property-details-page.component';
import { MobileAddPropertyPageComponent } from './pages/mobile-add-property-page/mobile-add-property-page.component';
import { MobilePropertyUnitsPageComponent } from './pages/mobile-property-units-page/mobile-property-units-page.component';

const routes: Routes = [
  {
    path: '',
    component: MobilePropertiesListPageComponent
  },
  {
    path: 'add',
    component: MobileAddPropertyPageComponent
  },
  {
    path: ':id',
    component: MobilePropertyDetailsPageComponent
  },
  {
    path: ':id/units',
    component: MobilePropertyUnitsPageComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MobilePropertiesRoutingModule { }
