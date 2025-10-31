import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { TranslateService } from '@ngx-translate/core';
import { UserProfileState } from '../../../../shared/store/user-profile/user-profile.state';
import { UserProfileAction } from '../../../../shared/store/user-profile/user-profile.actions';
import { LanguagePreservationService } from '../../../../shared/services/language-preservation.service';

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
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  currentUser$ = this.store.select(UserProfileState.selectStateUserProfile);
  currentRoute = '';
  pageTitle = '';
  breadcrumbs: string[] = [];

  menuItems: AdminMenuItem[] = [];

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private store: Store,
    private languagePreservation: LanguagePreservationService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.initializeMenuItems();
    this.setupRouteListener();
    this.updateCurrentRoute();
  }

  private initializeMenuItems(): void {
    this.menuItems = [
      {
        id: 'dashboard',
        label: this.translate.instant('ADMIN.MENU.DASHBOARD'),
        icon: 'tachometer-alt',
        route: this.getRouteWithLang('/admin/dashboard'),
        description: this.translate.instant('ADMIN.DESCRIPTIONS.DASHBOARD')
      },
      {
        id: 'users',
        label: this.translate.instant('ADMIN.MENU.USERS'),
        icon: 'users',
        route: this.getRouteWithLang('/admin/users'),
        description: this.translate.instant('ADMIN.DESCRIPTIONS.USERS')
      },
      {
        id: 'roles',
        label: this.translate.instant('ADMIN.MENU.ROLES_PERMISSIONS'),
        icon: 'user-shield',
        route: this.getRouteWithLang('/admin/roles'),
        description: this.translate.instant('ADMIN.DESCRIPTIONS.ROLES_PERMISSIONS')
      },
      {
        id: 'geography',
        label: this.translate.instant('ADMIN.MENU.GEOGRAPHY'),
        icon: 'globe-africa',
        route: this.getRouteWithLang('/admin/geography'),
        description: this.translate.instant('ADMIN.DESCRIPTIONS.GEOGRAPHY')
      },
      {
        id: 'payments',
        label: this.translate.instant('ADMIN.MENU.PAYMENTS'),
        icon: 'credit-card',
        route: this.getRouteWithLang('/admin/payments'),
        description: this.translate.instant('ADMIN.DESCRIPTIONS.PAYMENTS')
      },
      {
        id: 'settings',
        label: this.translate.instant('ADMIN.MENU.SETTINGS'),
        icon: 'cog',
        route: this.getRouteWithLang('/admin/settings'),
        description: this.translate.instant('ADMIN.DESCRIPTIONS.SETTINGS')
      },
      {
        id: 'monitoring',
        label: this.translate.instant('ADMIN.MENU.MONITORING'),
        icon: 'chart-line',
        route: this.getRouteWithLang('/admin/monitoring'),
        description: this.translate.instant('ADMIN.DESCRIPTIONS.MONITORING')
      }
    ];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
    
    // Extraire le titre et les breadcrumbs depuis les données de route
    let route = this.activatedRoute;
    while (route.firstChild) {
      route = route.firstChild;
    }
    
    route.data.pipe(
      takeUntil(this.destroy$)
    ).subscribe(data => {
      // Traduire le titre de page
      const titleKey = data['title'] || 'ADMIN.TITLE';
      this.pageTitle = this.translate.instant(titleKey);
      
      // Traduire les breadcrumbs
      this.breadcrumbs = [this.translate.instant('ADMIN.TITLE')];
      if (data['breadcrumb']) {
        this.breadcrumbs.push(this.translate.instant(data['breadcrumb']));
      }
    });
  }

  isActiveRoute(route: string): boolean {
    return this.currentRoute.includes(route);
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  getRouteWithLang(route: string): string {
    const currentLang = this.translate.currentLang || 'en';
    return `/${currentLang}${route}`;
  }

  onLogout(): void {
    // Préserver la langue et déconnecter
    this.languagePreservation.preserveCurrentLanguage();
    this.store.dispatch(new UserProfileAction.LogoutUserProfile(true));
  }

  // Template helper methods to simplify expressions
  getUserProfilePicture(user: any): string {
    return user?.profilePicture || '/assets/images/default-avatar.png';
  }

  getUserFullName(user: any): string {
    return `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
  }
}
