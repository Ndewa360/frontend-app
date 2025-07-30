import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngxs/store';

// Actions
import { AdminPaymentsAction } from '../../store/payments/admin-payments.actions';

// States
import { AdminPaymentsState } from '../../store/payments/admin-payments.state';

// Models
import { AdminPayment, AdminSubscription, AdminCoupon } from '../../store/payments/admin-payments.model';

@Component({
  selector: 'app-admin-payments',
  templateUrl: './admin-payments.component.html',
  styleUrls: ['./admin-payments.component.scss']
})
export class AdminPaymentsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Observables
  payments$ = this.store.select(AdminPaymentsState.selectPayments);
  subscriptions$ = this.store.select(AdminPaymentsState.selectSubscriptions);
  coupons$ = this.store.select(AdminPaymentsState.selectCoupons);
  stats$ = this.store.select(AdminPaymentsState.selectStats);
  isLoading$ = this.store.select(AdminPaymentsState.selectIsLoading);

  // Component state
  selectedTab = 'payments';
  showCreateModal = false;
  showEditModal = false;
  selectedItem: AdminPayment | AdminSubscription | AdminCoupon | null = null;

  // Status options
  paymentStatusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'pending', label: 'En attente' },
    { value: 'completed', label: 'Complété' },
    { value: 'failed', label: 'Échoué' },
    { value: 'cancelled', label: 'Annulé' },
    { value: 'refunded', label: 'Remboursé' }
  ];

  subscriptionStatusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'active', label: 'Actif' },
    { value: 'inactive', label: 'Inactif' },
    { value: 'cancelled', label: 'Annulé' },
    { value: 'expired', label: 'Expiré' }
  ];

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    this.store.dispatch([
      new AdminPaymentsAction.LoadPayments(),
      new AdminPaymentsAction.LoadSubscriptions(),
      new AdminPaymentsAction.LoadCoupons(),
      new AdminPaymentsAction.LoadPaymentStats()
    ]);
  }

  onTabChange(tab: string): void {
    this.selectedTab = tab;
  }

  onCreateItem(): void {
    this.showCreateModal = true;
  }

  onEditItem(item: AdminPayment | AdminSubscription | AdminCoupon): void {
    this.selectedItem = item;
    this.showEditModal = true;
  }

  onDeleteItem(item: AdminCoupon): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ce coupon "${item.code}" ?`)) {
      this.store.dispatch(new AdminPaymentsAction.DeleteCoupon(item._id));
    }
  }

  onRefundPayment(payment: AdminPayment): void {
    const refundAmount = prompt('Montant à rembourser (laisser vide pour remboursement total):', payment.amount.toString());
    if (refundAmount !== null) {
      const amount = refundAmount ? parseFloat(refundAmount) : undefined;
      const reason = prompt('Raison du remboursement:');
      // Dispatch refund action
      console.log('Refund payment:', payment._id, { amount, reason });
    }
  }

  onCancelSubscription(subscription: AdminSubscription): void {
    const reason = prompt('Raison de l\'annulation:');
    if (reason !== null) {
      // Dispatch cancel subscription action
      console.log('Cancel subscription:', subscription._id, reason);
    }
  }

  onToggleCouponStatus(coupon: AdminCoupon): void {
    this.store.dispatch(new AdminPaymentsAction.UpdateCoupon(coupon._id, { isActive: !coupon.isActive }));
  }

  onProcessPendingPayments(): void {
    if (confirm('Traiter tous les paiements en attente ?')) {
      this.store.dispatch(new AdminPaymentsAction.ProcessPendingPayments());
    }
  }

  onRefreshData(): void {
    this.store.dispatch(new AdminPaymentsAction.RefreshData());
  }

  onCloseModal(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.selectedItem = null;
  }

  onItemCreated(): void {
    this.onCloseModal();
    this.loadData();
  }

  onItemUpdated(): void {
    this.onCloseModal();
    this.loadData();
  }

  getPaymentStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'info';
      case 'failed':
        return 'danger';
      case 'cancelled':
        return 'secondary';
      case 'refunded':
        return 'warning';
      default:
        return 'secondary';
    }
  }

  getPaymentStatusLabel(status: string): string {
    switch (status) {
      case 'completed':
        return 'Complété';
      case 'pending':
        return 'En attente';
      case 'failed':
        return 'Échoué';
      case 'cancelled':
        return 'Annulé';
      case 'refunded':
        return 'Remboursé';
      default:
        return status;
    }
  }

  getSubscriptionStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'secondary';
      case 'cancelled':
        return 'warning';
      case 'expired':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getSubscriptionStatusLabel(status: string): string {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'inactive':
        return 'Inactif';
      case 'cancelled':
        return 'Annulé';
      case 'expired':
        return 'Expiré';
      default:
        return status;
    }
  }

  trackByPaymentId(index: number, payment: AdminPayment): string {
    return payment._id;
  }

  trackBySubscriptionId(index: number, subscription: AdminSubscription): string {
    return subscription._id;
  }

  trackByCouponId(index: number, coupon: AdminCoupon): string {
    return coupon._id;
  }

  // Menu state
  openMenuId: string | null = null;

  togglePaymentMenu(paymentId: string): void {
    this.openMenuId = this.openMenuId === paymentId ? null : paymentId;
  }

  toggleSubscriptionMenu(subscriptionId: string): void {
    this.openMenuId = this.openMenuId === subscriptionId ? null : subscriptionId;
  }

  toggleCouponMenu(couponId: string): void {
    this.openMenuId = this.openMenuId === couponId ? null : couponId;
  }

  // Status helper methods
  getPaymentStatusClasses(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getSubscriptionStatusClasses(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
