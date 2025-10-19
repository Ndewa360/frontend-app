import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, filter } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { ContentReadyService } from './content-ready.service';

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
  minLoadingTime?: number; // Temps minimum d'affichage du loader
}

@Injectable({
  providedIn: 'root'
})
export class DataDrivenLoaderService {
  private pageLoadingSubject = new BehaviorSubject<PageLoadingState | null>(null);
  public pageLoading$ = this.pageLoadingSubject.asObservable();

  private globalLoaderVisible = new BehaviorSubject<boolean>(false);
  public globalLoaderVisible$ = this.globalLoaderVisible.asObservable();

  private loadingStartTime: number = 0;
  private appLoaded = false;
  private currentLoadingConfig: DataLoadingConfig | null = null;

  // Configuration des routes et leurs données requises pour tout le frontend
  private routeConfigs: { [key: string]: DataLoadingConfig } = {
    // === ROUTES PRINCIPALES - PROPRIÉTÉS ===
    '/app/properties': {
      route: '/app/properties',
      requiredStores: ['userprofile.initLoadingState', 'properties.initLoadingState'],
      customMessage: 'Chargement de vos propriétés...',
      minLoadingTime: 800
    },
    '/app/properties/home': {
      route: '/app/properties/home',
      requiredStores: ['userprofile.initLoadingState', 'properties.initLoadingState'],
      customMessage: 'Chargement de vos propriétés...',
      minLoadingTime: 800
    },
    '/app/properties/list': {
      route: '/app/properties/list',
      requiredStores: ['userprofile.initLoadingState', 'properties.initLoadingState'],
      customMessage: 'Chargement de la liste des propriétés...',
      minLoadingTime: 600
    },
    '/app/properties/details': {
      route: '/app/properties/details',
      requiredStores: [
        'userprofile.initLoadingState',
        'properties.initLoadingState',
        'rooms.initLoadingState',
        'locataires.initLoadingState',
        'locations.initLoadingState'
      ],
      customMessage: 'Chargement des détails de la propriété...',
      minLoadingTime: 1000
    },

    // === GESTION DES CONTRATS ===
    '/app/contract': {
      route: '/app/contract',
      requiredStores: ['userprofile.initLoadingState'],
      customMessage: 'Chargement des contrats...',
      minLoadingTime: 600
    },
    '/app/contract-templates': {
      route: '/app/contract-templates',
      requiredStores: ['userprofile.initLoadingState'],
      customMessage: 'Chargement des modèles de contrats...',
      minLoadingTime: 500
    },

    // === FACTURATION ===
    '/app/facturation': {
      route: '/app/facturation',
      requiredStores: ['userprofile.initLoadingState'],
      customMessage: 'Chargement de la facturation...',
      minLoadingTime: 700
    },

    // === PROFIL UTILISATEUR ===
    '/app/profile': {
      route: '/app/profile',
      requiredStores: ['userprofile.initLoadingState'],
      customMessage: 'Chargement de votre profil...',
      minLoadingTime: 500
    },

    // === ASSIGNATION DE LOCATAIRE ===
    '/app/assign-location': {
      route: '/app/assign-location',
      requiredStores: ['userprofile.initLoadingState', 'properties.initLoadingState'],
      customMessage: 'Chargement de l\'assignation...',
      minLoadingTime: 600
    },

    // === PAGE D'ACCUEIL ===
    '/app/welcome': {
      route: '/app/welcome',
      requiredStores: ['userprofile.initLoadingState'],
      customMessage: 'Bienvenue sur Ndewa360°...',
      minLoadingTime: 400
    },

    // === ADMINISTRATION ===
    '/admin': {
      route: '/admin',
      requiredStores: ['userprofile.initLoadingState'],
      customMessage: 'Chargement de l\'administration...',
      minLoadingTime: 500
    },

    // === MONITORING ===
    '/monitoring': {
      route: '/monitoring',
      requiredStores: ['userprofile.initLoadingState'],
      customMessage: 'Chargement du monitoring...',
      minLoadingTime: 600
    },

    // === RECHERCHE PUBLIQUE ===
    '/search': {
      route: '/search',
      requiredStores: ['countries.initLoadingState'],
      customMessage: 'Chargement de la recherche...',
      minLoadingTime: 500
    },
    '/search/index': {
      route: '/search/index',
      requiredStores: ['countries.initLoadingState'],
      customMessage: 'Chargement de la recherche...',
      minLoadingTime: 500
    },

    // === SUPPORT ===
    '/support': {
      route: '/support',
      requiredStores: [],
      customMessage: 'Chargement du support...',
      minLoadingTime: 400
    },

    // === AUTHENTIFICATION ===
    '/auth': {
      route: '/auth',
      requiredStores: [],
      customMessage: 'Chargement de l\'authentification...',
      minLoadingTime: 300
    },
    '/auth/signin': {
      route: '/auth/signin',
      requiredStores: [],
      customMessage: 'Chargement de la connexion...',
      minLoadingTime: 300
    },
    '/auth/signup': {
      route: '/auth/signup',
      requiredStores: [],
      customMessage: 'Chargement de l\'inscription...',
      minLoadingTime: 300
    },

    // === PAIEMENT ===
    '/payment': {
      route: '/payment',
      requiredStores: [],
      customMessage: 'Chargement du paiement...',
      minLoadingTime: 400
    }
  };

