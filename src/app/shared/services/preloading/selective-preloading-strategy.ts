import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';

/**
 * Préchargement stratégique : précharge tous les modules lazy sauf ceux
 * explicitement marqués `data: { preload: false }` (zones réservées comme
 * l'admin). Les chunks arrivent en fond dès la fin du bootstrap : les clics
 * vers /home, /search, /support, /fundraising deviennent quasi instantanés
 * (plus de temps mort pendant le téléchargement du module).
 */
@Injectable({ providedIn: 'root' })
export class SelectivePreloadingStrategy implements PreloadingStrategy {
  private loadedRoutes: string[] = [];

  preload(route: Route, load: () => Observable<any>): Observable<any> {
    if (route.data && route.data['preload'] === false) {
      return of(null);
    }
    if (!this.loadedRoutes.includes(route.path as string)) {
      this.loadedRoutes.push(route.path as string);
      return load();
    }
    return of(null);
  }
}