import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PropertyDetailsResolver } from '../../shared/resolvers/loading-property-data/property-details-resolver.service';
import { ListPropertyComponent } from './list-property/list-property.component';
import { HomePropertyComponent } from './home-property/home-property.component';
import { PropertyDetailsCompleteComponent } from './property-details-complete/property-details-complete.component';

const routes: Routes = [
  {
    path: 'home',
    component: HomePropertyComponent,
    data: { breadcrumb: 'Accueil des biens' },
  },
  {
    path: 'list',
    component: ListPropertyComponent,
    data: { breadcrumb: 'Liste des biens' },
  },
  {
    path: 'details/:id',
    component: PropertyDetailsCompleteComponent,
    resolve: { "propertyDetailsData": PropertyDetailsResolver },
    data: { breadcrumb: 'Détails complets' },
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PropertiesRoutingModule {}
