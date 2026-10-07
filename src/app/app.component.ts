import { Component, OnInit, OnDestroy, Renderer2, ViewChild, ElementRef, HostListener, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Store } from '@ngxs/store';
import { RefreshTokenService } from './shared/store/auth-token/refresh-token.service';
import { UserActivityService } from './shared/store/auth-token/user-activity.service';
import { environment } from '../environments/environment';
import { LocalizationService } from './shared/services/localization/localization.service';
import { TranslationService } from './shared/services/localization/translation.service';
import { AuthTokenState } from './shared/store/auth-token';
import { interval, Subscription, Subject, of } from 'rxjs';
import { LOCAL_LANGUAGE, UserProfileAction } from './shared/store';
import { Title, Meta } from '@angular/platform-browser';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { SettingsService } from 'src/@youpez';
import { TutorialsService } from './shared/services/tutorials/tutorials.service';
import * as dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { takeUntil, debounceTime, filter, catchError } from 'rxjs/operators';
import { SeoService } from './shared/services/seo/seo.service';
import { DeviceDetectionService } from './shared/services/device-detection.service';
import { TranslateService } from '@ngx-translate/core';
import { AuthStateService } from './shared/services/auth-state.service';
import { DataDrivenLoaderService } from './shared/services/data-driven-loader.service';
import { AppLoadingPhaseService } from './shared/services/app-loading-phase.service';
import { GoogleAnalyticsService } from './shared/services/google-analytics.service';
import { LanguageUrlService } from './shared/services/language-url.service';
import { HealthCheckService } from './shared/services/health-check.service';
import { SwUpdate } from '@angular/service-worker';

