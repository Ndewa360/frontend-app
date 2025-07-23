import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store, Select } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
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
    private store: Store
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
        return this.data.limitType === 'room' ? 'Limite d\'unités atteinte' : 'Limite de biens atteinte';
      case 'room_limit_reached':
        return 'Limite d\'unités locatives atteinte';
      case 'account_suspended':
        return 'Compte suspendu';
      case 'upgrade_prompt':
        return 'Passer au forfait Premium';
      default:
        return 'Gestion de souscription';
    }
  }

  get modalMessage(): string {
    switch (this.data.type) {
      case 'limit_reached':
        if (this.data.limitType === 'room') {
          return `Vous avez atteint la limite de ${this.data.currentLimit || 8} unités locatives par bien pour le forfait gratuit. Pour créer plus d'unités, passez au forfait Premium.`;
        } else {
          return `Vous avez atteint la limite de ${this.data.currentLimit || 1} bien pour le forfait gratuit. Pour créer plus de biens, passez au forfait Premium.`;
        }
      case 'room_limit_reached':
        return `Vous avez atteint la limite de ${this.data.currentLimit || 8} unités locatives par bien pour le forfait gratuit. Pour créer plus d'unités, passez au forfait Premium.`;
      case 'account_suspended':
        return 'Votre compte est suspendu pour impayé. Veuillez régler vos factures pour réactiver votre compte.';
      case 'upgrade_prompt':
        return 'Le forfait Premium vous permet de créer un nombre illimité de biens et d\'unités locatives. Vous ne payez que 2% du loyer des unités effectivement occupées.';
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
    switch (status) {
      case 'active':
        return 'Actif';
      case 'suspended':
        return 'Suspendu';
      case 'disabled':
        return 'Désactivé';
      default:
        return status;
    }
  }
}
