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
              "propertyResolver":LoadingPropertyDataResolver
            },
            // pathMatch:'full',
            children:[
              {
                path: 'rooms',
                component: PropertyRoomComponent,
                data: {
                  breadcrumb: 'chambres'
                },
                // children:[
                //   {
                //     path:'idRoom',
                //     component:ShowRoomComponent
                //   }
                // ]
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
                // resolve:{
                //   "locataireResolver":LoadingLocataireResolver
                // },
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
        ]
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
