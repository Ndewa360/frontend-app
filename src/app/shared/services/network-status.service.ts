import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent, merge } from 'rxjs';
import { map, startWith, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
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
          this.showNotification('Connexion internet rétablie', 'success');
          // Vérifier immédiatement le backend quand la connexion revient
          this.checkBackendHealth();
        } else {
          this.showNotification('Connexion internet perdue', 'warning');
        }
      });

    console.log('🌐 Surveillance réseau initialisée');
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

      const response = await fetch(`${environment.apiUrl}/health`, {
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
      if (currentStatus.isBackendReachable !== isBackendReachable) {
        if (isBackendReachable) {
          this.showNotification('Serveur accessible', 'success');
        } else if (!this.hasShownInitialOfflineWarning) {
          this.showNotification('Serveur temporairement indisponible', 'warning');
          this.hasShownInitialOfflineWarning = true;
        }
      }

    } catch (error) {
      this.updateNetworkStatus({ isBackendReachable: false });
      
      // Ne montrer la notification que si c'est la première fois ou après un long délai
      if (!this.hasShownInitialOfflineWarning) {
        this.showNotification('Impossible de contacter le serveur', 'warning');
        this.hasShownInitialOfflineWarning = true;
      }
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
   * Afficher une notification avec cooldown
   */
  private showNotification(message: string, type: 'success' | 'warning' | 'error'): void {
    const now = Date.now();
    
    // Éviter les notifications trop fréquentes
    if (now - this.lastNotificationTime < this.NOTIFICATION_COOLDOWN) {
      return;
    }

    this.lastNotificationTime = now;

    // Afficher la notification selon le type
    switch (type) {
      case 'success':
        this.toastr.success(message, 'Réseau', {
          timeOut: 3000,
          positionClass: 'toast-bottom-right'
        });
        break;
      case 'warning':
        this.toastr.warning(message, 'Réseau', {
          timeOut: 5000,
          positionClass: 'toast-bottom-right'
        });
        break;
      case 'error':
        this.toastr.error(message, 'Réseau', {
          timeOut: 7000,
          positionClass: 'toast-bottom-right'
        });
        break;
    }
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
