import {NgModule} from '@angular/core'
import {Routes, RouterModule} from '@angular/router'


import {LayoutComponent} from '../layout/default/layout.component'

import {WelcomeComponent} from "./welcome/welcome.component"
import { LoadingPropertyDataResolver } from '../shared/resolvers'
import { PropertyDetailsResolver } from '../shared/resolvers/loading-property-data/property-details-resolver.service'
import { PropertyFinanceComponent } from './properties/components/property-finance/property-finance.component'
import { PropertyLocataireComponent } from './properties/components/property-locataire/property-locataire.component'
import { PropertyRoomComponent } from './properties/components/property-room/property-room.component'
import { ListPropertyComponent } from './properties/list-property/list-property.component'
import { ShowPropertyComponent } from './properties/show-property/show-property.component'
import { SeeLocationsComponent } from './properties/components/see-locations/see-locations.component'
import { FinancialHistoryComponent } from './properties/components/financial-history/financial-history.component'
import { HomePropertyComponent } from './properties/home-property/home-property.component'
import { LayoutListComponent } from './room/components/layout-list/layout-list.component'
import { LayoutListComponent as LayoutLocataireListComponent } from './locataires/components/layout-list/layout-list.component'
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
            path: ':id',
            component: ShowPropertyComponent,
            resolve:{
              "propertyDataResolver":LoadingPropertyDataResolver
            },
            children:[
              {
                path: 'rooms/:idRoom',
                component: LayoutListComponent,
                data: {
                  breadcrumb: 'unités'
                },
              },
              {
                path: 'rooms',
                component: PropertyRoomComponent,
                data: {
                  breadcrumb: 'unités'
                },
              },
              {
                path: 'locations',
                component: SeeLocationsComponent,
                data: {
                  breadcrumb: 'locations'
                },
              },
              {
                path: 'finances',
                component: PropertyFinanceComponent,
                data: {
                  breadcrumb: 'finances'
                },
              },
              {
                path: 'tenants/:idLocataire',
                component: LayoutLocataireListComponent,
                data: {
                  breadcrumb: 'locataires'
                },
              },
              {
                path: 'tenants',
                component: PropertyLocataireComponent,
                data: {
                  breadcrumb: 'locataires'
                },
              },
              {
                path: 'history-finance',
                component: FinancialHistoryComponent,
                data: {
                  breadcrumb: 'Historique des paiements'
                },
              },
              
              {
                path: '**',
                redirectTo: 'rooms'
              },              
            ]
    
            // data: {
            //   breadcrumb: 'Getting started'
            // },
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
