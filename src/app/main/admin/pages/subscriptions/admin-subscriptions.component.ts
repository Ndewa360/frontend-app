import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { MatDialog } from '@angular/material/dialog';
import { SubscriptionDetailsModalComponent } from '../../components/subscription-details-modal/subscription-details-modal.component';
import { AdminSubscriptionsAction } from '../../store/subscriptions/admin-subscriptions.actions';
import { AdminSubscriptionsState } from '../../store/subscriptions/admin-subscriptions.state';
import { AdminUserSubscription, SubscriptionFilters, SubscriptionStats } from '../../store/subscriptions/admin-subscriptions.model';
import { AdminSubscriptionsService } from '../../services/admin-subscriptions.service';

@Component({
  selector: 'app-admin-subscriptions',
  templateUrl: './admin-subscriptions.component.html',
  styleUrls: ['./admin-subscriptions.component.scss']
})
export class AdminSubscriptionsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Observables
  subscriptions$ = this.store.select(AdminSubscriptionsState.selectSubscriptions);
  stats$ = this.store.select(AdminSubscriptionsState.selectStats);
  isLoading$ = this.store.select(AdminSubscriptionsState.selectIsLoading);
  pagination$ = this.store.select(AdminSubscriptionsState.selectPagination);
  filters$ = this.store.select(AdminSubscriptionsState.selectFilters);

  // Component state
  selectedTab = 'overview';
  showFilters = false;
  isRefreshing = false;

  // Analytics data
  analyticsData: any = null;
  churnRiskUsers: any[] = [];
  upgradeOpportunities: any[] = [];
  isLoadingAnalytics = false;

  // Filter options
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

  // Current filters
  currentFilters: SubscriptionFilters = {
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  };

  constructor(
    private store: Store,
    private dialog: MatDialog,
    private subscriptionsService: AdminSubscriptionsService
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.setupSubscriptions();
    this.loadAnalytics();
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
    this.filters$.pipe(takeUntil(this.destroy$)).subscribe(filters => {
      this.currentFilters = { ...filters };
    });
  }

  onTabChange(tab: string): void {
    this.selectedTab = tab;
  }

  onToggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  onApplyFilters(filters: SubscriptionFilters): void {
    this.currentFilters = { ...this.currentFilters, ...filters, page: 1 };
    this.store.dispatch(new AdminSubscriptionsAction.SetFilters(this.currentFilters));
    this.store.dispatch(new AdminSubscriptionsAction.LoadSubscriptions(this.currentFilters));
  }

  onClearFilters(): void {
    this.currentFilters = {
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
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
    // Ouvrir un modal avec les détails complets
    const dialogRef = this.dialog.open(SubscriptionDetailsModalComponent, {
      width: '600px',
      data: { subscription }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.action) {
        // Recharger les données après une action
        this.onRefreshData();
      }
    });
  }

  onUpgradePlan(subscription: AdminUserSubscription): void {
    this.store.dispatch(new AdminSubscriptionsAction.ForceUpgradeToPremium(subscription._id));
  }

  onSuspendAccount(subscription: AdminUserSubscription): void {
    const reason = 'Suspension administrative';
    this.store.dispatch(new AdminSubscriptionsAction.SuspendAccount(subscription._id, reason));
  }

  onReactivateAccount(subscription: AdminUserSubscription): void {
    this.store.dispatch(new AdminSubscriptionsAction.ReactivateAccount(subscription._id));
  }

  onForceUpgrade(subscription: AdminUserSubscription): void {
    this.store.dispatch(new AdminSubscriptionsAction.ForceUpgradeToPremium(subscription._id));
  }

  onDowngradeToPlan(subscription: AdminUserSubscription, plan: string): void {
    this.store.dispatch(new AdminSubscriptionsAction.ChangePlan(subscription._id, plan));
  }

  onSendPaymentReminder(subscription: AdminUserSubscription): void {
    this.store.dispatch(new AdminSubscriptionsAction.SendPaymentReminder(subscription._id));
  }

  private loadAnalytics(): void {
    this.isLoadingAnalytics = true;
    this.subscriptionsService.getConversionMetrics('30d')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => { this.analyticsData = data; this.isLoadingAnalytics = false; },
        error: () => this.isLoadingAnalytics = false
      });
    this.subscriptionsService.getChurnRiskUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => this.churnRiskUsers = users || [],
        error: () => this.churnRiskUsers = []
      });
    this.subscriptionsService.getUpgradeOpportunities()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => this.upgradeOpportunities = users || [],
        error: () => this.upgradeOpportunities = []
      });
  }

  onRefreshData(): void {
    this.isRefreshing = true;
    this.store.dispatch(new AdminSubscriptionsAction.RefreshData());
    this.loadAnalytics();
    setTimeout(() => this.isRefreshing = false, 1000);
  }

  onExportData(): void {
    this.store.dispatch(new AdminSubscriptionsAction.ExportSubscriptions(this.currentFilters));
  }

  // Status helper methods
  getAccountStatusColor(status: string): string {
    switch (status) {
      case 'active':    return 'success';
      case 'suspended': return 'warning';
      case 'disabled':  return 'danger';
      default:          return 'secondary';
    }
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

  getPlanColor(plan: string): string {
    switch (plan) {
      case 'premium': return 'success';
      case 'free':    return 'info';
      default:        return 'secondary';
    }
  }

  getPlanLabel(plan: string): string {
    switch (plan) {
      case 'premium':
        return 'Premium';
      case 'free':
        return 'Gratuit';
      default:
        return plan;
    }
  }

  getPaymentStatusColor(hasUnpaid: boolean, totalUnpaid: number): string {
    if (!hasUnpaid) return 'success';
    if (totalUnpaid > 0) return 'danger';
    return 'warning';
  }

  getPaymentStatusLabel(hasUnpaid: boolean, totalUnpaid: number): string {
    if (!hasUnpaid) return 'À jour';
    if (totalUnpaid > 0) return `${totalUnpaid} FCFA impayé`;
    return 'En retard';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount || 0);
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  trackBySubscriptionId(index: number, subscription: AdminUserSubscription): string {
    return subscription._id;
  }

  // Menu state
  openMenuId: string | null = null;

  toggleSubscriptionMenu(subscriptionId: string): void {
    this.openMenuId = this.openMenuId === subscriptionId ? null : subscriptionId;
  }

  getPaginationEnd(pagination: any): number {
    return Math.min(pagination.page * pagination.limit, pagination.total);
  }
}