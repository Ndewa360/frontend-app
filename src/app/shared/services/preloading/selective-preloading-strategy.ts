import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Store } from '@ngxs/store';
import { Observable, of, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthTokenState } from '../../store/auth-token';

/** Zones réservées aux comptes connectés : inutiles à un visiteur. */
const AUTHENTICATED_ZONES = new Set(['app', 'onboarding']);

/** Délai avant tout préchargement : la page affichée garde la bande passante. */
const PRELOAD_DELAY_MS = 4_000;

/**
 * Préchargement des modules à la demande, **mesuré** :
 *  - après 4 s, puis quand le navigateur est inactif (la page en cours et ses
 *    appels à l'API passent d'abord) ;
 *  - jamais sur une connexion lente ou en mode « économie de données » ;
 *  - jamais depuis la page de paiement (un locataire n'ira pas ailleurs) ;
 *  - l'espace propriétaire (`/app`) seulement pour un utilisateur connecté ;
 *  - jamais les zones marquées `data: { preload: false }` (administration).
 *
 * Auparavant, tous les modules (environ 8,7 Mo de JavaScript) étaient
 * téléchargés juste après le démarrage, pour tout visiteur.
 */
@Injectable({ providedIn: 'root' })
export class SelectivePreloadingStrategy implements PreloadingStrategy {
  private readonly loadedRoutes = new Set<Route>();

  constructor(private store: Store) {}

  preload(route: Route, load: () => Observable<any>): Observable<any> {
    if (route.data?.['preload'] === false || this.loadedRoutes.has(route)) return of(null);
    if (!this.networkAllowsPreload() || this.onPaymentPage()) return of(null);
    if (AUTHENTICATED_ZONES.has(String(route.path)) && !this.isLoggedIn()) return of(null);

    this.loadedRoutes.add(route);
    return timer(PRELOAD_DELAY_MS).pipe(
      switchMap(() => this.whenIdle()),
      switchMap(() => (this.networkAllowsPreload() ? load() : of(null))),
    );
  }

  private isLoggedIn(): boolean {
    try {
      return !!this.store.selectSnapshot(AuthTokenState.selectStateUserIsLogin);
    } catch {
      return false;
    }
  }

  private onPaymentPage(): boolean {
    return typeof location !== 'undefined' && /^\/([a-z]{2}\/)?payment(\/|$)/.test(location.pathname);
  }

  private networkAllowsPreload(): boolean {
    const connection = typeof navigator !== 'undefined' ? (navigator as any).connection : null;
    if (!connection) return true;
    if (connection.saveData) return false;
    return !['slow-2g', '2g', '3g'].includes(connection.effectiveType);
  }

  private whenIdle(): Observable<void> {
    return new Observable<void>((subscriber) => {
      const done = () => { subscriber.next(); subscriber.complete(); };
      const w: any = typeof window !== 'undefined' ? window : null;
      if (w?.requestIdleCallback) {
        const handle = w.requestIdleCallback(done, { timeout: 5_000 });
        return () => w.cancelIdleCallback?.(handle);
      }
      const handle = setTimeout(done, 0);
      return () => clearTimeout(handle);
    });
  }
}
