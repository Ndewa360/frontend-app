import { Injectable } from '@angular/core';
import { BehaviorSubject, Subscription, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, filter } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { GlobalAction } from '../store';

export interface DataLoadingConfig {
  route: string;
  requiredStores: string[];
  customMessage?: string;
  minLoadingTime?: number;
}

@Injectable({ providedIn: 'root' })
export class DataDrivenLoaderService {

  // ─── Observable consommé par AppComponent pour afficher l'overlay Angular ──
  // Démarré masqué : l'overlay ne s'affiche que lors d'une navigation
  // nécessitant des stores (évite le « flash » de loader à la première peinture).
private _overlayVisible = new BehaviorSubject<boolean>(false);
  private _overlayMessage = new BehaviorSubject<string>('Chargement…');
  private _overlayProgress = new BehaviorSubject<number>(0);
  // Un store passé à 'ERROR' : l'overlay ne disparaît plus silencieusement,
  // il propose une action « Réessayer » à l'utilisateur.
  private _overlayError = new BehaviorSubject<string | null>(null);

  public overlayVisible$  = this._overlayVisible.asObservable();
  public overlayMessage$ = this._overlayMessage.asObservable();
  public overlayProgress$ = this._overlayProgress.asObservable();
  public overlayError$ = this._overlayError.asObservable();

  private storeSubscription: Subscription | null = null;
  private loadingStartTime = 0;
  private hideTimer: any = null;

  private routeConfigs: { [key: string]: DataLoadingConfig } = {
    '/app/properties':         { route: '/app/properties',         requiredStores: ['userprofile.initLoadingState', 'properties.initLoadingState'], customMessage: 'Chargement de vos propriétés…',     minLoadingTime: 0 },
    '/app/properties/home':    { route: '/app/properties/home',    requiredStores: ['userprofile.initLoadingState', 'properties.initLoadingState'], customMessage: 'Chargement de vos propriétés…',     minLoadingTime: 0 },
    '/app/properties/list':    { route: '/app/properties/list',    requiredStores: ['userprofile.initLoadingState', 'properties.initLoadingState'], customMessage: 'Chargement de la liste…',           minLoadingTime: 0 },
    // Noms de state RÉELS : `locatairelist` / `locationlist`. Les anciens noms
    // (`locataires`, `locations`) n'existaient pas → `undefined` → l'overlay
    // tournait les 12 s complètes sur chaque fiche de bien.
    '/app/properties/details': { route: '/app/properties/details', requiredStores: ['userprofile.initLoadingState', 'properties.initLoadingState', 'rooms.initLoadingState', 'locatairelist.initLoadingState', 'locationlist.initLoadingState'], customMessage: 'Chargement des détails…', minLoadingTime: 0 },
    '/app/contract':           { route: '/app/contract',           requiredStores: ['userprofile.initLoadingState'], customMessage: 'Chargement des contrats…',        minLoadingTime: 0 },
    '/app/contract-templates': { route: '/app/contract-templates', requiredStores: ['userprofile.initLoadingState'], customMessage: 'Chargement des modèles…',         minLoadingTime: 0 },
    '/app/facturation':        { route: '/app/facturation',        requiredStores: ['userprofile.initLoadingState'], customMessage: 'Chargement de la facturation…',   minLoadingTime: 0 },
    '/app/portefeuille':       { route: '/app/portefeuille',       requiredStores: ['userprofile.initLoadingState'], customMessage: 'Chargement du portefeuille…',     minLoadingTime: 0 },
    '/app/profile':            { route: '/app/profile',            requiredStores: ['userprofile.initLoadingState'], customMessage: 'Chargement du profil…',           minLoadingTime: 0 },
    '/app/assign-location':    { route: '/app/assign-location',    requiredStores: ['userprofile.initLoadingState', 'properties.initLoadingState'], customMessage: 'Chargement…', minLoadingTime: 0 },
    '/app/welcome':            { route: '/app/welcome',            requiredStores: ['userprofile.initLoadingState'], customMessage: 'Bienvenue sur Ndewa360°…',        minLoadingTime: 0 },
    '/admin':                  { route: '/admin',                  requiredStores: ['userprofile.initLoadingState'], customMessage: 'Chargement de l\'administration…', minLoadingTime: 0 },
    // `/search` : aucun store à attendre. `PublicDataResolver` dispatche
    // `FetchCountries()` puis retourne `of(true)` immédiatement — la navigation
    // ne bloque jamais — et la page possède déjà son propre état de chargement
    // (`SearchState.selectStateLoading` + `isLoading`/`isLoadingMore`).
    // Afficher l'overlay ici couvrait une page déjà interactive, pendant au
    // pire 6 s si `countries` était en échec. → pas d'overlay.
    '/search':                 { route: '/search',                 requiredStores: [],                             customMessage: '', minLoadingTime: 0 },
    '/auth':                   { route: '/auth',                   requiredStores: [],                              customMessage: '',                                minLoadingTime: 0 },
    '/payment':                { route: '/payment',                requiredStores: [],                              customMessage: '',                                minLoadingTime: 0 },
  };

  constructor(
    private store: Store,
    private router: Router,
    private toastr: ToastrService,
    private translate: TranslateService,
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
    this.hideTimer = null;
    this.loadingStartTime = Date.now();

    const config = this.findConfig(url);
    // Routes sans stores (auth, payment) → pas d'overlay, pas de budget.
    // On n'affiche que s'il reste quelque chose à attendre : les navigations
    // internes (stores déjà LOADED) ne doivent plus faire clignoter l'overlay.
    if (config && config.requiredStores.length > 0 && this.hasPendingStore(config)) {
      // Le budget est armé dès NavigationStart : le temps passé dans les
      // resolvers compte dans la durée totale de l'overlay.
      this.armSafetyTimer();
      this.show(config.customMessage || 'Chargement…', 0);
    }
  }

