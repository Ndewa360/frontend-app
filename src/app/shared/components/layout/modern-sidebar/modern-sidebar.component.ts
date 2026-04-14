import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Store, Select } from '@ngxs/store';
import { Observable, Subscription } from 'rxjs';
import { UserProfileAction } from '../../../store/user-profile/user-profile.actions';
import { UserProfileState } from '../../../store/user-profile/user-profile.state';
import { UserProfileModel } from '../../../store/user-profile/user-profile.model';
import { LanguagePreservationService } from '../../../services/language-preservation.service';
import { LanguageUrlService } from '../../../services/language-url.service';

export interface NavItem {
  id: string;
  label: string;
  route?: string;
  icon: string;
  badge?: string | number;
  children?: NavItem[];
  expanded?: boolean;
  disabled?: boolean;
}

export interface UserMenuItem {
  id: string;
  label: string;
  route?: string;
  icon: string;
  action?: () => void;
}

@Component({
  selector: 'app-modern-sidebar',
  templateUrl: './modern-sidebar.component.html',
  styleUrls: ['./modern-sidebar.component.scss']
})
export class ModernSidebarComponent implements OnInit, OnDestroy {
  @Input() appTitle: string = 'Ndewa360';
  @Input() appSubtitle: string = 'Gestion immobilière';
  @Input() collapsed: boolean = false;
  @Input() mobileOpen: boolean = false;

  @Output() collapsedChange = new EventEmitter<boolean>();
  @Output() mobileOpenChange = new EventEmitter<boolean>();
  @Output() navItemClicked = new EventEmitter<NavItem>();

  @Select(UserProfileState.selectStateUserProfile) userProfile$: Observable<UserProfileModel>;

  userName: string = 'Utilisateur';
  userRole: string = 'Propriétaire';
  userAvatar: string | undefined;

  isMobile: boolean = false;
  userMenuOpen: boolean = false;

  private sub: Subscription;

  get mainNavItems(): NavItem[] {
    const lang = this.languageUrlService.getCurrentLanguage();
    return [
      {
        id: 'properties',
        label: 'Propriétés',
        route: `/${lang}/app/properties/home`,
        icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h4M9 21v-4a2 2 0 012-2h2a2 2 0 012 2v4M9 21h6'
      },
      {
        id: 'search',
        label: 'Recherche',
        route: `/${lang}/search/index`,
        icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
      },
      {
        id: 'billing',
        label: 'Facturation',
        route: `/${lang}/app/facturation/plan`,
        icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
      },
      {
        id: 'statistics',
        label: 'Statistiques',
        route: `/${lang}/app/statistics`,
        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
      }
    ];
  }

  get managementNavItems(): NavItem[] {
    const lang = this.languageUrlService.getCurrentLanguage();
    return [
      {
        id: 'contracts',
        label: 'Contrats',
        route: `/${lang}/app/contract`,
        icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
      },
      {
        id: 'wallet',
        label: 'Portefeuille',
        route: `/${lang}/app/wallet`,
        icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'
      }
    ];
  }

  get userMenuItems(): UserMenuItem[] {
    const lang = this.languageUrlService.getCurrentLanguage();
    return [
      {
        id: 'profile',
        label: 'Mon profil',
        route: `/${lang}/app/profile`,
        icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
      },
      {
        id: 'settings',
        label: 'Paramètres',
        route: `/${lang}/app/user/settings`,
        icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'
      },
      {
        id: 'logout',
        label: 'Déconnexion',
        icon: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
        action: () => this.logout()
      }
    ];
  }

  constructor(
    private store: Store,
    private router: Router,
    private languagePreservation: LanguagePreservationService,
    private languageUrlService: LanguageUrlService
  ) {}

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.checkMobile();
  }

  ngOnInit(): void {
    this.checkMobile();
    // Connecter le nom et rôle au profil utilisateur réel depuis le store
    this.sub = this.userProfile$.subscribe(user => {
      if (user) {
        this.userName = user.name || user['fullName'] || 'Utilisateur';
        this.userRole = this.resolveUserRole(user);
        this.userAvatar = user['profilPicture'] || undefined;
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private resolveUserRole(user: any): string {
    if (user.userType === 'AGENT') return 'Agent immobilier';
    if (user.roles?.some((r: any) => (typeof r === 'string' ? r : r?.name) === 'super-admin')) return 'Super Admin';
    if (user.roles?.some((r: any) => (typeof r === 'string' ? r : r?.name) === 'admin')) return 'Administrateur';
    return 'Propriétaire';
  }

  private checkMobile(): void {
    this.isMobile = window.innerWidth < 768;
    if (this.isMobile && this.collapsed) {
      this.collapsed = false;
      this.collapsedChange.emit(this.collapsed);
    }
  }

  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
    this.userMenuOpen = false;
  }

  toggleMobile(): void {
    this.mobileOpen = !this.mobileOpen;
    this.mobileOpenChange.emit(this.mobileOpen);
  }

  closeMobile(): void {
    this.mobileOpen = false;
    this.mobileOpenChange.emit(this.mobileOpen);
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  onNavItemClick(item: NavItem): void {
    if (item.children) {
      item.expanded = !item.expanded;
    }
    if (this.isMobile) this.closeMobile();
    this.navItemClicked.emit(item);
  }

  onUserMenuClick(item: UserMenuItem): void {
    this.userMenuOpen = false;
    if (item.action) {
      item.action();
    } else if (item.route) {
      this.router.navigate([item.route]);
    }
    if (this.isMobile) this.closeMobile();
  }

  trackByNavItem(index: number, item: NavItem): string {
    return item.id;
  }

  getSidebarClasses(): string {
    const base = 'sidebar-modern fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200 transition-all duration-300';
    const width = this.collapsed ? 'w-16' : 'w-64';
    const mobile = this.isMobile ? 'transform -translate-x-full' : '';
    return `${base} ${width} ${mobile}`.trim();
  }

  getNavItemClasses(item: NavItem): string {
    const base = 'nav-item flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200';
    const disabled = item.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100';
    return `${base} ${disabled}`;
  }

  getUserInitials(): string {
    return this.userName
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  private logout(): void {
    this.languagePreservation.preserveCurrentLanguage();
    this.store.dispatch(new UserProfileAction.LogoutUserProfile(true));
  }
}