const getSessionStorage = (key: string, defaultValue: string = null) => {
  try { return (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(key)) || defaultValue; }
  catch { return defaultValue; }
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  isProduction = environment.production;

  // Overlay Angular — visible pendant le chargement des données
  overlayVisible  = false;
  overlayMessage  = 'Chargement…';
  overlayProgress = 0;
  overlayError: string | null = null;

  private tokenCheckInterval: Subscription;
  private userProfileCheckInterval: Subscription;

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
    private localizationService: LocalizationService,
    private translationService: TranslationService,
    private deviceService: DeviceDetectionService,
    private authStateService: AuthStateService,
    private cdr: ChangeDetectorRef,
    public dataDrivenLoader: DataDrivenLoaderService,
    private loadingPhase: AppLoadingPhaseService,
    private googleAnalytics: GoogleAnalyticsService,
    private languageUrlService: LanguageUrlService,
    private translateService: TranslateService,
    private healthCheck: HealthCheckService,
    private swUpdate: SwUpdate,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit(): void {
    // Mise à jour automatique du service worker (PWA)
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.pipe(takeUntil(this.destroy$))
        .subscribe(evt => {
          if (evt.type === 'VERSION_READY') {
            this.swUpdate.activateUpdate().then(() => window.location.reload());
          }
        });
    }
    // Health check backend
    if (isPlatformBrowser(this.platformId)) this.healthCheck.start();
    // Traductions — langue extraite depuis l'URL (prioritaire) ou le navigateur
    this.translateService.setDefaultLang('fr');
    const lang = this.getLanguageFromUrl();
    this.translateService.use(lang);

    // Overlay Angular piloté par DataDrivenLoaderService
    this.dataDrivenLoader.overlayVisible$.pipe(takeUntil(this.destroy$))
      .subscribe(v => {
        this.overlayVisible = v;
        // L'intercepteur HTTP utilise cet état pour ne pas toaster les erreurs
        // de lecture survenues pendant un chargement de page.
        this.loadingPhase.setLoading(v);
        this.cdr.detectChanges();
      });

    // L'état d'erreur garde l'overlay affiché : la phase de chargement reste
    // active tant que l'utilisateur n'a pas relancé ou changé de page.
    this.dataDrivenLoader.overlayError$.pipe(takeUntil(this.destroy$))
      .subscribe(err => {
        this.overlayError = err;
        this.loadingPhase.setLoading(this.overlayVisible);
      });

    this.dataDrivenLoader.overlayMessage$.pipe(takeUntil(this.destroy$))
      .subscribe(m => { this.overlayMessage = m; });

    this.dataDrivenLoader.overlayProgress$.pipe(takeUntil(this.destroy$))
      .subscribe(p => { this.overlayProgress = p; });

    // Google Analytics — applique le consentement stocké (chargement ou retrait
    // du script gtag). Les pagevues partent depuis l'abonnement NavigationEnd.
    if (isPlatformBrowser(this.platformId)) this.googleAnalytics.initFromConsent();

    // Front office detection
    this.initializeFrontOfficeDetection();

    // Day.js — locale française
    try { dayjs.locale(LOCAL_LANGUAGE.FR.toString()); } catch { console.warn('dayjs locale fr indisponible'); }

    // Fragments URL
    this.activatedRoute.fragment.pipe(
      takeUntil(this.destroy$),
      filter(f => !!f),
      debounceTime(300)
    ).subscribe(f => this.jumpToSection(f));

    // Query params (thème)
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(p => {
      try {
        this.settingsService.setTheme(p['theme'] || getSessionStorage('--app-theme', 'light'));
        this.settingsService.setSideBar(p['sidebar'] || getSessionStorage('--app-theme-sidebar', 'default'));
        this.settingsService.setHeader(p['header'] || getSessionStorage('--app-theme-header', 'default'));
      } catch { console.warn('Paramètres de thème invalides'); }
    });

    // SEO
    this.router.events.pipe(
      takeUntil(this.destroy$),
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: NavigationEnd) => {
      this.seoService.updateMetaTagsForRoute(e.urlAfterRedirects);
      // Google Analytics — pagevues suivies uniquement si consentement accepté.
      if (this.googleAnalytics.consentAccepted) {
        this.googleAnalytics.trackPageView(e.urlAfterRedirects);
      }
    });

    // Les timers/activity/profile ne doivent pas s'activer en SSR (rendu serveur)
    // sinon la zone Angular ne devient jamais stable et le rendu universel pend.
    if (!isPlatformBrowser(this.platformId)) return;

    // Token check toutes les 5 min
    this.tokenCheckInterval = interval(5 * 60 * 1000).pipe(
      takeUntil(this.destroy$),
      filter(() => this.store.selectSnapshot(AuthTokenState.selectStateUserIsLogin))
    ).subscribe(() => this.refreshTokenService.checkTokenExpiration().subscribe());

    // Profil check toutes les 10 min (l'activité utilisateur gère déjà la session)
    this.userProfileCheckInterval = interval(10 * 60 * 1000).pipe(
      takeUntil(this.destroy$),
      filter(() => this.store.selectSnapshot(AuthTokenState.selectStateUserIsLogin))
    ).subscribe(() => {
      this.store.dispatch(new UserProfileAction.FetchUserProfile())
        .pipe(catchError(() => of(null))).subscribe();
    });

    // Activité utilisateur
    this.userActivityService.getActivityState().pipe(takeUntil(this.destroy$)).subscribe();

    // Charger le profil si connecté
    this.authStateService.loadUserProfileConditionally(false);
  }

  /** Action « Réessayer » de l'overlay après un échec de chargement. */
  retryLoading(): void {
    this.dataDrivenLoader.retry();
  }

  private isInFrontOffice = false;

  private initializeFrontOfficeDetection(): void {
    this.checkIfFrontOffice(this.router.url);
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((e: NavigationEnd) => this.checkIfFrontOffice(e.url));
  }

  private checkIfFrontOffice(url: string): void {
    const backRoutes = ['/app', '/admin', '/monitoring', '/auth'];
    this.isInFrontOffice = !backRoutes.some(r => url.includes(r));
  }

  jumpToSection(section: string | null): void {
    if (!section) return;
    let attempts = 0;
    const tryScroll = () => {
      const el = document.getElementById(section);
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      else if (attempts++ < 10) setTimeout(tryScroll, 100);
    };
    tryScroll();
  }

  /**
   * Extrait la langue depuis la première segment de l'URL (ex: /en/home → 'en')
   */
  private getLanguageFromUrl(): string {
    if (isPlatformBrowser(this.platformId)) {
      const pathSegments = window.location.pathname.split('/').filter(Boolean);
      const langFromUrl = pathSegments[0];
      if (['fr', 'en'].includes(langFromUrl)) {
        return langFromUrl;
      }
    }
    const browserLang = isPlatformBrowser(this.platformId)
      ? (navigator.language || '').split('-')[0].toLowerCase()
      : 'fr';
    return ['fr', 'en'].includes(browserLang) ? browserLang : 'fr';
  }

  @HostListener('window:resize')
  onResize(): void {
    if (isPlatformBrowser(this.platformId)) this.deviceService.onResize();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.tokenCheckInterval?.unsubscribe();
    this.userProfileCheckInterval?.unsubscribe();
    this.healthCheck.stop();
  }
}