  constructor(
    private store: Store,
    private router: Router,
    private contentReadyService: ContentReadyService
  ) {
    this.initializeRouteListener();

    // Démarrer immédiatement le loader pour éviter la page blanche
    this.startInitialLoading();
  }

  /**
   * Démarre le chargement initial pour éviter la page blanche
   */
  private startInitialLoading(): void {
    console.log('🚀 DataDrivenLoader - Démarrage initial pour éviter la page blanche');

    // Afficher immédiatement le loader de données
    this.globalLoaderVisible.next(true);

    // Démarrer le chargement pour la route actuelle
    const currentUrl = this.router.url || window.location.pathname;
    console.log('📍 Route initiale détectée:', currentUrl);

    // Attendre que Angular soit complètement initialisé
    setTimeout(() => {
      // Simuler un NavigationStart pour la route actuelle
      this.handleNavigationStart(currentUrl);
      
      // Attendre plus longtemps pour que les resolvers et les stores soient prêts
      setTimeout(() => {
        this.handleNavigationEnd(currentUrl);
      }, 500);
    }, 300);
  }

  /**
   * Initialise l'écoute des événements de navigation
   */
  private initializeRouteListener(): void {
    this.router.events.pipe(
      filter(event =>
        event instanceof NavigationStart ||
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      )
    ).subscribe((event) => {
      if (event instanceof NavigationStart) {
        console.log(`🚀 Navigation démarrée vers: ${event.url}`);
        this.handleNavigationStart(event.url);
      } else if (event instanceof NavigationEnd) {
        console.log(`✅ Navigation terminée vers: ${event.urlAfterRedirects}`);
        this.handleNavigationEnd(event.urlAfterRedirects);
      } else if (event instanceof NavigationCancel || event instanceof NavigationError) {
        console.log(`❌ Navigation annulée/échouée:`, event);
        this.handleNavigationFailure();
      }
    });
  }

  /**
   * Gère le début de navigation (NavigationStart)
   */
  private handleNavigationStart(url: string): void {
    console.log(`🔄 Début de navigation vers: ${url}`);

    // Afficher le loader immédiatement pour éviter la page blanche
    this.globalLoaderVisible.next(true);

    // Trouver la configuration pour cette route
    const config = this.findRouteConfig(url);

    if (config) {
      console.log(`📋 Configuration trouvée pour ${url}:`, config);
      // Préparer le chargement mais ne pas encore observer les stores
      // car les resolvers peuvent ne pas avoir encore démarré
      this.currentLoadingConfig = config;
    } else {
      console.log(`⚠️ Aucune configuration pour ${url}, chargement par défaut`);
      this.currentLoadingConfig = null;
    }
  }

