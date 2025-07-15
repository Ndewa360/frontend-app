import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Platform } from '@ionic/angular';
import { Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { takeUntil, filter, map } from 'rxjs/operators';
import { UserProfileState } from '../../shared/store';
import { MobileDebugService } from '../shared/services/mobile-debug.service';
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
    private networkService: NetworkStatusService
  ) {
    this.initializeApp();
  }

  ngOnInit(): void {
    this.setupRouteTracking();
    this.setupAuthTracking();
    this.setupNetworkTracking();
    console.log('✅ Layout mobile initialisé');
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
      await this.platform.ready();

      // Initialiser le debug
      this.debugService.initializeMobileDebug();
      this.debugService.showDebugInfo();

      console.log('📱 Application mobile initialisée');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation mobile:', error);

      // Forcer la suppression du loader en cas d'erreur
      this.debugService.forceRemoveLoader();
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
}
