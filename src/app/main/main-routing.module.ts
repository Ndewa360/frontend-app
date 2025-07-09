import {NgModule} from '@angular/core'
import {Routes, RouterModule} from '@angular/router'


import {LayoutComponent} from '../layout/default/layout.component'

import {WelcomeComponent} from "./welcome/welcome.component"
import { LoadingPropertyDataResolver } from '../shared/resolvers'
import { PropertyDetailsResolver } from '../shared/resolvers/loading-property-data/property-details-resolver.service'
import { PropertyFinanceComponent } from './properties/components/property-finance/property-finance.component'
import { ListPropertyComponent } from './properties/list-property/list-property.component'
import { HomePropertyComponent } from './properties/home-property/home-property.component'
import { PropertyDetailsCompleteComponent } from './properties/property-details-complete/property-details-complete.component'





// const routeForPages = 

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
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
        path: 'facturation',
        loadChildren: () => import('./biiling/biiling.module').then(m => m.BiilingModule),
        data: {
          breadcrumb: 'Facturation'
        },
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
        path: 'properties',
        data: {
          breadcrumb: 'Biens'
        },  
        children: [      
          {
            path: 'home',
            component: HomePropertyComponent,
            // data: {
            //   breadcrumb: 'Getting started'
            // },
          },
          {
            path: 'list',
            component: ListPropertyComponent,
            // data: {
            //   breadcrumb: 'Getting started'
            // },
          },
          {
            path: 'details/:id',
            component: PropertyDetailsCompleteComponent,
            resolve: {
              "propertyDetailsData": PropertyDetailsResolver
            },
            data: {
              breadcrumb: 'Détails complets'
            },
          },
          {
            path: '**',
            redirectTo: '/app/properties/home',
            pathMatch: 'full',
          },
        ],
      },
      {
        path: 'welcome',
        component: WelcomeComponent,
        data: {
          breadcrumb: 'Welcome'
        },
      },
      {
        path: '**',
        redirectTo: '/app/welcome',
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
