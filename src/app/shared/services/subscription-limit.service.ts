import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResultFormat } from '../store';

export interface SubscriptionStatus {
  plan: 'free' | 'premium';
  accountStatus: 'active' | 'suspended' | 'disabled';
  propertyCount: number;
  propertyLimit: number;
  monthlyAmount: number;
  lastCalculationDate?: Date;
  suspensionDate?: Date;
  needsUpgrade: boolean;
}

export interface PropertyCreationCheck {
  canCreate: boolean;
  needsUpgrade: boolean;
}

export interface MonthlyCalculation {
  amount: number;
  month: string;
  calculationDate: Date;
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionLimitService {

  constructor(private http: HttpClient) { }

  /**
   * Vérifie si l'utilisateur peut créer une nouvelle propriété
   */
  canCreateProperty(): Observable<ApiResultFormat<PropertyCreationCheck>> {
    return this.http.get<ApiResultFormat<PropertyCreationCheck>>(
      `${environment.apiUrl}/subscription-limit/can-create-property`
    );
  }

  /**
   * Récupère le statut de souscription de l'utilisateur
   */
  getSubscriptionStatus(): Observable<ApiResultFormat<SubscriptionStatus>> {
    return this.http.get<ApiResultFormat<SubscriptionStatus>>(
      `${environment.apiUrl}/subscription-limit/subscription-status`
    );
  }

  /**
   * Upgrade vers le forfait premium
   */
  upgradeToPremium(): Observable<ApiResultFormat<any>> {
    return this.http.post<ApiResultFormat<any>>(
      `${environment.apiUrl}/subscription-limit/upgrade-to-premium`,
      {}
    );
  }

  /**
   * Réactive le compte après paiement
   */
  reactivateAccount(): Observable<ApiResultFormat<any>> {
    return this.http.post<ApiResultFormat<any>>(
      `${environment.apiUrl}/subscription-limit/reactivate-account`,
      {}
    );
  }

  /**
   * Calcule le montant mensuel
   */
  calculateMonthlyAmount(): Observable<ApiResultFormat<MonthlyCalculation>> {
    return this.http.get<ApiResultFormat<MonthlyCalculation>>(
      `${environment.apiUrl}/subscription-limit/calculate-monthly-amount`
    );
  }

  /**
   * Valide la création d'une propriété (avec gestion d'erreurs)
   */
  validatePropertyCreation(): Observable<ApiResultFormat<{ authorized: boolean }>> {
    return this.http.post<ApiResultFormat<{ authorized: boolean }>>(
      `${environment.apiUrl}/subscription-limit/validate-property-creation`,
      {}
    );
  }
}
