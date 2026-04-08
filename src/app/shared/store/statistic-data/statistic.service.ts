import { Injectable } from "@angular/core";
import { environment } from 'src/environments/environment';
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { catchError } from "rxjs/operators";
import { ApiResultFormat } from "../global";
import {
  StatisticAllPaymentLocataireYearModel,
  StatisticLocataireYearModel,
  StatisticPaymentOfAllPropertyByYear,
  EnrichedStatisticResponse
} from "./statistic.model";

@Injectable({
  providedIn: 'root'
})
export class StatisticService {

  constructor(private _httpClient: HttpClient) {}

  /**
   * Statistiques enrichies par propriété et année
   * Retourne rooms, propertyMetrics, revenueDistribution, tenantsAnalysis, cautionsAnalysis
   */
  getStatisticPropertyDataByYear(
    propertyID: string,
    year: string | number
  ): Observable<ApiResultFormat<EnrichedStatisticResponse>> {
    const url = `${environment.apiUrl}/statistic-location-payment/statistic-payement-by-property/${propertyID}/${year}/`;
    return this._httpClient.get<ApiResultFormat<EnrichedStatisticResponse>>(url).pipe(
      catchError(error => {
        console.error('❌ API Error getStatisticPropertyDataByYear:', {
          status: error.status,
          url,
          error: error.error
        });
        throw error;
      })
    );
  }

  /**
   * Statistiques de paiement par locataire (heatmap)
   */
  getStatisticLocataireDataByYear(
    propertyID: string,
    year: string | number
  ): Observable<ApiResultFormat<StatisticLocataireYearModel[]>> {
    return this._httpClient.get<ApiResultFormat<StatisticLocataireYearModel[]>>(
      `${environment.apiUrl}/statistic-location-payment/statistic-payement-by-locataire/${propertyID}/${year}/`
    );
  }

  /**
   * Détail des paiements par locataire (état mensuel)
   */
  getAllPaymentLocataireStatisticDataByYear(
    propertyID: string,
    year: string | number
  ): Observable<ApiResultFormat<StatisticAllPaymentLocataireYearModel[]>> {
    return this._httpClient.get<ApiResultFormat<StatisticAllPaymentLocataireYearModel[]>>(
      `${environment.apiUrl}/statistic-location-payment/statistic-payement-all-inyear/${propertyID}/${year}/`
    );
  }

  /**
   * Récapitulatif annuel de toutes les propriétés
   */
  getPaymentRecapitulationAccountOfAllPropertyByYear(
    year: string | number
  ): Observable<ApiResultFormat<StatisticPaymentOfAllPropertyByYear>> {
    return this._httpClient.get<ApiResultFormat<StatisticPaymentOfAllPropertyByYear>>(
      `${environment.apiUrl}/statistic-location-payment/statistic-payement-recapitulation-inyear/${year}/`
    );
  }
}
