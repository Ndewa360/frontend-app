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
  isProcessing = false;
  isRefreshing = false;

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
      this.isProcessing = true;
      this.store.dispatch(new AdminPaymentsAction.ProcessPendingPayments());
      // Simuler un délai pour l'UI
      setTimeout(() => {
        this.isProcessing = false;
      }, 2000);
    }
  }

  onRefreshData(): void {
    this.isRefreshing = true;
    this.store.dispatch(new AdminPaymentsAction.RefreshData());
    // Simuler un délai pour l'UI
    setTimeout(() => {
      this.isRefreshing = false;
    }, 1000);
  }

  onCloseModal(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.selectedItem = null;
  }

  onViewPaymentDetails(payment: AdminPayment): void {
    // TODO: Implémenter la vue détaillée du paiement
    console.log('Voir détails du paiement:', payment);
  }

  onViewSubscriptionDetails(subscription: AdminSubscription): void {
    // TODO: Implémenter la vue détaillée de l'abonnement
    console.log('Voir détails de l\'abonnement:', subscription);
  }

  onViewCouponDetails(coupon: AdminCoupon): void {
    // TODO: Implémenter la vue détaillée du coupon
    console.log('Voir détails du coupon:', coupon);
  }

  onEditCoupon(coupon: AdminCoupon): void {
    this.selectedItem = coupon;
    this.showEditModal = true;
  }

  onDeleteCoupon(coupon: AdminCoupon): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ce coupon "${coupon.code}" ?`)) {
      this.store.dispatch(new AdminPaymentsAction.DeleteCoupon(coupon._id));
    }
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
        return 'admin-badge-success';
      case 'inactive':
        return 'admin-badge-secondary';
      case 'cancelled':
        return 'admin-badge-danger';
      case 'expired':
        return 'admin-badge-warning';
      default:
        return 'admin-badge-secondary';
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
        return 'admin-badge-success';
      case 'pending':
        return 'admin-badge-warning';
      case 'failed':
        return 'admin-badge-danger';
      case 'cancelled':
        return 'admin-badge-secondary';
      case 'refunded':
        return 'admin-badge-info';
      default:
        return 'admin-badge-secondary';
    }
  }

  getSubscriptionStatusClasses(status: string): string {
    switch (status) {
      case 'active':
        return 'admin-badge-success';
      case 'inactive':
        return 'admin-badge-secondary';
      case 'cancelled':
        return 'admin-badge-danger';
      case 'expired':
        return 'admin-badge-warning';
      default:
        return 'admin-badge-secondary';
    }
  }
}
