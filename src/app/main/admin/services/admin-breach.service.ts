import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface BreachIncident {
  _id: string;
  type: string;
  severity: string;
  description: string;
  affectedDataTypes: string[];
  affectedUsersCount: number;
  detectedAt: string;
  notificationDeadline: string;
  status: string;
  reportedBy: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  authorityNotifiedAt?: string;
  createdAt: string;
}

export interface CreateBreachDto {
  type: string;
  severity: string;
  description: string;
  affectedDataTypes: string[];
  affectedUsersCount: number;
  detectedAt: string;
}

export interface UpdateBreachStatusDto {
  status: string;
  resolutionNotes?: string;
  authorityNotifiedAt?: string;
}

@Injectable()
export class AdminBreachService {
  private base = `${environment.apiUrl}/admin/breach`;

  constructor(private http: HttpClient) {}

  getAll(status?: string): Observable<BreachIncident[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<any>(this.base, { params }).pipe(map(r => r.data));
  }

  getOne(id: string): Observable<BreachIncident> {
    return this.http.get<any>(`${this.base}/${id}`).pipe(map(r => r.data));
  }

  declare(dto: CreateBreachDto): Observable<BreachIncident> {
    return this.http.post<any>(this.base, dto).pipe(map(r => r.data));
  }

  updateStatus(id: string, dto: UpdateBreachStatusDto): Observable<BreachIncident> {
    return this.http.patch<any>(`${this.base}/${id}/status`, dto).pipe(map(r => r.data));
  }
}
