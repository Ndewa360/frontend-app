import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Services
import { ToastrService } from 'ngx-toastr';

// Store
import { UserProfileState, UserProfileAction, UserProfileModel } from '../../../../../shared/store';

@Component({
  selector: 'app-mobile-profile-page',
  templateUrl: './mobile-profile-page.component.html',
  styleUrls: ['./mobile-profile-page.component.scss']
})
export class MobileProfilePageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Observables du store
  userProfile$: Observable<UserProfileModel | null>;
  isLoading$: Observable<boolean>;

  // Propriétés locales
  userProfile: UserProfileModel | null = null;
  isLoading = false;

  constructor(
    private store: Store,
    private router: Router,
    private toastr: ToastrService
  ) {
    // Initialiser les observables
    this.userProfile$ = this.store.select(UserProfileState.selectStateUserProfile);
    this.isLoading$ = this.store.select(UserProfileState.selectStateLoading);
  }

  ngOnInit(): void {
    this.setupSubscriptions();
    this.loadUserProfile();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Configuration des souscriptions
   */
  private setupSubscriptions(): void {
    // Écouter les changements du profil utilisateur
    this.userProfile$
      .pipe(takeUntil(this.destroy$))
      .subscribe(profile => {
        this.userProfile = profile;
      });

    // Écouter l'état de chargement
    this.isLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
      });
  }

  /**
   * Charger le profil utilisateur
   */
  private loadUserProfile(): void {
    if (!this.userProfile) {
      this.store.dispatch(new UserProfileAction.FetchUserProfile());
    }
  }

  /**
   * Rafraîchir les données
   */
  async onRefresh(event: any): Promise<void> {
    try {
      this.store.dispatch(new UserProfileAction.FetchUserProfile());
      
      // Attendre un peu pour l'animation
      setTimeout(() => {
        event.target.complete();
      }, 1000);
      
    } catch (error) {
      event.target.complete();
      console.error('Erreur lors du rafraîchissement:', error);
    }
  }

  /**
   * Obtenir les initiales de l'utilisateur
   */
  getUserInitials(): string {
    if (!this.userProfile?.name) return 'U';
    
    const names = this.userProfile.name.split(' ');
    if (names.length >= 2) {
      return names[0].charAt(0).toUpperCase() + names[1].charAt(0).toUpperCase();
    }
    return names[0].charAt(0).toUpperCase();
  }

  /**
   * Obtenir l'email de l'utilisateur
   */
  getUserEmail(): string {
    return this.userProfile?.email || 'Non défini';
  }

  /**
   * Obtenir le téléphone de l'utilisateur
   */
  getUserPhone(): string {
    return this.userProfile?.phoneNumber || 'Non défini';
  }

  /**
   * Naviguer vers l'édition du profil
   */
  editProfile(): void {
    this.router.navigate(['/mobile/profile/edit']);
  }

  /**
   * Naviguer vers les paramètres
   */
  goToSettings(): void {
    this.router.navigate(['/mobile/profile/settings']);
  }

  /**
   * Naviguer vers les notifications
   */
  goToNotifications(): void {
    this.router.navigate(['/mobile/profile/notifications']);
  }

  /**
   * Naviguer vers l'aide
   */
  goToHelp(): void {
    // Ouvrir une page d'aide externe ou interne
    window.open('https://ndiye.com/aide', '_blank');
  }

  /**
   * Naviguer vers les conditions d'utilisation
   */
  goToTerms(): void {
    // Ouvrir les conditions d'utilisation
    window.open('https://ndiye.com/conditions', '_blank');
  }

  /**
   * Naviguer vers la politique de confidentialité
   */
  goToPrivacy(): void {
    // Ouvrir la politique de confidentialité
    window.open('https://ndiye.com/confidentialite', '_blank');
  }

  /**
   * Contacter le support
   */
  contactSupport(): void {
    // Ouvrir l'email ou WhatsApp pour contacter le support
    const email = 'support@ndiye.com';
    const subject = 'Support Ndiye Mobile';
    const body = `Bonjour,\n\nJ'ai besoin d'aide concernant l'application Ndiye.\n\nMerci.`;

    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  }

  /**
   * Se déconnecter
   */
  async logout(): Promise<void> {
    try {
      // Afficher une confirmation
      const confirmed = await this.showLogoutConfirmation();
      
      if (confirmed) {
        // Dispatcher l'action de déconnexion
        this.store.dispatch(new UserProfileAction.Logout());

        // Rediriger vers la page de connexion
        this.router.navigate(['/mobile/auth/login']);

        this.toastr.success('Déconnexion réussie');
      }
      
    } catch (error) {
      this.toastr.error('Erreur lors de la déconnexion');
      console.error('Erreur déconnexion:', error);
    }
  }

  /**
   * Afficher la confirmation de déconnexion
   */
  private async showLogoutConfirmation(): Promise<boolean> {
    return new Promise(async (resolve) => {
      try {
        // Utiliser une alerte Ionic native
        const alert = await this.createLogoutAlert();
        await alert.present();

        const { role } = await alert.onDidDismiss();
        resolve(role === 'confirm');

      } catch (error) {
        // Fallback vers confirm natif
        const confirmed = confirm('Êtes-vous sûr de vouloir vous déconnecter ?');
        resolve(confirmed);
      }
    });
  }

  /**
   * Créer l'alerte de confirmation de déconnexion
   */
  private async createLogoutAlert(): Promise<any> {
    // Import dynamique pour éviter les erreurs de compilation
    const { AlertController } = await import('@ionic/angular');
    const alertController = new AlertController();

    return alertController.create({
      header: 'Déconnexion',
      message: 'Êtes-vous sûr de vouloir vous déconnecter ?',
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Se déconnecter',
          role: 'confirm',
          cssClass: 'danger'
        }
      ]
    });
  }

  /**
   * Obtenir les statistiques utilisateur
   */
  getUserStats() {
    // Récupérer les vraies données depuis le store si disponibles
    const properties = this.store.selectSnapshot(state => state.property?.properties) || [];
    const contracts = this.store.selectSnapshot(state => state.contract?.contracts) || [];

    return {
      properties: properties.length,
      contracts: contracts.length,
      payments: contracts.reduce((total, contract) => total + (contract.payments?.length || 0), 0)
    };
  }

  /**
   * Partager l'application
   */
  shareApp(): void {
    if (navigator.share) {
      navigator.share({
        title: 'Ndiye - Trouvez votre logement idéal',
        text: 'Découvrez Ndiye, l\'application pour trouver et gérer vos locations au Cameroun',
        url: 'https://ndiye.com'
      });
    } else {
      // Fallback pour les navigateurs qui ne supportent pas l'API Share
      this.toastr.info('Partagez Ndiye avec vos amis !');
    }
  }

  /**
   * Noter l'application
   */
  rateApp(): void {
    // Détecter la plateforme et rediriger vers le bon store
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes('android')) {
      // Rediriger vers Google Play Store
      window.open('https://play.google.com/store/apps/details?id=com.ndiye.app', '_blank');
    } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      // Rediriger vers App Store
      window.open('https://apps.apple.com/app/ndiye/id123456789', '_blank');
    } else {
      // Fallback pour le web
      this.toastr.info('Téléchargez notre app mobile pour nous noter !');
    }
  }
}
