import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

// Models
import { 
  AdminCountry, 
  AdminCity, 
  AdminCurrency, 
  GeographyStats,
  GeographyFilters,
  CreateCountryDto, 
  UpdateCountryDto,
  CreateCityDto,
  UpdateCityDto
} from '../store/geography/admin-geography.model';

// Shared Models
import { ApiResultFormat } from '../../../shared/store/global/api-result-format.model';

@Injectable({
  providedIn: 'root'
})
export class AdminGeographyService {
  private readonly apiUrl = `${environment.apiUrl}/admin/geography`;

  constructor(private http: HttpClient) {}

  /**
   * Obtenir les statistiques géographiques
   */
  getGeographyStats(): Observable<GeographyStats> {
    return this.http.get<ApiResultFormat<GeographyStats>>(`${this.apiUrl}/stats`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir la liste des pays avec filtres
   */
  getCountries(filters: GeographyFilters = {}): Observable<{ countries: AdminCountry[], total: number }> {
    let params = new HttpParams();
    
    // Ajouter les filtres aux paramètres
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<any>(`${this.apiUrl}/countries`, { params }).pipe(
      map(response => {
        console.log('🔧 Service countries - Réponse brute:', response);

        // Le backend renvoie { statusCode, message, data: [...], meta: { total, page, ... } }
        if (response && response.data && Array.isArray(response.data)) {
          const result = {
            countries: response.data,
            total: response.meta?.total || response.data.length
          };
          console.log('🔧 Service countries - Résultat transformé:', result);
          return result;
        }

        // Fallback si structure différente
        console.log('🔧 Service countries - Structure inattendue, fallback');
        return { countries: [], total: 0 };
      })
    );
  }

  /**
   * Obtenir un pays par ID
   */
  getCountryById(countryId: string): Observable<AdminCountry> {
    return this.http.get<ApiResultFormat<AdminCountry>>(`${this.apiUrl}/countries/${countryId}`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Créer un nouveau pays
   */
  createCountry(countryData: CreateCountryDto): Observable<AdminCountry> {
    return this.http.post<ApiResultFormat<AdminCountry>>(`${this.apiUrl}/countries`, countryData).pipe(
      map(response => response.data)
    );
  }

  /**
   * Mettre à jour un pays
   */
  updateCountry(countryId: string, countryData: UpdateCountryDto): Observable<AdminCountry> {
    return this.http.put<ApiResultFormat<AdminCountry>>(`${this.apiUrl}/countries/${countryId}`, countryData).pipe(
      map(response => response.data)
    );
  }

  /**
   * Supprimer un pays
   */
  deleteCountry(countryId: string): Observable<void> {
    return this.http.delete<ApiResultFormat<void>>(`${this.apiUrl}/countries/${countryId}`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir la liste des villes avec filtres
   */
  getCities(filters: GeographyFilters = {}): Observable<{ cities: AdminCity[], total: number }> {
    let params = new HttpParams();
    
    // Ajouter les filtres aux paramètres
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<any>(`${this.apiUrl}/cities`, { params }).pipe(
      map(response => {
        console.log('🔧 Service cities - Réponse brute:', response);

        // Le backend renvoie { statusCode, message, data: [...], meta: { total, page, ... } }
        if (response && response.data && Array.isArray(response.data)) {
          const result = {
            cities: response.data,
            total: response.meta?.total || response.data.length
          };
          console.log('🔧 Service cities - Résultat transformé:', result);
          return result;
        }

        // Fallback si structure différente
        console.log('🔧 Service cities - Structure inattendue, fallback');
        return { cities: [], total: 0 };
      })
    );
  }

  /**
   * Obtenir une ville par ID
   */
  getCityById(cityId: string): Observable<AdminCity> {
    return this.http.get<ApiResultFormat<AdminCity>>(`${this.apiUrl}/cities/${cityId}`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Créer une nouvelle ville
   */
  createCity(cityData: CreateCityDto): Observable<AdminCity> {
    return this.http.post<ApiResultFormat<AdminCity>>(`${this.apiUrl}/cities`, cityData).pipe(
      map(response => response.data)
    );
  }

  /**
   * Mettre à jour une ville
   */
  updateCity(cityId: string, cityData: UpdateCityDto): Observable<AdminCity> {
    return this.http.put<ApiResultFormat<AdminCity>>(`${this.apiUrl}/cities/${cityId}`, cityData).pipe(
      map(response => response.data)
    );
  }

  /**
   * Supprimer une ville
   */
  deleteCity(cityId: string): Observable<void> {
    return this.http.delete<ApiResultFormat<void>>(`${this.apiUrl}/cities/${cityId}`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir toutes les devises
   */
  getCurrencies(): Observable<AdminCurrency[]> {
    return this.http.get<ApiResultFormat<AdminCurrency[]>>(`${this.apiUrl}/currencies`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Obtenir une devise par ID
   */
  getCurrencyById(currencyId: string): Observable<AdminCurrency> {
    return this.http.get<ApiResultFormat<AdminCurrency>>(`${this.apiUrl}/currencies/${currencyId}`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Créer une nouvelle devise
   */
  createCurrency(currencyData: any): Observable<AdminCurrency> {
    return this.http.post<ApiResultFormat<AdminCurrency>>(`${this.apiUrl}/currencies`, currencyData).pipe(
      map(response => response.data)
    );
  }

  /**
   * Mettre à jour une devise
   */
  updateCurrency(currencyId: string, currencyData: any): Observable<AdminCurrency> {
    return this.http.put<ApiResultFormat<AdminCurrency>>(`${this.apiUrl}/currencies/${currencyId}`, currencyData).pipe(
      map(response => response.data)
    );
  }

  /**
   * Supprimer une devise
   */
  deleteCurrency(currencyId: string): Observable<void> {
    return this.http.delete<ApiResultFormat<void>>(`${this.apiUrl}/currencies/${currencyId}`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Définir la devise par défaut
   */
  setDefaultCurrency(currencyId: string): Observable<AdminCurrency> {
    return this.http.patch<ApiResultFormat<AdminCurrency>>(`${this.apiUrl}/currencies/${currencyId}/set-default`, {}).pipe(
      map(response => response.data)
    );
  }

  /**
   * Mettre à jour les taux de change
   */
  updateExchangeRates(): Observable<{ updated: number }> {
    return this.http.post<ApiResultFormat<{ updated: number }>>(`${this.apiUrl}/currencies/update-rates`, {}).pipe(
      map(response => response.data)
    );
  }

  /**
   * Importer des pays depuis une API externe
   */
  importCountries(source: string = 'restcountries'): Observable<{ imported: number }> {
    const params = new HttpParams().set('source', source);
    return this.http.post<ApiResultFormat<{ imported: number }>>(`${this.apiUrl}/countries/import`, {}, { params }).pipe(
      map(response => response.data)
    );
  }

  /**
   * Importer des villes depuis un fichier
   */
  importCities(file: File, countryId?: string): Observable<{ imported: number, errors: any[] }> {
    const formData = new FormData();
    formData.append('file', file);
    if (countryId) {
      formData.append('countryId', countryId);
    }

    return this.http.post<ApiResultFormat<{ imported: number, errors: any[] }>>(`${this.apiUrl}/cities/import`, formData).pipe(
      map(response => response.data)
    );
  }

  /**
   * Exporter les données géographiques
   */
  exportGeographyData(type: 'countries' | 'cities' | 'currencies', format: string = 'xlsx'): Observable<{ downloadUrl: string }> {
    const params = new HttpParams()
      .set('type', type)
      .set('format', format);
    
    return this.http.post<ApiResultFormat<{ downloadUrl: string }>>(`${this.apiUrl}/export`, {}, { params }).pipe(
      map(response => response.data)
    );
  }
}
