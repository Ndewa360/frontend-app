import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { MatDialog } from '@angular/material/dialog';
import { SubscriptionDetailsModalComponent } from '../../components/subscription-details-modal/subscription-details-modal.component';

// Actions
import { AdminSubscriptionsAction } from '../../store/subscriptions/admin-subscriptions.actions';

// States
import { AdminSubscriptionsState } from '../../store/subscriptions/admin-subscriptions.state';

// Models
import { AdminUserSubscription, SubscriptionFilters, SubscriptionStats } from '../../store/subscriptions/admin-subscriptions.model';

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
    private dialog: MatDialog
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
    const reason = prompt('Raison de l\'upgrade:');
    if (reason !== null) {
      this.store.dispatch(new AdminSubscriptionsAction.ForceUpgradeToPremium(subscription._id, reason));
    }
  }

  onSuspendAccount(subscription: AdminUserSubscription): void {
    const reason = prompt('Raison de la suspension:');
    if (reason !== null) {
      this.store.dispatch(new AdminSubscriptionsAction.SuspendAccount(subscription._id, reason));
    }
  }

  onReactivateAccount(subscription: AdminUserSubscription): void {
    if (confirm(`Réactiver le compte de ${subscription.user.firstName} ${subscription.user.lastName} ?`)) {
      this.store.dispatch(new AdminSubscriptionsAction.ReactivateAccount(subscription._id));
    }
  }

  onForceUpgrade(subscription: AdminUserSubscription): void {
    if (confirm(`Forcer l'upgrade vers Premium pour ${subscription.user.firstName} ${subscription.user.lastName} ?`)) {
      this.store.dispatch(new AdminSubscriptionsAction.ForceUpgradeToPremium(subscription._id));
    }
  }

  onDowngradeToPlan(subscription: AdminUserSubscription, plan: string): void {
    if (confirm(`Changer le plan vers ${plan} pour ${subscription.user.firstName} ${subscription.user.lastName} ?`)) {
      this.store.dispatch(new AdminSubscriptionsAction.ChangePlan(subscription._id, plan));
    }
  }

  onSendPaymentReminder(subscription: AdminUserSubscription): void {
    if (confirm(`Envoyer un rappel de paiement à ${subscription.user.email} ?`)) {
      this.store.dispatch(new AdminSubscriptionsAction.SendPaymentReminder(subscription._id));
    }
  }

  onRefreshData(): void {
    this.isRefreshing = true;
    this.store.dispatch(new AdminSubscriptionsAction.RefreshData());
    setTimeout(() => {
      this.isRefreshing = false;
    }, 1000);
  }

  onExportData(): void {
    this.store.dispatch(new AdminSubscriptionsAction.ExportSubscriptions(this.currentFilters));
  }

  // Status helper methods
  getAccountStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'admin-badge-success';
      case 'suspended':
        return 'admin-badge-warning';
      case 'disabled':
        return 'admin-badge-danger';
      default:
        return 'admin-badge-secondary';
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
      case 'premium':
        return 'admin-badge-success';
      case 'free':
        return 'admin-badge-info';
      default:
        return 'admin-badge-secondary';
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
    if (!hasUnpaid) return 'admin-badge-success';
    if (totalUnpaid > 0) return 'admin-badge-danger';
    return 'admin-badge-warning';
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
}