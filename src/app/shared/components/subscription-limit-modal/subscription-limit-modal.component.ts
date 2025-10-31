import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store, Select } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { SubscriptionLimitState, SubscriptionLimitAction, SubscriptionStatus } from '../../store/subscription-limit';

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

  @Select(SubscriptionLimitState.selectSubscriptionStatus) subscriptionStatus$: Observable<SubscriptionStatus | null>;
  @Select(SubscriptionLimitState.selectLoading) loading$: Observable<boolean>;

  subscriptionStatus: SubscriptionStatus | null = null;
  loading = false;
  upgrading = false;

  constructor(
    public dialogRef: MatDialogRef<SubscriptionLimitModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SubscriptionLimitModalData,
    private store: Store,
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
    this.loadSubscriptionStatus();
    this.subscribeToStoreChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToStoreChanges(): void {
    this.subscriptionStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        console.log('📊 Statut de souscription reçu dans le modal:', status);
        this.subscriptionStatus = status;
      });

    this.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.loading = loading;
        this.upgrading = loading;
      });
  }

  loadSubscriptionStatus(): void {
    this.store.dispatch(new SubscriptionLimitAction.GetSubscriptionStatus());
  }

  upgradeToPremium(): void {
    this.store.dispatch(new SubscriptionLimitAction.UpgradeToPremium()).subscribe({
      next: () => {
        this.dialogRef.close({ upgraded: true });
      },
      error: () => {
        // L'erreur est gérée dans le state avec toastr
      }
    });
  }

  reactivateAccount(): void {
    this.store.dispatch(new SubscriptionLimitAction.ReactivateAccount()).subscribe({
      next: () => {
        this.dialogRef.close({ reactivated: true });
      },
      error: () => {
        // L'erreur est gérée dans le state avec toastr
      }
    });
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
        return this.data.limitType === 'room' ? 
          this.translate.instant('SUBSCRIPTION_MODAL.MODAL_TITLES.UNITS_LIMIT_REACHED') : 
          this.translate.instant('SUBSCRIPTION_MODAL.MODAL_TITLES.PROPERTIES_LIMIT_REACHED');
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
        if (this.data.limitType === 'room') {
          return this.translate.instant('SUBSCRIPTION_MODAL.MODAL_MESSAGES.ROOM_LIMIT_MESSAGE', { limit: this.data.currentLimit || 8 });
        } else {
          return this.translate.instant('SUBSCRIPTION_MODAL.MODAL_MESSAGES.PROPERTY_LIMIT_MESSAGE', { limit: this.data.currentLimit || 1 });
        }
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
    return this.data.type === 'limit_reached' ||
           this.data.type === 'room_limit_reached' ||
           this.data.type === 'upgrade_prompt';
  }

  get showReactivateButton(): boolean {
    return this.data.type === 'account_suspended';
  }

  get showCalculateButton(): boolean {
    return this.subscriptionStatus?.plan === 'premium';
  }

  getAccountStatusLabel(status: string): string {
    const statusKey = status?.toLowerCase();
    switch (statusKey) {
      case 'active':
        return this.translate.instant('SUBSCRIPTION_MODAL.ACCOUNT_STATUS_LABELS.ACTIVE');
      case 'suspended':
        return this.translate.instant('SUBSCRIPTION_MODAL.ACCOUNT_STATUS_LABELS.SUSPENDED');
      case 'disabled':
        return this.translate.instant('SUBSCRIPTION_MODAL.ACCOUNT_STATUS_LABELS.DISABLED');
      default:
        return status;
    }
  }
}
