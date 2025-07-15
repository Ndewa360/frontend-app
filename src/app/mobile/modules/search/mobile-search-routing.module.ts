import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MobileSearchPageComponent } from './pages/mobile-search-page/mobile-search-page.component';
import { MobileUnitDetailsComponent } from './components/mobile-unit-details/mobile-unit-details.component';
import { MobileMapViewComponent } from './components/mobile-map-view/mobile-map-view.component';

const routes: Routes = [
  {
    path: '',
    component: MobileSearchPageComponent
  },
  {
    path: 'unit/:id',
    component: MobileUnitDetailsComponent
  },
  {
    path: 'map',
    component: MobileMapViewComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MobileSearchRoutingModule { }
