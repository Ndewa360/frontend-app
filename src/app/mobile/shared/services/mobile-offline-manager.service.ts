import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { MobileCacheService } from './mobile-cache.service';
import { MobileSyncService } from './mobile-sync.service';
// import { MobilePushNotificationsService } from './mobile-push-notifications.service';

// Import conditionnel pour Network
let Network: any = {
  addListener: () => ({ remove: () => {} }),
  getStatus: () => Promise.resolve({ connected: true, connectionType: 'wifi' })
};

// Tentative d'import dynamique
(async () => {
  try {
    const networkModule = await import('@capacitor/network');
    Network = networkModule.Network;
  } catch (error) {
    console.warn('⚠️ @capacitor/network non disponible, utilisation du fallback');
  }
})();

export interface OfflineStatus {
  isOnline: boolean;
  connectionType: string;
  lastOnlineTime?: Date;
  pendingActions: number;
  cacheSize: string;
}

@Injectable({
  providedIn: 'root'
})
export class MobileOfflineManagerService {
  private offlineStatus$ = new BehaviorSubject<OfflineStatus>({
    isOnline: true,
    connectionType: 'unknown',
    pendingActions: 0,
    cacheSize: '0 B'
  });

  constructor(
    private cacheService: MobileCacheService,
    private syncService: MobileSyncService,
    // private notificationService: MobilePushNotificationsService
  ) {
    this.initializeOfflineManager();
  }

  /**
   * Initialiser le gestionnaire hors ligne
   */
  private async initializeOfflineManager(): Promise<void> {
    // Écouter les changements de réseau
    Network.addListener('networkStatusChange', async (status: any) => {
      await this.handleNetworkChange(status);
    });

    // Vérifier le statut initial
    const status = await Network.getStatus();
    await this.handleNetworkChange(status);

    // Mettre à jour les statistiques périodiquement
    setInterval(() => {
      this.updateOfflineStats();
    }, 30000); // Toutes les 30 secondes
  }

  /**
   * Gérer les changements de réseau
   */
  private async handleNetworkChange(status: any): Promise<void> {
    const wasOnline = this.offlineStatus$.value.isOnline;
    const isOnline = status.connected;

    if (!wasOnline && isOnline) {
      // Passage hors ligne → en ligne
      console.log('🌐 Connexion rétablie - Synchronisation...');
      await this.handleBackOnline();
    } else if (wasOnline && !isOnline) {
      // Passage en ligne → hors ligne
      console.log('📴 Mode hors ligne activé');
      await this.handleGoingOffline();
    }

    await this.updateOfflineStats();
  }

  /**
   * Gérer le retour en ligne
   */
  private async handleBackOnline(): Promise<void> {
    try {
      // Synchroniser les actions en attente
      await this.syncService.syncPendingActions();
      
      // Mettre à jour le cache avec les dernières données
      await this.syncService.syncWithServer();
      
      // Notifier l'utilisateur
      // await this.notificationService.showToast('✅ Synchronisation terminée', 'short');
      
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation:', error);
      // await this.notificationService.showToast('⚠️ Erreur de synchronisation', 'short');
    }
  }

  /**
   * Gérer le passage hors ligne
   */
  private async handleGoingOffline(): Promise<void> {
    try {
      // Sauvegarder les données critiques
      await this.saveEssentialDataForOffline();
      
      // Notifier l'utilisateur
      // await this.notificationService.showToast('📴 Mode hors ligne activé', 'short');
      
    } catch (error) {
      console.error('❌ Erreur lors de la préparation hors ligne:', error);
    }
  }

