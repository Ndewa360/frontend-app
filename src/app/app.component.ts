import { Component, OnInit, OnDestroy, Renderer2, ViewChild, ElementRef, HostListener, ChangeDetectorRef } from '@angular/core';
import { Store } from '@ngxs/store';
import { RefreshTokenService } from './shared/store/auth-token/refresh-token.service';
import { UserActivityService } from './shared/store/auth-token/user-activity.service';
import { environment } from '../environments/environment';
import { MonitoringService } from './shared/services/monitoring.service';
import { LocalizationService } from './shared/services/localization/localization.service';
import { TranslationService } from './shared/services/localization/translation.service';
import { AuthTokenState } from './shared/store/auth-token';
import { interval, Subscription, Subject, of } from 'rxjs';
import { LOCAL_LANGUAGE, UserProfileAction } from './shared/store';
import { Title, Meta } from '@angular/platform-browser';
import { Router, ActivatedRoute, NavigationCancel, NavigationEnd, NavigationError } from '@angular/router';
import { SettingsService } from 'src/@youpez';
import { TutorialsService } from './shared/services/tutorials/tutorials.service';
import * as moment from 'moment';
import { takeUntil, debounceTime, filter, catchError } from 'rxjs/operators';
import { SeoService } from './shared/services/seo/seo.service';
import { DeviceDetectionService } from './shared/services/device-detection.service';
import { NetworkStatusService } from './shared/services/network-status.service';
import { TranslateService } from '@ngx-translate/core';

import { AuthStateService } from './shared/services/auth-state.service';
import { DataDrivenLoaderService } from './shared/services/data-driven-loader.service';
import { LanguageUrlService } from './shared/services/language-url.service';
import { ContentReadyService } from './shared/services/content-ready.service';



