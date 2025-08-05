import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Routing
import { MobileBillingRoutingModule } from './mobile-billing-routing.module';

// Pages
import { MobileBillingDashboardPageComponent } from './pages/mobile-billing-dashboard-page/mobile-billing-dashboard-page.component';
// import { MobileInvoicesListPageComponent } from './pages/mobile-invoices-list-page/mobile-invoices-list-page.component';
// import { MobilePaymentsListPageComponent } from './pages/mobile-payments-list-page/mobile-payments-list-page.component';
// import { MobileSubscriptionPageComponent } from './pages/mobile-subscription-page/mobile-subscription-page.component';

// Components
// import { MobileBillingStatsComponent } from './components/mobile-billing-stats/mobile-billing-stats.component';
// import { MobileInvoiceCardComponent } from './components/mobile-invoice-card/mobile-invoice-card.component';
// import { MobilePaymentCardComponent } from './components/mobile-payment-card/mobile-payment-card.component';
// import { MobileSubscriptionCardComponent } from './components/mobile-subscription-card/mobile-subscription-card.component';
// import { MobilePaymentMethodsComponent } from './components/mobile-payment-methods/mobile-payment-methods.component';

// Shared Mobile Components


@NgModule({
  declarations: [
    // Pages
    MobileBillingDashboardPageComponent,
    // MobileInvoicesListPageComponent,
    // MobilePaymentsListPageComponent,
    // MobileSubscriptionPageComponent,

    // Components
    // MobileBillingStatsComponent,
    // MobileInvoiceCardComponent,
    // MobilePaymentCardComponent,
    // MobileSubscriptionCardComponent,
    // MobilePaymentMethodsComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    ReactiveFormsModule,
    MobileBillingRoutingModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MobileBillingModule { }
