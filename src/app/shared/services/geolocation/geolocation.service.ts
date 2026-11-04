import { Injectable } from '@angular/core';
import { Observable, from, of, throwError } from 'rxjs';
import { map, catchError, timeout, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

export interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface LocationInfo {
  city: string;
  country: string;
  region: string;
  latitude: number;
  longitude: number;
}

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  private readonly DEFAULT_COUNTRY = 'Cameroun';
  private readonly GEOLOCATION_TIMEOUT = 10000; // 10 secondes
  
  constructor(private http: HttpClient) {}

  /**
   * Obtient la position actuelle de l'utilisateur
   */
  getCurrentPosition(): Observable<GeolocationPosition> {
    if (!navigator.geolocation) {
      return throwError(() => new Error('Géolocalisation non supportée'));
    }

    return from(
      new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            });
          },
          (error) => {
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: this.GEOLOCATION_TIMEOUT,
            maximumAge: 300000 // 5 minutes
          }
        );
      })
    ).pipe(
      timeout(this.GEOLOCATION_TIMEOUT),
      catchError((error) => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Ville correspondant aux coordonnées (service BigDataCloud), ou null.
   * Les coordonnées sont arrondies à 0,01° (environ 1 km) : la position précise
   * de l'utilisateur n'est pas transmise au service tiers.
   */
  getLocationInfo(latitude: number, longitude: number): Observable<LocationInfo | null> {
    const lat = Math.round(latitude * 100) / 100;
    const lng = Math.round(longitude * 100) / 100;
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=fr`;

    return this.http.get<any>(url).pipe(
      map((response) => {
        const city = response?.city || response?.locality || '';
        return city
          ? { city, country: response.countryName || this.DEFAULT_COUNTRY, region: response.principalSubdivision || '', latitude: lat, longitude: lng }
          : null;
      }),
      catchError(() => of(null))
    );
  }

  /**
   * Ville de l'utilisateur, ou null si la position est refusée ou introuvable
   * (la recherche porte alors sur toutes les villes, au lieu d'une ville
   * imposée présentée comme « détectée »).
   */
  getUserLocation(): Observable<LocationInfo | null> {
    return this.getCurrentPosition().pipe(
      switchMap((position) => this.getLocationInfo(position.latitude, position.longitude)),
      catchError(() => of(null))
    );
  }

  /**
   * Demande la permission de géolocalisation
   */
  requestLocationPermission(): Observable<boolean> {
    if (!navigator.geolocation) {
      return of(false);
    }

    return from(
      navigator.permissions.query({ name: 'geolocation' })
    ).pipe(
      map((result) => result.state === 'granted'),
      catchError(() => of(false))
    );
  }

  /**
   * Vérifie si la géolocalisation est disponible
   */
  isGeolocationAvailable(): boolean {
    return 'geolocation' in navigator;
  }
}
