import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PaymentContext } from 'src/app/public/payment/services/unified-payment.service';

export interface CreatePaymentSessionPayload {
  context: PaymentContext;
  amount: number;
  amountEditable?: boolean;
  currency?: string;
  description?: string;
  reference?: string;
  userId?: string;
  userEmail?: string;
  metadata?: Record<string, any>;
  successRedirectPath?: string;
  cancelRedirectPath?: string;
}

export interface PaymentSessionResponse {
  token: string;
  paymentUrl: string;
  expiresAt: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentSessionService {

  private readonly api = `${environment.apiUrl}/payment-sessions`;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  // ─── Créer une session via le backend ─────────────────────────────────────
  createSession(payload: CreatePaymentSessionPayload): Observable<{ data: PaymentSessionResponse }> {
    return this.http.post<{ data: PaymentSessionResponse }>(`${this.api}/create`, payload);
  }

  // ─── Générer un token local (sans backend) ────────────────────────────────
  // Le payload est encodé en base64 — lisible côté frontend sans clé secrète
  createLocalToken(payload: CreatePaymentSessionPayload): string {
    const exp = Math.floor(Date.now() / 1000) + 30 * 60; // 30 min
    const fullPayload = { ...payload, exp, iat: Math.floor(Date.now() / 1000) };
    const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const body = btoa(unescape(encodeURIComponent(JSON.stringify(fullPayload))))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    return `${header}.${body}.local`;
  }

  // ─── Créer session : backend d'abord, fallback local si indisponible ──────
  createSessionWithFallback(
    lang: string,
    payload: CreatePaymentSessionPayload
  ): Observable<{ data: PaymentSessionResponse }> {
    return new Observable(observer => {
      this.http.post<{ data: PaymentSessionResponse }>(`${this.api}/create`, payload).subscribe({
        next: (res) => {
          observer.next(res);
          observer.complete();
        },
        error: () => {
          // Backend pas encore prêt — générer le token localement
          const token = this.createLocalToken(payload);
          observer.next({
            data: {
              token,
              paymentUrl: `/${lang}/payment/${token}`,
              expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
            }
          });
          observer.complete();
        }
      });
    });
  }

  // ─── Créer et rediriger (avec fallback) ───────────────────────────────────
  createAndRedirect(lang: string, payload: CreatePaymentSessionPayload): void {
    this.createSessionWithFallback(lang, payload).subscribe({
      next: (res) => {
        this.router.navigate([`/${lang}/payment/${res.data.token}`]);
      }
    });
  }

  buildPaymentUrl(lang: string, token: string): string {
    return `/${lang}/payment/${token}`;
  }

  // ─── Helpers contextes ────────────────────────────────────────────────────

  createPremiumAccessSession(
    lang: string,
    userId: string,
    userEmail: string,
    ownerId: string,
    returnPath: string
  ): void {
    this.createAndRedirect(lang, {
      context: 'premium_access',
      amount: 500,
      amountEditable: false,
      currency: 'XAF',
      description: 'Accès Premium — Informations propriétaires (3 jours)',
      userId,
      userEmail,
      metadata: { ownerId, lang },
      successRedirectPath: `${returnPath}${returnPath.includes('?') ? '&' : '?'}premium=success`,
      cancelRedirectPath: returnPath
    });
  }

  createRentPaymentSession(
    lang: string,
    locationId: string,
    amount: number,
    description: string,
    returnPath: string
  ): void {
    this.createAndRedirect(lang, {
      context: 'rent',
      amount,
      amountEditable: true,
      currency: 'XAF',
      description,
      reference: locationId,
      metadata: { locationId, lang },
      successRedirectPath: returnPath,
      cancelRedirectPath: returnPath
    });
  }

  createSubscriptionSession(
    lang: string,
    periodId: string,
    amount: number,
    userId: string,
    returnPath: string
  ): void {
    this.createAndRedirect(lang, {
      context: 'subscription',
      amount,
      amountEditable: false,
      currency: 'XAF',
      description: 'Souscription Ndewa360°',
      reference: periodId,
      userId,
      metadata: { periodId, lang },
      successRedirectPath: `${returnPath}?payment=success`,
      cancelRedirectPath: returnPath
    });
  }
}
