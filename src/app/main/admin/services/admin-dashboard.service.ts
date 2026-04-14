import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { DashboardStats, SystemHealth, RecentActivity } from '../store/dashboard/admin-dashboard.model';
import { ApiResultFormat } from '../../../shared/store/global/api-result-format.model';

@Injectable({ providedIn: 'root' })
export class AdminDashboardService {
  private readonly apiUrl = `${environment.apiUrl}/admin/dashboard`;

  constructor(private http: HttpClient) {}

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<ApiResultFormat<DashboardStats>>(`${this.apiUrl}/stats`).pipe(
      map(r => r.data)
    );
  }

  getSystemHealth(): Observable<SystemHealth> {
    return this.http.get<ApiResultFormat<SystemHealth>>(`${this.apiUrl}/health`).pipe(
      map(r => r.data)
    );
  }

  getRecentActivities(limit = 20): Observable<RecentActivity[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<ApiResultFormat<RecentActivity[]>>(`${this.apiUrl}/activities`, { params }).pipe(
      map(r => r.data || [])
    );
  }

  getFinancialDashboard(period = '30d'): Observable<any> {
    const params = new HttpParams().set('period', period);
    return this.http.get<ApiResultFormat<any>>(`${this.apiUrl}/financial`, { params }).pipe(
      map(r => r.data)
    );
  }

  getSystemAlerts(): Observable<any[]> {
    return this.http.get<ApiResultFormat<any[]>>(`${this.apiUrl}/alerts`).pipe(
      map(r => r.data || [])
    );
  }

  exportDashboardReport(format = 'pdf'): Observable<{ downloadUrl: string }> {
    const params = new HttpParams().set('format', format);
    return this.http.post<ApiResultFormat<{ downloadUrl: string }>>(`${this.apiUrl}/export`, {}, { params }).pipe(
      map(r => r.data)
    );
  }
}
