import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
// import { Observable } from 'rxjs'; // Non utilisé pour le moment
import { UserProfileState } from '../../../../shared/store';
import { MobileNotificationService } from '../../../shared/services/mobile-notification.service';

@Component({
  selector: 'app-mobile-header',
  templateUrl: './mobile-header.component.html',
  styleUrls: ['./mobile-header.component.scss']
})
export class MobileHeaderComponent implements OnInit {
  @Input() currentRoute = '';
  @Input() isAuthenticated = false;
  @Input() isOnline = true;
  @Input() syncInProgress = false;

  userProfile$ = this.store.select(UserProfileState.selectStateUserProfile);
  
  constructor(
    private router: Router,
    private store: Store,
    private notificationService: MobileNotificationService
  ) {}

  ngOnInit(): void {}

  /**
   * Obtenir le titre de la page
   */
  getPageTitle(): string {
    const routeTitles: { [key: string]: string } = {
      '/mobile/search': 'Recherche',
      '/mobile/properties': 'Mes Biens',
      '/mobile/contracts': 'Contrats',
      '/mobile/billing': 'Facturation',
      '/mobile/profile': 'Profil',
      '/mobile/auth': 'Connexion'
    };

    for (const route in routeTitles) {
      if (this.currentRoute.includes(route)) {
        return routeTitles[route];
      }
    }

    return 'Ndiye';
  }

  /**
   * Vérifier si on peut revenir en arrière
   */
  canGoBack(): boolean {
    const noBackRoutes = [
      '/mobile/search',
      '/mobile/properties',
      '/mobile/contracts',
      '/mobile/billing',
      '/mobile/profile'
    ];

    return !noBackRoutes.some(route => this.currentRoute.includes(route));
  }

  /**
   * Revenir en arrière
   */
  goBack(): void {
    if (this.canGoBack()) {
      window.history.back();
    }
  }

  /**
   * Aller au profil utilisateur
   */
  goToProfile(): void {
    if (this.isAuthenticated) {
      this.router.navigate(['/mobile/profile']);
    } else {
      this.router.navigate(['/mobile/auth/login']);
    }
  }

  /**
   * Afficher les notifications
   */
  showNotifications(): void {
    this.notificationService.showInfo('Fonctionnalité bientôt disponible');
  }

  /**
   * Obtenir l'icône de statut de connexion
   */
  getConnectionIcon(): string {
    if (this.syncInProgress) {
      return 'sync';
    } else if (!this.isOnline) {
      return 'cloud-offline';
    } else {
      return 'wifi';
    }
  }

  /**
   * Obtenir la couleur de statut de connexion
   */
  getConnectionColor(): string {
    if (this.syncInProgress) {
      return 'warning';
    } else if (!this.isOnline) {
      return 'danger';
    } else {
      return 'success';
    }
  }

  /**
   * Obtenir les initiales de l'utilisateur
   */
  getUserInitials(userProfile: any): string {
    if (!userProfile) return 'U';
    
    const firstName = userProfile.firstName || '';
    const lastName = userProfile.lastName || '';
    
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || 'U';
  }

  /**
   * Obtenir l'avatar de l'utilisateur
   */
  getUserAvatar(userProfile: any): string | null {
    return userProfile?.avatar || null;
  }
}
