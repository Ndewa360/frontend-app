import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface PaymentLinkDetails {
  token: string;
  description: string;
  context: string;          // 'rent' | 'premium_access' | 'subscription' | 'deposit'
  amount?: number;          // montant fixe si non éditable
  amountEditable?: boolean;
  currency?: string;
  // Contexte loyer
  location?: any;
  property?: any;
  room?: any;
  locataire?: any;
  // Contexte premium
  ownerId?: string;
  userId?: string;
  // Contexte souscription
  periodId?: string;
  // Redirections après paiement
  successRedirectPath?: string;
  cancelRedirectPath?: string;
  metadata?: Record<string, any>;
  usageCount: number;
}

export interface StripePaymentData {
  paymentIntentId: string;
  sessionId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentLinkService {
  private apiUrl = `${environment.apiUrl}/payment-link`;

  constructor(private http: HttpClient) {}

  getPaymentDetails(token: string): Observable<{ data: PaymentLinkDetails }> {
    return this.http.get<{ data: PaymentLinkDetails }>(`${this.apiUrl}/details/${token}`);
  }

  confirmPayment(token: string, paymentData: StripePaymentData): Observable<any> {
    return this.http.post(`${this.apiUrl}/confirm/${token}`, paymentData);
  }

  createStripeSession(token: string, amount: number): Observable<{ sessionId: string }> {
    return this.http.post<{ sessionId: string }>(`${environment.apiUrl}/stripe/create-session`, {
      token,
      amount,
      successUrl: `${window.location.origin}/payment/success`,
      cancelUrl: `${window.location.origin}/payment/${token}`
    });
  }

  getTransactionHistory(locationId: string): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(`${environment.apiUrl}/stripe/transactions/${locationId}`);
  }

  getPaymentStats(locationId: string): Observable<{ data: any }> {
    return this.http.get<{ data: any }>(`${environment.apiUrl}/stripe/stats/${locationId}`);
  }
}
