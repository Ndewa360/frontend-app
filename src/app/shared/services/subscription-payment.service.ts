import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResultFormat } from '../store';
import { PaymentProvider } from 'src/app/public/payment/services/unified-payment.service';

// ─── DTOs alignés sur le backend ─────────────────────────────────────────────

export interface InitiateSubscriptionPaymentDto {
  periodId: string;
  provider: PaymentProvider;
  phoneNumber?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface InitiateSubscriptionPaymentResponse {
  externalRef: string;
  status: string;
  redirectUrl?: string;
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
  paymentMethod: string | null;
  paidAt: Date | null;
  transaction: any | null;
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
  paymentMethod: string | null;
  paidAt: Date | null;
  paymentTransactionRef: string | null;
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
}

export interface AvailablePaymentMethods {
  stripe: { enabled: boolean; methods: string[]; currencies: string[] };
  mtn: { enabled: boolean; methods: string[]; currencies: string[] };
  orange: { enabled: boolean; methods: string[]; currencies: string[] };
  easyTransact: { enabled: boolean; methods: string[]; currencies: string[] };
}

@Injectable({ providedIn: 'root' })
export class SubscriptionPaymentService {

  private readonly api = `${environment.apiUrl}/subscription-payment`;

  constructor(private http: HttpClient) {}

  // ─── POST /subscription-payment/initiate ─────────────────────────────────
  // Initie un paiement via le module de paiement unifié (tous providers)
  initiatePayment(dto: InitiateSubscriptionPaymentDto): Observable<{ data: InitiateSubscriptionPaymentResponse }> {
    return this.http.post<{ data: InitiateSubscriptionPaymentResponse }>(
      `${this.api}/initiate`, dto
    );
  }

  // ─── GET /subscription-payment/invoice/:periodId ─────────────────────────
  generateInvoice(periodId: string): Observable<ApiResultFormat<Invoice>> {
    return this.http.get<ApiResultFormat<Invoice>>(`${this.api}/invoice/${periodId}`);
  }

  // ─── GET /subscription-payment/payment-history ───────────────────────────
  getPaymentHistory(page = 1, limit = 10): Observable<ApiResultFormat<PaymentHistory>> {
    return this.http.get<ApiResultFormat<PaymentHistory>>(
      `${this.api}/payment-history?page=${page}&limit=${limit}`
    );
  }

  // ─── GET /subscription-payment/unpaid-invoices ───────────────────────────
  getUnpaidInvoices(): Observable<ApiResultFormat<UnpaidInvoicesResponse>> {
    return this.http.get<ApiResultFormat<UnpaidInvoicesResponse>>(`${this.api}/unpaid-invoices`);
  }

  // ─── GET /subscription-payment/payment-status ────────────────────────────
  getPaymentStatus(): Observable<ApiResultFormat<PaymentStatus>> {
    return this.http.get<ApiResultFormat<PaymentStatus>>(`${this.api}/payment-status`);
  }

  // ─── GET /subscription-payment/payment-methods ───────────────────────────
  getPaymentMethods(): Observable<ApiResultFormat<AvailablePaymentMethods>> {
    return this.http.get<ApiResultFormat<AvailablePaymentMethods>>(`${this.api}/payment-methods`);
  }

  // ─── POST /subscription-payment/send-reminders ───────────────────────────
  sendPaymentReminders(): Observable<ApiResultFormat<any>> {
    return this.http.post<ApiResultFormat<any>>(`${this.api}/send-reminders`, {});
  }

  // ─── GET /subscription-payment/period/:periodId/transaction ─────────────
  getPeriodWithTransaction(periodId: string): Observable<ApiResultFormat<any>> {
    return this.http.get<ApiResultFormat<any>>(`${this.api}/period/${periodId}/transaction`);
  }

  // ─── GET /subscription-payment/subscription/:id/transactions ─────────────
  getSubscriptionTransactions(subscriptionId: string): Observable<ApiResultFormat<any[]>> {
    return this.http.get<ApiResultFormat<any[]>>(
      `${this.api}/subscription/${subscriptionId}/transactions`
    );
  }

  // ─── GET /payment/check/:externalRef (module paiement unifié) ────────────
  checkPaymentStatus(externalRef: string): Observable<{ data: any }> {
    return this.http.get<{ data: any }>(
      `${environment.apiUrl}/payment/check/${externalRef}`
    );
  }
}
