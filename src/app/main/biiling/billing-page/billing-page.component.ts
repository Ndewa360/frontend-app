import { Component, OnInit } from '@angular/core';
import { Store, Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { SouscriptionModel, SouscriptionState } from 'src/app/shared/store';
import { SubscriptionLimitState, SubscriptionLimitAction, SubscriptionStatus } from 'src/app/shared/store/subscription-limit';
import { SubscriptionPaymentState, SubscriptionPaymentAction, PaymentHistory, UnpaidInvoice } from 'src/app/shared/store/subscription-payment';

interface MenuSection {
  name: string;
  children: MenuChild[];
}

interface MenuChild {
  name: string;
  path?: string;
  selected?: boolean;
}

@Component({
  selector: 'billing-page',
  templateUrl: './billing-page.component.html',
  styleUrls: ['./billing-page.component.css'],
})
export class BillingPageComponent implements OnInit {
  @Select(SouscriptionState.selectStatePeriodDefaultWithRunningState) souscription$:Observable<SouscriptionModel>
  @Select(SouscriptionState.isEndLoadingData) hasLoading$:Observable<boolean>

  // Nouveaux selectors pour le système de souscription
  @Select(SubscriptionLimitState.selectSubscriptionStatus) subscriptionStatus$: Observable<SubscriptionStatus | null>
  @Select(SubscriptionPaymentState.selectPaymentHistory) paymentHistory$: Observable<PaymentHistory | null>
  @Select(SubscriptionPaymentState.selectUnpaidInvoices) unpaidInvoices$: Observable<UnpaidInvoice[]>
  @Select(SubscriptionPaymentState.selectTotalUnpaidAmount) totalUnpaidAmount$: Observable<number>
  public sections: MenuSection[] = []

  public opened: boolean = false

  constructor(private store: Store, private translate: TranslateService) {
  }

  ngOnInit(): void {
    // Initialiser le menu avec les traductions
    this.initializeMenu();
    
    // Charger les données de souscription et paiement
    this.store.dispatch(new SubscriptionLimitAction.GetSubscriptionStatus());
    this.store.dispatch(new SubscriptionPaymentAction.GetPaymentHistory());
    this.store.dispatch(new SubscriptionPaymentAction.GetUnpaidInvoices());
  }

  private initializeMenu(): void {
    this.sections = [
      {
        name: this.translate.instant('BILLING.MENU.BILLING_PAYMENT'),
        children: [
          {
            name: this.translate.instant('BILLING.MENU.DASHBOARD'),
            path: 'dashboard',
            selected: true,
          },
          {
            name: this.translate.instant('BILLING.MENU.INVOICES'),
            path: 'facture',
          },
          {
            name: this.translate.instant('BILLING.MENU.SUBSCRIPTIONS'),
            path: 'plan-list'
          },
        ]
      },
      {
        name: this.translate.instant('BILLING.MENU.HISTORY_PAYMENTS'),
        children: [
          {
            name: this.translate.instant('BILLING.MENU.TRANSACTION_HISTORY'),
            path: undefined // Pas encore implémenté
          },
          {
            name: this.translate.instant('BILLING.MENU.PAYMENT_METHODS'),
            path: undefined // Pas encore implémenté
          }
        ]
      },
    ];
  }

  onToggle() {
    this.opened = !this.opened
  }
}
