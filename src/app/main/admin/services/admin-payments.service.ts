import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

// Models
import {
  AdminPayment,
  AdminSubscription,
  PaymentStats,
  PaymentFilters,
  SubscriptionFilters,
  PaymentsExport,
} from '../store/payments/admin-payments.model';

// Shared Models
import { ApiResultFormat } from '../../../shared/store/global/api-result-format.model';

/** Paramètres de requête sans valeurs vides ; dates en ISO. */
function toParams(filters: object): HttpParams {
  let params = new HttpParams();
  Object.entries(filters || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params = params.set(key, value instanceof Date ? value.toISOString() : String(value));
    }
  });
  return params;
}

function pageOf(response: any) {
  const total = response.meta?.total ?? response.total ?? 0;
  return {
    total,
    meta: {
      page: response.meta?.page ?? response.page ?? 1,
      limit: response.meta?.limit ?? response.limit ?? 20,
      totalPages: response.meta?.totalPages ?? response.totalPages ?? 0,
    },
  };
}

@Injectable({
  providedIn: 'root'
})
export class AdminPaymentsService {
  private readonly apiUrl = `${environment.apiUrl}/admin/payments`;

  constructor(private http: HttpClient) {}

  /**
   * Obtenir les statistiques des paiements
   */
  getPaymentsStats(): Observable<PaymentStats> {
    return this.http.get<ApiResultFormat<PaymentStats>>(`${this.apiUrl}/stats`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Factures d'abonnement (montant > 0) avec l'utilisateur
   */
  getPayments(filters: PaymentFilters = {}): Observable<{ payments: AdminPayment[], total: number, meta: any }> {
    return this.http.get<any>(`${this.apiUrl}`, { params: toParams(filters) }).pipe(
      map(response => ({ payments: response.data || [], ...pageOf(response) }))
    );
  }

  /**
   * Abonnements en cours avec l'utilisateur
   */
  getSubscriptions(filters: SubscriptionFilters = {}): Observable<{ subscriptions: AdminSubscription[], total: number, meta: any }> {
    return this.http.get<any>(`${this.apiUrl}/subscriptions`, { params: toParams(filters) }).pipe(
      map(response => ({ subscriptions: response.data || [], ...pageOf(response) }))
    );
  }

  /**
   * Export CSV des factures (mêmes filtres que la liste)
   */
  exportPayments(filters: PaymentFilters = {}): Observable<PaymentsExport> {
    return this.http.post<ApiResultFormat<PaymentsExport>>(`${this.apiUrl}/export`, filters).pipe(
      map(response => response.data)
    );
  }
}
