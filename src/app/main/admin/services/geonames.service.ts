import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AdminGeographyService } from './admin-geography.service';

// Interfaces pour Geonames
export interface GeonamesCity {
  geonameId: number;
  name: string;
  asciiName: string;
  lat: string;
  lng: string;
  countryCode: string;
  countryName: string;
  population: number;
  elevation?: number;
  timezone: {
    timeZoneId: string;
  };
  adminName1?: string; // État/Province
  adminName2?: string; // Région
  adminName3?: string; // Sous-région
  fcode: string; // Feature code (PPLC = capitale, PPL = ville, etc.)
}

export interface GeonamesResponse {
  totalResultsCount: number;
  geonames: GeonamesCity[];
}

export interface TransformedCity {
  geonameId: number;
  name: string;
  country: {
    code: string;
    name: string;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  population: number;
  elevation?: number;
  timezone: string;
  region?: string;
  isCapital: boolean;
  adminLevel1?: string;
  adminLevel2?: string;
  adminLevel3?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeonamesService {

  constructor(private adminGeographyService: AdminGeographyService) {}

  /**
   * Rechercher les villes d'un pays via notre backend
   */
  getCitiesByCountry(countryCode: string, maxRows: number = 50): Observable<TransformedCity[]> {
    return this.adminGeographyService.getCitiesFromGeonames(countryCode, maxRows).pipe(
      map(data => {
        if (data && Array.isArray(data)) {
          return this.transformCities(data);
        }
        return [];
      }),
      catchError(error => {
        console.error('Erreur lors de la récupération des villes depuis Geonames:', error);
        return throwError(() => new Error('Impossible de charger les villes depuis Geonames'));
      })
    );
  }

  /**
   * Rechercher les villes par nom via notre backend (recherche live, paginable)
   */
  searchCitiesByName(
    name: string,
    countryCode?: string,
    maxRows: number = 20,
    startRow: number = 0
  ): Observable<{ cities: TransformedCity[]; totalCount: number }> {
    return this.adminGeographyService.searchCitiesFromGeonames(name, countryCode, maxRows, startRow).pipe(
      map(response => ({
        cities: this.transformCities(response.cities),
        totalCount: response.totalCount
      })),
      catchError(error => {
        console.error('Erreur lors de la recherche de villes:', error);
        return throwError(() => new Error('Impossible de rechercher les villes'));
      })
    );
  }

  /**
   * Obtenir les détails d'une ville par son ID Geonames via notre backend
   */
  getCityDetails(geonameId: number): Observable<TransformedCity> {
    return this.adminGeographyService.getCityDetailsFromGeonames(geonameId).pipe(
      map(data => {
        if (data) {
          return this.transformCity(data);
        }
        throw new Error('Ville non trouvée');
      }),
      catchError(error => {
        console.error('Erreur lors de la récupération des détails de la ville:', error);
        return throwError(() => new Error('Impossible de charger les détails de la ville'));
      })
    );
  }

  /**
   * Transformer une liste de villes Geonames
   */
  private transformCities(cities: GeonamesCity[]): TransformedCity[] {
    return cities.map(city => this.transformCity(city));
  }

  /**
   * Transformer une ville Geonames au format application
   */
  private transformCity(city: GeonamesCity): TransformedCity {
    return {
      geonameId: city.geonameId,
      name: city.name,
      country: {
        code: city.countryCode,
        name: city.countryName
      },
      coordinates: {
        latitude: parseFloat(city.lat),
        longitude: parseFloat(city.lng)
      },
      population: city.population || 0,
      elevation: city.elevation,
      timezone: city.timezone?.timeZoneId || '',
      region: city.adminName1,
      isCapital: city.fcode === 'PPLC', // PPLC = capitale
      adminLevel1: city.adminName1,
      adminLevel2: city.adminName2,
      adminLevel3: city.adminName3
    };
  }

  /**
   * Transformer une ville pour le backend
   */
  transformCityForBackend(city: TransformedCity, countryId: string): any {
    return {
      name: city.name,
      countryId: countryId,
      coordinates: {
        latitude: city.coordinates.latitude,
        longitude: city.coordinates.longitude
      },
      timezone: city.timezone,
      isCapital: city.isCapital,
      population: city.population
    };
  }

  /**
   * Charger les villes d'un pays depuis GeoNames
   */
  loadCountryCities(countryId: string): Observable<any> {
    return this.adminGeographyService.loadCountryCities(countryId).pipe(
      catchError(error => {
        console.error('Erreur lors du chargement des villes du pays:', error);
        return throwError(() => new Error('Impossible de charger les villes du pays'));
      })
    );
  }

  /**
   * Activer/désactiver une ville
   */
  toggleCity(cityId: string, isActive: boolean): Observable<any> {
    return this.adminGeographyService.toggleCity(cityId, isActive).pipe(
      catchError(error => {
        console.error('Erreur lors de la modification du statut de la ville:', error);
        return throwError(() => new Error('Impossible de modifier le statut de la ville'));
      })
    );
  }

  /**
   * Créer une ville manuellement
   */
  createCity(cityData: any): Observable<any> {
    return this.adminGeographyService.createCityManually(cityData).pipe(
      catchError(error => {
        console.error('Erreur lors de la création de la ville:', error);
        return throwError(() => new Error('Impossible de créer la ville'));
      })
    );
  }

  /**
   * Test de connectivité avec le backend
   */
  testConnection(): Observable<boolean> {
    return this.adminGeographyService.getCitiesFromGeonames('FR', 1).pipe(
      map(() => {
        console.log('✅ Connexion GeoNames via AdminGeographyService réussie');
        return true;
      }),
      catchError(error => {
        console.error('❌ Erreur de connexion GeoNames:', error);
        return throwError(() => new Error('Test de connexion échoué'));
      })
    );
  }
}