  /**
   * Gère la fin de navigation (NavigationEnd)
   */
  private handleNavigationEnd(url: string): void {
    console.log(`✅ Navigation terminée vers: ${url}`);

    // Maintenant que la navigation est terminée, démarrer l'observation des données
    if (this.currentLoadingConfig && !this.appLoaded) {
      console.log(`🚀 Démarrage du chargement basé sur les données pour: ${url}`);
      this.startDataDrivenLoading(this.currentLoadingConfig);
    } else if (!this.currentLoadingConfig && !this.appLoaded) {
      // Route sans configuration, utiliser une configuration par défaut
      console.log(`⚠️ Pas de configuration pour ${url}, utilisation de la configuration par défaut`);
      this.handleUnconfiguredRoute(url);
    }
  }

  /**
   * Gère l'échec de navigation
   */
  private handleNavigationFailure(): void {
    console.log(`❌ Échec de navigation, masquage du loader`);
    this.globalLoaderVisible.next(false);
    this.hideGlobalLoader();
  }

  /**
   * Gère les routes sans configuration spécifique
   */
  private handleUnconfiguredRoute(url: string): void {
    console.log(`🔧 Gestion de route non configurée: ${url}`);

    // Créer une configuration par défaut basée sur le type de route
    let defaultConfig: DataLoadingConfig;

    if (url.startsWith('/app/')) {
      // Routes de l'application - nécessitent au minimum le profil utilisateur
      defaultConfig = {
        route: url,
        requiredStores: ['userprofile.initLoadingState'],
        customMessage: 'Chargement de la page...',
        minLoadingTime: 400
      };
    } else if (url.startsWith('/auth/')) {
      // Routes d'authentification - pas de stores requis
      defaultConfig = {
        route: url,
        requiredStores: [],
        customMessage: 'Chargement...',
        minLoadingTime: 300
      };
    } else {
      // Routes publiques - configuration minimale
      defaultConfig = {
        route: url,
        requiredStores: [],
        customMessage: 'Chargement...',
        minLoadingTime: 300
      };
    }

    console.log(`📋 Configuration par défaut créée pour ${url}:`, defaultConfig);
    this.startDataDrivenLoading(defaultConfig);
  }

  /**
   * Trouve la configuration pour une route donnée avec gestion des routes dynamiques
   */
  private findRouteConfig(url: string): DataLoadingConfig | null {
    console.log(`🔍 Recherche de configuration pour: ${url}`);

    // Recherche exacte d'abord
    if (this.routeConfigs[url]) {
      console.log(`✅ Configuration exacte trouvée pour: ${url}`);
      return this.routeConfigs[url];
    }

    // Gestion des routes dynamiques spécifiques
    if (url.match(/^\/app\/properties\/details\/\d+$/)) {
      console.log(`✅ Route dynamique détectée: détails de propriété`);
      return this.routeConfigs['/app/properties/details'];
    }

    // Recherche par correspondance partielle (du plus spécifique au plus général)
    const sortedRoutes = Object.keys(this.routeConfigs).sort((a, b) => b.length - a.length);

    for (const routePattern of sortedRoutes) {
      if (url.startsWith(routePattern)) {
        console.log(`✅ Configuration trouvée par correspondance partielle: ${routePattern} pour ${url}`);
        return this.routeConfigs[routePattern];
      }
    }

    console.log(`⚠️ Aucune configuration trouvée pour: ${url}`);
    return null;
  }

