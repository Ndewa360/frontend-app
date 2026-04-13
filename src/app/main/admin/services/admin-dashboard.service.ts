import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

// Models
import { 
  DashboardStats, 
  SystemHealth, 
  RecentActivity, 
  PerformanceMetrics 
} from '../store/dashboard/admin-dashboard.model';

// Shared Models
import { ApiResultFormat } from '../../../shared/store/global/api-result-format.model';

@Injectable({
  providedIn: 'root'
})
export class AdminDashboardService {
  private readonly apiUrl = `${environment.apiUrl}/admin/dashboard`;

  constructor(private http: HttpClient) {}

  /**
   * Obtenir le dashboard financier
   */
  getFinancialDashboard(period: string = '30d'): Observable<any> {
    const params = new HttpParams().set('period', period);
    return this.http.get<ApiResultFormat<any>>(`${this.apiUrl}/financial`, { params }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir les statistiques du dashboard
   */
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<ApiResultFormat<DashboardStats>>(`${this.apiUrl}/stats`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir l'état de santé du système
   */
  getSystemHealth(): Observable<SystemHealth> {
    return this.http.get<ApiResultFormat<SystemHealth>>(`${this.apiUrl}/health`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir les activités récentes
   */
  getRecentActivities(limit: number = 10): Observable<RecentActivity[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<ApiResultFormat<RecentActivity[]>>(`${this.apiUrl}/activities`, { params }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir les métriques de performance
   */
  getPerformanceMetrics(timeRange: string = '24h'): Observable<PerformanceMetrics> {
    const params = new HttpParams().set('timeRange', timeRange);
    return this.http.get<ApiResultFormat<PerformanceMetrics>>(`${this.apiUrl}/metrics`, { params }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir les statistiques des utilisateurs
   */
  getUsersOverview(): Observable<any> {
    return this.http.get<ApiResultFormat<any>>(`${this.apiUrl}/users-overview`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir les statistiques des propriétés
   */
  getPropertiesOverview(): Observable<any> {
    return this.http.get<ApiResultFormat<any>>(`${this.apiUrl}/properties-overview`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir les statistiques des paiements
   */
  getPaymentsOverview(): Observable<any> {
    return this.http.get<ApiResultFormat<any>>(`${this.apiUrl}/payments-overview`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir les données pour les graphiques
   */
  getChartData(chartType: string, timeRange: string = '30d'): Observable<any[]> {
    const params = new HttpParams()
      .set('type', chartType)
      .set('timeRange', timeRange);
    
    return this.http.get<ApiResultFormat<any[]>>(`${this.apiUrl}/charts`, { params }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir les alertes système
   */
  getSystemAlerts(): Observable<any[]> {
    return this.http.get<ApiResultFormat<any[]>>(`${this.apiUrl}/alerts`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Marquer une alerte comme résolue
   */
  resolveAlert(alertId: string): Observable<void> {
    return this.http.patch<ApiResultFormat<void>>(`${this.apiUrl}/alerts/${alertId}/resolve`, {}).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir les logs système
   */
  getSystemLogs(level: string = 'all', limit: number = 100): Observable<any[]> {
    const params = new HttpParams()
      .set('level', level)
      .set('limit', limit.toString());
    
    return this.http.get<ApiResultFormat<any[]>>(`${this.apiUrl}/logs`, { params }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Exporter un rapport du dashboard
   */
  exportDashboardReport(format: string = 'pdf', timeRange: string = '30d'): Observable<{ downloadUrl: string }> {
    const params = new HttpParams()
      .set('format', format)
      .set('timeRange', timeRange);
    
    return this.http.post<ApiResultFormat<{ downloadUrl: string }>>(`${this.apiUrl}/export`, {}, { params }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir les statistiques en temps réel
   */
  getRealTimeStats(): Observable<any> {
    return this.http.get<ApiResultFormat<any>>(`${this.apiUrl}/realtime`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir les tendances
   */
  getTrends(metric: string, timeRange: string = '7d'): Observable<any[]> {
    const params = new HttpParams()
      .set('metric', metric)
      .set('timeRange', timeRange);
    
    return this.http.get<ApiResultFormat<any[]>>(`${this.apiUrl}/trends`, { params }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir les comparaisons de périodes
   */
  getPeriodComparison(metric: string, currentPeriod: string, previousPeriod: string): Observable<any> {
    const params = new HttpParams()
      .set('metric', metric)
      .set('current', currentPeriod)
      .set('previous', previousPeriod);
    
    return this.http.get<ApiResultFormat<any>>(`${this.apiUrl}/comparison`, { params }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir les prédictions
   */
  getPredictions(metric: string, days: number = 30): Observable<any[]> {
    const params = new HttpParams()
      .set('metric', metric)
      .set('days', days.toString());
    
    return this.http.get<ApiResultFormat<any[]>>(`${this.apiUrl}/predictions`, { params }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Déclencher une actualisation des données
   */
  refreshData(): Observable<void> {
    return this.http.post<ApiResultFormat<void>>(`${this.apiUrl}/refresh`, {}).pipe(
      map(response => response.data)
    );
  }
}
