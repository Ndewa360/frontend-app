import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ChangelogComponent } from './changelog/changelog.component';
import { FaqComponent } from './faq/faq.component';
import { GettingStartedComponent } from './getting-started/getting-started.component';
import { ManualComponent } from './manual/manual.component';
import { SupportComponent } from './support/support.component';
import { LayoutComponent } from '../layout/default/layout.component';
import { RequestComponent } from './request/request.component';
// import { HomeComponent }

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children:[
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
      {
        path: 'request',
        component: RequestComponent,
        data: {
          breadcrumb: 'Changelog'
        },
      },
      {
        path: 'welcome',
        component: HomeComponent,
        data: {
          breadcrumb: 'Home'
        },
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SupportRoutingModule { }
