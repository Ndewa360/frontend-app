import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { Store, Select } from '@ngxs/store';
import { SubscriptionLimitState, SubscriptionLimitAction, SubscriptionStatus } from '../../store/subscription-limit';
import { SubscriptionPaymentState, SubscriptionPaymentAction } from '../../store/subscription-payment';
import { PaymentStatus } from '../../services/subscription-payment.service';
import { SubscriptionLimitModalComponent, SubscriptionLimitModalData } from '../subscription-limit-modal/subscription-limit-modal.component';

@Component({
  selector: 'app-subscription-status-widget',
  templateUrl: './subscription-status-widget.component.html',
  styleUrls: ['./subscription-status-widget.component.scss']
})
export class SubscriptionStatusWidgetComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  @Select(SubscriptionLimitState.selectSubscriptionStatus) subscriptionStatus$: Observable<SubscriptionStatus | null>;
  @Select(SubscriptionPaymentState.selectPaymentStatus) paymentStatus$: Observable<PaymentStatus | null>;
  @Select(SubscriptionLimitState.selectLoading) loading$: Observable<boolean>;
  @Select(SubscriptionLimitState.selectError) error$: Observable<string | null>;

  subscriptionStatus: SubscriptionStatus | null = null;
  paymentStatus: PaymentStatus | null = null;
  loading = true;
  error = false;

  constructor(
    private store: Store,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadSubscriptionData();
    this.subscribeToStoreChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToStoreChanges(): void {
    // S'abonner aux changements du store
    this.subscriptionStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.subscriptionStatus = status;
      });

    this.paymentStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.paymentStatus = status;
      });

    this.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.loading = loading;
      });

    this.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        this.error = !!error;
      });
  }

  loadSubscriptionData(): void {
    this.store.dispatch(new SubscriptionLimitAction.GetSubscriptionStatus());
    this.store.dispatch(new SubscriptionPaymentAction.GetPaymentStatus());
    // Pour les plans premium, calculer automatiquement le montant reel
    const status = this.store.selectSnapshot(SubscriptionLimitState.selectSubscriptionStatus);
    if (status?.plan === 'premium') {
      this.store.dispatch(new SubscriptionLimitAction.CalculateMonthlyAmount());
    }
  }

  openUpgradeModal(): void {
    const modalData: SubscriptionLimitModalData = {
      type: 'upgrade_prompt'
    };

    const dialogRef = this.dialog.open(SubscriptionLimitModalComponent, {
      width: '600px',
      data: modalData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.upgraded) {
        this.loadSubscriptionData();
      }
    });
  }

  openPaymentModal(): void {
    const modalData: SubscriptionLimitModalData = {
      type: 'account_suspended'
    };

    const dialogRef = this.dialog.open(SubscriptionLimitModalComponent, {
      width: '600px',
      data: modalData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.reactivated) {
        this.loadSubscriptionData();
      }
    });
  }

  get statusColor(): string {
    if (!this.subscriptionStatus) return 'gray';
    
    if (this.subscriptionStatus.accountStatus === 'suspended') {
      return 'red';
    } else if (this.subscriptionStatus.plan === 'premium') {
      return 'gold';
    } else if (this.subscriptionStatus.plan === 'trial') {
      return 'gold';
    } else {
      return 'blue';
    }
  }

  get statusText(): string {
    if (!this.subscriptionStatus) return 'Chargement...';
    
    if (this.subscriptionStatus.accountStatus === 'suspended') {
      return 'Compte suspendu';
    } else if (this.subscriptionStatus.plan === 'premium') {
      return 'Forfait Premium';
    } else if (this.subscriptionStatus.plan === 'trial') {
      const days = this.subscriptionStatus.trialInfo?.daysRemaining || 0;
      return `Essai Premium (${days}j)`;
    } else {
      return 'Forfait Gratuit';
    }
  }

  get showUpgradeButton(): boolean {
    return (this.subscriptionStatus?.plan === 'free' || this.subscriptionStatus?.plan === 'trial') &&
           this.subscriptionStatus?.accountStatus === 'active' &&
           !this.paymentStatus?.hasUnpaidInvoices;
  }

  get showPaymentButton(): boolean {
    return this.paymentStatus?.hasUnpaidInvoices === true;
  }

  get progressPercentage(): number {
    if (!this.subscriptionStatus || this.subscriptionStatus.plan === 'premium') {
      return 100;
    }
    
    return Math.min(
      (this.subscriptionStatus.propertyCount / this.subscriptionStatus.propertyLimit) * 100,
      100
    );
  }

  get progressColor(): string {
    const percentage = this.progressPercentage;
    if (percentage >= 90) return '#dc3545'; // Rouge
    if (percentage >= 70) return '#ffc107'; // Orange
    return '#28a745'; // Vert
  }

  calculateMonthlyAmount(): void {
    this.store.dispatch(new SubscriptionLimitAction.CalculateMonthlyAmount());
  }

  getTrialProgressPercentage(): number {
    if (!this.subscriptionStatus?.trialInfo) return 0;
    const daysRemaining = this.subscriptionStatus.trialInfo.daysRemaining;
    return Math.max(0, Math.min(100, (daysRemaining / 60) * 100));
  }
}
