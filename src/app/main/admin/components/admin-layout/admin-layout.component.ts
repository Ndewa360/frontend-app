import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { UserProfileState } from '../../../../shared/store/user-profile/user-profile.state';

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

  menuItems: AdminMenuItem[] = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: 'tachometer-alt',
      route: '/admin/dashboard',
      description: 'Vue d\'ensemble du système'
    },
    {
      id: 'users',
      label: 'Utilisateurs',
      icon: 'users',
      route: '/admin/users',
      description: 'Gestion des utilisateurs'
    },
    {
      id: 'roles',
      label: 'Rôles & Permissions',
      icon: 'user-shield',
      route: '/admin/roles',
      description: 'Gestion des rôles et permissions'
    },
    {
      id: 'geography',
      label: 'Géographie',
      icon: 'globe-africa',
      route: '/admin/geography',
      description: 'Pays, villes et devises'
    },
    {
      id: 'payments',
      label: 'Paiements',
      icon: 'credit-card',
      route: '/admin/payments',
      description: 'Gestion des paiements et souscriptions'
    },
    {
      id: 'settings',
      label: 'Paramètres',
      icon: 'cog',
      route: '/admin/settings',
      description: 'Configuration du système'
    },
    {
      id: 'monitoring',
      label: 'Monitoring',
      icon: 'chart-line',
      route: '/admin/monitoring',
      description: 'Surveillance et monitoring du système'
    }
  ];

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private store: Store
  ) {}

  ngOnInit(): void {
    this.setupRouteListener();
    this.updateCurrentRoute();
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
      this.pageTitle = data['title'] || 'Administration';
      this.breadcrumbs = ['Administration'];
      if (data['breadcrumb']) {
        this.breadcrumbs.push(data['breadcrumb']);
      }
    });
  }

  isActiveRoute(route: string): boolean {
    return this.currentRoute.includes(route);
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  onLogout(): void {
    // Logique de déconnexion
    this.router.navigate(['/auth/login']);
  }

  // Template helper methods to simplify expressions
  getUserProfilePicture(user: any): string {
    return user?.profilePicture || '/assets/images/default-avatar.png';
  }

  getUserFullName(user: any): string {
    return `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
  }
}
