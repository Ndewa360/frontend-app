import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

// Models
import { 
  AdminUserSubscription, 
  SubscriptionStats, 
  SubscriptionFilters,
  SubscriptionAction,
  BulkSubscriptionAction,
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  SubscriptionActionResult
} from '../store/subscriptions/admin-subscriptions.model';

// Shared Models
import { ApiResultFormat } from '../../../shared/store/global/api-result-format.model';

@Injectable({
  providedIn: 'root'
})
export class AdminSubscriptionsService {
  private readonly apiUrl = `${environment.apiUrl}/admin/subscriptions`;

  constructor(private http: HttpClient) {}

  /**
   * Obtenir les statistiques des souscriptions
   */
  getSubscriptionsStats(): Observable<SubscriptionStats> {
    return this.http.get<ApiResultFormat<SubscriptionStats>>(`${this.apiUrl}/stats`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir la liste des souscriptions avec filtres
   */
  getSubscriptions(filters: SubscriptionFilters = {}): Observable<{ subscriptions: AdminUserSubscription[], total: number, meta: any }> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      const value = (filters as any)[key];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value instanceof Date ? value.toISOString() : value.toString());
      }
    });
    return this.http.get<any>(`${this.apiUrl}`, { params }).pipe(
      map(response => ({
        subscriptions: response.data || [],
        total: response.meta?.total || 0,
        meta: response.meta || { page: 1, limit: 20, totalPages: 0 }
      }))
    );
  }

  /**
   * Obtenir une souscription par ID
   */
  getSubscriptionById(subscriptionId: string): Observable<AdminUserSubscription> {
    return this.http.get<ApiResultFormat<AdminUserSubscription>>(`${this.apiUrl}/${subscriptionId}`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Forcer l'upgrade vers Premium
   */
  forceUpgradeToPremium(subscriptionId: string, reason?: string): Observable<SubscriptionActionResult> {
    return this.http.post<ApiResultFormat<SubscriptionActionResult>>(`${this.apiUrl}/${subscriptionId}/force-upgrade`, { reason }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Changer le plan d'une souscription
   */
  changePlan(subscriptionId: string, targetPlan: string, reason?: string): Observable<SubscriptionActionResult> {
    return this.http.patch<ApiResultFormat<SubscriptionActionResult>>(`${this.apiUrl}/${subscriptionId}/change-plan`, { 
      targetPlan, 
      reason 
    }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Suspendre un compte
   */
  suspendAccount(subscriptionId: string, reason: string): Observable<SubscriptionActionResult> {
    return this.http.patch<ApiResultFormat<SubscriptionActionResult>>(`${this.apiUrl}/${subscriptionId}/suspend`, { reason }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Réactiver un compte
   */
  reactivateAccount(subscriptionId: string): Observable<SubscriptionActionResult> {
    return this.http.patch<ApiResultFormat<SubscriptionActionResult>>(`${this.apiUrl}/${subscriptionId}/reactivate`, {}).pipe(
      map(response => response.data)
    );
  }

  /**
   * Désactiver un compte
   */
  disableAccount(subscriptionId: string, reason: string): Observable<SubscriptionActionResult> {
    return this.http.patch<ApiResultFormat<SubscriptionActionResult>>(`${this.apiUrl}/${subscriptionId}/disable`, { reason }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Envoyer un rappel de paiement
   */
  sendPaymentReminder(subscriptionId: string): Observable<{ sent: boolean; message: string }> {
    return this.http.post<ApiResultFormat<{ sent: boolean; message: string }>>(`${this.apiUrl}/${subscriptionId}/payment-reminder`, {}).pipe(
      map(response => response.data)
    );
  }

  /**
   * Marquer un paiement comme payé
   */
  markPaymentAsPaid(subscriptionId: string, periodId: string, paymentReference: string): Observable<SubscriptionActionResult> {
    return this.http.post<ApiResultFormat<SubscriptionActionResult>>(`${this.apiUrl}/${subscriptionId}/mark-paid`, {
      periodId,
      paymentReference
    }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Traiter les factures impayées
   */
  processUnpaidInvoices(subscriptionId: string): Observable<{ processed: number; errors: any[] }> {
    return this.http.post<ApiResultFormat<{ processed: number; errors: any[] }>>(`${this.apiUrl}/${subscriptionId}/process-unpaid`, {}).pipe(
      map(response => response.data)
    );
  }

  /**
   * Actions en masse
   */
  bulkAction(action: BulkSubscriptionAction): Observable<{ processed: number; failed: number; results: any[] }> {
    return this.http.post<ApiResultFormat<{ processed: number; failed: number; results: any[] }>>(`${this.apiUrl}/bulk-action`, action).pipe(
      map(response => response.data)
    );
  }

  /**
   * Upgrade en masse
   */
  bulkUpgrade(subscriptionIds: string[], targetPlan: string, reason?: string): Observable<{ processed: number; failed: number; results: any[] }> {
    return this.http.post<ApiResultFormat<{ processed: number; failed: number; results: any[] }>>(`${this.apiUrl}/bulk-upgrade`, {
      subscriptionIds,
      targetPlan,
      reason
    }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Suspension en masse
   */
  bulkSuspend(subscriptionIds: string[], reason: string): Observable<{ processed: number; failed: number; results: any[] }> {
    return this.http.post<ApiResultFormat<{ processed: number; failed: number; results: any[] }>>(`${this.apiUrl}/bulk-suspend`, {
      subscriptionIds,
      reason
    }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Réactivation en masse
   */
  bulkReactivate(subscriptionIds: string[]): Observable<{ processed: number; failed: number; results: any[] }> {
    return this.http.post<ApiResultFormat<{ processed: number; failed: number; results: any[] }>>(`${this.apiUrl}/bulk-reactivate`, {
      subscriptionIds
    }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Exporter les souscriptions
   */
  exportSubscriptions(filters: SubscriptionFilters = {}, format: string = 'xlsx'): Observable<{ downloadUrl: string }> {
    let params = new HttpParams().set('format', format);
    
    // Ajouter les filtres aux paramètres
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value !== undefined && value !== null && value !== '') {
        if (value instanceof Date) {
          params = params.set(key, value.toISOString());
        } else {
          params = params.set(key, value.toString());
        }
      }
    });

    return this.http.post<ApiResultFormat<{ downloadUrl: string }>>(`${this.apiUrl}/export`, {}, { params }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Générer un rapport
   */
  generateReport(reportType: string, dateFrom: Date, dateTo: Date): Observable<{ downloadUrl: string }> {
    return this.http.post<ApiResultFormat<{ downloadUrl: string }>>(`${this.apiUrl}/generate-report`, {
      reportType,
      dateFrom,
      dateTo
    }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir les métriques de conversion
   */
  getConversionMetrics(timeRange: string = '30d'): Observable<any> {
    const params = new HttpParams().set('timeRange', timeRange);
    return this.http.get<ApiResultFormat<any>>(`${this.apiUrl}/analytics/conversion-metrics`, { params }).pipe(
      map(response => response.data)
    );
  }

  getRevenueTrends(timeRange: string = '30d'): Observable<any> {
    const params = new HttpParams().set('timeRange', timeRange);
    return this.http.get<ApiResultFormat<any>>(`${this.apiUrl}/analytics/revenue-trends`, { params }).pipe(
      map(response => response.data)
    );
  }

  getChurnRiskUsers(): Observable<AdminUserSubscription[]> {
    return this.http.get<ApiResultFormat<AdminUserSubscription[]>>(`${this.apiUrl}/analytics/churn-risk`).pipe(
      map(response => response.data)
    );
  }

  getUpgradeOpportunities(): Observable<AdminUserSubscription[]> {
    return this.http.get<ApiResultFormat<AdminUserSubscription[]>>(`${this.apiUrl}/analytics/upgrade-opportunities`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Synchroniser les données de souscription
   */
  syncSubscriptionData(): Observable<{ synced: number; errors: any[] }> {
    return this.http.post<ApiResultFormat<{ synced: number; errors: any[] }>>(`${this.apiUrl}/sync`, {}).pipe(
      map(response => response.data)
    );
  }

  /**
   * Recalculer les montants mensuels
   */
  recalculateMonthlyAmounts(subscriptionIds?: string[]): Observable<{ processed: number; updated: number }> {
    return this.http.post<ApiResultFormat<{ processed: number; updated: number }>>(`${this.apiUrl}/recalculate-amounts`, {
      subscriptionIds
    }).pipe(
      map(response => response.data)
    );
  }
}