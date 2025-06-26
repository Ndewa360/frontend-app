import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

export interface LoadingState {
  isLoading: boolean;
  loadingMessage?: string;
  progress?: number;
  error?: string;
}

export interface ComponentLoadingConfig {
  stores: string[];
  loadingMessage?: string;
  showProgress?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LoadingStateService {

  constructor(private store: Store) {}

  /**
   * Observe l'état de chargement global de l'application
   */
  getGlobalLoadingState(): Observable<LoadingState> {
    return combineLatest([
      this.store.select(state => state.userprofile?.initLoadingState),
      this.store.select(state => state.properties?.initLoadingState),
      this.store.select(state => state.countries?.initLoadingState)
    ]).pipe(
      map(([userLoading, propertiesLoading, countriesLoading]) => {
        const isLoading = userLoading === 'LOADING' || 
                         propertiesLoading === 'LOADING' || 
                         countriesLoading === 'LOADING';
        
        let loadingMessage = '';
        if (userLoading === 'LOADING') loadingMessage = 'Chargement du profil...';
        else if (propertiesLoading === 'LOADING') loadingMessage = 'Chargement des propriétés...';
        else if (countriesLoading === 'LOADING') loadingMessage = 'Chargement des données de localisation...';

        return {
          isLoading,
          loadingMessage
        };
      })
    );
  }

  /**
   * Observe l'état de chargement pour une propriété spécifique
   */
  getPropertyLoadingState(propertyId: string): Observable<LoadingState> {
    return combineLatest([
      this.store.select(state => state.rooms?.initLoadingState),
      this.store.select(state => state.locataires?.initLoadingState),
      this.store.select(state => state.locations?.initLoadingState),
      this.store.select(state => state.locationPayments?.initLoadingState),
      this.store.select(state => state.historyLocationPayments?.initLoadingState)
    ]).pipe(
      map(([roomsLoading, locatairesLoading, locationsLoading, paymentsLoading, historyLoading]) => {
        const loadingStates = [roomsLoading, locatairesLoading, locationsLoading, paymentsLoading, historyLoading];
        const isLoading = loadingStates.some(state => state === 'LOADING');
        
        let loadingMessage = '';
        let progress = 0;
        
        if (roomsLoading === 'LOADING') loadingMessage = 'Chargement des unités...';
        else if (locatairesLoading === 'LOADING') loadingMessage = 'Chargement des locataires...';
        else if (locationsLoading === 'LOADING') loadingMessage = 'Chargement des locations...';
        else if (paymentsLoading === 'LOADING') loadingMessage = 'Chargement des paiements...';
        else if (historyLoading === 'LOADING') loadingMessage = 'Chargement de l\'historique...';

        // Calcul du progrès
        const loadedCount = loadingStates.filter(state => state === 'LOADED').length;
        progress = (loadedCount / loadingStates.length) * 100;

        return {
          isLoading,
          loadingMessage,
          progress
        };
      })
    );
  }

  /**
   * Observe l'état de chargement pour des stores spécifiques
   */
  getCustomLoadingState(config: ComponentLoadingConfig): Observable<LoadingState> {
    const observables = config.stores.map(storePath => 
      this.store.select(state => this.getNestedProperty(state, storePath))
    );

    return combineLatest(observables).pipe(
      map((states) => {
        const isLoading = states.some(state => state === 'LOADING');
        const loadedCount = states.filter(state => state === 'LOADED').length;
        const progress = config.showProgress ? (loadedCount / states.length) * 100 : undefined;

        return {
          isLoading,
          loadingMessage: isLoading ? config.loadingMessage || 'Chargement en cours...' : undefined,
          progress
        };
      })
    );
  }

  /**
   * Vérifie si toutes les données initiales sont chargées
   */
  isInitialDataLoaded(): Observable<boolean> {
    return combineLatest([
      this.store.select(state => state.userprofile?.initLoadingState),
      this.store.select(state => state.properties?.initLoadingState)
    ]).pipe(
      map(([userLoading, propertiesLoading]) => 
        userLoading === 'LOADED' && propertiesLoading === 'LOADED'
      )
    );
  }

  /**
   * Vérifie si les données d'une propriété sont chargées
   */
  isPropertyDataLoaded(propertyId: string): Observable<boolean> {
    return combineLatest([
      this.store.select(state => state.rooms?.initLoadingState),
      this.store.select(state => state.locataires?.initLoadingState),
      this.store.select(state => state.locations?.initLoadingState)
    ]).pipe(
      map(([roomsLoading, locatairesLoading, locationsLoading]) => 
        roomsLoading === 'LOADED' && 
        locatairesLoading === 'LOADED' && 
        locationsLoading === 'LOADED'
      )
    );
  }

  /**
   * Utilitaire pour accéder aux propriétés imbriquées
   */
  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }
}