const getSessionStorage = (key, defaultValue = null) => {
  try {
    return sessionStorage.getItem(key) || defaultValue;
  } catch (e) {
    console.warn('SessionStorage non disponible:', e);
    return defaultValue;
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  isProduction = environment.production;
  private tokenCheckInterval: Subscription;
  private userProfileCheckInterval: Subscription;
  private routerSubscription: Subscription;
  private fragmentSubscription: Subscription;
  private queryParamsSubscription: Subscription;
  private appLoaded: boolean = false;
  private tokenExpirationWarningShown = false;
  private loadingTimeout: any;

  // Propriété pour détecter si on est dans le front office
  isInFrontOffice = false;



  @ViewChild('topScroll') topScroll: ElementRef;

  constructor(
    private store: Store,
    private refreshTokenService: RefreshTokenService,
    private userActivityService: UserActivityService,
    private renderer: Renderer2,
    private settingsService: SettingsService,
    private router: Router,
    private route: ActivatedRoute,
    private tutorialService: TutorialsService,
    private activatedRoute: ActivatedRoute,
    private titleService: Title,
    private meta: Meta,
    private seoService: SeoService,
    private networkStatusService: NetworkStatusService,
    private monitoringService: MonitoringService,
    private localizationService: LocalizationService,
    private translationService: TranslationService,
    private deviceService: DeviceDetectionService,
    private authStateService: AuthStateService,
    private cdr: ChangeDetectorRef,
    private dataDrivenLoader: DataDrivenLoaderService,
    private languageUrlService: LanguageUrlService,
    private contentReadyService: ContentReadyService,
    private translateService: TranslateService
  ) {
    // Fallback pour l'écran de chargement au cas où la navigation ne se termine jamais
    this.loadingTimeout = setTimeout(() => {
      if (!this.appLoaded) {
        console.warn('⚠️ Timeout de sécurité Angular atteint - Suppression forcée du loader');

        // Utiliser le ContentReadyService pour vérifier le contenu
        this.contentReadyService.waitForContent().then(() => {
          // Essayer d'abord la fonction appBootstrap
          if (typeof window['appBootstrap'] === 'function') {
            window['appBootstrap']();
          } else {
            // Fallback manuel si appBootstrap n'existe pas
            const loader = document.getElementById('app-loading-holder');
            if (loader && loader.parentNode) {
              loader.style.opacity = '0';
              setTimeout(() => {
                if (loader.parentNode) {
                  loader.parentNode.removeChild(loader);
                }
              }, 150);
            }
          }

          this.appLoaded = true;
          console.log('✅ Écran de chargement masqué par le timeout de sécurité Angular');
        });
      }
    }, 5000); // Augmenté à 5 secondes pour laisser plus de temps au chargement
  }

  ngOnInit(): void {


    // Initialiser les services de localisation
    console.log('🌍 Initialisation des services de localisation...');
    try {
      // Initialiser le service de traduction avec la langue par défaut
      this.translateService.setDefaultLang('fr');
      this.translateService.use('fr');
      
      console.log('✅ Services de localisation initialisés');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des services de localisation:', error);
    }

    // Détecter si on est dans le front office ou back office
    this.initializeFrontOfficeDetection();

    // Initialiser moment.js avec la locale française (sera remplacé par le système de localisation)
    try {
      moment.locale(LOCAL_LANGUAGE.FR.toString());
    } catch (e) {
      console.warn('Erreur lors de l\'initialisation de moment.js:', e);
    }
    
    // S'assurer que les traductions sont chargées de manière synchrone
    this.translateService.get('COMMON.LOADING').subscribe(translation => {
      console.log('✅ Traductions chargées, test:', translation);
      if (translation === 'COMMON.LOADING') {
        console.warn('⚠️ Traductions non chargées, rechargement...');
        this.translateService.reloadLang('fr').subscribe(() => {
          console.log('✅ Traductions rechargées');
        });
      }
    });
    
    // Forcer le chargement immédiat des traductions
    this.translateService.getTranslation('fr').subscribe(translations => {
      console.log('📚 Traductions FR chargées:', Object.keys(translations).length, 'clés');
    });
    // Initialiser la capture automatique des erreurs pour le monitoring
    this.monitoringService.initializeErrorCapture();

    // Gérer les fragments d'URL pour le défilement
    this.fragmentSubscription = this.activatedRoute.fragment
      .pipe(
        takeUntil(this.destroy$),
        filter(fragment => !!fragment),
        debounceTime(300) // Éviter les défilements trop fréquents
      )
      .subscribe(fragment => this.jumpToSection(fragment));

    // Gérer les paramètres de thème
    this.queryParamsSubscription = this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(queryParams => {
        try {
          // Thème
          const theme = queryParams['theme'] || getSessionStorage('--app-theme', 'light');
          this.settingsService.setTheme(theme);
          
          // Sidebar
          const sidebar = queryParams['sidebar'] || getSessionStorage('--app-theme-sidebar', 'default');
          this.settingsService.setSideBar(sidebar);
          
          // Header
          const header = queryParams['header'] || getSessionStorage('--app-theme-header', 'default');
          this.settingsService.setHeader(header);
        } catch (e) {
          console.error('Erreur lors de l\'application des paramètres de thème:', e);
        }
      });

    // Gérer les événements de navigation avec le nouveau système de loader
    this.routerSubscription = this.router.events
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (event instanceof NavigationEnd) {
          // Gérer les métadonnées en fonction de la route
          this.seoService.updateMetaTagsForRoute(event.urlAfterRedirects);

          // Le nouveau service DataDrivenLoaderService gère automatiquement le loader
          // basé sur les données requises pour chaque route
          console.log(`🔄 Navigation vers: ${event.urlAfterRedirects}`);
        } else if (event instanceof NavigationCancel || event instanceof NavigationError) {
          // Gérer les erreurs de navigation
          console.warn('Navigation annulée ou échouée:', event);
          this.dataDrivenLoader.forceStopLoading();
        }
      });

    // Observer l'état du loader basé sur les données
    this.dataDrivenLoader.globalLoaderVisible$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isVisible => {
        console.log('🔍 DataDrivenLoader état:', isVisible ? 'visible' : 'masqué');
        if (!isVisible && !this.appLoaded) {
          // Utiliser le ContentReadyService pour vérifier que le contenu est prêt
          this.contentReadyService.waitForContent().then(() => {
            this.appLoaded = true;
            clearTimeout(this.loadingTimeout);
            console.log('✅ Loader masqué par le service DataDrivenLoader - contenu prêt');
            this.hideGlobalLoader();
          });
        }
      });


    // Configurer la vérification du token avec un mécanisme de backoff
    this.setupTokenCheck();

    // Configurer la vérification du profil utilisateur
    this.setupUserProfileCheck();

    // Écouter les événements d'activité utilisateur pour rafraîchir le token si nécessaire
    this.setupUserActivityListener();

    // Charger le profil utilisateur au démarrage si connecté
    this.loadUserProfileIfLoggedIn();
  }
  
  private setupTokenCheck(): void {
    // Vérifier le token toutes les 5 minutes
    this.tokenCheckInterval = interval(5 * 60 * 1000)
      .pipe(
        takeUntil(this.destroy$),
        filter(() => this.store.selectSnapshot(AuthTokenState.selectStateUserIsLogin))
      )
      .subscribe(() => {
        this.refreshTokenService.checkTokenExpiration().subscribe();
      });
  }

  private setupUserProfileCheck(): void {
    // Réduire la fréquence de vérification du profil utilisateur (2 minutes au lieu de 30 secondes)
    this.userProfileCheckInterval = interval(2 * 60 * 1000)
      .pipe(
        takeUntil(this.destroy$),
        filter(() => this.store.selectSnapshot(AuthTokenState.selectStateUserIsLogin))
      )
      .subscribe(() => {
        this.store.dispatch(new UserProfileAction.FetchUserProfile())
          .pipe(
            catchError(err => {
              console.error('Erreur lors du chargement du profil utilisateur:', err);
              return of(null);
            })
          )
          .subscribe();
      });
  }

  private setupUserActivityListener(): void {
    // La surveillance d'activité est maintenant gérée par le UserActivityService
    // qui est automatiquement démarré lors de la connexion
    console.log('🟢 Configuration de la surveillance d\'activité utilisateur');

    // Écouter les changements d'état d'activité pour des actions spécifiques si nécessaire
    this.userActivityService.getActivityState()
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        console.log(`🔄 État d'activité changé: ${state}`);
        // Ici on peut ajouter des actions spécifiques selon l'état
      });
  }

  private loadUserProfileIfLoggedIn(): void {
    // Utiliser le nouveau service pour charger le profil de manière conditionnelle
    // Ne force pas la redirection sur les pages publiques
    this.authStateService.loadUserProfileConditionally(false);
  }

  jumpToSection(section: string | null): void {
    if (!section) return;
    
    // Attendre que l'élément soit disponible dans le DOM
    const maxAttempts = 10;
    let attempts = 0;
    
    const tryScrollToElement = () => {
      const element = document.getElementById(section);
      if (element) {
        try {
          // Vérifier si le navigateur supporte le comportement smooth
          const supportsSmooth = 'scrollBehavior' in document.documentElement.style;
          element.scrollIntoView({ 
            behavior: supportsSmooth ? 'smooth' : 'auto',
            block: 'start'
          });
        } catch (e) {
          // Fallback pour les navigateurs qui ne supportent pas scrollIntoView avec options
          element.scrollIntoView();
        }
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(tryScrollToElement, 100);
      }
    };
    
    tryScrollToElement();
  }



  /**
   * Masque le loader global
   */
  private hideGlobalLoader(): void {
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
    } catch (error) {
      console.error('❌ Erreur lors du masquage du loader global:', error);
    }
  }

  ngOnDestroy(): void {
    // Nettoyer tous les abonnements
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.tokenCheckInterval) {
      this.tokenCheckInterval.unsubscribe();
    }
    
    if (this.userProfileCheckInterval) {
      this.userProfileCheckInterval.unsubscribe();
    }
    
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    
    if (this.fragmentSubscription) {
      this.fragmentSubscription.unsubscribe();
    }
    
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
    }

    clearTimeout(this.loadingTimeout);
  }

  /**
   * Initialise la détection du front office vs back office
   */
  private initializeFrontOfficeDetection(): void {
    // Vérifier la route actuelle
    this.checkIfFrontOffice(this.router.url);

    // Écouter les changements de route
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this.checkIfFrontOffice(event.url);
      });
  }

  /**
   * Vérifie si l'URL correspond au front office
   */
  private checkIfFrontOffice(url: string): void {
    // Routes du front office (publiques)
    const frontOfficeRoutes = [
      '/search',
      '/support',
      '/payment',
      '/', // Landing page
      '/index',
      '/landing'
    ];

    // Routes du back office (privées/admin)
    const backOfficeRoutes = [
      '/app',
      '/admin',
      '/monitoring',
      '/auth'
    ];

    // Vérifier si l'URL commence par une route de front office
    this.isInFrontOffice = frontOfficeRoutes.some(route => {
      if (route === '/') {
        // Pour la route racine, vérifier si c'est exactement '/' ou si ça ne commence pas par une route de back office
        return url === '/' || !backOfficeRoutes.some(backRoute => url.startsWith(backRoute));
      }
      return url.startsWith(route);
    });

    console.log('🌐 Route détectée:', url, '- Front Office:', this.isInFrontOffice);
  }



  /**
   * Gérer les changements de taille d'écran
   */
  @HostListener('window:resize', ['$event'])
  onResize(_event: any): void {
    this.deviceService.onResize();
  }
}