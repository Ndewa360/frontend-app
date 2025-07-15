import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MobileBillingDashboardPageComponent } from './pages/mobile-billing-dashboard-page/mobile-billing-dashboard-page.component';
// import { MobileInvoicesListPageComponent } from './pages/mobile-invoices-list-page/mobile-invoices-list-page.component';
// import { MobilePaymentsListPageComponent } from './pages/mobile-payments-list-page/mobile-payments-list-page.component';
// import { MobileSubscriptionPageComponent } from './pages/mobile-subscription-page/mobile-subscription-page.component';

const routes: Routes = [
  {
    path: '',
    component: MobileBillingDashboardPageComponent
  },
  // {
  //   path: 'invoices',
  //   component: MobileInvoicesListPageComponent
  // },
  // {
  //   path: 'payments',
  //   component: MobilePaymentsListPageComponent
  // },
  // {
  //   path: 'subscription',
  //   component: MobileSubscriptionPageComponent
  // }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MobileBillingRoutingModule { }
