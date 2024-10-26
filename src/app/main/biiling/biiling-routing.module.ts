import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ShowBiilingComponent } from './components/show-biiling/show-biiling.component';
import { LoadingLocataireDataResolver, LoadingSouscriptionDataResolver } from 'src/app/shared/resolvers';
import { ChoisePlanComponent } from './components/choise-plan/choise-plan.component';
import { BillingPageComponent } from './billing-page/billing-page.component';
import { ShowFactureCurrentComponent } from './components/show-facture-current/show-facture-current.component';
import { PlanListComponent } from './components/plan-list/plan-list.component';

const routes: Routes = [
  {
    path: 'plan', 
    component: BillingPageComponent,
    resolve:{
      data:LoadingSouscriptionDataResolver
    },
    children: [
      {
        path: 'facture',
        component: ShowFactureCurrentComponent,        
      },
      {
        path: 'plan-list',
        component: PlanListComponent,        
      },
      {
        path: '',
        redirectTo: 'facture',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'choix-plan', 
    component: ChoisePlanComponent,
  },
  {
    path: ':locataireID/billing/:billingID', 
    component: ShowBiilingComponent,
    resolve:{
      data:LoadingLocataireDataResolver
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BiilingRoutingModule { }
