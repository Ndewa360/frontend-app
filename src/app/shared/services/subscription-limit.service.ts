import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResultFormat } from '../store';
import {
  SubscriptionStatus,
  PropertyCreationCheck,
  MonthlyCalculation,
} from '../store/subscription-limit/subscription-limit.model';

@Injectable({ providedIn: 'root' })
export class SubscriptionLimitService {

  constructor(private http: HttpClient) {}

  canCreateProperty(): Observable<ApiResultFormat<PropertyCreationCheck>> {
    return this.http.get<ApiResultFormat<PropertyCreationCheck>>(
      `${environment.apiUrl}/subscription-limit/can-create-property`
    );
  }

  getSubscriptionStatus(): Observable<ApiResultFormat<SubscriptionStatus>> {
    return this.http.get<ApiResultFormat<SubscriptionStatus>>(
      `${environment.apiUrl}/subscription-limit/subscription-status`
    );
  }

  upgradeToPremium(): Observable<ApiResultFormat<any>> {
    return this.http.post<ApiResultFormat<any>>(
      `${environment.apiUrl}/subscription-limit/upgrade-to-premium`,
      {}
    );
  }

  reactivateAccount(): Observable<ApiResultFormat<any>> {
    return this.http.post<ApiResultFormat<any>>(
      `${environment.apiUrl}/subscription-limit/reactivate-account`,
      {}
    );
  }

  calculateMonthlyAmount(): Observable<ApiResultFormat<MonthlyCalculation>> {
    return this.http.get<ApiResultFormat<MonthlyCalculation>>(
      `${environment.apiUrl}/subscription-limit/calculate-monthly-amount`
    );
  }

  validatePropertyCreation(): Observable<ApiResultFormat<{ authorized: boolean }>> {
    return this.http.post<ApiResultFormat<{ authorized: boolean }>>(
      `${environment.apiUrl}/subscription-limit/validate-property-creation`,
      {}
    );
  }
}
