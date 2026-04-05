import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Store, Actions, ofActionSuccessful, ofActionErrored } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { SubscriptionLimitState, SubscriptionLimitAction, SubscriptionStatus } from '../../store/subscription-limit';
import { SouscriptionState, SouscriptionAction } from '../../store';

export interface SubscriptionLimitModalData {
  type: 'limit_reached' | 'room_limit_reached' | 'account_suspended' | 'upgrade_prompt';
  currentLimit?: number;
  propertyCount?: number;
  suspensionDate?: Date;
  limitType?: 'property' | 'room';
}

@Component({
  selector: 'app-subscription-limit-modal',
  templateUrl: './subscription-limit-modal.component.html',
  styleUrls: ['./subscription-limit-modal.component.scss']
})
export class SubscriptionLimitModalComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  subscriptionStatus: SubscriptionStatus | null = null;
  loading = false;
  upgrading = false;

  constructor(
    public dialogRef: MatDialogRef<SubscriptionLimitModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SubscriptionLimitModalData,
    private store: Store,
    private actions: Actions,
    private translate: TranslateService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadSubscriptionStatus();

    this.store.select(SubscriptionLimitState.selectSubscriptionStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => { this.subscriptionStatus = status; });

    this.store.select(SubscriptionLimitState.selectLoading)
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => { this.loading = loading; });

    // Fermer le modal apres succes de l'upgrade et recharger les donnees
    this.actions.pipe(
      ofActionSuccessful(SubscriptionLimitAction.UpgradeToPremium),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.upgrading = false;
      // Mettre a jour le store immediatement
      const current = this.store.selectSnapshot(SouscriptionState.selectCurrentSubscription);
      if (current) {
        this.store.dispatch(new SouscriptionAction.SetCurrentSubscription({
          ...current,
          plan: 'premium' as any,
          accountStatus: 'active' as any,
        }));
      }
      // Recharger les donnees fraiches
      this.store.dispatch(new SouscriptionAction.FetchCurrentSubscription());
      this.store.dispatch(new SouscriptionAction.FetchSubscriptionHistory());
      this.store.dispatch(new SubscriptionLimitAction.GetSubscriptionStatus());
      this.dialogRef.close({ upgraded: true });
    });

    // Fermer le modal apres succes de la reactivation
    this.actions.pipe(
      ofActionSuccessful(SubscriptionLimitAction.ReactivateAccount),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.upgrading = false;
      this.dialogRef.close({ reactivated: true });
    });

    // Gerer les erreurs
    this.actions.pipe(
      ofActionErrored(SubscriptionLimitAction.UpgradeToPremium),
      takeUntil(this.destroy$)
    ).subscribe(() => { this.upgrading = false; });

    this.actions.pipe(
      ofActionErrored(SubscriptionLimitAction.ReactivateAccount),
      takeUntil(this.destroy$)
    ).subscribe(() => { this.upgrading = false; });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSubscriptionStatus(): void {
    this.store.dispatch(new SubscriptionLimitAction.GetSubscriptionStatus());
  }

  upgradeToPremium(): void {
    this.upgrading = true;
    this.store.dispatch(new SubscriptionLimitAction.UpgradeToPremium());
  }

  reactivateAccount(): void {
    this.upgrading = true;
    this.store.dispatch(new SubscriptionLimitAction.ReactivateAccount());
  }

  calculateMonthlyAmount(): void {
    this.store.dispatch(new SubscriptionLimitAction.CalculateMonthlyAmount());
  }

  close(): void {
    this.dialogRef.close();
  }

  get modalTitle(): string {
    switch (this.data.type) {
      case 'limit_reached':
        return this.data.limitType === 'room'
          ? this.translate.instant('SUBSCRIPTION_MODAL.MODAL_TITLES.UNITS_LIMIT_REACHED')
          : this.translate.instant('SUBSCRIPTION_MODAL.MODAL_TITLES.PROPERTIES_LIMIT_REACHED');
      case 'room_limit_reached':
        return this.translate.instant('SUBSCRIPTION_MODAL.MODAL_TITLES.RENTAL_UNITS_LIMIT_REACHED');
      case 'account_suspended':
        return this.translate.instant('SUBSCRIPTION_MODAL.MODAL_TITLES.ACCOUNT_SUSPENDED');
      case 'upgrade_prompt':
        return this.translate.instant('SUBSCRIPTION_MODAL.MODAL_TITLES.UPGRADE_TO_PREMIUM');
      default:
        return this.translate.instant('SUBSCRIPTION_MODAL.MODAL_TITLES.SUBSCRIPTION_MANAGEMENT');
    }
  }

  get modalMessage(): string {
    switch (this.data.type) {
      case 'limit_reached':
        return this.data.limitType === 'room'
          ? this.translate.instant('SUBSCRIPTION_MODAL.MODAL_MESSAGES.ROOM_LIMIT_MESSAGE', { limit: this.data.currentLimit || 8 })
          : this.translate.instant('SUBSCRIPTION_MODAL.MODAL_MESSAGES.PROPERTY_LIMIT_MESSAGE', { limit: this.data.currentLimit || 8 });
      case 'room_limit_reached':
        return this.translate.instant('SUBSCRIPTION_MODAL.MODAL_MESSAGES.ROOM_LIMIT_MESSAGE', { limit: this.data.currentLimit || 8 });
      case 'account_suspended':
        return this.translate.instant('SUBSCRIPTION_MODAL.MODAL_MESSAGES.ACCOUNT_SUSPENDED_MESSAGE');
      case 'upgrade_prompt':
        return this.translate.instant('SUBSCRIPTION_MODAL.MODAL_MESSAGES.UPGRADE_PROMPT_MESSAGE');
      default:
        return '';
    }
  }

  get showUpgradeButton(): boolean {
    return ['limit_reached', 'room_limit_reached', 'upgrade_prompt'].includes(this.data.type);
  }

  get showReactivateButton(): boolean {
    return this.data.type === 'account_suspended';
  }

  get showCalculateButton(): boolean {
    return this.subscriptionStatus?.plan === 'premium';
  }

  getAccountStatusLabel(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active':    return this.translate.instant('SUBSCRIPTION_MODAL.ACCOUNT_STATUS_LABELS.ACTIVE');
      case 'suspended': return this.translate.instant('SUBSCRIPTION_MODAL.ACCOUNT_STATUS_LABELS.SUSPENDED');
      case 'disabled':  return this.translate.instant('SUBSCRIPTION_MODAL.ACCOUNT_STATUS_LABELS.DISABLED');
      default:          return status;
    }
  }

  get progressPercentage(): number {
    if (!this.subscriptionStatus || this.subscriptionStatus.plan === 'premium') return 100;
    return Math.min(
      (this.subscriptionStatus.propertyCount / this.subscriptionStatus.propertyLimit) * 100,
      100
    );
  }

  get progressColor(): string {
    const p = this.progressPercentage;
    if (p >= 90) return '#dc3545';
    if (p >= 70) return '#ffc107';
    return '#28a745';
  }
}
