import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Platform } from '@ionic/angular';
import { Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { takeUntil, filter, map } from 'rxjs/operators';
import { MobileSyncService } from '../shared/services/mobile-sync.service';
import { MobileNotificationService } from '../shared/services/mobile-notification.service';
import { UserProfileState } from '../../shared/store';

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
    private syncService: MobileSyncService,
    private notificationService: MobileNotificationService
  ) {
    this.initializeApp();
  }

  ngOnInit(): void {
    this.setupRouteTracking();
    this.setupAuthTracking();
    this.setupNetworkTracking();
    this.setupSyncTracking();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialiser l'application mobile
   */
  private async initializeApp(): Promise<void> {
    await this.platform.ready();
    
    // Initialiser les services mobiles
    await this.syncService.initialize();
    await this.notificationService.initialize();
    
    console.log('📱 Application mobile initialisée');
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
        
        if (isAuth) {
          // Démarrer la synchronisation automatique
          this.syncService.startAutoSync();
        } else {
          // Arrêter la synchronisation
          this.syncService.stopAutoSync();
        }
      });
  }

  /**
   * Suivre l'état du réseau
   */
  private setupNetworkTracking(): void {
    // Écouter les changements de connectivité
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.onNetworkStatusChange(true);
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.onNetworkStatusChange(false);
    });

    // État initial
    this.isOnline = navigator.onLine;
  }

  /**
   * Suivre l'état de synchronisation
   */
  private setupSyncTracking(): void {
    this.syncService.syncInProgress$
      .pipe(takeUntil(this.destroy$))
      .subscribe(inProgress => {
        this.syncInProgress = inProgress;
      });
  }

  /**
   * Gérer les changements d'état réseau
   */
  private onNetworkStatusChange(isOnline: boolean): void {
    if (isOnline) {
      console.log('🌐 Connexion rétablie');
      this.notificationService.showToast('Connexion rétablie', 'success');
      
      // Démarrer la synchronisation si authentifié
      if (this.isAuthenticated) {
        this.syncService.syncNow();
      }
    } else {
      console.log('📴 Connexion perdue');
      this.notificationService.showToast('Mode hors ligne', 'warning');
    }
  }

  /**
   * Vérifier si une route est active
   */
  isRouteActive(route: string): boolean {
    return this.currentRoute.includes(route);
  }

  /**
   * Obtenir l'icône d'état de synchronisation
   */
  getSyncIcon(): string {
    if (this.syncInProgress) {
      return 'sync';
    } else if (!this.isOnline) {
      return 'cloud-offline';
    } else {
      return 'cloud-done';
    }
  }

  /**
   * Obtenir la couleur d'état de synchronisation
   */
  getSyncColor(): string {
    if (this.syncInProgress) {
      return 'warning';
    } else if (!this.isOnline) {
      return 'danger';
    } else {
      return 'success';
    }
  }
}
