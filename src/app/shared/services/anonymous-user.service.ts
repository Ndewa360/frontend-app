import { Injectable } from '@angular/core';

const STORAGE_KEY = 'ndewa360_visitor_id';
const ACCESS_KEY = 'ndewa360_premium_access';

export interface LocalPremiumAccess {
  accessId: string;
  transactionId: string;
  ownerId: string;       // ID du propriétaire pour lequel l'accès a été payé
  expiryDate: string;
  phone: string;
  paymentMethod: string;
  paidAt: string;
}

@Injectable({ providedIn: 'root' })
export class AnonymousUserService {

  /**
   * Retourne l'ID visiteur persistant (crée si inexistant)
   */
  getVisitorId(): string {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      // Identifiant non devinable : il sert de preuve d'achat pour l'accès premium.
      const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID().replace(/-/g, '')
        : Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
      id = 'visitor_' + Date.now() + '_' + random;
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  }

  /**
   * Sauvegarde l'accès premium localement après paiement réussi
   */
  savePremiumAccess(access: LocalPremiumAccess): void {
    localStorage.setItem(ACCESS_KEY, JSON.stringify(access));
  }

  /**
   * Récupère l'accès premium local s'il est encore valide
   */
  getLocalPremiumAccess(): LocalPremiumAccess | null {
    try {
      const raw = localStorage.getItem(ACCESS_KEY);
      if (!raw) return null;

      const access: LocalPremiumAccess = JSON.parse(raw);
      const expiry = new Date(access.expiryDate);

      if (expiry <= new Date()) {
        // Expiré — nettoyer
        localStorage.removeItem(ACCESS_KEY);
        return null;
      }

      return access;
    } catch {
      return null;
    }
  }

  /**
   * Vérifie si l'accès local est encore actif
   */
  hasLocalActiveAccess(): boolean {
    return this.getLocalPremiumAccess() !== null;
  }

  /**
   * Calcule les jours restants depuis l'accès local
   */
  getRemainingDays(): number {
    const access = this.getLocalPremiumAccess();
    if (!access) return 0;
    const diff = new Date(access.expiryDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  /**
   * Supprime l'accès local (ex: après expiration)
   */
  clearLocalAccess(): void {
    localStorage.removeItem(ACCESS_KEY);
  }
}
