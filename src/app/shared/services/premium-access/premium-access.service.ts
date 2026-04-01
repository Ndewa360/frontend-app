import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AccessCheck {
  hasAccess: boolean;
  access: any | null;
}

export interface OwnerInfo {
  access: {
    id: string;
    expiryDate: string;
    remainingDays: number;
    accessCount: number;
    accessedOwnersCount: number;
    paymentTransactionRef?: string;
  };
  owner: {
    id: string;
    name: string;
    email: string;
    phone: string;
    whatsapp: string;
    address: string;
  };
}

@Injectable({ providedIn: 'root' })
export class PremiumAccessService {

  private readonly api = `${environment.apiUrl}/premium-access`;

  constructor(private http: HttpClient) {}

  // ─── Vérifier si un utilisateur (connecté ou anonyme) a un accès actif ───
  // Route backend: GET /premium-access/check/:userId (publique)
  checkActiveAccess(userId: string): Observable<{ data: AccessCheck }> {
    return this.http.get<{ data: AccessCheck }>(`${this.api}/check/${userId}`);
  }

  // ─── Infos propriétaire pour utilisateur connecté (JWT requis) ───────────
  // Route backend: GET /premium-access/owner-info/:ownerId
  getOwnerInfo(ownerId: string): Observable<{ data: OwnerInfo }> {
    return this.http.get<{ data: OwnerInfo }>(`${this.api}/owner-info/${ownerId}`);
  }

  // ─── Infos propriétaire pour visiteur anonyme (pas de JWT) ───────────────
  // Route backend: GET /premium-access/public-owner-info/:ownerId?visitorId=
  getPublicOwnerInfo(ownerId: string, visitorId: string): Observable<{ data: OwnerInfo }> {
    return this.http.get<{ data: OwnerInfo }>(
      `${this.api}/public-owner-info/${ownerId}?visitorId=${visitorId}`
    );
  }

  // ─── Historique des accès (JWT requis) ───────────────────────────────────
  // Route backend: GET /premium-access/history
  getUserPremiumHistory(): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(`${this.api}/history`);
  }

  // ─── Accès + transaction liée (JWT requis) ───────────────────────────────
  // Route backend: GET /premium-access/transaction
  getAccessWithTransaction(): Observable<{ data: any }> {
    return this.http.get<{ data: any }>(`${this.api}/transaction`);
  }

  // ─── Utilitaires ─────────────────────────────────────────────────────────

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  calculateRemainingDays(expiryDate: string): number {
    const diff = new Date(expiryDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  isAccessExpired(expiryDate: string): boolean {
    return new Date(expiryDate) <= new Date();
  }

  getPremiumAccessPrice(): number {
    return 500;
  }
}
