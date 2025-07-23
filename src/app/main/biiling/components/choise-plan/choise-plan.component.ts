import { Component, OnInit } from '@angular/core';
import { ShowBillingContractComponent } from '../show-billing-contract/show-billing-contract.component';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { Store } from '@ngxs/store';
import { SouscriptionState, SouscriptionAction, SubscriptionLimitAction, SubscriptionLimitState } from 'src/app/shared/store';
import { Observable } from 'rxjs';

@Component({
  selector: 'choise-plan',
  templateUrl: './choise-plan.component.html',
  styleUrls: ['./choise-plan.component.css']
})
export class ChoisePlanComponent implements OnInit {
  currentSubscription$: Observable<any>;
  isUpgrading$: Observable<boolean>;
  subscriptionStatus$: Observable<any>;

  constructor(
    private dialog: MatDialog,
    private store: Store
  ){}

  ngOnInit() {
    // Charger les données de souscription
    this.currentSubscription$ = this.store.select(SouscriptionState.selectCurrentSubscription);
    this.isUpgrading$ = this.store.select(SubscriptionLimitState.selectLoading);
    this.subscriptionStatus$ = this.store.select(SubscriptionLimitState.selectSubscriptionStatus);

    // Charger les données initiales
    this.store.dispatch(new SouscriptionAction.FetchCurrentSubscription());
    this.store.dispatch(new SubscriptionLimitAction.GetSubscriptionStatus());
  }

  showBillingContract()
  {
    console.log('🔄 Démarrage de l\'upgrade vers Premium...');

    // Appeler l'API d'upgrade via le store
    this.store.dispatch(new SubscriptionLimitAction.UpgradeToPremium()).subscribe({
      next: (result) => {
        console.log('✅ Upgrade réussi:', result);

        // Recharger les données de souscription
        this.store.dispatch(new SouscriptionAction.FetchCurrentSubscription());

        // Ouvrir le contrat de facturation
        this.dialog.open(ShowBillingContractComponent, {
          viewContainerRef: null,
          disableClose: true,
          role: "alertdialog",
          width: '70%',
          height: '98%'
        });
      },
      error: (error) => {
        console.error('❌ Erreur lors de l\'upgrade:', error);
      }
    });
  }

  isPremiumPlan(subscription: any): boolean {
    return subscription?.plan === 'PREMIUM' || subscription?.plan === 'premium';
  }

  isFreePlan(subscription: any): boolean {
    return subscription?.plan === 'FREE' || subscription?.plan === 'free';
  }
}
