import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent, merge } from 'rxjs';
import { map, startWith, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { ToastrService, ActiveToast } from 'ngx-toastr';
import { environment } from '../../../environments/environment';

export interface NetworkStatus {
  isOnline: boolean;
  isBackendReachable: boolean;
  lastChecked: Date;
  connectionType?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NetworkStatusService {
  private networkStatusSubject = new BehaviorSubject<NetworkStatus>({
    isOnline: navigator.onLine,
    isBackendReachable: false,
    lastChecked: new Date()
  });

  public networkStatus$ = this.networkStatusSubject.asObservable();

  private backendCheckInterval: any;
  private lastNotificationTime = 0;
  private readonly NOTIFICATION_COOLDOWN = 30000; // 30 secondes entre les notifications
  private hasShownInitialOfflineWarning = false;

  // Toast persistant unique pour l'état réseau
  private persistentToastRef: ActiveToast<any> | null = null;

  constructor(private toastr: ToastrService) {
    this.initializeNetworkMonitoring();
    this.startBackendHealthCheck();
  }

  /**
   * Initialiser la surveillance du réseau
   */
  private initializeNetworkMonitoring(): void {
    // Écouter les événements de connexion/déconnexion
    const online$ = fromEvent(window, 'online').pipe(map(() => true));
    const offline$ = fromEvent(window, 'offline').pipe(map(() => false));

    merge(online$, offline$)
      .pipe(
        startWith(navigator.onLine),
        distinctUntilChanged(),
        debounceTime(1000) // Éviter les notifications trop fréquentes
      )
      .subscribe(isOnline => {
        this.updateNetworkStatus({ isOnline });

        if (isOnline) {
          this.updatePersistentToast('Connexion internet rétablie', 'success');
          // Vérifier immédiatement le backend quand la connexion revient
          this.checkBackendHealth();
        } else {
          this.showPersistentToast('Connexion internet perdue', 'warning');
        }
      });

    console.log('🌐 Surveillance réseau initialisée');

    // Afficher un toast persistant si on démarre hors-ligne ou backend down
    const status = this.networkStatusSubject.value;
    if (!status.isOnline) {
      this.showPersistentToast('Connexion internet perdue', 'warning');
    } else if (!status.isBackendReachable) {
      // On ne le sait pas encore au démarrage; le checkBackendHealth mettra à jour
    }
  }

  /**
   * Démarrer la vérification périodique du backend
   */
  private startBackendHealthCheck(): void {
    // Vérification initiale
    this.checkBackendHealth();

    // Vérification périodique toutes les 30 secondes
    this.backendCheckInterval = setInterval(() => {
      if (navigator.onLine) {
        this.checkBackendHealth();
      }
    }, 30000);
  }

  /**
   * Vérifier la santé du backend
   */
  private async checkBackendHealth(): Promise<void> {
    if (!navigator.onLine) {
      this.updateNetworkStatus({ isBackendReachable: false });
      return;
    }

    try {
      // Utiliser une requête simple vers un endpoint de santé
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // Timeout de 5 secondes

      const response = await fetch(`${environment.apiUrl}/monitoring/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      const isBackendReachable = response.ok;
      this.updateNetworkStatus({ isBackendReachable });

      // Ne notifier que si le statut change
      const currentStatus = this.networkStatusSubject.value;
      // if (currentStatus.isBackendReachable !== isBackendReachable) {
      //   if (isBackendReachable) {
      //     this.updatePersistentToast('Serveur accessible', 'success');
      //   } else if (!this.hasShownInitialOfflineWarning) {
      //     this.showPersistentToast('Serveur temporairement indisponible', 'warning');
      //     this.hasShownInitialOfflineWarning = true;
      //   }
      // }

    } catch (error) {
      this.updateNetworkStatus({ isBackendReachable: false });

      // Ne montrer la notification que si c'est la première fois ou après un long délai
      // if (!this.hasShownInitialOfflineWarning) {
      //   this.showPersistentToast('Impossible de contacter le serveur', 'warning');
      //   this.hasShownInitialOfflineWarning = true;
      // }
    }
  }

  /**
   * Mettre à jour le statut réseau
   */
  private updateNetworkStatus(updates: Partial<NetworkStatus>): void {
    const currentStatus = this.networkStatusSubject.value;
    const newStatus: NetworkStatus = {
      ...currentStatus,
      ...updates,
      lastChecked: new Date()
    };

    this.networkStatusSubject.next(newStatus);
  }

  /**
   * Afficher une notification avec cooldown (non persistante)
   */
  private showNotification(message: string, type: 'success' | 'warning' | 'error'): void {
    const now = Date.now();
    if (now - this.lastNotificationTime < this.NOTIFICATION_COOLDOWN) {
      return;
    }
    this.lastNotificationTime = now;

    switch (type) {
      case 'success':
        this.toastr.success(message, 'Réseau', { timeOut: 3000, positionClass: 'toast-bottom-right' });
        break;
      case 'warning':
        this.toastr.warning(message, 'Réseau', { timeOut: 5000, positionClass: 'toast-bottom-right' });
        break;
      case 'error':
        this.toastr.error(message, 'Réseau', { timeOut: 7000, positionClass: 'toast-bottom-right' });
        break;
    }
  }

  /**
   * Afficher un toast persistant unique tant que l'état n'est pas revenu à la normale
   */
  private showPersistentToast(message: string, type: 'success' | 'warning' | 'error'): void {
    // Si un toast persistant existe déjà, le mettre à jour au lieu d'en créer un nouveau
    if (this.persistentToastRef) {
      this.updatePersistentToast(message, type);
      return;
    }

    const options = {
      disableTimeOut: true, // persistant
      closeButton: true,
      tapToDismiss: false,
      positionClass: 'toast-bottom-right'
    } as any;

    switch (type) {
      case 'success':
        this.persistentToastRef = this.toastr.success(message, 'Réseau', options);
        break;
      case 'warning':
        this.persistentToastRef = this.toastr.warning(message, 'Réseau', options);
        break;
      case 'error':
        this.persistentToastRef = this.toastr.error(message, 'Réseau', options);
        break;
    }
  }

  /**
   * Mettre à jour/normaliser le toast persistant selon l'état courant
   */
  private updatePersistentToast(message: string, type: 'success' | 'warning' | 'error'): void {
    // Si aucun toast persistant, en créer un si l'état n'est pas normal
    if (!this.persistentToastRef) {
      if (type === 'success') {
        // Si tout est normal, aucune nécessité de créer un toast
        return;
      }
      this.showPersistentToast(message, type);
      return;
    }

    // Si on est revenu à un état normal (success), fermer le toast persistant
    if (type === 'success') {
      this.toastr.clear(this.persistentToastRef.toastId);
      this.persistentToastRef = null;
      // Ensuite, afficher un bref toast de succès si souhaité
      this.toastr.success(message, 'Réseau', { timeOut: 2000, positionClass: 'toast-bottom-right' });
      return;
    }

    // Sinon, mettre à jour visuellement: on ferme et recrée avec le nouveau message/type
    this.toastr.clear(this.persistentToastRef.toastId);
    this.persistentToastRef = null;
    this.showPersistentToast(message, type);
  }

  /**
   * Obtenir le statut réseau actuel
   */
  getCurrentStatus(): NetworkStatus {
    return this.networkStatusSubject.value;
  }

  /**
   * Vérifier si on est en ligne
   */
  isOnline(): boolean {
    return this.networkStatusSubject.value.isOnline;
  }

  /**
   * Vérifier si le backend est accessible
   */
  isBackendReachable(): boolean {
    return this.networkStatusSubject.value.isBackendReachable;
  }

  /**
   * Vérifier si l'application est pleinement fonctionnelle
   */
  isFullyOperational(): boolean {
    const status = this.networkStatusSubject.value;
    return status.isOnline && status.isBackendReachable;
  }

  /**
   * Forcer une vérification du backend
   */
  forceBackendCheck(): void {
    this.checkBackendHealth();
  }

  /**
   * Réinitialiser les notifications (utile pour les tests)
   */
  resetNotifications(): void {
    this.lastNotificationTime = 0;
    this.hasShownInitialOfflineWarning = false;
  }

  /**
   * Arrêter la surveillance (cleanup)
   */
  destroy(): void {
    if (this.backendCheckInterval) {
      clearInterval(this.backendCheckInterval);
    }
  }

  /**
   * Obtenir une description textuelle du statut
   */
  getStatusDescription(): string {
    const status = this.networkStatusSubject.value;

    if (!status.isOnline) {
      return 'Hors ligne';
    } else if (!status.isBackendReachable) {
      return 'Serveur indisponible';
    } else {
      return 'En ligne';
    }
  }

  /**
   * Obtenir la couleur du statut pour l'UI
   */
  getStatusColor(): 'success' | 'warning' | 'danger' {
    const status = this.networkStatusSubject.value;

    if (!status.isOnline) {
      return 'danger';
    } else if (!status.isBackendReachable) {
      return 'warning';
    } else {
      return 'success';
    }
  }

  /**
   * Obtenir l'icône du statut
   */
  getStatusIcon(): string {
    const status = this.networkStatusSubject.value;

    if (!status.isOnline) {
      return 'wifi-off';
    } else if (!status.isBackendReachable) {
      return 'cloud-offline';
    } else {
      return 'wifi';
    }
  }
}
