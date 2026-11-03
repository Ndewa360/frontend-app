import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ApiResultFormat } from '../../../shared/store/global/api-result-format.model';

/** Action d'un administrateur (backend : admin/models/admin-audit-log.schema.ts). */
export interface AdminAuditLog {
  _id: string;
  /** Clé de l'action (ADMIN.AUDIT.ACTIONS.<clé>), OTHER si inconnue. */
  actionKey?: string;
  actor: string;
  actorName: string;
  actorEmail: string;
  method: string;
  path: string;
  /** Libellé lisible (ex. « Attribution de rôles »). */
  action: string;
  target: string;
  /** Corps de la requête, secrets masqués. */
  payload: any;
  statusCode: number;
  success: boolean;
  error: string;
  ip: string;
  createdAt: string;
}

export interface AdminAuditPage {
  data: AdminAuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminAuditFilters {
  page?: number;
  limit?: number;
  actor?: string;
  target?: string;
  /** 'true' | 'false' | '' (tous) */
  success?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminAuditService {
  private readonly apiUrl = `${environment.apiUrl}/admin/audit-logs`;

  constructor(private http: HttpClient) {}

  list(filters: AdminAuditFilters = {}): Observable<AdminAuditPage> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value));
    });
    return this.http.get<ApiResultFormat<AdminAuditPage>>(this.apiUrl, { params }).pipe(
      map(response => response.data || { data: [], total: 0, page: 1, limit: 30, totalPages: 0 })
    );
  }
}
