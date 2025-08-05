import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Platform } from '@ionic/angular';
import { Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { takeUntil, filter, map } from 'rxjs/operators';
import { UserProfileState } from '../../shared/store';
import { MobileDebugService } from '../shared/services/mobile-debug.service';
import { DeviceDetectionService } from '../../shared/services/device-detection.service';
import { environment } from '../../../environments/environment';
import { NetworkStatusService } from '../../shared/services/network-status.service';

@Component({
  selector: 'app-mobile-layout',
  templateUrl: './mobile-layout.component.html',
  styleUrls: ['./mobile-layout.component.scss']
})
export class MobileLayoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  currentRoute = '';
  isAuthenticated = false;
  isOnline = true;
  syncInProgress = false;

  constructor(
    private router: Router,
    private platform: Platform,
    private store: Store,
    private debugService: MobileDebugService,
    private networkService: NetworkStatusService,
    private deviceDetectionService: DeviceDetectionService
  ) {
    this.initializeApp();
  }

  ngOnInit(): void {
    console.log('🚀 MobileLayoutComponent ngOnInit démarré');
    console.log('📱 Plateforme:', this.platform.platforms());
    console.log('🌐 URL actuelle:', this.router.url);
    console.log('📱 URL complète:', window.location.href);

    // Diagnostic DOM immédiat
    console.log('📱 Diagnostic DOM layout:');
    console.log('  - app-root:', !!document.querySelector('app-root'));
    console.log('  - ion-app:', !!document.querySelector('ion-app'));
    console.log('  - mobile-layout:', !!document.querySelector('app-mobile-layout'));

    try {
      this.setupRouteTracking();
      console.log('✅ Route tracking configuré');

      this.setupAuthTracking();
      console.log('✅ Auth tracking configuré');

      this.setupNetworkTracking();
      console.log('✅ Network tracking configuré');

      // Tester la connectivité API et charger les données essentielles
      this.initializeEssentialData();

      console.log('✅ Layout mobile initialisé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation du layout mobile:', error);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialiser l'application mobile
   */
  private async initializeApp(): Promise<void> {
    try {
      console.log('📱 Démarrage de l\'initialisation mobile...');

      // Vérifier que ion-app existe
      const ionApp = document.querySelector('ion-app');
      if (!ionApp) {
        console.error('❌ ion-app non trouvé dans le DOM');
        this.createIonAppIfMissing();
      } else {
        console.log('✅ ion-app trouvé dans le DOM');
      }

      // Attendre que la plateforme soit prête
      await this.platform.ready();
      console.log('✅ Plateforme Ionic prête');

      // Initialiser le debug avec vérification
      this.debugService.initializeMobileDebug();
      this.debugService.checkAndFixMobileLoader();
      this.debugService.showDebugInfo();

      // Vérifier que les services essentiels sont disponibles
      await this.checkEssentialServices();

      console.log('📱 Application mobile initialisée avec succès');

      // Supprimer le loader après initialisation réussie
      setTimeout(() => {
        this.debugService.forceRemoveLoader();
      }, 1000);

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation mobile:', error);

      // Forcer la suppression du loader en cas d'erreur
      setTimeout(() => {
        this.debugService.forceRemoveLoader();
      }, 500);
    }
  }

  /**
   * Vérifier que les services essentiels sont disponibles
   */
  private async checkEssentialServices(): Promise<void> {
    try {
      // Vérifier le store NgXS
      const storeState = this.store.snapshot();
      console.log('✅ Store NgXS disponible:', !!storeState);

      // Vérifier la connectivité réseau
      const isOnline = navigator.onLine;
      console.log('🌐 Connectivité réseau:', isOnline);

      // Vérifier les traductions
      const hasTranslations = document.querySelector('[translate]');
      console.log('🌍 Système de traduction:', !!hasTranslations);

    } catch (error) {
      console.warn('⚠️ Problème avec les services essentiels:', error);
    }
  }

  /**
   * Suivre les changements de route
   */
  private setupRouteTracking(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.urlAfterRedirects;
        console.log('📍 Route mobile:', this.currentRoute);
      });
  }

  /**
   * Suivre l'état d'authentification
   */
  private setupAuthTracking(): void {
    this.store.select(UserProfileState.selectStateUserProfile).pipe(
      map(userProfile => !!userProfile && !!userProfile._id)
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuth => {
        this.isAuthenticated = isAuth;
        console.log('🔐 État d\'authentification:', isAuth ? 'Connecté' : 'Déconnecté');
      });
  }

  /**
   * Suivre l'état du réseau
   */
  private setupNetworkTracking(): void {
    // Utiliser le service de statut réseau
    this.networkService.networkStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.isOnline = status.isOnline && status.isBackendReachable;
        console.log('🌐 Statut réseau mobile:', status);
      });
  }



  /**
   * Vérifier si une route est active
   */
  isRouteActive(route: string): boolean {
    return this.currentRoute.includes(route);
  }

  /**
   * Obtenir l'icône d'état de connexion
   */
  getConnectionIcon(): string {
    return this.isOnline ? 'wifi' : 'wifi-off';
  }

  /**
   * Obtenir la couleur d'état de connexion
   */
  getConnectionColor(): string {
    return this.isOnline ? 'success' : 'danger';
  }

  /**
   * Tester la connectivité API
   */
  private async testApiConnectivity(): Promise<void> {
    try {
      console.log('🧪 Test de connectivité API...');

      // Test simple de connectivité
      const apiUrl = environment.apiUrl;
      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        timeout: 5000
      } as any);

      if (response.ok) {
        console.log('✅ Backend accessible');
      } else {
        console.log('❌ Backend inaccessible');
        this.showConnectivityWarning();
      }
    } catch (error) {
      console.error('❌ Erreur lors du test de connectivité:', error);
      this.showConnectivityWarning();
    }
  }

  /**
   * Initialiser les données essentielles
   */
  private async initializeEssentialData(): Promise<void> {
    try {
      console.log('🔄 Initialisation des données essentielles...');

      // Test de connectivité API
      await this.testApiConnectivity();

      // Redirection automatique vers la recherche si on est sur la racine mobile
      if (this.router.url === '/mobile' || this.router.url === '/mobile/') {
        console.log('📱 Redirection automatique vers la recherche mobile');
        await this.router.navigate(['/mobile/search']);
      }

      console.log('✅ Données essentielles initialisées');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des données:', error);
    }
  }

  /**
   * Créer ion-app si manquant
   */
  private createIonAppIfMissing(): void {
    try {
      console.log('🔧 Création de ion-app manquant...');

      const appRoot = document.querySelector('app-root');
      if (appRoot) {
        // Créer ion-app
        const ionApp = document.createElement('ion-app');
        ionApp.innerHTML = appRoot.innerHTML;

        // Remplacer le contenu
        appRoot.innerHTML = '';
        appRoot.appendChild(ionApp);

        console.log('✅ ion-app créé avec succès');
      } else {
        console.error('❌ app-root non trouvé');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la création de ion-app:', error);
    }
  }

  /**
   * Afficher un avertissement de connectivité
   */
  private showConnectivityWarning(): void {
    console.warn('⚠️ Problème de connectivité détecté - Vérifiez que le backend tourne sur http://192.168.1.5:3001');
  }
}
