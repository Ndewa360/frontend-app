import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { BehaviorSubject, Observable, timer, combineLatest } from 'rxjs';
import { takeUntil, switchMap, filter } from 'rxjs/operators';
import { MobileCacheService } from './mobile-cache.service';
import { PropertyAction, RoomAction, UserProfileAction, StatisticAction, UserProfileState } from '../../../shared/store';

export interface SyncStatus {
  isOnline: boolean;
  lastSync: number;
  syncInProgress: boolean;
  pendingActions: number;
  errors: string[];
}

export interface PendingAction {
  id: string;
  action: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

@Injectable({
  providedIn: 'root'
})
export class MobileSyncService {
  private syncStatusSubject = new BehaviorSubject<SyncStatus>({
    isOnline: navigator.onLine,
    lastSync: 0,
    syncInProgress: false,
    pendingActions: 0,
    errors: []
  });

  private pendingActions: PendingAction[] = [];
  private autoSyncInterval: any;
  private readonly SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly CACHE_KEYS = {
    PENDING_ACTIONS: 'pending_actions',
    LAST_SYNC: 'last_sync',
    OFFLINE_DATA: 'offline_data'
  };

  constructor(
    private store: Store,
    private cacheService: MobileCacheService
  ) {
    this.setupNetworkListeners();
  }

  /**
   * Initialiser le service de synchronisation
   */
  async initialize(): Promise<void> {
    await this.loadPendingActions();
    await this.loadLastSyncTime();
    
    // Synchroniser si en ligne et authentifié
    if (this.isOnline && this.isAuthenticated) {
      this.syncNow();
    }

    console.log('🔄 Service de synchronisation mobile initialisé');
  }

  /**
   * Obtenir le statut de synchronisation
   */
  get syncStatus$(): Observable<SyncStatus> {
    return this.syncStatusSubject.asObservable();
  }

  /**
   * Obtenir l'état de synchronisation en cours
   */
  get syncInProgress$(): Observable<boolean> {
    return this.syncStatusSubject.pipe(
      filter(status => status !== null),
      switchMap(status => [status.syncInProgress])
    );
  }

  /**
   * Vérifier si en ligne
   */
  get isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Vérifier si authentifié
   */
  get isAuthenticated(): boolean {
    const userProfile = this.store.selectSnapshot(UserProfileState.selectStateUserProfile);
    return !!userProfile && !!userProfile._id;
  }

  /**
   * Démarrer la synchronisation automatique
   */
  startAutoSync(): void {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
    }

    this.autoSyncInterval = setInterval(() => {
      if (this.isOnline && this.isAuthenticated) {
        this.syncNow();
      }
    }, this.SYNC_INTERVAL);

    console.log('🔄 Synchronisation automatique démarrée');
  }

  /**
   * Arrêter la synchronisation automatique
   */
  stopAutoSync(): void {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
    }

