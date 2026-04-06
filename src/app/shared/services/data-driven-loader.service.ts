import { Injectable } from '@angular/core';
import { BehaviorSubject, Subscription, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, filter } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

export interface PageLoadingState {
  route: string;
  isLoading: boolean;
  requiredData: string[];
  loadedData: string[];
  message?: string;
  progress?: number;
}

export interface DataLoadingConfig {
  route: string;
  requiredStores: string[];
  customMessage?: string;
  minLoadingTime?: number;
}

@Injectable({ providedIn: 'root' })
export class DataDrivenLoaderService {

  // ─── Observable consommé par AppComponent pour afficher l'overlay Angular ──
  private _overlayVisible = new BehaviorSubject<boolean>(true);
  private _overlayMessage = new BehaviorSubject<string>('Chargement…');
  private _overlayProgress = new BehaviorSubject<number>(0);

  public overlayVisible$  = this._overlayVisible.asObservable();
  public overlayMessage$  = this._overlayMessage.asObservable();
  public overlayProgress$ = this._overlayProgress.asObservable();

  // Rétrocompatibilité avec les composants qui utilisent globalLoaderVisible$
  public globalLoaderVisible$ = this._overlayVisible.asObservable();
  public pageLoading$ = new BehaviorSubject<PageLoadingState | null>(null).asObservable();

  private storeSubscription: Subscription | null = null;
  private loadingStartTime = 0;
  private hideTimer: any = null;

  private routeConfigs: { [key: string]: DataLoadingConfig } = {
    '/app/properties':         { route: '/app/properties',         requiredStores: ['userprofile.initLoadingState', 'properties.initLoadingState'], customMessage: 'Chargement de vos propriétés…',     minLoadingTime: 0 },
    '/app/properties/home':    { route: '/app/properties/home',    requiredStores: ['userprofile.initLoadingState', 'properties.initLoadingState'], customMessage: 'Chargement de vos propriétés…',     minLoadingTime: 0 },
    '/app/properties/list':    { route: '/app/properties/list',    requiredStores: ['userprofile.initLoadingState', 'properties.initLoadingState'], customMessage: 'Chargement de la liste…',           minLoadingTime: 0 },
    '/app/properties/details': { route: '/app/properties/details', requiredStores: ['userprofile.initLoadingState', 'properties.initLoadingState', 'rooms.initLoadingState', 'locataires.initLoadingState', 'locations.initLoadingState'], customMessage: 'Chargement des détails…', minLoadingTime: 0 },
    '/app/contract':           { route: '/app/contract',           requiredStores: ['userprofile.initLoadingState'], customMessage: 'Chargement des contrats…',        minLoadingTime: 0 },
    '/app/contract-templates': { route: '/app/contract-templates', requiredStores: ['userprofile.initLoadingState'], customMessage: 'Chargement des modèles…',         minLoadingTime: 0 },
    '/app/facturation':        { route: '/app/facturation',        requiredStores: ['userprofile.initLoadingState'], customMessage: 'Chargement de la facturation…',   minLoadingTime: 0 },
    '/app/portefeuille':       { route: '/app/portefeuille',       requiredStores: ['userprofile.initLoadingState'], customMessage: 'Chargement du portefeuille…',     minLoadingTime: 0 },
    '/app/profile':            { route: '/app/profile',            requiredStores: ['userprofile.initLoadingState'], customMessage: 'Chargement du profil…',           minLoadingTime: 0 },
    '/app/assign-location':    { route: '/app/assign-location',    requiredStores: ['userprofile.initLoadingState', 'properties.initLoadingState'], customMessage: 'Chargement…', minLoadingTime: 0 },
    '/app/welcome':            { route: '/app/welcome',            requiredStores: ['userprofile.initLoadingState'], customMessage: 'Bienvenue sur Ndewa360°…',        minLoadingTime: 0 },
    '/admin':                  { route: '/admin',                  requiredStores: ['userprofile.initLoadingState'], customMessage: 'Chargement de l\'administration…', minLoadingTime: 0 },
    '/monitoring':             { route: '/monitoring',             requiredStores: ['userprofile.initLoadingState'], customMessage: 'Chargement du monitoring…',       minLoadingTime: 0 },
    '/search':                 { route: '/search',                 requiredStores: ['countries.initLoadingState'],  customMessage: 'Chargement de la recherche…',     minLoadingTime: 0 },
    '/auth':                   { route: '/auth',                   requiredStores: [],                              customMessage: '',                                minLoadingTime: 0 },
    '/payment':                { route: '/payment',                requiredStores: [],                              customMessage: '',                                minLoadingTime: 0 },
  };

  constructor(
    private store: Store,
    private router: Router,
    private toastr: ToastrService,
  ) {
    this.listenToNavigation();
    this.listenToNetworkStatus();
  }

  // ─── Navigation ───────────────────────────────────────────────────────────

