import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface PremiumAccessRequest {
  userId: string;
  userEmail: string;
  amount: number;
  successUrl: string;
  cancelUrl: string;
  metadata?: any;
}

export interface PremiumAccessResponse {
  sessionId: string;
  sessionUrl: string;
  accessId: string;
}

export interface OwnerInfo {
  access: {
    id: string;
    expiryDate: string;
    remainingDays: number;
    accessCount: number;
    accessedOwnersCount: number;
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

export interface AccessCheck {
  hasAccess: boolean;
  access: any | null;
}

@Injectable({
  providedIn: 'root'
})
export class PremiumAccessService {
  private apiUrl = `${environment.apiUrl}/premium-access`;

  constructor(private http: HttpClient) {}

  // Créer une session de paiement pour l'accès premium
  createPremiumAccessSession(data: PremiumAccessRequest): Observable<{ data: PremiumAccessResponse }> {
    return this.http.post<{ data: PremiumAccessResponse }>(`${this.apiUrl}/create-session`, data);
  }

  // Confirmer le paiement
  confirmPremiumAccess(sessionId: string, paymentIntentId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/confirm`, {
      sessionId,
      paymentIntentId
    });
  }

  // Vérifier si l'utilisateur a un accès actif
  checkActiveAccess(userId: string): Observable<{ data: AccessCheck }> {
    return this.http.get<{ data: AccessCheck }>(`${this.apiUrl}/check/${userId}`);
  }

  // Obtenir les informations du propriétaire
  getOwnerInfo(userId: string, ownerId: string): Observable<{ data: OwnerInfo }> {
    return this.http.get<{ data: OwnerInfo }>(`${this.apiUrl}/owner-info/${userId}/${ownerId}`);
  }

  // Obtenir l'historique des accès premium
  getUserPremiumHistory(userId: string): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(`${this.apiUrl}/history/${userId}`);
  }

  // Obtenir les statistiques des accès premium
  getPremiumStats(): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(`${this.apiUrl}/stats`);
  }

  // Formater le montant
  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount);
  }

  // Calculer les jours restants
  calculateRemainingDays(expiryDate: string): number {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  // Vérifier si l'accès est expiré
  isAccessExpired(expiryDate: string): boolean {
    return new Date(expiryDate) <= new Date();
  }

  // Obtenir le prix de l'accès premium (configurable)
  getPremiumAccessPrice(): number {
    return 500; // 500 FCFA pour 3 jours d'accès global
  }
}
