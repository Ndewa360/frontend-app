import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { filter, map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class NavigationLoaderService {

  private _loading = new BehaviorSubject<boolean>(false);
  private _targetRoute = new BehaviorSubject<string>('');

  public loading$ = this._loading.asObservable();

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(e =>
        e instanceof NavigationStart ||
        e instanceof NavigationEnd ||
        e instanceof NavigationCancel ||
        e instanceof NavigationError
      )
    ).subscribe(e => {
      if (e instanceof NavigationStart) {
        this._loading.next(true);
        this._targetRoute.next(e.url);
      } else {
        this._loading.next(false);
        this._targetRoute.next('');
      }
    });
  }

  get isLoading(): boolean { return this._loading.value; }

  /** Retourne un Observable<boolean> indiquant si la route donnée est en cours de chargement */
  isLoadingRoute(route: string): Observable<boolean> {
    return this._loading.pipe(
      map(loading => loading && this._targetRoute.value === route)
    );
  }

  /** Démarre manuellement le loader pour une route (feedback immédiat avant NavigationStart) */
  startLoading(route: string): void {
    this._loading.next(true);
    this._targetRoute.next(route);
  }

  /** Arrête manuellement le loader */
  stopLoading(): void {
    this._loading.next(false);
    this._targetRoute.next('');
  }
}
