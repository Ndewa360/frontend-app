import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { MatDialog } from '@angular/material/dialog';
import { SubscriptionDetailsModalComponent } from '../../components/subscription-details-modal/subscription-details-modal.component';
import { AdminSubscriptionsAction } from '../../store/subscriptions/admin-subscriptions.actions';
import { AdminSubscriptionsState } from '../../store/subscriptions/admin-subscriptions.state';
import { AdminUserSubscription, SubscriptionFilters } from '../../store/subscriptions/admin-subscriptions.model';
import { AdminSubscriptionsService } from '../../services/admin-subscriptions.service';

@Component({
  selector: 'app-admin-subscriptions',
  templateUrl: './admin-subscriptions.component.html',
  styleUrls: ['./admin-subscriptions.component.scss']
})
export class AdminSubscriptionsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  subscriptions$ = this.store.select(AdminSubscriptionsState.selectSubscriptions);
  stats$         = this.store.select(AdminSubscriptionsState.selectStats);
  isLoading$     = this.store.select(AdminSubscriptionsState.selectIsLoading);
  pagination$    = this.store.select(AdminSubscriptionsState.selectPagination);
  filters$       = this.store.select(AdminSubscriptionsState.selectFilters);

  selectedTab  = 'overview';
  showFilters  = false;
  isRefreshing = false;
  openMenuId: string | null = null;

  // Analytics — toutes les propriétés requises par le HTML
  analyticsData: any        = null;
  revenueTrends: any[]      = [];
  churnRiskUsers: any[]     = [];
  upgradeOpportunities: any[] = [];
  isLoadingAnalytics        = false;
  analyticsTimeRange        = '30d';

  planOptions = [
    { value: '', label: 'Tous les plans' },
    { value: 'free', label: 'Gratuit' },
    { value: 'premium', label: 'Premium' }
  ];

  statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'active', label: 'Actif' },
    { value: 'suspended', label: 'Suspendu' },
    { value: 'disabled', label: 'Désactivé' }
  ];

  paymentStatusOptions = [
    { value: '', label: 'Tous les paiements' },
    { value: 'up_to_date', label: 'À jour' },
    { value: 'overdue', label: 'En retard' },
    { value: 'unpaid', label: 'Impayé' }
  ];

  currentFilters: SubscriptionFilters = {
    page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc'
  };

  constructor(
    private store: Store,
    private dialog: MatDialog,
    private subscriptionsService: AdminSubscriptionsService
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    this.store.dispatch([
      new AdminSubscriptionsAction.LoadSubscriptions(this.currentFilters),
      new AdminSubscriptionsAction.LoadStats()
    ]);
  }

  private setupSubscriptions(): void {
    this.filters$.pipe(takeUntil(this.destroy$)).subscribe(f => {
      this.currentFilters = { ...f };
    });
  }

  onTabChange(tab: string): void {
    this.selectedTab = tab;
    if (tab === 'analytics' && !this.analyticsData) {
      this.loadAnalytics();
    }
  }

  onToggleFilters(): void { this.showFilters = !this.showFilters; }

  onApplyFilters(filters: SubscriptionFilters): void {
    this.currentFilters = { ...this.currentFilters, ...filters, page: 1 };
    this.store.dispatch(new AdminSubscriptionsAction.SetFilters(this.currentFilters));
    this.store.dispatch(new AdminSubscriptionsAction.LoadSubscriptions(this.currentFilters));
  }

  onClearFilters(): void {
    this.currentFilters = { page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' };
    this.store.dispatch(new AdminSubscriptionsAction.SetFilters(this.currentFilters));
    this.store.dispatch(new AdminSubscriptionsAction.LoadSubscriptions(this.currentFilters));
  }

  onPageChange(page: number): void {
    this.currentFilters.page = page;
    this.store.dispatch(new AdminSubscriptionsAction.LoadSubscriptions(this.currentFilters));
  }

  onSortChange(sortBy: string): void {
    const sortOrder = this.currentFilters.sortBy === sortBy && this.currentFilters.sortOrder === 'asc' ? 'desc' : 'asc';
    this.currentFilters = { ...this.currentFilters, sortBy, sortOrder };
    this.store.dispatch(new AdminSubscriptionsAction.LoadSubscriptions(this.currentFilters));
  }

  onViewDetails(subscription: AdminUserSubscription): void {
    const dialogRef = this.dialog.open(SubscriptionDetailsModalComponent, {
      width: '600px', data: { subscription }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result?.action) this.onRefreshData();
    });
  }

  onForceUpgrade(subscription: any): void {
    this.store.dispatch(new AdminSubscriptionsAction.ForceUpgradeToPremium(subscription._id));
  }

  onDowngradeToPlan(subscription: AdminUserSubscription, plan: string): void {
    this.store.dispatch(new AdminSubscriptionsAction.ChangePlan(subscription._id, plan));
  }

  onSuspendAccount(subscription: AdminUserSubscription): void {
    this.store.dispatch(new AdminSubscriptionsAction.SuspendAccount(subscription._id, 'Suspension administrative'));
  }

  onReactivateAccount(subscription: AdminUserSubscription): void {
    this.store.dispatch(new AdminSubscriptionsAction.ReactivateAccount(subscription._id));
  }

  onSendPaymentReminder(subscription: any): void {
    this.store.dispatch(new AdminSubscriptionsAction.SendPaymentReminder(subscription._id));
  }

  onRefreshData(): void {
    this.isRefreshing = true;
    this.store.dispatch(new AdminSubscriptionsAction.RefreshData())
      .pipe(takeUntil(this.destroy$))
      .subscribe({ complete: () => this.isRefreshing = false, error: () => this.isRefreshing = false });
    if (this.selectedTab === 'analytics') this.loadAnalytics();
  }

  onExportData(): void {
    this.store.dispatch(new AdminSubscriptionsAction.ExportSubscriptions(this.currentFilters));
  }

  toggleSubscriptionMenu(id: string): void {
    this.openMenuId = this.openMenuId === id ? null : id;
  }

  // ── Analytics ─────────────────────────────────────────────────────────────

  private loadAnalytics(): void {
    this.isLoadingAnalytics = true;

    this.subscriptionsService.getConversionMetrics(this.analyticsTimeRange)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => { this.analyticsData = data; this.isLoadingAnalytics = false; },
        error: () => { this.isLoadingAnalytics = false; }
      });

    this.subscriptionsService.getRevenueTrends(this.analyticsTimeRange)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => { this.revenueTrends = Array.isArray(data) ? data : []; },
        error: () => { this.revenueTrends = []; }
      });

    this.subscriptionsService.getChurnRiskUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => { this.churnRiskUsers = users || []; },
        error: () => { this.churnRiskUsers = []; }
      });

    this.subscriptionsService.getUpgradeOpportunities()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => { this.upgradeOpportunities = users || []; },
        error: () => { this.upgradeOpportunities = []; }
      });
  }

  onAnalyticsTimeRangeChange(range: string): void {
    this.analyticsTimeRange = range;
    this.loadAnalytics();
  }

  getMaxRevenue(): number {
    if (!this.revenueTrends.length) return 1;
    return Math.max(...this.revenueTrends.map((d: any) => d.revenue || 0), 1);
  }

  getBarHeightPercent(value: number): number {
    return Math.round((value / this.getMaxRevenue()) * 100);
  }

  formatTrendDate(item: any): string {
    if (!item) return '';
    if (item._id) return item._id;
    return `${item.year || ''}-${String(item.month || '').padStart(2, '0')}`;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getUserInitials(user: any): string {
    if (!user) return '?';
    const first = (user.firstName || user.name?.split(' ')[0] || '').charAt(0);
    const last  = (user.lastName  || user.name?.split(' ')[1] || '').charAt(0);
    return (first + last).toUpperCase() || '?';
  }

  getUserFullName(user: any): string {
    if (!user) return 'Inconnu';
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.name || user.email || 'Inconnu';
  }

  getPaginationEnd(pagination: any): number {
    return Math.min(pagination.page * pagination.limit, pagination.total);
  }

  getAccountStatusColor(status: string): string {
    const map: Record<string, string> = {
      active: 'success', suspended: 'warning', disabled: 'danger'
    };
    return map[status] || 'secondary';
  }

  getAccountStatusLabel(status: string): string {
    const map: Record<string, string> = {
      active: 'Actif', suspended: 'Suspendu', disabled: 'Désactivé'
    };
    return map[status] || status;
  }

  getPlanColor(plan: string): string {
    return plan === 'premium' ? 'success' : plan === 'free' ? 'info' : 'secondary';
  }

  getPlanLabel(plan: string): string {
    return plan === 'premium' ? 'Premium' : plan === 'free' ? 'Gratuit' : plan;
  }

  getPaymentStatusColor(hasUnpaid: boolean, totalUnpaid: number): string {
    if (!hasUnpaid) return 'success';
    return totalUnpaid > 0 ? 'danger' : 'warning';
  }

  getPaymentStatusLabel(hasUnpaid: boolean, totalUnpaid: number): string {
    if (!hasUnpaid) return 'À jour';
    return totalUnpaid > 0 ? `${totalUnpaid} FCFA impayé` : 'En retard';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency', currency: 'XAF', minimumFractionDigits: 0
    }).format(amount || 0);
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  trackBySubscriptionId(_: number, s: AdminUserSubscription): string {
    return s._id;
  }
}
