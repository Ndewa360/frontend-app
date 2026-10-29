import { Component, OnInit, OnDestroy } from '@angular/core';
import { ShowBillingContractComponent } from '../show-billing-contract/show-billing-contract.component';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngxs/store';
import { SouscriptionState, SouscriptionAction } from 'src/app/shared/store';
import { SubscriptionLimitAction, SubscriptionLimitState } from 'src/app/shared/store/subscription-limit';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'carbon-components-angular/button';
import { NgIf, AsyncPipe } from '@angular/common';
import { AppLogoComponent } from '../../../../../@youpez/components/app-logo/app-logo.component';
import { NgScrollbar } from 'ngx-scrollbar';
import { PricingTiersComponent } from 'src/app/shared/components/pricing-tiers/pricing-tiers.component';
import { SubscriptionLimitService } from 'src/app/shared/services/subscription-limit.service';
import { PricingSummary } from 'src/app/shared/pricing/pricing-grid';

@Component({
  selector: 'choise-plan',
  templateUrl: './choise-plan.component.html',
  styleUrls: ['./choise-plan.component.css'],
  standalone: true,
  imports: [NgScrollbar, AppLogoComponent, NgIf, ButtonModule, AsyncPipe, TranslatePipe, PricingTiersComponent]
})
export class ChoisePlanComponent implements OnInit, OnDestroy {
  currentSubscription$: Observable<any>;
  subscriptionStatus$: Observable<any>;
  pricing: PricingSummary | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    private store: Store,
    private subscriptionLimitService: SubscriptionLimitService
  ) {}

  ngOnInit(): void {
    this.currentSubscription$ = this.store.select(SouscriptionState.selectCurrentSubscription);
    this.subscriptionStatus$   = this.store.select(SubscriptionLimitState.selectSubscriptionStatus);

    // Toujours recharger depuis le backend a chaque visite
    this.store.dispatch(new SouscriptionAction.FetchCurrentSubscription());
    this.store.dispatch(new SubscriptionLimitAction.GetSubscriptionStatus());

    this.subscriptionLimitService.getPricing()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: res => { this.pricing = res?.data ?? null; }, error: () => { this.pricing = null; } });
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
      height: '98%'
    });
  }

  isPremiumPlan(subscription: any): boolean {
    return subscription?.plan === 'PREMIUM' || subscription?.plan === 'premium';
  }

  isFreePlan(subscription: any): boolean {
    return subscription?.plan === 'FREE' || subscription?.plan === 'free';
  }
}
