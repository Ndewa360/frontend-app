import { trackByFn } from '../../../../shared/utils/track-by.util';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute, RouterLink, RouterOutlet } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { UserProfileState } from '../../../../shared/store/user-profile/user-profile.state';
import { UserProfileAction } from '../../../../shared/store/user-profile/user-profile.actions';
import { LanguagePreservationService } from '../../../../shared/services/language-preservation.service';
import { AdminCurrencyService } from '../../services/admin-currency.service';
import { SelectModule } from 'carbon-components-angular';
import { NgFor, NgIf, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface AdminMenuItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  description?: string;
  badge?: number;
}

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
  standalone: true,
  imports: [RouterLink, FormsModule, NgFor, SelectModule, NgIf, RouterOutlet, AsyncPipe, TranslatePipe]
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  trackByFn = trackByFn;

  private destroy$   = new Subject<void>();
  // Subject dédié pour annuler la subscription route.data à chaque navigation
  private routeData$ = new Subject<void>();

  currentUser$ = this.store.select(UserProfileState.selectStateUserProfile);
  currentRoute = '';
  pageTitle    = '';
  breadcrumbs: string[] = [];
  menuItems: AdminMenuItem[] = [];
  selectedCurrency = 'XAF';

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private store: Store,
    private languagePreservation: LanguagePreservationService,
    private translate: TranslateService,
    private currencyService: AdminCurrencyService
  ) {}

  ngOnInit(): void {
    this.buildMenuItems();
    this.setupRouteListener();
    this.updateCurrentRoute();

    this.currencyService.init();
    this.selectedCurrency = this.currencyService.currency;
    this.currencyService.currencyChange$
      .pipe(takeUntil(this.destroy$))
      .subscribe(currency => this.selectedCurrency = currency);

    // Reconstruire le menu quand la langue change
    this.translate.onLangChange
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.buildMenuItems();
        this.updateCurrentRoute();
      });
  }

  ngOnDestroy(): void {
    this.routeData$.next();
    this.routeData$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildMenuItems(): void {
    // id → clés ADMIN.MENU.<KEY> et ADMIN.DESCRIPTIONS.<KEY>
    const items: Array<[string, string, string]> = [
      ['dashboard',        'DASHBOARD',         'tachometer-alt'],
      ['users',            'USERS',             'users'],
      ['subscriptions',    'SUBSCRIPTIONS',     'crown'],
      ['payments',         'PAYMENTS',          'credit-card'],
      ['premium-sales',    'PREMIUM_SALES',     'key'],
      ['platform-finance', 'PLATFORM_FINANCE',  'wallet'],
      ['agents',           'AGENTS',            'user-tie'],
      ['roles',            'ROLES_PERMISSIONS', 'user-shield'],
      ['geography',        'GEOGRAPHY',         'globe-africa'],
      ['breach',           'BREACH',            'shield-virus'],
      ['errors',           'ERRORS',            'bug'],
      ['audit',            'AUDIT',             'history'],
      ['settings',         'SETTINGS',          'cog'],
    ];
    this.menuItems = items.map(([id, key, icon]) => ({
      id,
      label: this.translate.instant(`ADMIN.MENU.${key}`),
      icon,
      route: this.getRouteWithLang(`/admin/${id}`),
      description: this.translate.instant(`ADMIN.DESCRIPTIONS.${key}`),
    }));
  }

  private setupRouteListener(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.updateCurrentRoute();
    });
  }

  private updateCurrentRoute(): void {
    this.currentRoute = this.router.url;

    // Annuler la subscription précédente sur route.data avant d'en créer une nouvelle
    this.routeData$.next();

    let route = this.activatedRoute;
    while (route.firstChild) {
      route = route.firstChild;
    }

    route.data.pipe(takeUntil(this.routeData$)).subscribe(data => {
      const titleKey = data['title'] || 'ADMIN.TITLE';
      this.pageTitle  = this.translate.instant(titleKey);
      this.breadcrumbs = [this.translate.instant('ADMIN.TITLE')];
      if (data['breadcrumb']) {
        this.breadcrumbs.push(this.translate.instant(data['breadcrumb']));
      }
    });
  }

  isActiveRoute(itemId: string): boolean {
    return this.currentRoute.includes(`/admin/${itemId}`);
  }

  getRouteWithLang(route: string): string {
    const currentLang = this.translate.currentLang || 'fr';
    return `/${currentLang}${route}`;
  }

  onLogout(): void {
    this.languagePreservation.preserveCurrentLanguage();
    this.store.dispatch(new UserProfileAction.LogoutUserProfile(true));
  }

  getUserFullName(user: any): string {
    return `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.name || '';
  }

  getInitials(user: any): string {
    const first = user?.firstName?.charAt(0) || '';
    const last  = user?.lastName?.charAt(0)  || '';
    return (first + last).toUpperCase() || (user?.name?.charAt(0) || 'A').toUpperCase();
  }

  onCurrencyChange(code: string): void {
    this.currencyService.setCurrency(code);
  }

  get currencies(): string[] {
    return this.currencyService.availableCurrencies;
  }

  get currencyLabels(): Record<string, string> {
    return this.currencyService.currencyLabels;
  }
}
