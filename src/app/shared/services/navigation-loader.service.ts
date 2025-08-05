import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface NavigationState {
  isLoading: boolean;
  targetRoute?: string;
  loadingMessage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NavigationLoaderService {
  private navigationStateSubject = new BehaviorSubject<NavigationState>({
    isLoading: false
  });

  public navigationState$: Observable<NavigationState> = this.navigationStateSubject.asObservable();

  constructor(private router: Router) {
    this.initializeNavigationListener();
  }

  /**
   * Initialise l'écoute des événements de navigation
   */
  private initializeNavigationListener(): void {
    this.router.events.pipe(
      filter(event => 
        event instanceof NavigationStart || 
        event instanceof NavigationEnd || 
        event instanceof NavigationCancel || 
        event instanceof NavigationError
      )
    ).subscribe(event => {
      if (event instanceof NavigationStart) {
        // Démarrage de la navigation
        this.setNavigationState({
          isLoading: true,
          targetRoute: event.url,
          loadingMessage: this.getLoadingMessage(event.url)
        });
      } else {
        // Fin de la navigation (succès, annulation ou erreur)
        this.setNavigationState({
          isLoading: false
        });
      }
    });
  }

  /**
   * Met à jour l'état de navigation
   */
  private setNavigationState(state: NavigationState): void {
    this.navigationStateSubject.next(state);
  }

  /**
   * Retourne un message de chargement personnalisé selon la route
   */
  private getLoadingMessage(url: string): string {
    if (url.startsWith('/admin')) {
      return 'Chargement de l\'administration...';
    } else if (url.startsWith('/app')) {
      return 'Chargement de l\'application...';
    } else if (url.startsWith('/search')) {
      return 'Chargement de la recherche...';
    } else if (url.startsWith('/monitoring')) {
      return 'Chargement du monitoring...';
    }
    return 'Chargement en cours...';
  }

  /**
   * Démarre manuellement un état de chargement
   */
  public startLoading(targetRoute: string, message?: string): void {
    this.setNavigationState({
      isLoading: true,
      targetRoute,
      loadingMessage: message || this.getLoadingMessage(targetRoute)
    });
  }

  /**
   * Arrête manuellement l'état de chargement
   */
  public stopLoading(): void {
    this.setNavigationState({
      isLoading: false
    });
  }

  /**
   * Vérifie si une route spécifique est en cours de chargement
   */
  public isLoadingRoute(route: string): Observable<boolean> {
    return new Observable(observer => {
      this.navigationState$.subscribe(state => {
        observer.next(state.isLoading && state.targetRoute === route);
      });
    });
  }

  /**
   * Retourne l'état actuel de navigation
   */
  public getCurrentState(): NavigationState {
    return this.navigationStateSubject.value;
  }
}
