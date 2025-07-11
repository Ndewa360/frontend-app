import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface GeneratePaymentLinkRequest {
  locationId: string;
  description?: string;
}

export interface PaymentLinkResponse {
  token: string;
  paymentUrl: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentLinkService {
  private apiUrl = `${environment.apiUrl}/payment-link`;

  constructor(private http: HttpClient) {}

  generatePaymentLink(request: GeneratePaymentLinkRequest): Observable<{ data: PaymentLinkResponse }> {
    return this.http.post<{ data: PaymentLinkResponse }>(`${this.apiUrl}/generate`, request);
  }

  getExistingPaymentLink(locationId: string): Observable<{ data: PaymentLinkResponse }> {
    return this.http.get<{ data: PaymentLinkResponse }>(`${this.apiUrl}/existing/${locationId}`);
  }

  getPaymentHistory(propertyId: string): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(`${this.apiUrl}/history/${propertyId}`);
  }
}
