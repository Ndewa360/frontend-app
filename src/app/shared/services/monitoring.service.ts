import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, timer, Subject } from 'rxjs';
import { map, catchError, tap, takeUntil } from 'rxjs/operators';
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
export class MonitoringService {
  private readonly apiUrl = `${environment.apiUrl}/monitoring`;
  private destroy$ = new Subject<void>();
  
  // Observables pour les données en temps réel
  private dashboardData$ = new BehaviorSubject<DashboardData | null>(null);
  private alerts$ = new BehaviorSubject<Alert[]>([]);
  private realTimeMetrics$ = new BehaviorSubject<RealTimeMetrics | null>(null);
  
  // Configuration par défaut
  private config: MonitoringConfig = {
    autoRefreshInterval: 30000, // 30 secondes
    maxErrorsToShow: 100,
    alertThresholds: {
      errorRate: 5, // 5%
      responseTime: 2000, // 2 secondes
      memoryUsage: 80 // 80%
    },
    enableRealTimeAlerts: true,
    enableAutoCleanup: false,
    cleanupIntervalDays: 30
  };

  constructor(private http: HttpClient) {
    this.initializeRealTimeUpdates();
  }

  // ==================== ERROR MANAGEMENT ====================

  /**
   * Log une erreur dans le système de monitoring
   */
  logError(errorData: LogErrorRequest): Observable<ErrorLog> {
    // En développement, aussi logger dans la console
    if (!environment.production) {
      console.error('🚨 Frontend Error:', errorData);
    }

    return this.http.post<ApiResultFormat<ErrorLog>>(`${this.apiUrl}/errors`, errorData)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Failed to log error to monitoring system:', error);
          throw error;
        })
      );
  }

  /**
   * Récupère la liste des erreurs avec filtres
   */
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

  /**
   * Récupère les détails d'une erreur spécifique
   */
  getErrorDetails(id: string): Observable<ErrorLog> {
    return this.http.get<ApiResultFormat<ErrorLog>>(`${this.apiUrl}/errors/${id}`)
      .pipe(map(response => response.data));
  }

  /**
   * Met à jour le statut d'une erreur
   */
  updateErrorStatus(id: string, status: ErrorStatus, resolvedBy?: string, notes?: string): Observable<ErrorLog> {
    const updateData = { status, resolvedBy, notes };
    return this.http.put<ApiResultFormat<ErrorLog>>(`${this.apiUrl}/errors/${id}`, updateData)
      .pipe(map(response => response.data));
  }

  /**
   * Supprime une erreur
   */
  deleteError(id: string): Observable<boolean> {
    return this.http.delete<ApiResultFormat<{ deleted: boolean }>>(`${this.apiUrl}/errors/${id}`)
      .pipe(map(response => response.data.deleted));
  }

  /**
   * Met à jour plusieurs erreurs en lot
   */
  bulkUpdateErrors(request: BulkUpdateRequest): Observable<number> {
    return this.http.post<ApiResultFormat<{ updatedCount: number }>>(`${this.apiUrl}/errors/bulk-update`, request)
      .pipe(map(response => response.data.updatedCount));
  }

  /**
   * Recherche des erreurs
   */
  searchErrors(searchTerm: string, filters?: ErrorFilters): Observable<ErrorLog[]> {
    const searchFilters = { ...filters, search: searchTerm };
    return this.getErrors(searchFilters).pipe(map(result => result.errors));
  }

  // ==================== SYSTEM HEALTH ====================

  /**
   * Récupère l'état de santé actuel du système
   */
  getSystemHealth(): Observable<SystemHealth> {
    return this.http.get<ApiResultFormat<SystemHealth>>(`${this.apiUrl}/health`)
      .pipe(map(response => response.data));
  }

  /**
   * Récupère le dernier check de santé
   */
  getLatestHealth(): Observable<SystemHealth> {
    return this.http.get<ApiResultFormat<SystemHealth>>(`${this.apiUrl}/health/latest`)
      .pipe(map(response => response.data));
  }

  /**
   * Récupère l'historique de santé du système
   */
  getHealthHistory(hours: number = 24): Observable<SystemHealth[]> {
    const params = new HttpParams().set('hours', hours.toString());
    return this.http.get<ApiResultFormat<SystemHealth[]>>(`${this.apiUrl}/health/history`, { params })
      .pipe(map(response => response.data));
  }

  // ==================== STATISTICS ====================

  /**
   * Récupère les statistiques des erreurs
   */
  getErrorStats(): Observable<ErrorStats> {
    return this.http.get<ApiResultFormat<ErrorStats>>(`${this.apiUrl}/errors/stats`)
      .pipe(map(response => response.data));
  }

  /**
   * Récupère les données complètes du dashboard
   */
  getDashboardData(): Observable<DashboardData> {
    return this.http.get<ApiResultFormat<DashboardData>>(`${this.apiUrl}/dashboard`)
      .pipe(
        map(response => response.data),
        tap(data => this.dashboardData$.next(data))
      );
  }

  // ==================== MAINTENANCE ====================

  /**
   * Nettoie les anciennes données
   */
  cleanupOldData(request: CleanupRequest): Observable<{ deletedErrors: number; deletedHealthChecks: number }> {
    return this.http.post<ApiResultFormat<{ deletedErrors: number; deletedHealthChecks: number }>>(`${this.apiUrl}/cleanup`, request)
      .pipe(map(response => response.data));
  }

  // ==================== REAL-TIME FEATURES ====================

  /**
   * Observable pour les données du dashboard en temps réel
   */
  getDashboardDataStream(): Observable<DashboardData | null> {
    return this.dashboardData$.asObservable();
  }

  /**
   * Observable pour les alertes en temps réel
   */
  getAlertsStream(): Observable<Alert[]> {
    return this.alerts$.asObservable();
  }

  /**
   * Observable pour les métriques en temps réel
   */
  getRealTimeMetricsStream(): Observable<RealTimeMetrics | null> {
    return this.realTimeMetrics$.asObservable();
  }

  /**
   * Ajoute une alerte
   */
  addAlert(alert: Omit<Alert, 'id' | 'timestamp'>): void {
    const newAlert: Alert = {
      ...alert,
      id: this.generateId(),
      timestamp: new Date()
    };

    const currentAlerts = this.alerts$.value;
    this.alerts$.next([newAlert, ...currentAlerts]);

    // Auto-suppression si configuré
    if (alert.autoClose && alert.duration) {
      setTimeout(() => {
        this.removeAlert(newAlert.id);
      }, alert.duration);
    }
  }

  /**
   * Supprime une alerte
   */
  removeAlert(alertId: string): void {
    const currentAlerts = this.alerts$.value;
    this.alerts$.next(currentAlerts.filter(alert => alert.id !== alertId));
  }

  /**
   * Efface toutes les alertes
   */
  clearAllAlerts(): void {
    this.alerts$.next([]);
  }

  // ==================== CONFIGURATION ====================

  /**
   * Met à jour la configuration du monitoring
   */
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Redémarrer les mises à jour en temps réel si l'intervalle a changé
    if (newConfig.autoRefreshInterval) {
      this.initializeRealTimeUpdates();
    }
  }

  /**
   * Récupère la configuration actuelle
   */
  getConfig(): MonitoringConfig {
    return { ...this.config };
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Capture automatiquement les erreurs JavaScript
   */
  captureJavaScriptError(error: Error, additionalData?: any): void {
    const errorData: LogErrorRequest = {
      message: error.message,
      stackTrace: {
        stack: error.stack,
        name: error.name
      },
      level: ErrorLevel.HIGH,
      source: ErrorSource.FRONTEND,
      url: window.location.href,
      component: 'JavaScript',
      additionalData: {
        ...additionalData,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        url: window.location.href
      }
    };

    this.logError(errorData).subscribe({
      error: (logError) => console.error('Failed to log JavaScript error:', logError)
    });
  }

  /**
   * Initialise les mises à jour en temps réel
   */
  private initializeRealTimeUpdates(): void {
    // Arrêter les anciens timers
    this.destroy$.next();
    this.destroy$ = new Subject<void>();

    // Démarrer les mises à jour automatiques
    timer(0, this.config.autoRefreshInterval)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.getDashboardData().subscribe({
          error: (error) => {
            // Erreur de monitoring : logger silencieusement, ne pas afficher à l'utilisateur
            console.warn('Monitoring: impossible de récupérer les données du dashboard', error);
          }
        });
      });
  }

  /**
   * Génère un ID unique
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Initialise la capture automatique des erreurs
   */
  initializeErrorCapture(): void {
    // Capture des erreurs JavaScript globales
    window.addEventListener('error', (event) => {
      this.captureJavaScriptError(event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Capture des promesses rejetées non gérées
    window.addEventListener('unhandledrejection', (event) => {
      const error = new Error(event.reason?.message || 'Unhandled Promise Rejection');
      this.captureJavaScriptError(error, {
        reason: event.reason,
        type: 'unhandledrejection'
      });
    });
  }

  /**
   * Nettoie les ressources
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
