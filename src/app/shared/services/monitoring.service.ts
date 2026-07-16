import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject, timer, EMPTY } from 'rxjs';
import { map, catchError, tap, switchMap, takeUntil } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  ErrorLog,
  SystemHealth,
  ErrorStats,
  DashboardData,
  ErrorFilters,
  LogErrorRequest,
  BulkUpdateRequest,
  CleanupRequest,
  Alert,
  RealTimeMetrics,
  MonitoringConfig,
  ErrorLevel,
  ErrorSource,
  ErrorStatus
} from '../models/monitoring.models';
import { ApiResultFormat } from '../store/global';

@Injectable({
  providedIn: 'root'
})
export class MonitoringService implements OnDestroy {
  private readonly apiUrl = `${environment.apiUrl}/monitoring`;

  private dashboardData$ = new BehaviorSubject<DashboardData | null>(null);
  private alerts$ = new BehaviorSubject<Alert[]>([]);

  // Le timer de refresh n'est PAS démarré automatiquement — il doit être activé explicitement
  private autoRefreshDestroy$ = new Subject<void>();
  private serviceDestroy$ = new Subject<void>();

  private config: MonitoringConfig = {
    autoRefreshInterval: 30000,
    maxErrorsToShow: 100,
    alertThresholds: { errorRate: 5, responseTime: 2000, memoryUsage: 80 },
    enableRealTimeAlerts: true,
    enableAutoCleanup: false,
    cleanupIntervalDays: 30
  };

  constructor(private http: HttpClient) {}

  ngOnDestroy(): void {
    this.stopAutoRefresh();
    this.serviceDestroy$.next();
    this.serviceDestroy$.complete();
  }

  // ==================== AUTO-REFRESH (opt-in) ====================

  startAutoRefresh(): void {
    this.stopAutoRefresh();
    this.autoRefreshDestroy$ = new Subject<void>();

    // switchMap annule la requête précédente si le timer tick avant la fin
    timer(0, this.config.autoRefreshInterval).pipe(
      takeUntil(this.autoRefreshDestroy$),
      switchMap(() =>
        this.getDashboardData().pipe(
          catchError(() => EMPTY) // silencieux si erreur
        )
      )
    ).subscribe();
  }

  stopAutoRefresh(): void {
    this.autoRefreshDestroy$.next();
    this.autoRefreshDestroy$.complete();
  }

  // ==================== ERROR MANAGEMENT ====================

  logError(errorData: LogErrorRequest): Observable<ErrorLog> {
    return this.http.post<ApiResultFormat<ErrorLog>>(`${this.apiUrl}/errors`, errorData).pipe(
      map(response => response.data),
      catchError(error => {
        // Ne pas re-logger les erreurs de logging pour éviter la boucle infinie
        throw error;
      })
    );
  }

