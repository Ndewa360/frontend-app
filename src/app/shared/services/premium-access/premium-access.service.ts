import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AccessCheckForOwner {
  hasAccess: boolean;
  access: any | null;
}

export interface OwnerInfo {
  access: {
    id: string;
    ownerId: string;
    expiryDate: string;
    remainingHours: number;
    remainingDays: number;
    accessCount: number;
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

  /**
   * Vérifie si userId a un accès actif pour UN propriétaire précis.
   * Route: GET /premium-access/check/:userId/:ownerId
   */
  checkAccessForOwner(userId: string, ownerId: string): Observable<{ data: AccessCheckForOwner }> {
    return this.http.get<{ data: AccessCheckForOwner }>(`${this.api}/check/${userId}/${ownerId}`);
  }

  /**
   * Vérifie si userId a AU MOINS UN accès actif (tous propriétaires).
   * Route: GET /premium-access/check/:userId
   */
  checkAnyActiveAccess(userId: string): Observable<{ data: { hasAccess: boolean; access: any; activeOwnerIds: string[] } }> {
    return this.http.get<{ data: { hasAccess: boolean; access: any; activeOwnerIds: string[] } }>(`${this.api}/check/${userId}`);
  }

  /**
   * Infos propriétaire pour utilisateur connecté (JWT requis).
   * Route: GET /premium-access/owner-info/:ownerId
   */
  getOwnerInfo(ownerId: string, propertyId?: string): Observable<{ data: OwnerInfo }> {
    const params = propertyId ? `?propertyId=${propertyId}` : '';
    return this.http.get<{ data: OwnerInfo }>(`${this.api}/owner-info/${ownerId}${params}`);
  }

  getPublicOwnerInfo(ownerId: string, visitorId: string, propertyId?: string): Observable<{ data: OwnerInfo }> {
    let url = `${this.api}/public-owner-info/${ownerId}?visitorId=${visitorId}`;
    if (propertyId) url += `&propertyId=${propertyId}`;
    return this.http.get<{ data: OwnerInfo }>(url);
  }

  /**
   * Historique des accès (JWT requis).
   * Route: GET /premium-access/history
   */
  getUserPremiumHistory(): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(`${this.api}/history`);
  }

  // ─── Utilitaires ─────────────────────────────────────────────────────────

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  calculateRemainingHours(expiryDate: string): number {
    const diff = new Date(expiryDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60)));
  }

  calculateRemainingDays(expiryDate: string): number {
    const diff = new Date(expiryDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  isAccessExpired(expiryDate: string): boolean {
    return new Date(expiryDate) <= new Date();
  }

  getPremiumAccessPrice(): number {
    return 1000;
  }
}
