import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

// Models
import { 
  AdminPayment, 
  AdminSubscription, 
  AdminCoupon, 
  PaymentStats,
  PaymentFilters,
  SubscriptionFilters,
  CouponFilters,
  CreateCouponDto, 
  UpdateCouponDto
} from '../store/payments/admin-payments.model';

// Shared Models
import { ApiResultFormat } from '../../../shared/store/global/api-result-format.model';

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
   * Obtenir la liste des paiements avec filtres
   */
  getPayments(filters: PaymentFilters = {}): Observable<{ payments: AdminPayment[], total: number, meta: any }> {
    let params = new HttpParams();
    
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

    return this.http.get<ApiResultFormat<{ payments: AdminPayment[], total: number, meta: any }>>(`${this.apiUrl}`, { params }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir un paiement par ID
   */
  getPaymentById(paymentId: string): Observable<AdminPayment> {
    return this.http.get<ApiResultFormat<AdminPayment>>(`${this.apiUrl}/${paymentId}`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir la liste des souscriptions avec filtres
   */
  getSubscriptions(filters: SubscriptionFilters = {}): Observable<{ subscriptions: AdminSubscription[], total: number, meta: any }> {
    let params = new HttpParams();
    
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

    return this.http.get<ApiResultFormat<{ subscriptions: AdminSubscription[], total: number, meta: any }>>(`${this.apiUrl}/subscriptions`, { params }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir une souscription par ID
   */
  getSubscriptionById(subscriptionId: string): Observable<AdminSubscription> {
    return this.http.get<ApiResultFormat<AdminSubscription>>(`${this.apiUrl}/subscriptions/${subscriptionId}`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Annuler une souscription
   */
  cancelSubscription(subscriptionId: string, reason?: string): Observable<AdminSubscription> {
    return this.http.patch<ApiResultFormat<AdminSubscription>>(`${this.apiUrl}/subscriptions/${subscriptionId}/cancel`, { reason }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Renouveler une souscription
   */
  renewSubscription(subscriptionId: string): Observable<AdminSubscription> {
    return this.http.patch<ApiResultFormat<AdminSubscription>>(`${this.apiUrl}/subscriptions/${subscriptionId}/renew`, {}).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir la liste des coupons avec filtres
   */
  getCoupons(filters: CouponFilters = {}): Observable<{ coupons: AdminCoupon[], total: number, meta: any }> {
    let params = new HttpParams();
    
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

    return this.http.get<ApiResultFormat<{ coupons: AdminCoupon[], total: number, meta: any }>>(`${this.apiUrl}/coupons`, { params }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir un coupon par ID
   */
  getCouponById(couponId: string): Observable<AdminCoupon> {
    return this.http.get<ApiResultFormat<AdminCoupon>>(`${this.apiUrl}/coupons/${couponId}`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Créer un nouveau coupon
   */
  createCoupon(couponData: CreateCouponDto): Observable<AdminCoupon> {
    return this.http.post<ApiResultFormat<AdminCoupon>>(`${this.apiUrl}/coupons`, couponData).pipe(
      map(response => response.data)
    );
  }

  /**
   * Mettre à jour un coupon
   */
  updateCoupon(couponId: string, couponData: UpdateCouponDto): Observable<AdminCoupon> {
    return this.http.put<ApiResultFormat<AdminCoupon>>(`${this.apiUrl}/coupons/${couponId}`, couponData).pipe(
      map(response => response.data)
    );
  }

  /**
   * Supprimer un coupon
   */
  deleteCoupon(couponId: string): Observable<void> {
    return this.http.delete<ApiResultFormat<void>>(`${this.apiUrl}/coupons/${couponId}`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Activer/Désactiver un coupon
   */
  toggleCouponStatus(couponId: string, isActive: boolean): Observable<AdminCoupon> {
    return this.http.patch<ApiResultFormat<AdminCoupon>>(`${this.apiUrl}/coupons/${couponId}/status`, { isActive }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Créer des coupons en masse
   */
  createBulkCoupons(bulkData: { count: number; template: CreateCouponDto }): Observable<{ created: number; coupons: AdminCoupon[] }> {
    return this.http.post<ApiResultFormat<{ created: number; coupons: AdminCoupon[] }>>(`${this.apiUrl}/coupons/bulk`, bulkData).pipe(
      map(response => response.data)
    );
  }

  /**
   * Rembourser un paiement
   */
  refundPayment(paymentId: string, refundData: { amount?: number; reason?: string }): Observable<AdminPayment> {
    return this.http.post<ApiResultFormat<AdminPayment>>(`${this.apiUrl}/${paymentId}/refund`, refundData).pipe(
      map(response => response.data)
    );
  }

  /**
   * Traiter les paiements en attente
   */
  processPendingPayments(): Observable<{ processed: number; failed: number }> {
    return this.http.post<ApiResultFormat<{ processed: number; failed: number }>>(`${this.apiUrl}/process-pending`, {}).pipe(
      map(response => response.data)
    );
  }

  /**
   * Synchroniser avec les fournisseurs de paiement
   */
  syncPaymentProviders(): Observable<{ synced: number; errors: any[] }> {
    return this.http.post<ApiResultFormat<{ synced: number; errors: any[] }>>(`${this.apiUrl}/sync-providers`, {}).pipe(
      map(response => response.data)
    );
  }

  /**
   * Exporter les paiements
   */
  exportPayments(filters: PaymentFilters = {}, format: string = 'xlsx'): Observable<{ downloadUrl: string }> {
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
   * Générer un rapport financier
   */
  generateFinancialReport(reportData: { type: string; dateFrom: Date; dateTo: Date }): Observable<{ downloadUrl: string }> {
    return this.http.post<ApiResultFormat<{ downloadUrl: string }>>(`${this.apiUrl}/generate-report`, reportData).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir les statistiques de revenus
   */
  getRevenueStats(timeRange: string = '30d'): Observable<any> {
    const params = new HttpParams().set('timeRange', timeRange);
    return this.http.get<ApiResultFormat<any>>(`${this.apiUrl}/revenue-stats`, { params }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir les métriques de conversion
   */
  getConversionMetrics(): Observable<any> {
    return this.http.get<ApiResultFormat<any>>(`${this.apiUrl}/conversion-metrics`).pipe(
      map(response => response.data)
    );
  }
}