    console.log('🔄 Synchronisation automatique arrêtée');
  }

  /**
   * Synchroniser maintenant
   */
  async syncNow(): Promise<void> {
    if (!this.isOnline || !this.isAuthenticated) {
      console.log('🔄 Synchronisation ignorée (hors ligne ou non authentifié)');
      return;
    }

    const currentStatus = this.syncStatusSubject.value;
    if (currentStatus.syncInProgress) {
      console.log('🔄 Synchronisation déjà en cours');
      return;
    }

    this.updateSyncStatus({ syncInProgress: true, errors: [] });

    try {
      console.log('🔄 Début de la synchronisation');

      // 1. Exécuter les actions en attente
      await this.processPendingActions();

      // 2. Synchroniser les données depuis le serveur
      await this.syncFromServer();

      // 3. Mettre à jour le cache
      await this.updateCache();

      // 4. Marquer la synchronisation comme réussie
      const now = Date.now();
      await this.cacheService.set(this.CACHE_KEYS.LAST_SYNC, now);
      
      this.updateSyncStatus({
        syncInProgress: false,
        lastSync: now,
        pendingActions: this.pendingActions.length
      });

      console.log('✅ Synchronisation terminée avec succès');

    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation:', error);
      
      this.updateSyncStatus({
        syncInProgress: false,
        errors: [error.message || 'Erreur de synchronisation']
      });
    }
  }

  /**
   * Ajouter une action à exécuter (pour mode hors ligne)
   */
  async addPendingAction(action: any): Promise<void> {
    const pendingAction: PendingAction = {
      id: this.generateId(),
      action,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3
    };

    this.pendingActions.push(pendingAction);
    await this.savePendingActions();

    this.updateSyncStatus({
      pendingActions: this.pendingActions.length
    });

    // Essayer de synchroniser immédiatement si en ligne
    if (this.isOnline && this.isAuthenticated) {
      this.syncNow();
    }

    console.log('📝 Action ajoutée à la file d\'attente:', action.constructor.name);
  }

  /**
   * Configurer les écouteurs réseau
   */
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      console.log('🌐 Connexion rétablie');
      this.updateSyncStatus({ isOnline: true });
      
      if (this.isAuthenticated) {
        this.syncNow();
      }
    });

    window.addEventListener('offline', () => {
      console.log('📴 Connexion perdue');
      this.updateSyncStatus({ isOnline: false });
    });
  }

  /**
   * Traiter les actions en attente
   */
  private async processPendingActions(): Promise<void> {
    if (this.pendingActions.length === 0) {
      return;
    }

    console.log(`🔄 Traitement de ${this.pendingActions.length} actions en attente`);

    const actionsToRemove: string[] = [];

    for (const pendingAction of this.pendingActions) {
      try {
        // Dispatcher l'action
        this.store.dispatch(pendingAction.action);
        
        // Marquer pour suppression
        actionsToRemove.push(pendingAction.id);
        
        console.log('✅ Action exécutée:', pendingAction.action.constructor.name);

      } catch (error) {
        console.error('❌ Erreur lors de l\'exécution de l\'action:', error);
        
        // Incrémenter le compteur de tentatives
        pendingAction.retryCount++;
        
        // Supprimer si trop de tentatives
        if (pendingAction.retryCount >= pendingAction.maxRetries) {
          actionsToRemove.push(pendingAction.id);
          console.error('❌ Action abandonnée après trop de tentatives:', pendingAction.action.constructor.name);
        }
      }
    }

    // Supprimer les actions traitées
    this.pendingActions = this.pendingActions.filter(
      action => !actionsToRemove.includes(action.id)
    );

    await this.savePendingActions();
  }

  /**
   * Synchroniser depuis le serveur
   */
  private async syncFromServer(): Promise<void> {
    console.log('🔄 Synchronisation depuis le serveur');

    // Synchroniser les données utilisateur
    this.store.dispatch(new UserProfileAction.FetchUserProfile());

    // Synchroniser les propriétés
    this.store.dispatch(new PropertyAction.FetchProperties());

    // Synchroniser les statistiques de l'année courante
    const currentYear = new Date().getFullYear();
    this.store.dispatch(
      new StatisticAction.FetchStatisticPaymentRecapitulationAccountOfAllPropertyByYear(currentYear)
    );
  }

  /**
   * Mettre à jour le cache avec les données fraîches
   */
  private async updateCache(): Promise<void> {
    console.log('🔄 Mise à jour du cache');

    // Mettre en cache les données importantes pour l'utilisation hors ligne
    const userProfile = this.store.selectSnapshot(state => state.ndewa360_user_profile.userProfile);
    if (userProfile) {
      await this.cacheService.set('user_profile', userProfile, 7 * 24 * 60 * 60 * 1000); // 7 jours
    }

    const properties = this.store.selectSnapshot(state => state.ndewa360_property.properties);
    if (properties) {
      await this.cacheService.set('properties', properties, 24 * 60 * 60 * 1000); // 24 heures
    }
  }

  /**
   * Charger les actions en attente depuis le cache
   */
  private async loadPendingActions(): Promise<void> {
    const cached = await this.cacheService.get<PendingAction[]>(this.CACHE_KEYS.PENDING_ACTIONS);
    if (cached) {
      this.pendingActions = cached;
    }
  }

  /**
   * Sauvegarder les actions en attente dans le cache
   */
  private async savePendingActions(): Promise<void> {
    await this.cacheService.set(this.CACHE_KEYS.PENDING_ACTIONS, this.pendingActions);
  }

  /**
   * Charger l'heure de dernière synchronisation
   */
  private async loadLastSyncTime(): Promise<void> {
    const lastSync = await this.cacheService.get<number>(this.CACHE_KEYS.LAST_SYNC);
    if (lastSync) {
      this.updateSyncStatus({ lastSync });
    }
  }

  /**
   * Mettre à jour le statut de synchronisation
   */
  private updateSyncStatus(updates: Partial<SyncStatus>): void {
    const currentStatus = this.syncStatusSubject.value;
    const newStatus = { ...currentStatus, ...updates };
    this.syncStatusSubject.next(newStatus);
  }

  /**
   * Générer un ID unique
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
