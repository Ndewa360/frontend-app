import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Store } from "@ngxs/store";

/**
 * @deprecated Ce service est obsolète.
 * Tous les calculs de mois dus sont centralisés dans le backend
 * via FinancialCalculationEngine.calculateMonthsDueInYear().
 * Les données sont exposées via StatisticState.selectStateStatisticPropertyIdAndYear().
 */
@Injectable({
  providedIn: 'root'
})
export class CalculateLocationService {

  constructor(
    private _httpClient: HttpClient,
    private _store: Store
  ) {}

  /**
   * @deprecated Utiliser les données de StatisticState (revenueDistribution) à la place.
   */
  initCalculateLocation(locataireInfos: { locataire?: any; room?: any; entryDate?: Date }) {
    return [];
  }
}