  getErrors(filters?: ErrorFilters): Observable<{ errors: ErrorLog[]; total: number }> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof ErrorFilters];
        if (value !== undefined && value !== null) {
          if (value instanceof Date) {
            params = params.set(key, value.toISOString());
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }
    return this.http.get<ApiResultFormat<{ errors: ErrorLog[]; total: number }>>(`${this.apiUrl}/errors`, { params })
      .pipe(map(response => response.data));
  }

  getErrorDetails(id: string): Observable<ErrorLog> {
    return this.http.get<ApiResultFormat<ErrorLog>>(`${this.apiUrl}/errors/${id}`)
      .pipe(map(response => response.data));
  }

  updateErrorStatus(id: string, status: ErrorStatus, resolvedBy?: string, notes?: string): Observable<ErrorLog> {
    return this.http.put<ApiResultFormat<ErrorLog>>(`${this.apiUrl}/errors/${id}`, { status, resolvedBy, notes })
      .pipe(map(response => response.data));
  }

  deleteError(id: string): Observable<boolean> {
    return this.http.delete<ApiResultFormat<{ deleted: boolean }>>(`${this.apiUrl}/errors/${id}`)
      .pipe(map(response => response.data.deleted));
  }

  bulkUpdateErrors(request: BulkUpdateRequest): Observable<number> {
    return this.http.post<ApiResultFormat<{ updatedCount: number }>>(`${this.apiUrl}/errors/bulk-update`, request)
      .pipe(map(response => response.data.updatedCount));
  }

  searchErrors(searchTerm: string, filters?: ErrorFilters): Observable<ErrorLog[]> {
    const searchFilters = { ...filters, search: searchTerm };
    return this.getErrors(searchFilters).pipe(map(result => result.errors));
  }

  // ==================== SYSTEM HEALTH ====================

  getSystemHealth(): Observable<SystemHealth> {
    return this.http.get<ApiResultFormat<SystemHealth>>(`${this.apiUrl}/health`)
      .pipe(map(response => response.data));
  }

  getLatestHealth(): Observable<SystemHealth> {
    return this.http.get<ApiResultFormat<SystemHealth>>(`${this.apiUrl}/health/latest`)
      .pipe(map(response => response.data));
  }

  getHealthHistory(hours: number = 24): Observable<SystemHealth[]> {
    const params = new HttpParams().set('hours', hours.toString());
    return this.http.get<ApiResultFormat<SystemHealth[]>>(`${this.apiUrl}/health/history`, { params })
      .pipe(map(response => response.data));
  }

  // ==================== STATISTICS ====================

  getErrorStats(): Observable<ErrorStats> {
    return this.http.get<ApiResultFormat<ErrorStats>>(`${this.apiUrl}/errors/stats`)
      .pipe(map(response => response.data));
  }

  getDashboardData(): Observable<DashboardData> {
    return this.http.get<ApiResultFormat<DashboardData>>(`${this.apiUrl}/dashboard`).pipe(
      map(response => response.data),
      tap(data => this.dashboardData$.next(data))
    );
  }

  // ==================== MAINTENANCE ====================

  cleanupOldData(request: CleanupRequest): Observable<{ deletedErrors: number; deletedHealthChecks: number }> {
    return this.http.post<ApiResultFormat<{ deletedErrors: number; deletedHealthChecks: number }>>(`${this.apiUrl}/cleanup`, request)
      .pipe(map(response => response.data));
  }

  // ==================== STREAMS ====================

  getDashboardDataStream(): Observable<DashboardData | null> {
    return this.dashboardData$.asObservable();
  }

  getAlertsStream(): Observable<Alert[]> {
    return this.alerts$.asObservable();
  }

  // ==================== ALERTS ====================

  addAlert(alert: Omit<Alert, 'id' | 'timestamp'>): void {
    const newAlert: Alert = { ...alert, id: this.generateId(), timestamp: new Date() };
    this.alerts$.next([newAlert, ...this.alerts$.value]);
    if (alert.autoClose && alert.duration) {
      setTimeout(() => this.removeAlert(newAlert.id), alert.duration);
    }
  }

  removeAlert(alertId: string): void {
    this.alerts$.next(this.alerts$.value.filter(a => a.id !== alertId));
  }

  clearAllAlerts(): void {
    this.alerts$.next([]);
  }

  // ==================== CONFIG ====================

  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): MonitoringConfig {
    return { ...this.config };
  }

  // ==================== ERROR CAPTURE ====================

  captureJavaScriptError(error: Error, additionalData?: any): void {
    const errorData: LogErrorRequest = {
      message: error.message,
      stackTrace: { stack: error.stack, name: error.name },
      level: ErrorLevel.HIGH,
      source: ErrorSource.FRONTEND,
      url: window.location.href,
      component: 'JavaScript',
      additionalData: { ...additionalData, userAgent: navigator.userAgent, timestamp: new Date().toISOString() }
    };
    this.logError(errorData).subscribe({ error: () => {} });
  }

  initializeErrorCapture(): void {
    window.addEventListener('error', (event) => {
      if (event.error) {
        this.captureJavaScriptError(event.error, { filename: event.filename, lineno: event.lineno, colno: event.colno });
      }
    });
    window.addEventListener('unhandledrejection', (event) => {
      const error = new Error(event.reason?.message || 'Unhandled Promise Rejection');
      this.captureJavaScriptError(error, { reason: event.reason, type: 'unhandledrejection' });
    });
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
