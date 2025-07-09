import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResultFormat } from '../store';

export interface PaymentData {
  periodId: string;
  paymentAmount: number;
  paymentReference: string;
  paymentMethod?: string;
}

export interface Invoice {
  invoiceNumber: string;
  subscriptionId: string;
  periodId: string;
  userId: string;
  userInfo: {
    name: string;
    email: string;
  };
  period: {
    startDate: Date;
    endDate: Date;
    billingRef: string;
  };
  amount: number;
  plan: string;
  status: string;
  createdAt: Date;
  dueDate: Date;
  unitsDetails: any[];
}

export interface PaymentHistoryItem {
  id: string;
  billingRef: string;
  startDate: Date;
  endDate: Date;
  amount: number;
  status: string;
  occupiedUnits: number;
  totalRevenue: number;
  unitsDetails: any[];
}

export interface PaymentHistory {
  periods: PaymentHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UnpaidInvoice {
  id: string;
  billingRef: string;
  startDate: Date;
  endDate: Date;
  amount: number;
  dueDate: Date;
  overdueDays: number;
}

export interface UnpaidInvoicesResponse {
  invoices: UnpaidInvoice[];
  totalAmount: number;
  count: number;
}

export interface PaymentStatus {
  hasUnpaidInvoices: boolean;
  totalUnpaidAmount: number;
  paymentRequired: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionPaymentService {

  constructor(private http: HttpClient) { }

  /**
   * Traite un paiement
   */
  processPayment(paymentData: PaymentData): Observable<ApiResultFormat<any>> {
    return this.http.post<ApiResultFormat<any>>(
      `${environment.apiUrl}/subscription-payment/process-payment`,
      paymentData
    );
  }

  /**
   * Génère une facture pour une période
   */
  generateInvoice(periodId: string): Observable<ApiResultFormat<Invoice>> {
    return this.http.get<ApiResultFormat<Invoice>>(
      `${environment.apiUrl}/subscription-payment/invoice/${periodId}`
    );
  }

  /**
   * Récupère l'historique des paiements
   */
  getPaymentHistory(page: number = 1, limit: number = 10): Observable<ApiResultFormat<PaymentHistory>> {
    return this.http.get<ApiResultFormat<PaymentHistory>>(
      `${environment.apiUrl}/subscription-payment/payment-history?page=${page}&limit=${limit}`
    );
  }

  /**
   * Récupère les factures impayées
   */
  getUnpaidInvoices(): Observable<ApiResultFormat<UnpaidInvoicesResponse>> {
    return this.http.get<ApiResultFormat<UnpaidInvoicesResponse>>(
      `${environment.apiUrl}/subscription-payment/unpaid-invoices`
    );
  }

  /**
   * Récupère le statut de paiement
   */
  getPaymentStatus(): Observable<ApiResultFormat<PaymentStatus>> {
    return this.http.get<ApiResultFormat<PaymentStatus>>(
      `${environment.apiUrl}/subscription-payment/payment-status`
    );
  }

  /**
   * Envoie des rappels de paiement
   */
  sendPaymentReminders(): Observable<ApiResultFormat<any>> {
    return this.http.post<ApiResultFormat<any>>(
      `${environment.apiUrl}/subscription-payment/send-payment-reminders`,
      {}
    );
  }

  /**
   * Récupère la facture de la période courante
   */
  getCurrentPeriodInvoice(): Observable<ApiResultFormat<Invoice>> {
    return this.http.get<ApiResultFormat<Invoice>>(
      `${environment.apiUrl}/subscription-payment/current-period-invoice`
    );
  }
}
