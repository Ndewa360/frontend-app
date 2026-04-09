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

const getSessionStorage = (key: string, defaultValue: string = null) => {
  try { return sessionStorage.getItem(key) || defaultValue; }
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
    private networkStatusService: NetworkStatusService,
    private monitoringService: MonitoringService,
    private localizationService: LocalizationService,
    private translationService: TranslationService,
    private deviceService: DeviceDetectionService,
    private authStateService: AuthStateService,
    private cdr: ChangeDetectorRef,
    public dataDrivenLoader: DataDrivenLoaderService,
    private languageUrlService: LanguageUrlService,
    private translateService: TranslateService,
  ) {}

  ngOnInit(): void {
    // Traductions — langue détectée depuis le navigateur
    this.translateService.setDefaultLang('en');
    const browserLang = (navigator.language || '').split('-')[0].toLowerCase();
    const lang = ['fr', 'en'].includes(browserLang) ? browserLang : 'en';
    this.translateService.use(lang);

    // Overlay Angular piloté par DataDrivenLoaderService
    this.dataDrivenLoader.overlayVisible$.pipe(takeUntil(this.destroy$))
      .subscribe(v => { this.overlayVisible = v; this.cdr.detectChanges(); });

    this.dataDrivenLoader.overlayMessage$.pipe(takeUntil(this.destroy$))
      .subscribe(m => { this.overlayMessage = m; });

    this.dataDrivenLoader.overlayProgress$.pipe(takeUntil(this.destroy$))
      .subscribe(p => { this.overlayProgress = p; });

    // Monitoring
    this.monitoringService.initializeErrorCapture();

    // Front office detection
    this.initializeFrontOfficeDetection();

    // Moment.js
    try { moment.locale(LOCAL_LANGUAGE.FR.toString()); } catch {}

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
      } catch {}
    });

    // SEO
    this.router.events.pipe(
      takeUntil(this.destroy$),
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: NavigationEnd) => {
      this.seoService.updateMetaTagsForRoute(e.urlAfterRedirects);
    });

    // Token check toutes les 5 min
    this.tokenCheckInterval = interval(5 * 60 * 1000).pipe(
      takeUntil(this.destroy$),
      filter(() => this.store.selectSnapshot(AuthTokenState.selectStateUserIsLogin))
    ).subscribe(() => this.refreshTokenService.checkTokenExpiration().subscribe());

    // Profil check toutes les 2 min
    this.userProfileCheckInterval = interval(2 * 60 * 1000).pipe(
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

  @HostListener('window:resize')
  onResize(): void { this.deviceService.onResize(); }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.tokenCheckInterval?.unsubscribe();
    this.userProfileCheckInterval?.unsubscribe();
  }
}
