import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';

import { AdminPaymentsAction } from '../../store/payments/admin-payments.actions';
import { AdminPaymentsState } from '../../store/payments/admin-payments.state';
import { AdminPaymentsService } from '../../services/admin-payments.service';
import { AdminPayment, AdminSubscription, AdminCoupon } from '../../store/payments/admin-payments.model';

@Component({
  selector: 'app-admin-payments',
  templateUrl: './admin-payments.component.html',
  styleUrls: ['./admin-payments.component.scss']
})
export class AdminPaymentsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  payments$      = this.store.select(AdminPaymentsState.selectPayments);
  subscriptions$ = this.store.select(AdminPaymentsState.selectSubscriptions);
  coupons$       = this.store.select(AdminPaymentsState.selectCoupons);
  stats$         = this.store.select(AdminPaymentsState.selectStats);
  isLoading$     = this.store.select(AdminPaymentsState.selectIsLoading);

  selectedTab = 'payments';
  showCouponModal = false;
  editingCoupon: AdminCoupon | null = null;
  isProcessing = false;
  isRefreshing = false;
  openMenuId: string | null = null;

  // Modal refund
  showRefundModal = false;
  refundingPayment: AdminPayment | null = null;
  refundAmount: number | null = null;
  refundReason = '';

  // Modal cancel subscription
  showCancelModal = false;
  cancellingSubscription: AdminSubscription | null = null;
  cancelReason = '';

  couponForm: FormGroup;

  paymentStatusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'pending',   label: 'En attente' },
    { value: 'completed', label: 'Complété' },
    { value: 'failed',    label: 'Échoué' },
    { value: 'cancelled', label: 'Annulé' },
    { value: 'refunded',  label: 'Remboursé' }
  ];

  constructor(
    private store: Store,
    private fb: FormBuilder,
    private paymentsService: AdminPaymentsService,
    private toastr: ToastrService
  ) {
    this.couponForm = this.fb.group({
      name:        ['', Validators.required],
      code:        ['', Validators.required],
      description: [''],
      type:        ['percentage', Validators.required],
      value:       [0, [Validators.required, Validators.min(0)]],
      usageLimit:  [null],
      startDate:   [null],
      endDate:     [null],
      isActive:    [true]
    });
  }

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

  onTabChange(tab: string): void { this.selectedTab = tab; }

  onRefreshData(): void {
    this.isRefreshing = true;
    this.store.dispatch(new AdminPaymentsAction.RefreshData());
    setTimeout(() => this.isRefreshing = false, 1000);
  }

  onProcessPendingPayments(): void {
    if (!confirm('Traiter tous les paiements en attente ?')) return;
    this.isProcessing = true;
    this.store.dispatch(new AdminPaymentsAction.ProcessPendingPayments());
    setTimeout(() => this.isProcessing = false, 2000);
  }

  // Payments
  onRefundPayment(payment: AdminPayment): void {
    this.refundingPayment = payment;
    this.refundAmount = null;
    this.refundReason = '';
    this.showRefundModal = true;
  }

  confirmRefund(): void {
    if (!this.refundingPayment) return;
    const amount = this.refundAmount || undefined;
    const reason = this.refundReason.trim() || 'Remboursement administratif';
    this.showRefundModal = false;
    this.paymentsService.refundPayment(this.refundingPayment._id, { amount, reason })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastr.success('Remboursement effectué');
          this.store.dispatch(new AdminPaymentsAction.LoadPayments());
        },
        error: () => this.toastr.error('Erreur lors du remboursement')
      });
    this.refundingPayment = null;
  }

  cancelRefund(): void {
    this.showRefundModal = false;
    this.refundingPayment = null;
  }

  // Filters
  paymentSearchTerm = '';
  paymentStatusFilter = '';

  onPaymentSearch(event: Event): void {
    this.paymentSearchTerm = (event.target as HTMLInputElement).value;
  }

  onPaymentStatusFilter(event: Event): void {
    this.paymentStatusFilter = (event.target as HTMLSelectElement).value;
    this.store.dispatch(new AdminPaymentsAction.LoadPayments({ status: this.paymentStatusFilter }));
  }

  onCancelSubscription(subscription: AdminSubscription): void {
    this.cancellingSubscription = subscription;
    this.cancelReason = '';
    this.showCancelModal = true;
  }

  confirmCancelSubscription(): void {
    if (!this.cancellingSubscription) return;
    const reason = this.cancelReason.trim() || 'Annulation administrative';
    this.showCancelModal = false;
    this.paymentsService.cancelSubscription(this.cancellingSubscription._id, reason)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastr.success('Abonnement annulé');
          this.store.dispatch(new AdminPaymentsAction.LoadSubscriptions());
        },
        error: () => this.toastr.error('Erreur lors de l\'annulation')
      });
    this.cancellingSubscription = null;
  }

  cancelCancelSubscription(): void {
    this.showCancelModal = false;
    this.cancellingSubscription = null;
  }

  // Coupons
  onCreateCoupon(): void {
    this.editingCoupon = null;
    this.couponForm.reset({ type: 'percentage', value: 0, isActive: true });
    this.showCouponModal = true;
  }

  onEditCoupon(coupon: AdminCoupon): void {
    this.editingCoupon = coupon;
    this.couponForm.patchValue({
      name:        coupon.name,
      code:        coupon.code,
      description: coupon.description,
      type:        coupon.type,
      value:       coupon.value,
      usageLimit:  coupon.usageLimit,
      startDate:   coupon.startDate ? new Date(coupon.startDate).toISOString().split('T')[0] : null,
      endDate:     coupon.endDate   ? new Date(coupon.endDate).toISOString().split('T')[0]   : null,
      isActive:    coupon.isActive
    });
    this.showCouponModal = true;
  }

  onSaveCoupon(): void {
    if (this.couponForm.invalid) {
      this.couponForm.markAllAsTouched();
      return;
    }
    const data = this.couponForm.value;
    if (this.editingCoupon) {
      this.store.dispatch(new AdminPaymentsAction.UpdateCoupon(this.editingCoupon._id, data));
    } else {
      this.store.dispatch(new AdminPaymentsAction.CreateCoupon(data));
    }
    this.showCouponModal = false;
    this.editingCoupon = null;
  }

  onDeleteCoupon(coupon: AdminCoupon): void {
    if (!confirm(`Supprimer le coupon "${coupon.code}" ?`)) return;
    this.store.dispatch(new AdminPaymentsAction.DeleteCoupon(coupon._id));
  }

  onToggleCouponStatus(coupon: AdminCoupon): void {
    this.store.dispatch(new AdminPaymentsAction.UpdateCoupon(coupon._id, { isActive: !coupon.isActive }));
  }

  onCloseCouponModal(): void {
    this.showCouponModal = false;
    this.editingCoupon = null;
  }

  toggleMenu(id: string): void {
    this.openMenuId = this.openMenuId === id ? null : id;
  }

  getPaymentStatusClasses(status: string): string {
    const map: Record<string, string> = {
      completed: 'admin-badge-success',
      pending:   'admin-badge-warning',
      failed:    'admin-badge-danger',
      cancelled: 'admin-badge-secondary',
      refunded:  'admin-badge-info'
    };
    return map[status] || 'admin-badge-secondary';
  }

  getPaymentStatusLabel(status: string): string {
    const map: Record<string, string> = {
      completed: 'Complété', pending: 'En attente',
      failed: 'Échoué', cancelled: 'Annulé', refunded: 'Remboursé'
    };
    return map[status] || status;
  }

  getSubscriptionStatusClasses(status: string): string {
    const map: Record<string, string> = {
      active: 'admin-badge-success', inactive: 'admin-badge-secondary',
      cancelled: 'admin-badge-danger', expired: 'admin-badge-warning'
    };
    return map[status] || 'admin-badge-secondary';
  }

  getSubscriptionStatusLabel(status: string): string {
    const map: Record<string, string> = {
      active: 'Actif', inactive: 'Inactif', cancelled: 'Annulé', expired: 'Expiré'
    };
    return map[status] || status;
  }

  trackByPaymentId(_: number, p: AdminPayment): string      { return p._id; }
  trackBySubscriptionId(_: number, s: AdminSubscription): string { return s._id; }
  trackByCouponId(_: number, c: AdminCoupon): string        { return c._id; }

  couponSearchTerm = '';

  onSubscriptionStatusFilter(event: Event): void {
    const status = (event.target as HTMLSelectElement).value;
    this.store.dispatch(new AdminPaymentsAction.LoadSubscriptions({ status }));
  }

  filterCoupons(coupons: AdminCoupon[]): AdminCoupon[] {
    if (!coupons) return [];
    if (!this.couponSearchTerm) return coupons;
    const term = this.couponSearchTerm.toLowerCase();
    return coupons.filter(c =>
      c.code?.toLowerCase().includes(term) ||
      c.name?.toLowerCase().includes(term)
    );
  }
}
