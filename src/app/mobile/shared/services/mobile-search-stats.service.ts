import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface MobileSearchFilters {
  cityId?: string;
  cityName?: string;
  roomType?: string;
  priceMin?: number;
  priceMax?: number;
  hasKitchen?: boolean;
  hasParking?: boolean;
  hasPrivateShower?: boolean;
  furnished?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MobileSearchStatsService {

  constructor(private http: HttpClient) {}

  /**
   * Enregistrer une recherche mobile
   */
  recordMobileSearch(
    filters: MobileSearchFilters, 
    resultsCount: number,
    sessionId?: string,
    userId?: string
  ): Observable<any> {
    const headers = new HttpHeaders({
      'x-app-source': 'mobile',
      'x-session-id': sessionId || this.generateSessionId(),
      'x-user-id': userId || ''
    });

    const body = {
      filters,
      resultsCount
    };

    console.log('📱 Enregistrement statistiques mobile:', body);

    return this.http.post(
      `${environment.apiUrl}/search-stats/record`,
      body,
      { headers }
    );
  }

  /**
   * Obtenir les recherches populaires pour mobile
   */
  getPopularSearches(limit: number = 5): Observable<any> {
    const headers = new HttpHeaders({
      'x-app-source': 'mobile'
    });

    return this.http.get(
      `${environment.apiUrl}/search-stats/popular?limit=${limit}`,
      { headers }
    );
  }

  /**
   * Obtenir les recherches populaires par ville pour mobile
   */
  getPopularSearchesByCity(cityId: string, limit: number = 3): Observable<any> {
    const headers = new HttpHeaders({
      'x-app-source': 'mobile'
    });

    return this.http.get(
      `${environment.apiUrl}/search-stats/popular-by-city?cityId=${cityId}&limit=${limit}`,
      { headers }
    );
  }

  /**
   * Obtenir les villes les plus recherchées pour mobile
   */
  getTopSearchedCities(limit: number = 5): Observable<any> {
    const headers = new HttpHeaders({
      'x-app-source': 'mobile'
    });

    return this.http.get(
      `${environment.apiUrl}/search-stats/top-cities?limit=${limit}`,
      { headers }
    );
  }

  /**
   * Générer un ID de session unique
   */
  private generateSessionId(): string {
    return 'mobile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Convertir les filtres mobiles en format API
   */
  convertMobileFiltersToApi(mobileFilters: any, cityName?: string): MobileSearchFilters {
    return {
      cityId: mobileFilters.city,
      cityName: cityName || mobileFilters.cityName,
      roomType: mobileFilters.roomType,
      priceMin: mobileFilters.minPrice || mobileFilters.priceMin,
      priceMax: mobileFilters.maxPrice || mobileFilters.priceMax,
      hasKitchen: mobileFilters.hasKitchen,
      hasParking: mobileFilters.hasParking,
      hasPrivateShower: mobileFilters.hasPrivateShower || mobileFilters.isInternalShower,
      furnished: mobileFilters.furnished
    };
  }

  /**
   * Obtenir l'ID utilisateur depuis le stockage local
   */
  private getUserId(): string | null {
    try {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const user = JSON.parse(userData);
        return user.id || user._id || null;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'ID utilisateur:', error);
    }
    return null;
  }

  /**
   * Obtenir ou créer un ID de session persistant
   */
  private getOrCreateSessionId(): string {
    let sessionId = localStorage.getItem('mobile_session_id');
    if (!sessionId) {
      sessionId = this.generateSessionId();
      localStorage.setItem('mobile_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Enregistrer une recherche avec gestion automatique des IDs
   */
  recordSearchWithAutoIds(filters: MobileSearchFilters, resultsCount: number): void {
    const sessionId = this.getOrCreateSessionId();
    const userId = this.getUserId();

    this.recordMobileSearch(filters, resultsCount, sessionId, userId).subscribe({
      next: (response) => {
        console.log('✅ Statistiques mobiles enregistrées:', response);
      },
      error: (error) => {
        console.error('❌ Erreur lors de l\'enregistrement des statistiques mobiles:', error);
      }
    });
  }
}
