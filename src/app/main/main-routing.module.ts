import {NgModule} from '@angular/core'
import {Routes, RouterModule} from '@angular/router'


import {LayoutComponent} from '../layout/default/layout.component'

import {FaqComponent} from "./application/faq/faq.component"
import {ManualComponent} from "./application/manual/manual.component"
import {SupportComponent} from "./application/support/support.component"
import {ChangelogComponent} from "./application/changelog/changelog.component"
import {WelcomeComponent} from "./welcome/welcome.component"
import {GettingStartedComponent} from "./application/getting-started/getting-started.component"
import { LoadingPropertyDataResolver } from '../shared/resolvers'
import { PropertyFinanceComponent } from './properties/components/property-finance/property-finance.component'
import { PropertyLocataireComponent } from './properties/components/property-locataire/property-locataire.component'
import { PropertyRoomComponent } from './properties/components/property-room/property-room.component'
import { ListPropertyComponent } from './properties/list-property/list-property.component'
import { ShowPropertyComponent } from './properties/show-property/show-property.component'
import { SeeLocationsComponent } from './properties/components/see-locations/see-locations.component'



// const routeForPages = 

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'application',
        data: {
          breadcrumb: 'Application'
        },
        children: [      
          {
            path: 'getting-started',
            component: GettingStartedComponent,
            data: {
              breadcrumb: 'Getting started'
            },
          },
          {
            path: 'faq',
            component: FaqComponent,
            data: {
              breadcrumb: 'FAQ'
            },
          },
          {
            path: 'manual',
            component: ManualComponent,
            data: {
              breadcrumb: 'Manual'
            },
          },
          {
            path: 'support',
            component: SupportComponent,
            data: {
              breadcrumb: 'Support'
            },
          },
          {
            path: 'changelog',
            component: ChangelogComponent,
            data: {
              breadcrumb: 'Changelog'
            },
          },
        ]
      },
      {
        path: 'locataires',
        loadChildren: () => import('./locataires/locataires.module').then(m => m.LocatairesModule),
        data: {
          breadcrumb: 'Locataires'
        },
      },
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
            path: 'list',
            component: ListPropertyComponent,
            // data: {
            //   breadcrumb: 'Getting started'
            // },
          },
          {
            path: ':id',
            component: ShowPropertyComponent,
            resolve:{
              "propertyDataResolver":LoadingPropertyDataResolver
            },
            children:[
              {
                path: 'rooms',
                component: PropertyRoomComponent,
                data: {
                  breadcrumb: 'chambres'
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
                path: 'tenants',
                component: PropertyLocataireComponent,
                data: {
                  breadcrumb: 'locataires'
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
            redirectTo: '/app/properties/list',
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
