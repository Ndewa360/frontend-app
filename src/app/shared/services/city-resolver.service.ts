import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { Observable, of } from 'rxjs';
import { map, take, filter } from 'rxjs/operators';
import { CityState, CityModel } from '../store';

@Injectable({
  providedIn: 'root'
})
export class CityResolverService {

  constructor(private store: Store) {}

  /**
   * Convertir un nom de ville en ID
   */
  getCityIdByName(cityName: string): Observable<string | null> {
    if (!cityName || cityName.trim() === '') {
      return of(null);
    }

    // Si c'est déjà un ID, le retourner directement
    if (this.isObjectId(cityName)) {
      console.log(`🏙️ "${cityName}" est déjà un ID`);
      return of(cityName);
    }

    return this.store.select(CityState.selectStateCities).pipe(
      filter(cities => cities && cities.length > 0),
      take(1),
      map((cities: CityModel[]) => {
        console.log(`🏙️ Recherche de la ville "${cityName}" dans ${cities.length} villes`);

        const normalizedSearchName = this.normalizeCityName(cityName);

        // Recherche exacte d'abord
        let foundCity = cities.find(city =>
          this.normalizeCityName(city.fullName) === normalizedSearchName
        );

        // Si pas trouvé, recherche partielle
        if (!foundCity) {
          foundCity = cities.find(city =>
            this.normalizeCityName(city.fullName).includes(normalizedSearchName) ||
            normalizedSearchName.includes(this.normalizeCityName(city.fullName))
          );
        }

        const result = foundCity ? foundCity._id : null;
        console.log(`🏙️ Conversion nom -> ID: "${cityName}" -> "${result}"`);

        if (!result) {
          console.log('🏙️ Villes disponibles:', cities.map(c => c.fullName));
        }

        return result;
      })
    );
  }

  /**
   * Convertir un ID de ville en nom
   */
  getCityNameById(cityId: string): Observable<string | null> {
    if (!cityId || cityId.trim() === '') {
      return of(null);
    }

    return this.store.select(CityState.selectStateCities).pipe(
      filter(cities => cities && cities.length > 0),
      take(1),
      map((cities: CityModel[]) => {
        const foundCity = cities.find(city => city._id === cityId);
        const result = foundCity ? foundCity.fullName : null;
        console.log(`🏙️ Conversion ID -> nom: "${cityId}" -> "${result}"`);
        return result;
      })
    );
  }

  /**
   * Obtenir une ville par nom ou ID
   */
  getCityByNameOrId(identifier: string): Observable<CityModel | null> {
    if (!identifier || identifier.trim() === '') {
      return of(null);
    }

    return this.store.select(CityState.selectStateCities).pipe(
      filter(cities => cities && cities.length > 0),
      take(1),
      map((cities: CityModel[]) => {
        // D'abord essayer par ID
        let foundCity = cities.find(city => city._id === identifier);
        
        // Si pas trouvé, essayer par nom
        if (!foundCity) {
          const normalizedSearchName = this.normalizeCityName(identifier);
          
          // Recherche exacte
          foundCity = cities.find(city => 
            this.normalizeCityName(city.fullName) === normalizedSearchName
          );

          // Si pas trouvé, recherche partielle
          if (!foundCity) {
            foundCity = cities.find(city => 
              this.normalizeCityName(city.fullName).includes(normalizedSearchName) ||
              normalizedSearchName.includes(this.normalizeCityName(city.fullName))
            );
          }
        }

        console.log(`🏙️ Recherche ville: "${identifier}" -> ${foundCity ? foundCity.fullName : 'non trouvée'}`);
        return foundCity || null;
      })
    );
  }

  /**
   * Vérifier si un identifiant est un ID ou un nom
   */
  isObjectId(identifier: string): boolean {
    // Un ObjectId MongoDB fait 24 caractères hexadécimaux
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    return objectIdRegex.test(identifier);
  }

  /**
   * Normaliser le nom d'une ville pour la comparaison
   */
  private normalizeCityName(cityName: string): string {
    return cityName
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .replace(/[^a-z0-9\s]/g, '') // Supprimer la ponctuation
      .replace(/\s+/g, ' '); // Normaliser les espaces
  }

  /**
   * Obtenir la ville par défaut (Bangangté)
   */
  getDefaultCity(): Observable<CityModel | null> {
    return this.getCityByNameOrId('Bangangté');
  }

  /**
   * Obtenir l'ID de la ville par défaut
   */
  getDefaultCityId(): Observable<string | null> {
    return this.getCityIdByName('Bangangté');
  }

  /**
   * Convertir les paramètres URL pour utiliser les noms de ville
   */
  convertUrlParamsToNames(params: { [key: string]: any }): Observable<{ [key: string]: any }> {
    const convertedParams = { ...params };
    
    if (params['ville'] || params['city']) {
      const cityIdentifier = params['ville'] || params['city'];
      
      if (this.isObjectId(cityIdentifier)) {
        // Convertir l'ID en nom pour l'URL
        return this.getCityNameById(cityIdentifier).pipe(
          map(cityName => {
            if (cityName) {
              convertedParams['ville'] = cityName;
              delete convertedParams['city']; // Utiliser 'ville' comme standard
            }
            return convertedParams;
          })
        );
      } else {
        // C'est déjà un nom, juste standardiser sur 'ville'
        convertedParams['ville'] = cityIdentifier;
        delete convertedParams['city'];
        return of(convertedParams);
      }
    }
    
    return of(convertedParams);
  }

  /**
   * Convertir les paramètres URL pour utiliser les IDs de ville (pour l'API)
   */
  convertUrlParamsToIds(params: { [key: string]: any }): Observable<{ [key: string]: any }> {
    const convertedParams = { ...params };
    
    if (params['ville'] || params['city']) {
      const cityIdentifier = params['ville'] || params['city'];
      
      if (!this.isObjectId(cityIdentifier)) {
        // Convertir le nom en ID pour l'API
        return this.getCityIdByName(cityIdentifier).pipe(
          map(cityId => {
            if (cityId) {
              convertedParams['city'] = cityId;
              delete convertedParams['ville']; // L'API utilise 'city'
            }
            return convertedParams;
          })
        );
      } else {
        // C'est déjà un ID, juste standardiser sur 'city'
        convertedParams['city'] = cityIdentifier;
        delete convertedParams['ville'];
        return of(convertedParams);
      }
    }
    
    return of(convertedParams);
  }

  /**
   * Obtenir les suggestions de villes basées sur une saisie partielle
   */
  getCitySuggestions(partialName: string, limit: number = 5): Observable<CityModel[]> {
    if (!partialName || partialName.trim().length < 2) {
      return of([]);
    }

    return this.store.select(CityState.selectStateCities).pipe(
      filter(cities => cities && cities.length > 0),
      take(1),
      map((cities: CityModel[]) => {
        const normalizedSearch = this.normalizeCityName(partialName);
        
        return cities
          .filter(city => 
            this.normalizeCityName(city.fullName).includes(normalizedSearch)
          )
          .sort((a, b) => {
            // Prioriser les correspondances qui commencent par la recherche
            const aStartsWith = this.normalizeCityName(a.fullName).startsWith(normalizedSearch);
            const bStartsWith = this.normalizeCityName(b.fullName).startsWith(normalizedSearch);
            
            if (aStartsWith && !bStartsWith) return -1;
            if (!aStartsWith && bStartsWith) return 1;
            
            // Puis trier alphabétiquement
            return a.fullName.localeCompare(b.fullName);
          })
          .slice(0, limit);
      })
    );
  }
}
