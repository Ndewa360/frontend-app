import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

// ─── Types alignés sur le backend ──────────────────────────────────────────
// Backend: PaymentProvider enum → MTN | ORANGE | STRIPE | EASY_TRANSACT
export type PaymentProvider = 'MTN' | 'ORANGE' | 'STRIPE' | 'EASY_TRANSACT';

// Backend: PaymentContext enum → RENT | SUBSCRIPTION | PREMIUM_ACCESS
export type PaymentContext = 'RENT' | 'SUBSCRIPTION' | 'PREMIUM_ACCESS';

// Alias lisibles pour le template
export type PaymentMethod = 'orange_money' | 'mtn_money' | 'card' | 'easy_transact';

export type PaymentStatus =
  | 'idle'
  | 'processing'
  | 'pending_confirmation'
  | 'success'
  | 'failed'
  | 'cancelled';

// ─── DTO d'initiation aligné sur InitiatePaymentRequestDto backend ──────────
export interface InitiatePaymentDto {
  context: PaymentContext;
  provider: PaymentProvider;
  amount: number;
  currency?: string;
  phoneNumber?: string;
  description?: string;
  userEmail?: string;
  paymentLinkId?: string;
  // Contexte RENT
  locationId?: string;
  locataireId?: string;
  roomId?: string;
  propertyId?: string;
  // Contexte SUBSCRIPTION
  periodId?: string;
  subscriptionId?: string;
  // Stripe
  successUrl?: string;
  cancelUrl?: string;
  // Visiteur anonyme (PREMIUM_ACCESS public)
  visitorId?: string;
}

export interface InitiatePaymentResponse {
  externalRef: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'EXPIRED';
  redirectUrl?: string;
}

export interface CheckPaymentResponse {
  externalRef: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'EXPIRED';
  context: PaymentContext;
  amount: number;
}

export interface PaymentTransactionResponse {
  externalRef: string;
  status: string;
  context: PaymentContext;
  provider: PaymentProvider;
  amount: number;
  currency: string;
  processedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class UnifiedPaymentService {

  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ─── Initiation unifiée (tous providers) ──────────────────────────────────
  // Route sécurisée : POST /payment/initiate        (JWT requis — RENT, SUBSCRIPTION)
  // Route publique  : POST /payment/initiate-public (anonymes — PREMIUM_ACCESS)

  initiatePayment(
    dto: InitiatePaymentDto,
    isPublic = false
  ): Observable<{ data: InitiatePaymentResponse }> {
    const route = isPublic ? 'initiate-public' : 'initiate';
    return this.http.post<{ data: InitiatePaymentResponse }>(
      `${this.api}/payment/${route}`, dto
    );
  }

  // ─── Vérification du statut ───────────────────────────────────────────────
  // Route backend: GET /payment/check/:externalRef

  checkPaymentStatus(externalRef: string): Observable<{ data: CheckPaymentResponse }> {
    return this.http.get<{ data: CheckPaymentResponse }>(
      `${this.api}/payment/check/${externalRef}`
    );
  }

  // ─── Récupérer une transaction ────────────────────────────────────────────
  // Route backend: GET /payment/transaction/:externalRef

  getTransaction(externalRef: string): Observable<{ data: PaymentTransactionResponse }> {
    return this.http.get<{ data: PaymentTransactionResponse }>(
      `${this.api}/payment/transaction/${externalRef}`
    );
  }

  // ─── Mes transactions ─────────────────────────────────────────────────────
  // Route backend: GET /payment/my-transactions?context=...

  getMyTransactions(context?: PaymentContext): Observable<{ data: PaymentTransactionResponse[] }> {
    const params = context ? `?context=${context}` : '';
    return this.http.get<{ data: PaymentTransactionResponse[] }>(
      `${this.api}/payment/my-transactions${params}`
    );
  }

  // ─── Transactions d'une location ─────────────────────────────────────────
  // Route backend: GET /payment/location/:locationId/transactions

  getLocationTransactions(locationId: string): Observable<{ data: PaymentTransactionResponse[] }> {
    return this.http.get<{ data: PaymentTransactionResponse[] }>(
      `${this.api}/payment/location/${locationId}/transactions`
    );
  }

  // ─── Stats de paiement d'une location ────────────────────────────────────
  // Route backend: GET /payment/location/:locationId/stats

  getLocationPaymentStats(locationId: string): Observable<{ data: any }> {
    return this.http.get<{ data: any }>(
      `${this.api}/payment/location/${locationId}/stats`
    );
  }

  // ─── Helpers pour la page de paiement ────────────────────────────────────

  /** Mappe le PaymentMethod du template vers le PaymentProvider backend */
  methodToProvider(method: PaymentMethod): PaymentProvider {
    const map: Record<PaymentMethod, PaymentProvider> = {
      orange_money: 'ORANGE',
      mtn_money: 'MTN',
      card: 'STRIPE',
      easy_transact: 'EASY_TRANSACT',
    };
    return map[method];
  }

  formatAmount(amount: number, currency = 'XAF'): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  }

  validatePhone(phone: string): boolean {
    return /^(\+237)?6[0-9]{8}$/.test(phone.replace(/\s/g, ''));
  }

  normalizePhone(phone: string): string {
    // Supprimer tous les espaces et caractères non numériques sauf +
    const cleaned = phone.replace(/[\s\-\.]/g, '');
    if (cleaned.startsWith('+237')) return cleaned;
    if (cleaned.startsWith('00237')) return `+${cleaned.slice(2)}`;
    return `+237${cleaned}`;
  }
}