  /**
   * Démarre le chargement basé sur les données pour une route
   */
  private startDataDrivenLoading(config: DataLoadingConfig): void {
    this.loadingStartTime = Date.now();
    
    console.log(`🚀 Démarrage du chargement basé sur les données pour: ${config.route}`);
    console.log(`📊 Stores requis:`, config.requiredStores);

    const pageState: PageLoadingState = {
      route: config.route,
      isLoading: true,
      requiredData: config.requiredStores,
      loadedData: [],
      message: config.customMessage || 'Chargement en cours...',
      progress: 0
    };

    this.pageLoadingSubject.next(pageState);
    this.globalLoaderVisible.next(true);

    // Observer les stores requis
    this.observeRequiredStores(config);
  }

  /**
   * Observe les stores requis et met à jour l'état de chargement
   */
  private observeRequiredStores(config: DataLoadingConfig): void {
    const storeObservables = config.requiredStores.map(storePath => 
      this.store.select(state => this.getNestedProperty(state, storePath))
    );

    combineLatest(storeObservables).pipe(
      map(states => {
        const loadedStores: string[] = [];
        
        states.forEach((state, index) => {
          if (state === 'LOADED') {
            loadedStores.push(config.requiredStores[index]);
          }
        });

        return {
          loadedStores,
          allLoaded: loadedStores.length === config.requiredStores.length,
          progress: Math.round((loadedStores.length / config.requiredStores.length) * 100)
        };
      }),
      distinctUntilChanged((prev, curr) => 
        prev.allLoaded === curr.allLoaded && prev.progress === curr.progress
      )
    ).subscribe(({ loadedStores, allLoaded, progress }) => {
      console.log(`📊 Progression du chargement: ${progress}%`, loadedStores);

      // Mettre à jour l'état de chargement
      const currentState = this.pageLoadingSubject.value;
      if (currentState && currentState.isLoading) {
        const updatedState: PageLoadingState = {
          ...currentState,
          loadedData: loadedStores,
          progress,
          message: this.getProgressMessage(config.customMessage || 'Chargement', progress)
        };

        this.pageLoadingSubject.next(updatedState);

        // Si toutes les données sont chargées
        if (allLoaded) {
          this.completeDataDrivenLoading(config);
        }
      }
    });
  }

  /**
   * Termine le chargement basé sur les données
   */
  private completeDataDrivenLoading(config: DataLoadingConfig): void {
    const loadingDuration = Date.now() - this.loadingStartTime;
    const minLoadingTime = config.minLoadingTime || 500;

    console.log(`✅ Toutes les données chargées pour: ${config.route}`);
    console.log(`⏱️ Durée de chargement: ${loadingDuration}ms (min: ${minLoadingTime}ms)`);

    // Respecter le temps minimum de chargement pour éviter les flashs
    const remainingTime = Math.max(0, minLoadingTime - loadingDuration);

    setTimeout(() => {
      const currentState = this.pageLoadingSubject.value;
      if (currentState) {
        const completedState: PageLoadingState = {
          ...currentState,
          isLoading: false,
          progress: 100,
          message: 'Chargement terminé'
        };

        this.pageLoadingSubject.next(completedState);
        
        // Utiliser le ContentReadyService pour attendre que le contenu soit prêt
        this.contentReadyService.startContentCheck();
        this.contentReadyService.waitForContent().then(() => {
          setTimeout(() => {
            this.globalLoaderVisible.next(false);
            this.hideGlobalLoader();
          }, 200); // Délai réduit car le contenu est vraiment prêt
        });
      }
    }, remainingTime);
  }

  /**
   * Masque physiquement le loader global
   */
  private hideGlobalLoader(): void {
    if (this.appLoaded) return;

    try {
      if (typeof window['appBootstrap'] === 'function') {
        window['appBootstrap']();
        console.log('✅ Loader global masqué via appBootstrap');
      } else {
        const loader = document.getElementById('app-loading-holder');
        if (loader && loader.parentNode) {
          loader.style.transition = 'opacity 0.3s ease-out';
          loader.style.opacity = '0';
          setTimeout(() => {
            if (loader.parentNode) {
              loader.parentNode.removeChild(loader);
            }
          }, 300);
          console.log('✅ Loader global masqué manuellement');
        }
      }
      this.appLoaded = true;
    } catch (error) {
      console.error('❌ Erreur lors du masquage du loader global:', error);
    }
  }

