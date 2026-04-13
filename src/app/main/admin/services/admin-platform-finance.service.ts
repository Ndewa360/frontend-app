import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

const API = `${environment.apiUrl}/admin/platform-finance`;

export interface PlatformBalance {
  currency: string;
  grossRevenue: number;
  breakdown: { subscriptions: number; premiumAccess: number; withdrawalFees: number };
  confirmedWithdrawals: number;
  reservedWithdrawals: number;
  available: number;
}

export interface PlatformRevenuePeriod {
  period: number;
  subscriptions: { revenue: number; count: number };
  premiumAccess: { revenue: number; count: number };
  withdrawalFees: { revenue: number; count: number };
  total: number;
}

export interface PlatformWithdrawal {
  _id: string;
  reference: string;
  requestedAmount: number;
  feePercent: number;
  feeAmount: number;
  netAmount: number;
  currency: string;
  method: string;
  recipientName: string;
  recipientAccount: string;
  bankName?: string;
  operator?: string;
  status: string;
  requestedBy: any;
  approvedBy?: any;
  confirmedBy?: any;
  failedBy?: any;
  approvedAt?: Date;
  confirmedAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  cancellationReason?: string;
  externalReference?: string;
  notes?: string;
  createdAt: Date;
}

export interface PlatformKpis {
  currency: string;
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  monthOverMonthGrowth: number;
  arpu: number;
  totalPremiumAccessSold: number;
}

export interface PlatformFinanceConfig {
  userWithdrawalFeePercent: number;
  minWithdrawalAmount: number;
  maxWithdrawalAmount: number;
  supportedCurrencies: string[];
  defaultCurrency: string;
  requireDualValidation: boolean;
  notifyOnWithdrawal: boolean;
  notifyEmails: string[];
}

@Injectable({ providedIn: 'root' })
export class AdminPlatformFinanceService {
  constructor(private http: HttpClient) {}

  getConfig(): Observable<PlatformFinanceConfig> {
    return this.http.get<any>(`${API}/config`).pipe(map(r => r.data));
  }

  updateConfig(dto: Partial<PlatformFinanceConfig>): Observable<PlatformFinanceConfig> {
    return this.http.patch<any>(`${API}/config`, dto).pipe(map(r => r.data));
  }

  getBalance(currency?: string): Observable<PlatformBalance | PlatformBalance[]> {
    let params = new HttpParams();
    if (currency) params = params.set('currency', currency);
    return this.http.get<any>(`${API}/balance`, { params }).pipe(map(r => r.data));
  }

  getRevenue(period: 'monthly' | 'quarterly' | 'semester', year?: number, currency = 'XAF'): Observable<PlatformRevenuePeriod[]> {
    let params = new HttpParams().set('period', period).set('currency', currency);
    if (year) params = params.set('year', year.toString());
    return this.http.get<any>(`${API}/revenue`, { params }).pipe(map(r => r.data));
  }

  getTransactions(filters: any = {}): Observable<{ data: any[]; total: number; meta: any }> {
    let params = new HttpParams();
    Object.keys(filters).forEach(k => {
      if (filters[k] !== undefined && filters[k] !== null && filters[k] !== '') {
        params = params.set(k, filters[k] instanceof Date ? filters[k].toISOString() : filters[k].toString());
      }
    });
    return this.http.get<any>(`${API}/transactions`, { params }).pipe(
      map(r => ({ data: r.data, total: r.meta?.total || 0, meta: r.meta }))
    );
  }

  getKpis(currency = 'XAF'): Observable<PlatformKpis> {
    return this.http.get<any>(`${API}/kpis`, { params: new HttpParams().set('currency', currency) }).pipe(map(r => r.data));
  }

  getSnapshots(year?: number, currency = 'XAF'): Observable<any[]> {
    let params = new HttpParams().set('currency', currency);
    if (year) params = params.set('year', year.toString());
    return this.http.get<any>(`${API}/snapshots`, { params }).pipe(map(r => r.data));
  }

  computeSnapshot(year?: number, month?: number, currency = 'XAF'): Observable<any> {
    let params = new HttpParams().set('currency', currency);
    if (year)  params = params.set('year', year.toString());
    if (month) params = params.set('month', month.toString());
    return this.http.post<any>(`${API}/snapshots/compute`, {}, { params }).pipe(map(r => r.data));
  }

  getWithdrawals(filters: any = {}): Observable<{ data: PlatformWithdrawal[]; total: number; meta: any }> {
    let params = new HttpParams();
    Object.keys(filters).forEach(k => {
      if (filters[k] !== undefined && filters[k] !== null && filters[k] !== '') {
        params = params.set(k, filters[k].toString());
      }
    });
    return this.http.get<any>(`${API}/withdrawals`, { params }).pipe(
      map(r => ({ data: r.data, total: r.meta?.total || 0, meta: r.meta }))
    );
  }

  getWithdrawal(id: string): Observable<PlatformWithdrawal> {
    return this.http.get<any>(`${API}/withdrawals/${id}`).pipe(map(r => r.data));
  }

  createWithdrawal(dto: any): Observable<PlatformWithdrawal> {
    return this.http.post<any>(`${API}/withdrawals`, dto).pipe(map(r => r.data));
  }

  approveWithdrawal(id: string, notes?: string): Observable<PlatformWithdrawal> {
    return this.http.patch<any>(`${API}/withdrawals/${id}/approve`, { notes }).pipe(map(r => r.data));
  }

  confirmWithdrawal(id: string, externalReference?: string, notes?: string): Observable<PlatformWithdrawal> {
    return this.http.patch<any>(`${API}/withdrawals/${id}/confirm`, { externalReference, notes }).pipe(map(r => r.data));
  }

  failWithdrawal(id: string, failureReason: string): Observable<PlatformWithdrawal> {
    return this.http.patch<any>(`${API}/withdrawals/${id}/fail`, { failureReason }).pipe(map(r => r.data));
  }

  cancelWithdrawal(id: string, cancellationReason?: string): Observable<PlatformWithdrawal> {
    return this.http.patch<any>(`${API}/withdrawals/${id}/cancel`, { cancellationReason }).pipe(map(r => r.data));
  }
}
