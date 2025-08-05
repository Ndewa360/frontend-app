import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface RestCountry {
  name: {
    common: string;
    official: string;
  };
  cca2: string;
  cca3: string;
  region: string;
  subregion?: string;
  capital?: string[];
  currencies?: {
    [key: string]: {
      name: string;
      symbol: string;
    };
  };
  languages?: {
    [key: string]: string;
  };
  latlng?: number[];
  area?: number;
  population?: number;
  timezones?: string[];
  flag?: string;
  flags?: {
    png: string;
    svg: string;
  };
  continents?: string[];
}

export interface Region {
  name: string;
  label: string;
  icon: string;
  color: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class RestCountriesService {
  private readonly baseUrl = 'https://restcountries.com/v3.1';

  constructor(private http: HttpClient) {}

  /**
   * Obtenir les régions disponibles
   */
  getAvailableRegions(): Region[] {
    return [
      {
        name: 'Africa',
        label: 'Afrique',
        icon: 'fas fa-globe-africa',
        color: '#10b981',
        description: 'Pays du continent africain'
      },
      {
        name: 'Americas',
        label: 'Amériques',
        icon: 'fas fa-globe-americas',
        color: '#3b82f6',
        description: 'Pays d\'Amérique du Nord et du Sud'
      },
      {
        name: 'Asia',
        label: 'Asie',
        icon: 'fas fa-globe-asia',
        color: '#f59e0b',
        description: 'Pays du continent asiatique'
      },
      {
        name: 'Europe',
        label: 'Europe',
        icon: 'fas fa-globe-europe',
        color: '#8b5cf6',
        description: 'Pays du continent européen'
      },
      {
        name: 'Oceania',
        label: 'Océanie',
        icon: 'fas fa-globe',
        color: '#06b6d4',
        description: 'Pays d\'Océanie et du Pacifique'
      }
    ];
  }

  /**
   * Obtenir les pays d'une région
   */
  getCountriesByRegion(region: string): Observable<RestCountry[]> {
    return this.http.get<RestCountry[]>(`${this.baseUrl}/region/${region}`).pipe(
      map(countries => countries.sort((a, b) => a.name.common.localeCompare(b.name.common)))
    );
  }

  /**
   * Rechercher des pays par nom
   */
  searchCountries(query: string): Observable<RestCountry[]> {
    if (!query || query.length < 2) {
      return new Observable(observer => observer.next([]));
    }
    
    return this.http.get<RestCountry[]>(`${this.baseUrl}/name/${query}`).pipe(
      map(countries => countries.sort((a, b) => a.name.common.localeCompare(b.name.common)))
    );
  }

  /**
   * Obtenir un pays par code
   */
  getCountryByCode(code: string): Observable<RestCountry> {
    return this.http.get<RestCountry[]>(`${this.baseUrl}/alpha/${code}`).pipe(
      map(countries => countries[0])
    );
  }

  /**
   * Transformer un pays RestCountries en format application (pour le backend admin)
   */
  transformCountryForApp(restCountry: RestCountry): any {
    const primaryCurrency = restCountry.currencies ? Object.keys(restCountry.currencies)[0] : '';

    return {
      name: restCountry.name.common,
      code: restCountry.cca2,
      iso2: restCountry.cca2,
      iso3: restCountry.cca3,
      continent: restCountry.continents?.[0] || restCountry.region,
      region: restCountry.region,
      subregion: restCountry.subregion || '',
      capital: restCountry.capital?.[0] || '',
      currency: primaryCurrency,
      languages: restCountry.languages ? Object.values(restCountry.languages) : [],
      timezone: restCountry.timezones?.[0] || '',
      flag: restCountry.flag || '🏳️', // Utiliser l'emoji du drapeau
      phoneCode: '', // À compléter si nécessaire avec une autre API
      population: restCountry.population || 0,
      area: restCountry.area || 0,
      coordinates: restCountry.latlng ? {
        latitude: restCountry.latlng[0],
        longitude: restCountry.latlng[1]
      } : undefined,
      isActive: true
    };
  }
}