  private listenToNavigation(): void {
    this.router.events.pipe(
      filter(e =>
        e instanceof NavigationStart ||
        e instanceof NavigationEnd ||
        e instanceof NavigationCancel ||
        e instanceof NavigationError
      )
    ).subscribe(e => {
      if (e instanceof NavigationStart) {
        this.onStart(e.url);
      } else if (e instanceof NavigationEnd) {
        this.onEnd(e.urlAfterRedirects);
      } else {
        this.hide();
      }
    });
  }

  private onStart(url: string): void {
    this.cancelSub();
    clearTimeout(this.hideTimer);
    this.loadingStartTime = Date.now();

    const config = this.findConfig(url);
    if (config && config.requiredStores.length > 0) {
      this.show(config.customMessage || 'Chargement…', 0);
    }
    // Routes sans stores (auth, payment) → pas d'overlay
  }

  private onEnd(url: string): void {
    const config = this.findConfig(url);

    if (!config || config.requiredStores.length === 0) {
      // Pas de stores à attendre → masquer immédiatement
      this.hide();
      return;
    }

    this.observeStores(config);
  }

  // ─── Observation des stores ───────────────────────────────────────────────

  private observeStores(config: DataLoadingConfig): void {
    const obs = config.requiredStores.map(path =>
      this.store.select(state => this.get(state, path))
    );

    this.storeSubscription = combineLatest(obs).pipe(
      map(states => {
        const loaded  = states.filter(s => s === 'LOADED').length;
        const errored = states.some(s => s === 'ERROR');
        return {
          allLoaded: loaded === config.requiredStores.length,
          progress:  Math.round((loaded / config.requiredStores.length) * 100),
          errored,
        };
      }),
      distinctUntilChanged((a, b) => a.allLoaded === b.allLoaded && a.progress === b.progress)
    ).subscribe(({ allLoaded, progress, errored }) => {
      this._overlayProgress.next(progress);

      if (errored) {
        // Erreur réseau détectée dans les stores
        this.hide();
        return;
      }

      if (allLoaded) {
        this.cancelSub();
        // Attendre 1 tick Angular pour que les composants soient rendus
        // avant de masquer l'overlay — évite la page blanche
        requestAnimationFrame(() => requestAnimationFrame(() => {
          this.hide();
        }));
      }
    });

    // Timeout de sécurité : 12 secondes max
    this.hideTimer = setTimeout(() => {
      this.cancelSub();
      this.hide();
      this.toastr.warning(
        'Le chargement prend plus de temps que prévu. Vérifiez votre connexion.',
        'Ndewa360°',
        { timeOut: 5000 }
      );
    }, 12000);
  }

  // ─── Détection connexion réseau ───────────────────────────────────────────

  private listenToNetworkStatus(): void {
    window.addEventListener('offline', () => {
      if (this._overlayVisible.value) {
        // Loader actif + connexion perdue
        this.toastr.error(
          'Connexion internet perdue. Vérifiez votre réseau et réessayez.',
          'Hors ligne',
          { timeOut: 0, extendedTimeOut: 0, closeButton: true }
        );
        this.cancelSub();
        clearTimeout(this.hideTimer);
        this.hide();
      } else {
        this.toastr.warning(
          'Connexion internet perdue.',
          'Hors ligne',
          { timeOut: 0, extendedTimeOut: 0, closeButton: true }
        );
      }
    });

    window.addEventListener('online', () => {
      this.toastr.success('Connexion rétablie.', 'En ligne', { timeOut: 3000 });
    });
  }

  // ─── Affichage / masquage ─────────────────────────────────────────────────

  private show(message: string, progress: number): void {
    this._overlayMessage.next(message);
    this._overlayProgress.next(progress);
    this._overlayVisible.next(true);
  }

  private hide(): void {
    clearTimeout(this.hideTimer);
    this._overlayVisible.next(false);
    this._overlayProgress.next(0);
  }

  // ─── Utilitaires ─────────────────────────────────────────────────────────

  private cancelSub(): void {
    if (this.storeSubscription) {
      this.storeSubscription.unsubscribe();
      this.storeSubscription = null;
    }
  }

  private findConfig(url: string): DataLoadingConfig | null {
    const clean = url
      .replace(/^\/[a-z]{2}\//, '/')
      .replace(/\?.*$/, '')
      .replace(/#.*$/, '');

    if (this.routeConfigs[clean]) return this.routeConfigs[clean];

    const sorted = Object.keys(this.routeConfigs).sort((a, b) => b.length - a.length);
    for (const p of sorted) {
      if (clean.startsWith(p)) return this.routeConfigs[p];
    }

    if (clean.startsWith('/app/')) {
      return { route: clean, requiredStores: ['userprofile.initLoadingState'], customMessage: 'Chargement…', minLoadingTime: 0 };
    }
    return null;
  }

  private get(obj: any, path: string): any {
    return path.split('.').reduce((cur, k) => cur?.[k], obj);
  }

  // ─── API publique ─────────────────────────────────────────────────────────

  public forceStopLoading(): void { this.cancelSub(); this.hide(); }
  public addRouteConfig(config: DataLoadingConfig): void { this.routeConfigs[config.route] = config; }
  public getCurrentLoadingState(): any { return null; }
}
