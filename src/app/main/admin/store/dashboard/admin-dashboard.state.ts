import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

// Models
import { AdminDashboardStateModel, DashboardStats, SystemHealth, RecentActivity, PerformanceMetrics } from './admin-dashboard.model';

// Actions
import { AdminDashboardAction } from './admin-dashboard.actions';

// Services
import { AdminDashboardService } from '../../services/admin-dashboard.service';

@State<AdminDashboardStateModel>({
  name: 'adminDashboard',
  defaults: {
    stats: null,
    systemHealth: null,
    recentActivities: [],
    performanceMetrics: null,
    financialData: null,
    loading: false,
    error: null,
    lastUpdated: null
  }
})
@Injectable()
export class AdminDashboardState {

  constructor(private adminDashboardService: AdminDashboardService) {}

  // Selectors
  @Selector()
  static selectDashboardStats(state: AdminDashboardStateModel): DashboardStats | null {
    return state.stats;
  }

  @Selector()
  static selectSystemHealth(state: AdminDashboardStateModel): SystemHealth | null {
    return state.systemHealth;
  }

  @Selector()
  static selectRecentActivities(state: AdminDashboardStateModel): RecentActivity[] {
    return state.recentActivities;
  }

  @Selector()
  static selectPerformanceMetrics(state: AdminDashboardStateModel): PerformanceMetrics | null {
    return state.performanceMetrics;
  }

  @Selector()
  static selectFinancialData(state: AdminDashboardStateModel): any {
    return state.financialData;
  }

  @Selector()
  static selectIsLoading(state: AdminDashboardStateModel): boolean {
    return state.loading;
  }

  @Selector()
  static selectError(state: AdminDashboardStateModel): any {
    return state.error;
  }

  @Selector()
  static selectLastUpdated(state: AdminDashboardStateModel): Date | null {
    return state.lastUpdated;
  }

  // Actions

  @Action(AdminDashboardAction.LoadDashboardStats)
  loadDashboardStats(ctx: StateContext<AdminDashboardStateModel>) {
    ctx.patchState({ loading: true, error: null });
    
    return this.adminDashboardService.getDashboardStats().pipe(
      tap(stats => {
        ctx.dispatch(new AdminDashboardAction.LoadDashboardStatsSuccess(stats));
      }),
      catchError(error => {
        ctx.dispatch(new AdminDashboardAction.LoadDashboardStatsFailure(error));
        return throwError(error);
      })
    );
  }

  @Action(AdminDashboardAction.LoadDashboardStatsSuccess)
  loadDashboardStatsSuccess(ctx: StateContext<AdminDashboardStateModel>, action: AdminDashboardAction.LoadDashboardStatsSuccess) {
    ctx.patchState({
      stats: action.stats,
      loading: false,
      error: null,
      lastUpdated: new Date()
    });
  }

  @Action(AdminDashboardAction.LoadDashboardStatsFailure)
  loadDashboardStatsFailure(ctx: StateContext<AdminDashboardStateModel>, action: AdminDashboardAction.LoadDashboardStatsFailure) {
    ctx.patchState({
      loading: false,
      error: action.error
    });
  }

  @Action(AdminDashboardAction.LoadSystemHealth)
  loadSystemHealth(ctx: StateContext<AdminDashboardStateModel>) {
    ctx.patchState({ loading: true, error: null });
    
    return this.adminDashboardService.getSystemHealth().pipe(
      tap(health => {
        ctx.dispatch(new AdminDashboardAction.LoadSystemHealthSuccess(health));
      }),
      catchError(error => {
        ctx.dispatch(new AdminDashboardAction.LoadSystemHealthFailure(error));
        return throwError(error);
      })
    );
  }

  @Action(AdminDashboardAction.LoadSystemHealthSuccess)
  loadSystemHealthSuccess(ctx: StateContext<AdminDashboardStateModel>, action: AdminDashboardAction.LoadSystemHealthSuccess) {
    ctx.patchState({
      systemHealth: action.health,
      loading: false,
      error: null
    });
  }

