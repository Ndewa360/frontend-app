import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResultFormat } from '../store';
import { InitiatePaymentDto, InitiatePaymentResponse, CheckPaymentResponse } from 'src/app/public/payment/services/unified-payment.service';

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
  userInfo: { name: string; email: string };
  period: { startDate: Date; endDate: Date; billingRef: string };
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

// Réponse de POST /payment/initiate pour une souscription
export interface SubscriptionInitiateResponse {
  externalRef: string;
  status: string;
  redirectUrl?: string;  // URL Stripe Checkout si provider=STRIPE
}

@Injectable({ providedIn: 'root' })
export class SubscriptionPaymentService {

  constructor(private http: HttpClient) {}

  // ─── Routes souscription (backend /souscription ou /subscription-payment) ──

  processPayment(paymentData: PaymentData): Observable<ApiResultFormat<any>> {
    return this.http.post<ApiResultFormat<any>>(
      `${environment.apiUrl}/subscription-payment/process-payment`,
      paymentData
    );
  }

  generateInvoice(periodId: string): Observable<ApiResultFormat<Invoice>> {
    return this.http.get<ApiResultFormat<Invoice>>(
      `${environment.apiUrl}/subscription-payment/invoice/${periodId}`
    );
  }

  getPaymentHistory(page = 1, limit = 10): Observable<ApiResultFormat<PaymentHistory>> {
    return this.http.get<ApiResultFormat<PaymentHistory>>(
      `${environment.apiUrl}/subscription-payment/payment-history?page=${page}&limit=${limit}`
    );
  }

  getUnpaidInvoices(): Observable<ApiResultFormat<UnpaidInvoicesResponse>> {
    return this.http.get<ApiResultFormat<UnpaidInvoicesResponse>>(
      `${environment.apiUrl}/subscription-payment/unpaid-invoices`
    );
  }

  getPaymentStatus(): Observable<ApiResultFormat<PaymentStatus>> {
    return this.http.get<ApiResultFormat<PaymentStatus>>(
      `${environment.apiUrl}/subscription-payment/payment-status`
    );
  }

  sendPaymentReminders(): Observable<ApiResultFormat<any>> {
    return this.http.post<ApiResultFormat<any>>(
      `${environment.apiUrl}/subscription-payment/send-payment-reminders`,
      {}
    );
  }

  getCurrentPeriodInvoice(): Observable<ApiResultFormat<Invoice>> {
    return this.http.get<ApiResultFormat<Invoice>>(
      `${environment.apiUrl}/subscription-payment/current-period-invoice`
    );
  }

  // ─── Paiement unifié via POST /payment/initiate ───────────────────────────
  // Utilisé pour initier un paiement de souscription (Stripe, MTN, Orange, EasyTransact)

  initiateSubscriptionPayment(dto: InitiatePaymentDto): Observable<{ data: InitiatePaymentResponse }> {
    // SUBSCRIPTION et RENT nécessitent un JWT — route sécurisée
    return this.http.post<{ data: InitiatePaymentResponse }>(
      `${environment.apiUrl}/payment/initiate`,
      dto
    );
  }

  // ─── Vérification du statut via GET /payment/check/:externalRef ──────────

  checkPaymentStatus(externalRef: string): Observable<{ data: CheckPaymentResponse }> {
    return this.http.get<{ data: CheckPaymentResponse }>(
      `${environment.apiUrl}/payment/check/${externalRef}`
    );
  }

  // ─── Récupérer une transaction ────────────────────────────────────────────

  getTransaction(externalRef: string): Observable<{ data: any }> {
    return this.http.get<{ data: any }>(
      `${environment.apiUrl}/payment/transaction/${externalRef}`
    );
  }

  // ─── Méthodes de paiement disponibles ────────────────────────────────────
  // Retourne les providers disponibles (statique côté frontend)

  getPaymentMethods(): Observable<ApiResultFormat<any>> {
    return this.http.get<ApiResultFormat<any>>(
      `${environment.apiUrl}/subscription-payment/payment-methods`
    );
  }
}