  /**
   * Génère un message de progression
   */
  private getProgressMessage(baseMessage: string, progress: number): string {
    if (progress < 30) {
      return `${baseMessage}...`;
    } else if (progress < 70) {
      return `${baseMessage}... ${progress}%`;
    } else if (progress < 100) {
      return `Finalisation... ${progress}%`;
    } else {
      return 'Chargement terminé';
    }
  }

  /**
   * Utilitaire pour accéder aux propriétés imbriquées
   */
  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  /**
   * Marque manuellement une donnée comme chargée (optionnel)
   * Utile pour des cas spéciaux où l'observation automatique ne suffit pas
   */
  public markDataLoaded(dataKey: string): void {
    const currentState = this.pageLoadingSubject.value;
    if (!currentState || !currentState.isLoading) {
      console.log(`⚠️ Tentative de marquage de ${dataKey} mais aucun chargement en cours`);
      return;
    }

    if (!currentState.loadedData.includes(dataKey) && currentState.requiredData.includes(dataKey)) {
      const updatedLoadedData = [...currentState.loadedData, dataKey];
      console.log(`✅ Donnée marquée manuellement comme chargée: ${dataKey}`);

      const updatedState: PageLoadingState = {
        ...currentState,
        loadedData: updatedLoadedData,
        progress: Math.round((updatedLoadedData.length / currentState.requiredData.length) * 100),
        message: this.getProgressMessage(currentState.message?.split('...')[0] || 'Chargement',
                                       Math.round((updatedLoadedData.length / currentState.requiredData.length) * 100))
      };

      this.pageLoadingSubject.next(updatedState);

      // Vérifier si toutes les données sont chargées
      if (updatedLoadedData.length >= currentState.requiredData.length) {
        const config = this.findRouteConfig(currentState.route);
        if (config) {
          this.completeDataDrivenLoading(config);
        }
      }
    } else {
      console.log(`⚠️ Donnée ${dataKey} déjà chargée ou non requise pour cette route`);
    }
  }

  /**
   * Force l'arrêt du chargement (pour les cas d'erreur)
   */
  public forceStopLoading(): void {
    console.log('🛑 Arrêt forcé du chargement basé sur les données');
    this.pageLoadingSubject.next(null);
    this.globalLoaderVisible.next(false);
    this.hideGlobalLoader();
  }

  /**
   * Ajoute une configuration de route dynamiquement
   */
  public addRouteConfig(config: DataLoadingConfig): void {
    this.routeConfigs[config.route] = config;
    console.log(`➕ Configuration ajoutée pour la route: ${config.route}`);
  }

  /**
   * Attend que le DOM soit prêt avant d'exécuter le callback
   */
  private waitForDOMReady(callback: () => void): void {
    // Vérifier si le contenu Angular est rendu
    const checkDOMReady = () => {
      const appRoot = document.querySelector('app-root');
      const routerOutlet = document.querySelector('router-outlet');
      const hasContent = appRoot && (appRoot.children.length > 1 || 
        (routerOutlet && routerOutlet.nextElementSibling));
      
      if (hasContent) {
        console.log('✅ DOM prêt - contenu Angular détecté');
        callback();
      } else {
        console.log('⏳ DOM pas encore prêt, nouvelle vérification dans 100ms');
        setTimeout(checkDOMReady, 100);
      }
    };
    
    // Démarrer la vérification
    setTimeout(checkDOMReady, 100);
  }

  /**
   * Retourne l'état actuel du chargement
   */
  public getCurrentLoadingState(): PageLoadingState | null {
    return this.pageLoadingSubject.value;
  }
}
