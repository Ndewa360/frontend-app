import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

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
    // Pas de résolveur : la page s'ouvre aussitôt (en-tête tiré de la liste,
    // indicateurs de chargement) et charge elle-même le détail. Le résolveur
    // bloquait la navigation jusqu'à la réponse complète du serveur.
    component: PropertyDetailsCompleteComponent,
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
