import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

interface TabItem {
  route: string;
  icon: string;
  label: string;
  requiresAuth: boolean;
  badge?: number;
}

@Component({
  selector: 'app-mobile-tabs',
  templateUrl: './mobile-tabs.component.html',
  styleUrls: ['./mobile-tabs.component.scss']
})
export class MobileTabsComponent {
  @Input() currentRoute = '';
  @Input() isAuthenticated = false;

  tabs: TabItem[] = [
    {
      route: '/mobile/search',
      icon: 'search',
      label: 'Recherche',
      requiresAuth: false
    },
    {
      route: '/mobile/properties',
      icon: 'home',
      label: 'Biens',
      requiresAuth: true
    },
    {
      route: '/mobile/contracts',
      icon: 'document-text',
      label: 'Contrats',
      requiresAuth: true
    },
    {
      route: '/mobile/billing',
      icon: 'card',
      label: 'Facturation',
      requiresAuth: true
    },
    {
      route: '/mobile/profile',
      icon: 'person',
      label: 'Profil',
      requiresAuth: true
    }
  ];

  constructor(private router: Router) {}

  /**
   * Naviguer vers un onglet
   */
  navigateToTab(tab: TabItem): void {
    if (tab.requiresAuth && !this.isAuthenticated) {
      // Rediriger vers la connexion
      this.router.navigate(['/mobile/auth/login']);
      return;
    }

    this.router.navigate([tab.route]);
  }

  /**
   * Vérifier si un onglet est actif
   */
  isTabActive(tab: TabItem): boolean {
    return this.currentRoute.includes(tab.route.replace('/mobile', ''));
  }

  /**
   * Obtenir les onglets visibles
   */
  getVisibleTabs(): TabItem[] {
    if (!this.isAuthenticated) {
      // Afficher seulement les onglets publics + connexion
      return [
        ...this.tabs.filter(tab => !tab.requiresAuth),
        {
          route: '/mobile/auth/login',
          icon: 'log-in',
          label: 'Connexion',
          requiresAuth: false
        }
      ];
    }

    return this.tabs;
  }

  /**
   * Obtenir la couleur de l'onglet
   */
  getTabColor(tab: TabItem): string {
    if (this.isTabActive(tab)) {
      return 'primary';
    }

    if (tab.requiresAuth && !this.isAuthenticated) {
      return 'medium';
    }

    return 'medium';
  }

  /**
   * Vérifier si l'onglet est désactivé
   */
  isTabDisabled(tab: TabItem): boolean {
    return tab.requiresAuth && !this.isAuthenticated;
  }
}
