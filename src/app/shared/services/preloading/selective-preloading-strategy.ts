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
    // Opt-in : on ne précharge QUE les routes qui le demandent explicitement
    // (`data: { preload: true }`). Avant, la stratégie préchargeait tout sauf
    // `preload: false`, donc 53 chunks (~6,6 Mo) étaient téléchargés en fond
    // à chaque visite, y compris des zones peu probables. Sans marquage,
    // aucune précharge → modules chargés à la navigation (défaut Angular).
    if (route.data && route.data['preload'] === true) {
      this.loadedRoutes.push(route.path as string);
      return load();
    }
    return of(null);
  }
}