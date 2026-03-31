import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

// ─── Types de moyens de paiement ───────────────────────────────────────────
export type PaymentMethod = 'orange_money' | 'mtn_money' | 'card';

// ─── Contextes d'utilisation du module de paiement ─────────────────────────
export type PaymentContext =
  | 'rent'           // Paiement de loyer (locataire → propriétaire)
  | 'subscription'   // Souscription Ndewa360 (propriétaire → Ndewa360)
  | 'premium_access' // Accès premium chercheur (chercheur → Ndewa360)
  | 'deposit';       // Caution (locataire → propriétaire)

// ─── Statuts de paiement ────────────────────────────────────────────────────
export type PaymentStatus =
  | 'idle'
  | 'processing'
  | 'pending_confirmation'  // En attente de confirmation opérateur
  | 'success'
  | 'failed'
  | 'cancelled';

// ─── Interfaces ─────────────────────────────────────────────────────────────
export interface PaymentConfig {
  context: PaymentContext;
  amount?: number;           // Montant fixe (optionnel, sinon l'utilisateur saisit)
  amountEditable?: boolean;  // L'utilisateur peut modifier le montant
  currency?: string;         // Défaut: XAF
  description?: string;
  reference?: string;        // Référence interne (token, periodId, etc.)
  metadata?: Record<string, any>;
  successRedirect?: string;
  cancelRedirect?: string;
}

export interface MobileMoneyPayload {
  phone: string;
  operator: 'orange' | 'mtn';
  amount: number;
  reference: string;
  description?: string;
}

export interface MobileMoneyResponse {
  transactionId: string;
  status: 'pending' | 'success' | 'failed';
  message: string;
  ussdCode?: string;
  expiresAt?: string;
}

export interface MobileMoneyStatusResponse {
  transactionId: string;
  status: 'pending' | 'success' | 'failed';
  amount: number;
  phone: string;
  completedAt?: string;
}

export interface StripeSessionPayload {
  amount: number;
  reference: string;
  context: PaymentContext;
  description?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, any>;
}

export interface StripeSessionResponse {
  sessionId: string;
  sessionUrl: string;
}

@Injectable({ providedIn: 'root' })
export class UnifiedPaymentService {

  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ─── Orange Money ──────────────────────────────────────────────────────────

  initiateOrangeMoney(payload: MobileMoneyPayload): Observable<{ data: MobileMoneyResponse }> {
    return this.http.post<{ data: MobileMoneyResponse }>(
      `${this.api}/payments/orange-money/initiate`, payload
    );
  }

  checkOrangeMoneyStatus(transactionId: string): Observable<{ data: MobileMoneyStatusResponse }> {
    return this.http.get<{ data: MobileMoneyStatusResponse }>(
      `${this.api}/payments/orange-money/status/${transactionId}`
    );
  }

  // ─── MTN Money ────────────────────────────────────────────────────────────

  initiateMtnMoney(payload: MobileMoneyPayload): Observable<{ data: MobileMoneyResponse }> {
    return this.http.post<{ data: MobileMoneyResponse }>(
      `${this.api}/payments/mtn-money/initiate`, payload
    );
  }

  checkMtnMoneyStatus(transactionId: string): Observable<{ data: MobileMoneyStatusResponse }> {
    return this.http.get<{ data: MobileMoneyStatusResponse }>(
      `${this.api}/payments/mtn-money/status/${transactionId}`
    );
  }

  // ─── Stripe (Visa / Mastercard) ───────────────────────────────────────────

  createStripeSession(payload: StripeSessionPayload): Observable<{ data: StripeSessionResponse }> {
    return this.http.post<{ data: StripeSessionResponse }>(
      `${this.api}/payments/stripe/create-session`, payload
    );
  }

  confirmStripePayment(sessionId: string): Observable<{ data: any }> {
    return this.http.post<{ data: any }>(
      `${this.api}/payments/stripe/confirm`, { sessionId }
    );
  }

  // ─── Utilitaires ──────────────────────────────────────────────────────────

  formatAmount(amount: number, currency = 'XAF'): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0
    }).format(amount);
  }

  validatePhone(phone: string): boolean {
    // Cameroun : 6XXXXXXXX ou +2376XXXXXXXX
    return /^(\+237)?6[0-9]{8}$/.test(phone.replace(/\s/g, ''));
  }

  normalizePhone(phone: string): string {
    const cleaned = phone.replace(/\s/g, '');
    return cleaned.startsWith('+237') ? cleaned : `+237${cleaned}`;
  }
}
