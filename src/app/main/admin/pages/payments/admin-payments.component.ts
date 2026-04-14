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

  // Modal refund
  showRefundModal = false;
  refundingPayment: AdminPayment | null = null;
  refundAmount: number | null = null;
  refundReason = '';

  // Modal cancel subscription
  showCancelModal = false;
  cancellingSubscription: AdminSubscription | null = null;
  cancelReason = '';

  // Filters
  paymentSearchTerm = '';
  paymentStatusFilter = '';
  couponSearchTerm = '';

  couponForm: FormGroup;

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

  ngOnInit(): void { this.loadData(); }

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

  // ── Payments ──────────────────────────────────────────────────────────────

  onPaymentSearch(event: Event): void {
    this.paymentSearchTerm = (event.target as HTMLInputElement).value;
  }

  onPaymentStatusFilter(event: Event): void {
    this.paymentStatusFilter = (event.target as HTMLSelectElement).value;
    this.store.dispatch(new AdminPaymentsAction.LoadPayments({ status: this.paymentStatusFilter }));
  }

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
        next: () => { this.toastr.success('Remboursement effectué'); this.store.dispatch(new AdminPaymentsAction.LoadPayments()); },
        error: () => this.toastr.error('Erreur lors du remboursement')
      });
    this.refundingPayment = null;
  }

  cancelRefund(): void { this.showRefundModal = false; this.refundingPayment = null; }

  // ── Subscriptions ─────────────────────────────────────────────────────────

  onSubscriptionStatusFilter(event: Event): void {
    const status = (event.target as HTMLSelectElement).value;
    this.store.dispatch(new AdminPaymentsAction.LoadSubscriptions({ status }));
  }

  onSubscriptionPlanFilter(event: Event): void {
    const plan = (event.target as HTMLSelectElement).value;
    this.store.dispatch(new AdminPaymentsAction.LoadSubscriptions({ subscriptionPlan: plan } as any));
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
        next: () => { this.toastr.success('Abonnement suspendu'); this.store.dispatch(new AdminPaymentsAction.LoadSubscriptions()); },
        error: () => this.toastr.error('Erreur lors de la suspension')
      });
    this.cancellingSubscription = null;
  }

  cancelCancelSubscription(): void { this.showCancelModal = false; this.cancellingSubscription = null; }

  // ── Coupons ───────────────────────────────────────────────────────────────

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
    if (this.couponForm.invalid) { this.couponForm.markAllAsTouched(); return; }
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

  onCloseCouponModal(): void { this.showCouponModal = false; this.editingCoupon = null; }

  filterCoupons(coupons: AdminCoupon[]): AdminCoupon[] {
    if (!coupons) return [];
    if (!this.couponSearchTerm) return coupons;
    const term = this.couponSearchTerm.toLowerCase();
    return coupons.filter(c =>
      c.code?.toLowerCase().includes(term) ||
      c.name?.toLowerCase().includes(term)
    );
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(amount || 0);
  }

  getUserName(user: any): string {
    if (!user) return 'N/A';
    return user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'N/A';
  }

  getSubStatus(sub: AdminSubscription): string {
    return sub.status || (sub as any).accountStatus || 'inactive';
  }

  getSubAmount(sub: AdminSubscription): number {
    return sub.amount || (sub as any).monthlyAmount || 0;
  }

  getSubCurrency(sub: AdminSubscription): string {
    return sub.currency || 'XAF';
  }

  getSubPropertyLimit(sub: AdminSubscription): string {
    return sub.propertyLimit ? sub.propertyLimit.toString() : '∞';
  }

  getCouponUsage(coupon: AdminCoupon): string {
    const used = coupon.usageCount ?? (coupon as any).usedCount ?? 0;
    const limit = coupon.usageLimit ?? (coupon as any).maxUses;
    return `${used} / ${limit ?? '∞'}`;
  }

  getCouponExpiry(coupon: AdminCoupon): Date | null {
    return coupon.endDate || (coupon as any).validUntil || null;
  }

  getCouponValueLabel(coupon: AdminCoupon): string {
    const t = coupon.type?.toString().toLowerCase();
    return (t === 'percentage' || t === 'percent') ? `${coupon.value}%` : `${coupon.value} FCFA`;
  }

  getCancellingUserName(): string {
    const user = this.cancellingSubscription?.user;
    return this.getUserName(user);
  }

  getPaymentStatusClasses(status: string): string {
    const map: Record<string, string> = {
      completed: 'admin-badge-success', pending: 'admin-badge-warning',
      failed: 'admin-badge-danger', cancelled: 'admin-badge-secondary', refunded: 'admin-badge-info'
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
      active: 'admin-badge-success', ACTIVE: 'admin-badge-success',
      inactive: 'admin-badge-secondary', DISABLED: 'admin-badge-secondary',
      cancelled: 'admin-badge-danger', SUSPENDED: 'admin-badge-warning',
      expired: 'admin-badge-warning'
    };
    return map[status] || 'admin-badge-secondary';
  }

  getSubscriptionStatusLabel(status: string): string {
    const map: Record<string, string> = {
      active: 'Actif', ACTIVE: 'Actif',
      inactive: 'Inactif', DISABLED: 'Désactivé',
      cancelled: 'Annulé', SUSPENDED: 'Suspendu',
      expired: 'Expiré'
    };
    return map[status] || status;
  }

  trackByPaymentId(_: number, p: AdminPayment): string      { return p._id; }
  trackBySubscriptionId(_: number, s: AdminSubscription): string { return s._id; }
  trackByCouponId(_: number, c: AdminCoupon): string        { return c._id; }
}
