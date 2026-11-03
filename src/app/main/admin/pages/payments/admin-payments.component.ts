import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize, takeUntil } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AdminPaymentsAction } from '../../store/payments/admin-payments.actions';
import { AdminPaymentsState } from '../../store/payments/admin-payments.state';
import { AdminPaymentsService } from '../../services/admin-payments.service';
import { AdminCurrencyService } from '../../services/admin-currency.service';
import { AdminPayment, AdminSubscription } from '../../store/payments/admin-payments.model';
import { downloadCsv } from '../../utils/csv-download';
import { tierLabel } from '../../../../shared/pricing/pricing-grid';
import { NgIf, NgFor, NgClass, AsyncPipe, DatePipe, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-admin-payments',
  templateUrl: './admin-payments.component.html',
  styleUrls: ['./admin-payments.component.scss'],
  standalone: true,
  imports: [NgIf, FormsModule, NgFor, NgClass, AsyncPipe, DatePipe, DecimalPipe, RouterLink, TranslateModule]
})
export class AdminPaymentsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private search$ = new Subject<string>();

  payments$      = this.store.select(AdminPaymentsState.selectPayments);
  subscriptions$ = this.store.select(AdminPaymentsState.selectSubscriptions);
  stats$         = this.store.select(AdminPaymentsState.selectStats);
  pagination$    = this.store.select(AdminPaymentsState.selectPagination);
  isLoading$     = this.store.select(AdminPaymentsState.selectIsLoading);

  selectedTab: 'payments' | 'subscriptions' = 'payments';
  isRefreshing = false;
  isExporting = false;

  // Filters
  paymentSearchTerm = '';
  paymentStatusFilter = '';

  constructor(
    private store: Store,
    private paymentsService: AdminPaymentsService,
    private toastr: ToastrService,
    private currencyService: AdminCurrencyService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(search => this.store.dispatch(new AdminPaymentsAction.LoadPayments({ search, page: 1 })));
    this.store.dispatch(new AdminPaymentsAction.RefreshData());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTabChange(tab: 'payments' | 'subscriptions'): void { this.selectedTab = tab; }

  onRefreshData(): void {
    this.isRefreshing = true;
    this.store.dispatch(new AdminPaymentsAction.RefreshData())
      .pipe(finalize(() => this.isRefreshing = false))
      .subscribe({ error: () => this.toastr.error(this.translate.instant('ADMIN.PAYMENTS.TS.LOAD_ERROR')) });
  }

  // ── Factures ──────────────────────────────────────────────────────────────

  onPaymentSearch(value: string): void {
    this.search$.next((value || '').trim());
  }

  onPaymentStatusFilter(event: Event): void {
    this.paymentStatusFilter = (event.target as HTMLSelectElement).value;
    this.store.dispatch(new AdminPaymentsAction.LoadPayments({ status: this.paymentStatusFilter, page: 1 }));
  }

  goToPaymentsPage(page: number): void {
    this.store.dispatch(new AdminPaymentsAction.LoadPayments({ page }));
  }

  onExport(): void {
    if (this.isExporting) return;
    this.isExporting = true;
    const filters = this.store.selectSnapshot(AdminPaymentsState.selectFilters).payments;
    this.paymentsService.exportPayments({ ...filters, page: 1 })
      .pipe(finalize(() => this.isExporting = false), takeUntil(this.destroy$))
      .subscribe({
        next: file => {
          if (!file?.recordCount) { this.toastr.info(this.translate.instant('ADMIN.PAYMENTS.TS.EXPORT_EMPTY')); return; }
          downloadCsv(file);
          this.toastr.success(this.translate.instant('ADMIN.PAYMENTS.TS.EXPORT_DONE', { count: file.recordCount }));
        },
        error: () => this.toastr.error(this.translate.instant('ADMIN.PAYMENTS.TS.EXPORT_ERROR'))
      });
  }

  // ── Abonnements ───────────────────────────────────────────────────────────

  onSubscriptionStatusFilter(event: Event): void {
    const status = (event.target as HTMLSelectElement).value;
    this.store.dispatch(new AdminPaymentsAction.LoadSubscriptions({ status, page: 1 }));
  }

  onSubscriptionPlanFilter(event: Event): void {
    const subscriptionPlan = (event.target as HTMLSelectElement).value;
    this.store.dispatch(new AdminPaymentsAction.LoadSubscriptions({ subscriptionPlan, page: 1 }));
  }

  goToSubscriptionsPage(page: number): void {
    this.store.dispatch(new AdminPaymentsAction.LoadSubscriptions({ page }));
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  formatCurrency(amount: number): string {
    return this.currencyService.format(amount);
  }

  getUserName(user: any): string {
    if (!user) return '—';
    return user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || '—';
  }

  getSubAmount(sub: AdminSubscription): number {
    return sub.customMonthlyAmount ?? sub.monthlyAmount ?? sub.amount ?? 0;
  }

  tierLabel(tier?: string | null, plan?: string | null): string {
    return tierLabel(tier, plan, this.translate.currentLang);
  }

  isPaidTier(tier?: string | null, plan?: string | null): boolean {
    return tier ? tier !== 'FREE' : plan === 'premium';
  }

  getMethodLabel(method?: string): string {
    const map: Record<string, string> = {
      mobile_money: 'Mobile Money', MOBILE_MONEY: 'Mobile Money', WALLET: this.translate.instant('ADMIN.PAYMENTS.TS.WALLET'),
      wallet: this.translate.instant('ADMIN.PAYMENTS.TS.WALLET'), MANUAL: this.translate.instant('ADMIN.PAYMENTS.TS.MANUAL'),
      ORANGE_MONEY: 'Orange Money', MTN_MONEY: 'MTN MoMo'
    };
    return (method && map[method]) || method || '—';
  }

  getPaymentStatusClasses(status: string): string {
    const map: Record<string, string> = {
      completed: 'admin-badge-success', pending: 'admin-badge-warning', failed: 'admin-badge-danger'
    };
    return map[status] || 'admin-badge-secondary';
  }

  getPaymentStatusLabel(status: string): string {
    const map: Record<string, string> = {
      completed: 'PAID', pending: 'PENDING', failed: 'UNPAID'
    };
    return map[status] ? this.translate.instant(`ADMIN.PAYMENTS.TS.STATUS_${map[status]}`) : status;
  }

  getSubscriptionStatusClasses(status: string): string {
    const map: Record<string, string> = {
      active: 'admin-badge-success', cancelled: 'admin-badge-warning', inactive: 'admin-badge-danger'
    };
    return map[status] || 'admin-badge-secondary';
  }

  getSubscriptionStatusLabel(status: string): string {
    const map: Record<string, string> = {
      active: 'ACTIVE', cancelled: 'SUSPENDED', inactive: 'DISABLED'
    };
    return map[status] ? this.translate.instant(`ADMIN.PAYMENTS.TS.SUB_${map[status]}`) : status;
  }

  trackByPaymentId(_: number, p: AdminPayment): string      { return p._id; }
  trackBySubscriptionId(_: number, s: AdminSubscription): string { return s._id; }
}
