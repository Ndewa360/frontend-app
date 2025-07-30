export namespace AdminDashboardAction {
  
  // Load Dashboard Stats
  export class LoadDashboardStats {
    static readonly type = '[Admin Dashboard] Load Dashboard Stats';
  }

  export class LoadDashboardStatsSuccess {
    static readonly type = '[Admin Dashboard] Load Dashboard Stats Success';
    constructor(public stats: any) {}
  }

  export class LoadDashboardStatsFailure {
    static readonly type = '[Admin Dashboard] Load Dashboard Stats Failure';
    constructor(public error: any) {}
  }

  // Load System Health
  export class LoadSystemHealth {
    static readonly type = '[Admin Dashboard] Load System Health';
  }

  export class LoadSystemHealthSuccess {
    static readonly type = '[Admin Dashboard] Load System Health Success';
    constructor(public health: any) {}
  }

  export class LoadSystemHealthFailure {
    static readonly type = '[Admin Dashboard] Load System Health Failure';
    constructor(public error: any) {}
  }

  // Load Recent Activities
  export class LoadRecentActivities {
    static readonly type = '[Admin Dashboard] Load Recent Activities';
    constructor(public limit?: number) {}
  }

  export class LoadRecentActivitiesSuccess {
    static readonly type = '[Admin Dashboard] Load Recent Activities Success';
    constructor(public activities: any[]) {}
  }

  export class LoadRecentActivitiesFailure {
    static readonly type = '[Admin Dashboard] Load Recent Activities Failure';
    constructor(public error: any) {}
  }

  // Load Performance Metrics
  export class LoadPerformanceMetrics {
    static readonly type = '[Admin Dashboard] Load Performance Metrics';
    constructor(public timeRange?: string) {}
  }

  export class LoadPerformanceMetricsSuccess {
    static readonly type = '[Admin Dashboard] Load Performance Metrics Success';
    constructor(public metrics: any) {}
  }

  export class LoadPerformanceMetricsFailure {
    static readonly type = '[Admin Dashboard] Load Performance Metrics Failure';
    constructor(public error: any) {}
  }

  // Export Dashboard Report
  export class ExportDashboardReport {
    static readonly type = '[Admin Dashboard] Export Dashboard Report';
    constructor(public format?: string) {}
  }

  export class ExportDashboardReportSuccess {
    static readonly type = '[Admin Dashboard] Export Dashboard Report Success';
    constructor(public downloadUrl: string) {}
  }

  export class ExportDashboardReportFailure {
    static readonly type = '[Admin Dashboard] Export Dashboard Report Failure';
    constructor(public error: any) {}
  }

  // Set Loading
  export class SetLoading {
    static readonly type = '[Admin Dashboard] Set Loading';
    constructor(public loading: boolean) {}
  }

  // Clear State
  export class ClearState {
    static readonly type = '[Admin Dashboard] Clear State';
  }

  // Refresh All Data
  export class RefreshAllData {
    static readonly type = '[Admin Dashboard] Refresh All Data';
  }
}