  @Action(AdminDashboardAction.LoadSystemHealthFailure)
  loadSystemHealthFailure(ctx: StateContext<AdminDashboardStateModel>, action: AdminDashboardAction.LoadSystemHealthFailure) {
    ctx.patchState({
      loading: false,
      error: action.error
    });
  }

  @Action(AdminDashboardAction.LoadRecentActivities)
  loadRecentActivities(ctx: StateContext<AdminDashboardStateModel>, action: AdminDashboardAction.LoadRecentActivities) {
    ctx.patchState({ loading: true, error: null });
    
    return this.adminDashboardService.getRecentActivities(action.limit).pipe(
      tap(activities => {
        ctx.dispatch(new AdminDashboardAction.LoadRecentActivitiesSuccess(activities));
      }),
      catchError(error => {
        ctx.dispatch(new AdminDashboardAction.LoadRecentActivitiesFailure(error));
        return throwError(error);
      })
    );
  }

  @Action(AdminDashboardAction.LoadRecentActivitiesSuccess)
  loadRecentActivitiesSuccess(ctx: StateContext<AdminDashboardStateModel>, action: AdminDashboardAction.LoadRecentActivitiesSuccess) {
    ctx.patchState({
      recentActivities: action.activities,
      loading: false,
      error: null
    });
  }

  @Action(AdminDashboardAction.LoadRecentActivitiesFailure)
  loadRecentActivitiesFailure(ctx: StateContext<AdminDashboardStateModel>, action: AdminDashboardAction.LoadRecentActivitiesFailure) {
    ctx.patchState({
      loading: false,
      error: action.error
    });
  }

  @Action(AdminDashboardAction.LoadFinancialDashboard)
  loadFinancialDashboard(ctx: StateContext<AdminDashboardStateModel>, action: AdminDashboardAction.LoadFinancialDashboard) {
    ctx.patchState({ loading: true, error: null });
    return this.adminDashboardService.getFinancialDashboard(action.period).pipe(
      tap(data => {
        ctx.patchState({ financialData: data, loading: false, error: null, lastUpdated: new Date() });
      }),
      catchError(error => {
        ctx.patchState({ loading: false, error });
        return throwError(error);
      })
    );
  }

  @Action(AdminDashboardAction.SetLoading)
  setLoading(ctx: StateContext<AdminDashboardStateModel>, action: AdminDashboardAction.SetLoading) {
    ctx.patchState({ loading: action.loading });
  }

  @Action(AdminDashboardAction.ClearState)
  clearState(ctx: StateContext<AdminDashboardStateModel>) {
    ctx.patchState({
      stats: null,
      systemHealth: null,
      recentActivities: [],
      performanceMetrics: null,
      financialData: null,
      error: null,
      lastUpdated: null
    });
  }

  @Action(AdminDashboardAction.RefreshAllData)
  refreshAllData(ctx: StateContext<AdminDashboardStateModel>) {
    ctx.dispatch([
      new AdminDashboardAction.LoadDashboardStats(),
      new AdminDashboardAction.LoadSystemHealth(),
      new AdminDashboardAction.LoadRecentActivities(10)
    ]);
  }

  @Action(AdminDashboardAction.ExportDashboardReport)
  exportDashboardReport(ctx: StateContext<AdminDashboardStateModel>, action: AdminDashboardAction.ExportDashboardReport) {
    return this.adminDashboardService.exportDashboardReport(action.format).pipe(
      tap((result) => {
        if (result?.downloadUrl) {
          window.open(result.downloadUrl, '_blank');
        }
        ctx.dispatch(new AdminDashboardAction.ExportDashboardReportSuccess(result?.downloadUrl || ''));
      }),
      catchError(error => {
        ctx.dispatch(new AdminDashboardAction.ExportDashboardReportFailure(error));
        return throwError(error);
      })
    );
  }
}
