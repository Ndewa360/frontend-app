import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {NgxPrintModule} from 'ngx-print';
import { BiilingRoutingModule } from './biiling-routing.module';
import { ShowBiilingComponent } from './components/show-biiling/show-biiling.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { ChoisePlanComponent } from './components/choise-plan/choise-plan.component';
import { ShowBillingContractComponent } from './components/show-billing-contract/show-billing-contract.component';
import { BillingPageComponent } from './billing-page/billing-page.component';
import { ShowFactureCurrentComponent } from './components/show-facture-current/show-facture-current.component';
import { PlanListComponent } from './components/plan-list/plan-list.component';


@NgModule({
  declarations: [
    ShowBiilingComponent,
    ChoisePlanComponent,
    ShowBillingContractComponent,
    BillingPageComponent,
    ShowFactureCurrentComponent,
    PlanListComponent
  ],
  imports: [
    CommonModule,
    BiilingRoutingModule,
    SharedModule,
    NgxPrintModule
  ]
})
export class BiilingModule { }
