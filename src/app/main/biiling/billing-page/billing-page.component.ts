import { Component, OnInit } from '@angular/core';
import { Store, Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { SouscriptionModel, SouscriptionState } from 'src/app/shared/store';
import { SubscriptionLimitState, SubscriptionLimitAction, SubscriptionStatus } from 'src/app/shared/store/subscription-limit';
import { SubscriptionPaymentState, SubscriptionPaymentAction, PaymentHistory, UnpaidInvoice } from 'src/app/shared/store/subscription-payment';

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
  public sections =  [
    {
      name: 'Facturation & Paiement',
      children: [
        {
          name: 'Factures',
          path: 'facture',
          selected: true,
        },
        {
          name: 'Paiement'
        },
        {
          name: 'Abonements',
          // path: 'plan-list'
        },
      ]
    },
    {
      name: 'Methode de paiement',
      children: [
        {
          name: 'Methode de paiement'
        },
        {
          name: 'Historique'
        }
      ]
    },
  ]

  public opened: boolean = false

  constructor(private store: Store) {
  }

  ngOnInit(): void {
    // Charger les données de souscription et paiement
    this.store.dispatch(new SubscriptionLimitAction.GetSubscriptionStatus());
    this.store.dispatch(new SubscriptionPaymentAction.GetPaymentHistory());
    this.store.dispatch(new SubscriptionPaymentAction.GetUnpaidInvoices());
  }

  onToggle() {
    this.opened = !this.opened
  }
}
