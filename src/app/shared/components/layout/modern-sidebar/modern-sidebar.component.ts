import { Component, Input, Output, EventEmitter, OnInit, HostListener } from '@angular/core';
import { Store } from '@ngxs/store';
import { UserProfileAction } from '../../../store/user-profile/user-profile.actions';
import { LanguagePreservationService } from '../../../services/language-preservation.service';

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
export class ModernSidebarComponent implements OnInit {
  @Input() appTitle: string = 'Ndiye';
  @Input() appSubtitle: string = 'Gestion immobilière';
  @Input() userName: string = 'Utilisateur';
  @Input() userRole: string = 'Propriétaire';
  @Input() userAvatar?: string;
  @Input() collapsed: boolean = false;
  @Input() mobileOpen: boolean = false;

  @Output() collapsedChange = new EventEmitter<boolean>();
  @Output() mobileOpenChange = new EventEmitter<boolean>();
  @Output() navItemClicked = new EventEmitter<NavItem>();

  isMobile: boolean = false;
  userMenuOpen: boolean = false;

  mainNavItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      route: '/dashboard',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
    },
    {
      id: 'properties',
      label: 'Propriétés',
      route: '/properties',
      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h4M9 21v-4a2 2 0 012-2h2a2 2 0 012 2v4M9 21h6',
      badge: '12'
    },
    {
      id: 'search',
      label: 'Recherche',
      route: '/search',
      icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
    },
    {
      id: 'tenants',
      label: 'Locataires',
      route: '/tenants',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
      badge: '34'
    },
    {
      id: 'finances',
      label: 'Finances',
      route: '/finances',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
      children: [
        {
          id: 'payments',
          label: 'Paiements',
          route: '/finances/payments',
          icon: '',
          badge: '3'
        },
        {
          id: 'reports',
          label: 'Rapports',
          route: '/finances/reports',
          icon: ''
        }
      ]
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
      route: '/maintenance',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
      badge: '2'
    }
  ];

  managementNavItems: NavItem[] = [
    {
      id: 'contracts',
      label: 'Contrats',
      route: '/contracts',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
    },
    {
      id: 'documents',
      label: 'Documents',
      route: '/documents',
      icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z'
    },
    {
      id: 'analytics',
      label: 'Analyses',
      route: '/analytics',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
    }
  ];

  userMenuItems: UserMenuItem[] = [
    {
      id: 'profile',
      label: 'Mon profil',
      route: '/profile',
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
    },
    {
      id: 'settings',
      label: 'Paramètres',
      route: '/settings',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'
    },
    {
      id: 'help',
      label: 'Aide',
      route: '/help',
      icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    {
      id: 'logout',
      label: 'Déconnexion',
      icon: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
      action: () => this.logout()
    }
  ];

  constructor(
    private store: Store,
    private languagePreservation: LanguagePreservationService
  ) {}

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.checkMobile();
  }

  ngOnInit(): void {
    this.checkMobile();
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
    
    if (this.isMobile) {
      this.closeMobile();
    }
    
    this.navItemClicked.emit(item);
  }

  onUserMenuClick(item: UserMenuItem): void {
    this.userMenuOpen = false;
    
    if (item.action) {
      item.action();
    }
    
    if (this.isMobile) {
      this.closeMobile();
    }
  }

  trackByNavItem(index: number, item: NavItem): string {
    return item.id;
  }

  getSidebarClasses(): string {
    const baseClasses = 'sidebar-modern fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200 transition-all duration-300';
    const widthClasses = this.collapsed ? 'w-16' : 'w-64';
    const mobileClasses = this.isMobile ? 'transform -translate-x-full' : '';
    
    return `${baseClasses} ${widthClasses} ${mobileClasses}`.trim();
  }

  getNavItemClasses(item: NavItem): string {
    const baseClasses = 'nav-item flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200';
    const disabledClasses = item.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100';
    
    return `${baseClasses} ${disabledClasses}`;
  }

  getUserInitials(): string {
    return this.userName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  private logout(): void {
    // Préserver la langue et déconnecter
    this.languagePreservation.preserveCurrentLanguage();
    this.store.dispatch(new UserProfileAction.LogoutUserProfile(true));
  }
}