  /**
   * Sauvegarder les données essentielles pour le mode hors ligne
   */
  private async saveEssentialDataForOffline(): Promise<void> {
    try {
      // Récupérer les données critiques depuis le store ou l'API
      const userProfile = await this.cacheService.get('current_user_profile');
      const recentSearches = await this.cacheService.get('recent_searches');
      const favoriteUnits = await this.cacheService.get('favorite_units');
      const appSettings = await this.cacheService.get('app_settings');

      const essentialData = {
        userProfile: userProfile || undefined,
        recentSearches: Array.isArray(recentSearches) ? recentSearches : [],
        favoriteUnits: Array.isArray(favoriteUnits) ? favoriteUnits : [],
        properties: [],
        contracts: []
      };

      await this.cacheService.saveOfflineData(essentialData);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde des données essentielles:', error);
    }
  }

  /**
   * Mettre à jour les statistiques hors ligne
   */
  private async updateOfflineStats(): Promise<void> {
    try {
      const networkStatus = await Network.getStatus();
      const pendingActions = await this.syncService.getPendingActionsCount();
      const cacheStats = await this.cacheService.getCacheStats();

      const status: OfflineStatus = {
        isOnline: networkStatus.connected,
        connectionType: networkStatus.connectionType,
        lastOnlineTime: networkStatus.connected ? new Date() : this.offlineStatus$.value.lastOnlineTime,
        pendingActions,
        cacheSize: typeof cacheStats.totalSize === 'string' ? cacheStats.totalSize : '0 B'
      };

      this.offlineStatus$.next(status);
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour des stats:', error);
    }
  }

  /**
   * Obtenir le statut hors ligne observable
   */
  getOfflineStatus(): Observable<OfflineStatus> {
    return this.offlineStatus$.asObservable();
  }

  /**
   * Vérifier si l'application peut fonctionner hors ligne
   */
  async canWorkOffline(): Promise<boolean> {
    return await this.cacheService.canWorkOffline();
  }

  /**
   * Forcer la synchronisation
   */
  async forcSync(): Promise<void> {
    const status = await Network.getStatus();
    if (status.connected) {
      await this.handleBackOnline();
    } else {
      // await this.notificationService.showToast('❌ Pas de connexion internet', 'short');
    }
  }

  /**
   * Nettoyer les données hors ligne
   */
  async clearOfflineData(): Promise<void> {
    await this.cacheService.clear();
    await this.syncService.clearPendingActions();
    // await this.notificationService.showToast('🗑️ Données hors ligne supprimées', 'short');
  }

  /**
   * Obtenir les statistiques détaillées
   */
  async getDetailedStats(): Promise<any> {
    const cacheStats = await this.cacheService.getCacheStats();
    const networkStatus = await Network.getStatus();
    const pendingActions = await this.syncService.getPendingActionsCount();

    return {
      network: {
        isOnline: networkStatus.connected,
        connectionType: networkStatus.connectionType
      },
      cache: cacheStats,
      sync: {
        pendingActions,
        lastSyncTime: await this.syncService.getLastSyncTime()
      },
      offline: {
        canWorkOffline: await this.canWorkOffline(),
        essentialDataAvailable: await this.cacheService.getOfflineData() !== null
      }
    };
  }

  /**
   * Préparer l'application pour un usage hors ligne prolongé
   */
  async prepareForExtendedOffline(userId: string): Promise<void> {
    console.log('🔄 Préparation pour usage hors ligne prolongé...');
    
    try {
      // Précharger les données essentielles
      await this.cacheService.preloadEssentialData(userId);
      
      // Sauvegarder l'état actuel
      await this.saveEssentialDataForOffline();
      
      // Programmer des notifications de rappel
      await this.scheduleOfflineReminders();
      
      // await this.notificationService.showToast('✅ Prêt pour usage hors ligne', 'long');
      
    } catch (error) {
      console.error('❌ Erreur lors de la préparation hors ligne:', error);
      // await this.notificationService.showToast('❌ Erreur de préparation', 'short');
    }
  }

  /**
   * Programmer des rappels pour le mode hors ligne
   */
  private async scheduleOfflineReminders(): Promise<void> {
    // Rappel de synchronisation après 24h hors ligne
    // Cette fonctionnalité sera implémentée avec les notifications locales
    console.log('📅 Rappels hors ligne programmés');
  }
}
