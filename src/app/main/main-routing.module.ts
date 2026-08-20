import {NgModule} from '@angular/core'
import {Routes, RouterModule} from '@angular/router'


import {LayoutComponent} from '../layout/default/layout.component'

import {WelcomeComponent} from "./welcome/welcome.component"
import { AgentValidationGuard } from '../shared/guards/agent-validation-guard.service'
import { SuspendedGuard } from '../shared/guards/suspended.guard'





// const routeForPages = 

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AgentValidationGuard, SuspendedGuard],
    children: [      
      // {
      //   path: 'locataires',
      //   loadChildren: () => import('./locataires/locataires.module').then(m => m.LocatairesModule),
      //   data: {
      //     breadcrumb: 'Locataires'
      //   },
      // },
      {
        path: 'contract',
        loadChildren: () => import('./contract/contract.module').then(m => m.ContractModule),
        data: {
          breadcrumb: 'Contrat'
        },
      },
      {
        path: 'contract-templates',
        loadChildren: () => import('./contract-templates/contract-templates.module').then(m => m.ContractTemplatesModule),
        data: {
          breadcrumb: 'Modèles de contrats'
        },
      },
      {
        path: 'agent',
        loadChildren: () => import('./agent/agent.module').then(m => m.AgentModule),
        data: {
          breadcrumb: 'Agent Immobilier'
        },
      },
      {
        path: 'facturation',
        loadChildren: () => import('./biiling/biiling.module').then(m => m.BiilingModule),
        data: { breadcrumb: 'Facturation' },
      },
      {
        path: 'portefeuille',
        loadChildren: () => import('./wallet/wallet.module').then(m => m.WalletModule),
        data: { breadcrumb: 'Portefeuille' },
      },
      {
        path: 'profile',
        loadChildren: () => import('./user-profile/user-profile.module').then(m => m.UserProfileModule),
        data: {
          breadcrumb: 'Profil utilisateur'
        },
      },
      {
        path: 'assign-location',
        loadChildren: () => import('./assign-location/assign-location.module').then(m => m.AssignLocationModule),
        data: {
          breadcrumb: 'Assignation de locataire'
        },
      },
      {
        path: 'admin',
        loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule),
        data: {
          breadcrumb: 'Administration'
        },
      },
       
      {
        path: 'properties',
        loadChildren: () => import('./properties/properties-page.module').then(m => m.PropertiesPageModule),
        data: {
          breadcrumb: 'Biens'
        },
      },
      {
        path: 'welcome',
        component: WelcomeComponent,
        data: {
          breadcrumb: 'Welcome'
        },
      },
      {
        path: '',
        redirectTo: 'properties/home',
        pathMatch: 'full',
      },
      {
        path: '**',
        redirectTo: 'properties/home',
        pathMatch: 'full',
      },
    ],
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MainRoutingModule {
}
