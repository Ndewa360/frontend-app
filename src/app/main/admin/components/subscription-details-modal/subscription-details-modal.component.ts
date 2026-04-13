import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { AdminSubscriptionsAction } from '../../store/subscriptions/admin-subscriptions.actions';
import { AdminUserSubscription } from '../../store/subscriptions/admin-subscriptions.model';

export interface SubscriptionDetailsModalData {
  subscription: AdminUserSubscription;
}

@Component({
  selector: 'app-subscription-details-modal',
  templateUrl: './subscription-details-modal.component.html',
  styleUrls: ['./subscription-details-modal.component.scss']
})
export class SubscriptionDetailsModalComponent implements OnInit {

  activeTab: 'overview' | 'periods' | 'actions' = 'overview';
  actionReason = '';
  showReasonInput = false;
  pendingAction: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<SubscriptionDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SubscriptionDetailsModalData,
    private store: Store,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {}

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

  onUpgrade(): void {
    this.pendingAction = 'upgrade';
    this.showReasonInput = true;
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
    this.toastr.success('Rappel de paiement envoyé');
    this.dialogRef.close({ action: 'reminder' });
  }

  confirmAction(): void {
    if (!this.pendingAction) return;

    switch (this.pendingAction) {
      case 'upgrade':
        this.store.dispatch(new AdminSubscriptionsAction.ForceUpgradeToPremium(
          this.subscription._id, this.actionReason
        ));
        this.dialogRef.close({ action: 'upgrade' });
        break;
      case 'suspend':
        if (!this.actionReason.trim()) {
          this.toastr.warning('La raison de suspension est requise');
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
    return plan === 'premium' ? 'Premium' : 'Gratuit';
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
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency', currency: 'XAF', minimumFractionDigits: 0
    }).format(amount || 0);
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }
}
