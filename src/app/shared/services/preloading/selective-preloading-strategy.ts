import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';

/**
 * Préchargement stratégique : précharge tous les modules sauf les zones
 * réservées (admin, monitoring) pour optimiser l'expérience de navigation
 * sans alourdir le démarrage de l'application.
 */
@Injectable({ providedIn: 'root' })
export class SelectivePreloadingStrategy implements PreloadingStrategy {
  private loadedRoutes: string[] = [];

  preload(route: Route, load: () => Observable<any>): Observable<any> {
    if (route.data && route.data['preload'] === false) {
      this.loadedRoutes.push(route.path as string);
      return of(null);
    }
    return load();
  }
}