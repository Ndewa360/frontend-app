import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface MonthlyReportSummary {
  _id: string;
  year: number;
  month: number;
  status: 'PENDING' | 'GENERATED' | 'SENT' | 'FAILED' | 'SKIPPED';
  pdfUrl: string;
  sentAt: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class MonthlyReportService {
  private base = `${environment.apiUrl}/monthly-report`;

  constructor(private http: HttpClient) {}

  getMyReports(ownerId: string): Observable<{ data: MonthlyReportSummary[] }> {
    return this.http.get<{ data: MonthlyReportSummary[] }>(`${this.base}/owner/${ownerId}`);
  }
}
