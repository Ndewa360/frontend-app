import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

// Aligné sur la réponse de GET /payment-link/details/:token (backend PaymentLinkService.getPaymentLinkByToken)
export interface PaymentLinkDetails {
  token: string;
  description: string;
  context: string;          // 'RENT' | 'PREMIUM_ACCESS' | 'SUBSCRIPTION'
  amount?: number;
  amountEditable?: boolean;
  currency?: string;
  // Contexte loyer (payment-link persistant)
  location?: any;
  property?: any;
  room?: any;
  locataire?: any;
  // Contexte session JWT
  reference?: string;
  userId?: string;
  userEmail?: string;
  metadata?: Record<string, any>;
  successRedirectPath?: string;
  cancelRedirectPath?: string;
  usageCount: number;
}

@Injectable({ providedIn: 'root' })
export class PaymentLinkService {

  private readonly api = `${environment.apiUrl}/payment-link`;

  constructor(private http: HttpClient) {}

  // Route backend: GET /payment-link/details/:token
  getPaymentDetails(token: string): Observable<{ data: PaymentLinkDetails }> {
    return this.http.get<{ data: PaymentLinkDetails }>(`${this.api}/details/${token}`);
  }
}
