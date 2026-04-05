import { Component, OnInit, OnDestroy } from '@angular/core';
import { ShowBillingContractComponent } from '../show-billing-contract/show-billing-contract.component';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Store, Actions, ofActionSuccessful, ofActionErrored } from '@ngxs/store';
import { SouscriptionState, SouscriptionAction } from 'src/app/shared/store';
import { SubscriptionLimitAction, SubscriptionLimitState } from 'src/app/shared/store/subscription-limit';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'choise-plan',
  templateUrl: './choise-plan.component.html',
  styleUrls: ['./choise-plan.component.css']
})
export class ChoisePlanComponent implements OnInit, OnDestroy {
  currentSubscription$: Observable<any>;
  isUpgrading$: Observable<boolean>;
  subscriptionStatus$: Observable<any>;

  private destroy$ = new Subject<void>();
  private lang = 'fr';

  constructor(
    private dialog: MatDialog,
    private store: Store,
    private actions: Actions,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.lang = window.location.pathname.split('/')[1] || 'fr';

    this.currentSubscription$ = this.store.select(SouscriptionState.selectCurrentSubscription);
    this.isUpgrading$          = this.store.select(SubscriptionLimitState.selectLoading);
    this.subscriptionStatus$   = this.store.select(SubscriptionLimitState.selectSubscriptionStatus);

    // Toujours recharger depuis le backend a chaque visite
    this.store.dispatch(new SouscriptionAction.FetchCurrentSubscription());
    this.store.dispatch(new SubscriptionLimitAction.GetSubscriptionStatus());

    // Ecouter le succes de l'upgrade (declenche depuis ShowBillingContractComponent)
    this.actions.pipe(
      ofActionSuccessful(SubscriptionLimitAction.UpgradeToPremium),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      // Mettre a jour le store immediatement
      const current = this.store.selectSnapshot(SouscriptionState.selectCurrentSubscription);
      if (current) {
        this.store.dispatch(new SouscriptionAction.SetCurrentSubscription({
          ...current,
          plan: 'premium' as any,
          accountStatus: 'active' as any,
        }));
      }
      // Recharger les donnees fraiches depuis le backend
      this.store.dispatch(new SouscriptionAction.FetchCurrentSubscription());
      this.store.dispatch(new SouscriptionAction.FetchSubscriptionHistory());
      this.store.dispatch(new SubscriptionLimitAction.GetSubscriptionStatus());
      // Naviguer vers le dashboard
      this.router.navigate([`/${this.lang}/app/facturation/plan/dashboard`]);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  showBillingContract(): void {
    this.dialog.open(ShowBillingContractComponent, {
      disableClose: true,
      role: 'alertdialog',
      width: '70%',
      height: '98%',
    });
  }

  isPremiumPlan(subscription: any): boolean {
    return subscription?.plan === 'PREMIUM' || subscription?.plan === 'premium';
  }

  isFreePlan(subscription: any): boolean {
    return subscription?.plan === 'FREE' || subscription?.plan === 'free';
  }
}
