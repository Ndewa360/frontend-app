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
  private readonly DEFAULT_CITY = 'Bangangté';
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
        console.error('Erreur de géolocalisation:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtient les informations de localisation à partir des coordonnées
   */
  getLocationInfo(latitude: number, longitude: number): Observable<LocationInfo> {
    // Utilisation de l'API de géocodage inverse gratuite
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=fr`;
    
    return this.http.get<any>(url).pipe(
      map((response) => ({
        city: response.city || response.locality || response.principalSubdivision || this.DEFAULT_CITY,
        country: response.countryName || this.DEFAULT_COUNTRY,
        region: response.principalSubdivision || '',
        latitude,
        longitude
      })),
      catchError((error) => {
        console.error('Erreur de géocodage inverse:', error);
        // Fallback vers Bangangté
        return of({
          city: this.DEFAULT_CITY,
          country: this.DEFAULT_COUNTRY,
          region: 'Ouest',
          latitude,
          longitude
        });
      })
    );
  }

  /**
   * Obtient la localisation complète de l'utilisateur avec fallback
   */
  getUserLocation(): Observable<LocationInfo> {
    return this.getCurrentPosition().pipe(
      switchMap((position) => 
        this.getLocationInfo(position.latitude, position.longitude)
      ),
      catchError((error) => {
        console.warn('Impossible de détecter la position, utilisation de Bangangté par défaut:', error);
        // Fallback vers Bangangté (coordonnées approximatives)
        return of({
          city: this.DEFAULT_CITY,
          country: this.DEFAULT_COUNTRY,
          region: 'Ouest',
          latitude: 5.1439,
          longitude: 10.4897
        });
      })
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

  /**
   * Obtient la ville par défaut (Bangangté)
   */
  getDefaultLocation(): LocationInfo {
    return {
      city: this.DEFAULT_CITY,
      country: this.DEFAULT_COUNTRY,
      region: 'Ouest',
      latitude: 5.1439,
      longitude: 10.4897
    };
  }
}
