import { Component, OnInit, OnDestroy, Renderer2, ViewChild, ElementRef } from '@angular/core';
import { Store } from '@ngxs/store';
import { RefreshTokenService } from './shared/store/auth-token/refresh-token.service';
import { AuthTokenState } from './shared/store/auth-token';
import { interval, Subscription, Subject, fromEvent, merge, of, timer } from 'rxjs';
import { LOCAL_LANGUAGE, UserProfileAction } from './shared/store';
import { Title, Meta } from '@angular/platform-browser';
import { Router, ActivatedRoute, NavigationCancel, NavigationEnd, NavigationStart, NavigationError } from '@angular/router';
import { SettingsService } from 'src/@youpez';
import { TutorialsService } from './shared/services/tutorials/tutorials.service';
import * as moment from 'moment';
import { takeUntil, debounceTime, filter, take, catchError, retry, switchMap } from 'rxjs/operators';
import { SeoService } from './shared/services/seo/seo.service';

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
  private tokenCheckInterval: Subscription;
  private userProfileCheckInterval: Subscription;
  private routerSubscription: Subscription;
  private fragmentSubscription: Subscription;
  private queryParamsSubscription: Subscription;
  private appLoaded: boolean = false;
  private tokenExpirationWarningShown = false;
  private loadingTimeout: any;

  @ViewChild('topScroll') topScroll: ElementRef;

  constructor(
    private store: Store,
    private refreshTokenService: RefreshTokenService,
    private renderer: Renderer2,
    private settingsService: SettingsService,
    private router: Router,
    private route: ActivatedRoute,
    private tutorialService: TutorialsService,
    private activatedRoute: ActivatedRoute,
    private titleService: Title, 
    private meta: Meta,
    private seoService: SeoService
  ) {
    // Fallback pour l'écran de chargement au cas où la navigation ne se termine jamais
    this.loadingTimeout = setTimeout(() => {
      if (!this.appLoaded && typeof window['appBootstrap'] === 'function') {
        window['appBootstrap']();
        this.appLoaded = true;
        console.warn('Écran de chargement masqué par le timeout de sécurité');
      }
    }, 10000); // 10 secondes maximum
  }

  ngOnInit(): void {
    // Initialiser moment.js avec la locale française
    try {
      moment.locale(LOCAL_LANGUAGE.FR.toString());
    } catch (e) {
      console.warn('Erreur lors de l\'initialisation de moment.js:', e);
    }

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

    // Gérer les événements de navigation
    this.routerSubscription = this.router.events
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (event instanceof NavigationEnd) {
          // Gérer les métadonnées en fonction de la route
          this.seoService.updateMetaTagsForRoute(event.urlAfterRedirects);
          
          if (!this.appLoaded) {
            try {
              if (typeof window['appBootstrap'] === 'function') {
                window['appBootstrap']();
                this.appLoaded = true;
                clearTimeout(this.loadingTimeout);
              } else {
                console.warn('La fonction appBootstrap n\'est pas disponible');
                // Masquer manuellement l'écran de chargement
                const loader = document.getElementById('app-loading-holder');
                if (loader && loader.parentNode) {
                  loader.style.opacity = '0';
                  setTimeout(() => loader.parentNode.removeChild(loader), 300);
                }
                this.appLoaded = true;
              }
            } catch (e) {
              console.error('Erreur lors du masquage de l\'écran de chargement:', e);
            }
          }
        } else if (event instanceof NavigationCancel || event instanceof NavigationError) {
          // Gérer les erreurs de navigation
          console.warn('Navigation annulée ou échouée:', event);
          if (!this.appLoaded) {
            try {
              if (typeof window['appBootstrap'] === 'function') {
                window['appBootstrap']();
              }
              this.appLoaded = true;
              clearTimeout(this.loadingTimeout);
            } catch (e) {
              console.error('Erreur lors du masquage de l\'écran de chargement après erreur:', e);
            }
          }
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
    // Écouter les événements d'activité utilisateur pour rafraîchir le token si nécessaire
    merge(
      fromEvent(document, 'click'),
      fromEvent(document, 'keypress'),
      fromEvent(document, 'scroll')
    ).pipe(
      takeUntil(this.destroy$),
      debounceTime(30000),
      filter(() => this.store.selectSnapshot(AuthTokenState.selectStateUserIsLogin))
    ).subscribe(() => {
      this.refreshTokenService.checkTokenExpiration().subscribe();
    });
  }

  private loadUserProfileIfLoggedIn(): void {
    const isLoggedIn = this.store.selectSnapshot(AuthTokenState.selectStateUserIsLogin);
    if (isLoggedIn) {
      this.store.dispatch(new UserProfileAction.FetchUserProfile())
        .pipe(
          catchError(err => {
            console.error('Erreur lors du chargement initial du profil utilisateur:', err);
            return of(null);
          })
        )
        .subscribe();
    }
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
}