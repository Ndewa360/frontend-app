import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngxs/store';

// Actions
import { AdminDashboardAction } from '../../store/dashboard/admin-dashboard.actions';

// States
import { AdminDashboardState } from '../../store/dashboard/admin-dashboard.state';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Observables
  dashboardStats$ = this.store.select(AdminDashboardState.selectDashboardStats);
  systemHealth$ = this.store.select(AdminDashboardState.selectSystemHealth);
  recentActivities$ = this.store.select(AdminDashboardState.selectRecentActivities);
  isLoading$ = this.store.select(AdminDashboardState.selectIsLoading);

  // Chart data
  userGrowthChartData: any[] = [];
  revenueChartData: any[] = [];
  systemMetricsData: any[] = [];

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.setupDataSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDashboardData(): void {
    this.store.dispatch(new AdminDashboardAction.LoadDashboardStats());
    this.store.dispatch(new AdminDashboardAction.LoadSystemHealth());
    this.store.dispatch(new AdminDashboardAction.LoadRecentActivities());
  }

  private setupDataSubscriptions(): void {
    // Écouter les changements de statistiques pour mettre à jour les graphiques
    this.dashboardStats$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(stats => {
      if (stats) {
        this.updateChartData(stats);
      }
    });
  }

  private updateChartData(stats: any): void {
    // Mettre à jour les données des graphiques
    this.userGrowthChartData = stats.userGrowthChart || [];
    this.revenueChartData = stats.revenueChart || [];
    this.systemMetricsData = stats.systemMetrics || [];
  }

  onRefreshData(): void {
    this.loadDashboardData();
  }

  onExportReport(): void {
    this.store.dispatch(new AdminDashboardAction.ExportDashboardReport());
  }

  onViewDetails(section: string): void {
    // Navigation vers les détails selon la section
    switch (section) {
      case 'users':
        // Navigate to users page
        break;
      case 'payments':
        // Navigate to payments page
        break;
      case 'properties':
        // Navigate to properties page
        break;
      case 'activities':
        // Navigate to activities/logs page
        break;
      default:
        break;
    }
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'user':
        return 'user';
      case 'property':
        return 'home';
      case 'payment':
        return 'currency-dollar';
      case 'system':
        return 'settings';
      default:
        return 'information';
    }
  }

  // Template helper methods to simplify expressions
  getRecentAlerts(alerts: any[]): any[] {
    return alerts?.slice(0, 3) || [];
  }
}
