import { trackByFn } from '../../../../shared/utils/track-by.util';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { AdminSubscriptionsAction } from '../../store/subscriptions/admin-subscriptions.actions';
import { AdminUserSubscription } from '../../store/subscriptions/admin-subscriptions.model';
import { AdminCurrencyService } from '../../services/admin-currency.service';
import { AdminSubscriptionsService } from '../../services/admin-subscriptions.service';
import { FormsModule } from '@angular/forms';
import { ExtendedModule } from '@angular/flex-layout/extended';
import { NgClass, NgIf, NgFor } from '@angular/common';

export interface SubscriptionDetailsModalData {
  subscription: AdminUserSubscription;
}

@Component({
  selector: 'app-subscription-details-modal',
  templateUrl: './subscription-details-modal.component.html',
  styleUrls: ['./subscription-details-modal.component.scss'],
  standalone: true,
  imports: [NgClass, ExtendedModule, NgIf, NgFor, FormsModule]
})
export class SubscriptionDetailsModalComponent implements OnInit {
  trackByFn = trackByFn;


  activeTab: 'overview' | 'periods' | 'actions' = 'overview';
  actionReason = '';
  showReasonInput = false;
  pendingAction: string | null = null;
  customAmount: number | null = null;
  savingAmount = false;

  constructor(
    public dialogRef: MatDialogRef<SubscriptionDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SubscriptionDetailsModalData,
    private store: Store,
    private toastr: ToastrService,
    private translate: TranslateService,
    private currencyService: AdminCurrencyService,
    private subscriptionsService: AdminSubscriptionsService
  ) {}

  ngOnInit(): void {
    this.customAmount = this.subscription.customMonthlyAmount ?? null;
  }

  get subscription(): AdminUserSubscription {
    return this.data.subscription;
  }

  get userName(): string {
    return `${this.subscription.user.firstName} ${this.subscription.user.lastName}`;
  }

  setTab(tab: 'overview' | 'periods' | 'actions'): void {
    this.activeTab = tab;
  }

  // ── Actions ──────────────────────────────────────────────────────────────

  /** Ouvre la saisie du montant Gold négocié pour ce compte. */
  onCustomAmount(): void {
    this.pendingAction = 'custom-amount';
    this.showReasonInput = true;
  }

  private saveCustomAmount(): void {
    const amount = this.customAmount === null || (this.customAmount as any) === '' ? null : Math.round(Number(this.customAmount));
    if (amount !== null && (!Number.isFinite(amount) || amount < 0)) {
      this.toastr.warning(this.translate.instant('ADMIN.TOASTS.INVALID_AMOUNT'));
      return;
    }
    this.savingAmount = true;
    this.subscriptionsService.setCustomAmount(this.subscription._id, amount, this.actionReason || undefined).subscribe({
      next: (res) => {
        this.savingAmount = false;
        this.toastr.success(res?.appliesNow
          ? 'Montant Gold appliqué à ce compte.'
          : 'Montant enregistré : il s\'appliquera dès que le compte sera au palier Gold.');
        this.dialogRef.close({ action: 'custom-amount' });
      },
      error: () => {
        this.savingAmount = false;
        this.toastr.error(this.translate.instant('ADMIN.TOASTS.AMOUNT_SAVE_FAILED'));
      }
    });
  }

  onSuspend(): void {
    this.pendingAction = 'suspend';
    this.showReasonInput = true;
  }

  onReactivate(): void {
    this.store.dispatch(new AdminSubscriptionsAction.ReactivateAccount(this.subscription._id));
    this.dialogRef.close({ action: 'reactivate' });
  }

  onSendReminder(): void {
    this.store.dispatch(new AdminSubscriptionsAction.SendPaymentReminder(this.subscription._id));
    this.toastr.success(this.translate.instant('ADMIN.SUBSCRIPTION.PAYMENT_REMINDER_SENT'));
    this.dialogRef.close({ action: 'reminder' });
  }

  confirmAction(): void {
    if (!this.pendingAction) return;

    switch (this.pendingAction) {
    case 'custom-amount':
      this.saveCustomAmount();
      return;
    case 'suspend':
      if (!this.actionReason.trim()) {
        this.toastr.warning(this.translate.instant('ADMIN.SUBSCRIPTION.SUSPENSION_REASON_REQUIRED'));
        return;
      }
      this.store.dispatch(new AdminSubscriptionsAction.SuspendAccount(
        this.subscription._id, this.actionReason
      ));
      this.dialogRef.close({ action: 'suspend' });
      break;
    }

    this.cancelAction();
  }

  cancelAction(): void {
    this.pendingAction = null;
    this.showReasonInput = false;
    this.actionReason = '';
  }

  close(): void {
    this.dialogRef.close();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getPlanLabel(plan: string): string {
    if (plan === 'premium') return this.subscription.currentTier === 'GOLD' ? 'Gold' : 'Pro';
    return plan === 'trial' ? 'Essai' : 'Gratuit';
  }

  getPlanClass(plan: string): string {
    return plan === 'premium' ? 'badge-premium' : 'badge-free';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'Actif', suspended: 'Suspendu', disabled: 'Désactivé'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      active: 'badge-success', suspended: 'badge-warning', disabled: 'badge-danger'
    };
    return classes[status] || 'badge-secondary';
  }

  getPeriodStateLabel(state: string): string {
    const labels: Record<string, string> = {
      payed: 'Payé', unpaid: 'Impayé', waiting: 'En attente', should_not_payed: 'Gratuit'
    };
    return labels[state] || state;
  }

  getPeriodStateClass(state: string): string {
    const classes: Record<string, string> = {
      payed: 'badge-success', unpaid: 'badge-danger',
      waiting: 'badge-warning', should_not_payed: 'badge-secondary'
    };
    return classes[state] || 'badge-secondary';
  }

  formatCurrency(amount: number): string {
    return this.currencyService.format(amount);
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }
}
