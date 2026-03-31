import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface PremiumAccessRequest {
  userId: string;
  userEmail: string;
  amount: number;
  paymentMethod: 'orange_money' | 'mtn_money';
  phone?: string;
  metadata?: any;
}

export interface PremiumAccessInitResponse {
  accessId: string;
  transactionId: string;
  status: 'pending' | 'success' | 'failed';
  message: string;
  ussdCode?: string;
  expiresAt?: string;
}

export interface PremiumAccessStatusResponse {
  transactionId: string;
  accessId: string;
  status: 'pending' | 'success' | 'failed';
  completedAt?: string;
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

  // Initier un paiement Mobile Money pour l'accès premium
  initiatePremiumPayment(data: PremiumAccessRequest): Observable<{ data: PremiumAccessInitResponse }> {
    return this.http.post<{ data: PremiumAccessInitResponse }>(`${this.apiUrl}/initiate-payment`, data);
  }

  // Vérifier le statut d'un paiement en cours
  checkPaymentStatus(transactionId: string): Observable<{ data: PremiumAccessStatusResponse }> {
    return this.http.get<{ data: PremiumAccessStatusResponse }>(`${this.apiUrl}/payment-status/${transactionId}`);
  }

  // Confirmer l'accès après paiement réussi
  confirmPremiumAccess(accessId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/confirm`, { accessId });
  }

  // Vérifier si l'utilisateur (connecté ou visiteur) a un accès actif
  checkActiveAccess(userId: string): Observable<{ data: AccessCheck }> {
    return this.http.get<{ data: AccessCheck }>(`${this.apiUrl}/check/${userId}`);
  }

  // Obtenir les informations du propriétaire (nécessite un accès actif)
  // userId peut être un vrai userId ou un visitorId
  getOwnerInfo(userId: string, ownerId: string): Observable<{ data: OwnerInfo }> {
    return this.http.get<{ data: OwnerInfo }>(`${this.apiUrl}/owner-info/${userId}/${ownerId}`);
  }

  // Obtenir l'historique des accès premium
  getUserPremiumHistory(userId: string): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(`${this.apiUrl}/history/${userId}`);
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

  // Prix de l'accès premium
  getPremiumAccessPrice(): number {
    return 500; // 500 FCFA pour 3 jours d'accès global
  }
}
