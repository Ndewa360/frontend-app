import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
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

  // ─── Créer une session via le backend (POST /payment-sessions/create) ─────
  createSession(payload: CreatePaymentSessionPayload): Observable<{ data: PaymentSessionResponse }> {
    return this.http.post<{ data: PaymentSessionResponse }>(`${this.api}/create`, payload);
  }

  // ─── Créer une session publique (POST /payment-sessions/create-public) ────
  // Pour les visiteurs anonymes (PREMIUM_ACCESS) — pas de JWT requis.
  // Le visitorId doit être passé dans metadata.visitorId (et userId).
  createSessionPublic(payload: CreatePaymentSessionPayload): Observable<{ data: PaymentSessionResponse }> {
    return this.http.post<{ data: PaymentSessionResponse }>(`${this.api}/create-public`, payload);
  }

  // ─── Créer session avec gestion d'erreur explicite (sans fallback non sécurisé) ────────────
  // Le fallback token non signé a été supprimé : un token généré côté client
  // sans signature permettrait de forger un paiement avec un montant arbitraire.
  // Si le backend est indisponible, on propage l'erreur pour que l'UI l'affiche.
  createSessionWithFallback(
    lang: string,
    payload: CreatePaymentSessionPayload
  ): Observable<{ data: PaymentSessionResponse }> {
    return this.http.post<{ data: PaymentSessionResponse }>(`${this.api}/create`, payload);
  }

  // ─── Créer et rediriger ───────────────────────────────────────────────────
  createAndRedirect(lang: string, payload: CreatePaymentSessionPayload): void {
    this.createSessionWithFallback(lang, payload).subscribe({
      next: (res) => {
        this.router.navigate([`/${lang}/payment/${res.data.token}`]);
      },
      error: (err) => {
        const message = err?.error?.message?.[0] || err?.message || 'Erreur lors de la création de la session de paiement';
        this.router.navigate([`/${lang}/error/payment-error`], {
          queryParams: { message }
        });
      }
    });
  }

  buildPaymentUrl(lang: string, token: string): string {
    return `/${lang}/payment/${token}`;
  }

  // ─── Helpers contextes (contextes alignés sur le backend) ─────────────────

  createPremiumAccessSession(
    lang: string,
    userId: string,
    userEmail: string,
    ownerId: string,
    returnPath: string
  ): void {
    this.createAndRedirect(lang, {
      context: 'PREMIUM_ACCESS',
      amount: 1000,
      amountEditable: false,
      currency: 'XAF',
      description: 'Accès Premium — Informations propriétaires (24 heures)',
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
      context: 'RENT',
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

  createWalletDepositSession(
    lang: string,
    userId: string,
    userEmail: string,
    amount: number,
    returnPath: string
  ): void {
    this.createAndRedirect(lang, {
      context: 'WALLET_DEPOSIT',
      amount,
      amountEditable: false,
      currency: 'XAF',
      description: `Dépôt wallet Ndewa360° — ${amount.toLocaleString('fr-FR')} FCFA`,
      userId,
      userEmail,
      metadata: { lang },
      successRedirectPath: `${returnPath}?deposit=success`,
      cancelRedirectPath: returnPath,
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
      context: 'SUBSCRIPTION',
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