  private onEnd(url: string): void {
    const config = this.findConfig(url);

    if (!config || config.requiredStores.length === 0) {
      // Pas de stores à attendre → masquer immédiatement
      this.hide();
      return;
    }

    if (!this.hasPendingStore(config)) {
      // Tout est déjà en cache : rien à observer, surtout pas un timer.
      this.hide();
      return;
    }

    // Un resolver a lancé une requête pendant la navigation alors que tout
    // semblait prêt au démarrage : on affiche maintenant, avant d'attendre.
    if (!this._overlayVisible.value) {
      this.show(config.customMessage || 'Chargement…', 0);
    }

    // Garantie qu'un budget existe dès qu'on va attendre — couvre le premier
    // chargement, où le NavigationStart est raté (le service n'est injecté
    // qu'au constructeur d'AppComponent, après l'APP_INITIALIZER). En revanche
    // on ne réarme JAMAIS : le budget court depuis le début de la navigation.
    if (!this.hideTimer) {
      this.armSafetyTimer();
    }

    this.observeStores(config);
  }

  /** Vrai si au moins un store attendu n'est pas encore à 'LOADED'. */
  private hasPendingStore(config: DataLoadingConfig): boolean {
    return config.requiredStores.some(
      path => this.store.selectSnapshot((state: any) => this.get(state, path)) !== 'LOADED'
    );
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
        // Erreur réseau dans un store : on ne masque plus le loader en silence.
        // L'utilisateur voit pourquoi la page est vide et peut relancer.
        this.cancelSub();
        this._overlayError.next(
          this.translate.instant('LOADER.LOAD_ERROR') || 'Impossible de charger les données.'
        );
        clearTimeout(this.hideTimer);
        this.hideTimer = null;
        return;
      }

      if (allLoaded) {
        this.cancelSub();
        this._overlayError.next(null);
        // Attendre 1 tick Angular pour que les composants soient rendus
        // avant de masquer l'overlay — évite la page blanche
        if (typeof requestAnimationFrame !== 'undefined') {
          requestAnimationFrame(() => requestAnimationFrame(() => {
            this.hide();
          }));
        } else {
          this.hide();
        }
      }
    });
  }

  /**
   * Filet de sécurité : 6 s maximum de budget total pour l'overlay.
   *
   * 6 s plutôt que 12 s : ces stores se résolvent en ~300 ms au premier
   * chargement et en quasi-immédiat ensuite — 12 s masquait un
   * dysfonctionnement pendant une éternité. Au-delà, on laisse la page
   * s'afficher avec ses propres états de chargement.
   */
  private armSafetyTimer(): void {
    this.hideTimer = setTimeout(() => {
      this.hideTimer = null;
      this.cancelSub();
      this.hide();
      this.toastr.warning(
        this.translate.instant('LOADER.TIMEOUT_WARNING'),
        'Ndewa360°',
        { timeOut: 5000 }
      );
    }, 6000);
  }

  // ─── Détection connexion réseau ───────────────────────────────────────────

  private listenToNetworkStatus(): void {
    if (typeof window === 'undefined') return;
    window.addEventListener('offline', () => {
      if (this._overlayVisible.value) {
        // Loader actif + connexion perdue
        this.toastr.error(
          this.translate.instant('LOADER.OFFLINE_ERROR'),
          this.translate.instant('COMMON.OFFLINE'),
          { timeOut: 0, extendedTimeOut: 0, closeButton: true }
        );
        this.cancelSub();
        clearTimeout(this.hideTimer);
        this.hide();
      } else {
        this.toastr.warning(
          this.translate.instant('LOADER.OFFLINE_WARNING'),
          this.translate.instant('COMMON.OFFLINE'),
          { timeOut: 0, extendedTimeOut: 0, closeButton: true }
        );
      }
    });

    window.addEventListener('online', () => {
      this.store.dispatch(new GlobalAction.SetConnexionInternetState(true));
      this.toastr.success(this.translate.instant('LOADER.ONLINE_SUCCESS'), this.translate.instant('COMMON.ONLINE'), { timeOut: 3000 });
    });
  }

  // ─── Affichage / masquage ─────────────────────────────────────────────────

  private show(message: string, progress: number): void {
    this._overlayError.next(null);
    this._overlayMessage.next(message);
    this._overlayProgress.next(progress);
    this._overlayVisible.next(true);
  }

  private hide(): void {
    clearTimeout(this.hideTimer);
    this.hideTimer = null;
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
  // Supprimé (jamais appelé dans l'application) : forceStopLoading(),
  // addRouteConfig(), getCurrentLoadingState().

  /**
   * Relance le chargement après un échec.
   *
   * Rejoue la navigation courante : gardes, resolvers et `ngOnInit` des
   * composants rejouent leurs actions de chargement. C'est plus robuste qu'une
   * liste d'actions à maintenir en dur, qui divergerait à chaque évolution du
   * `routeConfigs`.
   */
  public retry(): void {
    this.hide();
    const url = this.router.url;
    this.router.navigateByUrl(url, { onSameUrlNavigation: 'reload' })
      .catch(() => this.router.navigateByUrl('/'));
  }
}
