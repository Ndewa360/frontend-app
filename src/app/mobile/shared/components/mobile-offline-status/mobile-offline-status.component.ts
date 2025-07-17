import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MobileOfflineManagerService, OfflineStatus } from '../../services/mobile-offline-manager.service';

@Component({
  selector: 'app-mobile-offline-status',
  templateUrl: './mobile-offline-status.component.html',
  styleUrls: ['./mobile-offline-status.component.scss']
})
export class MobileOfflineStatusComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  offlineStatus: OfflineStatus = {
    isOnline: true,
    connectionType: 'unknown',
    pendingActions: 0,
    cacheSize: '0 B'
  };

  showDetails = false;
  detailedStats: any = null;

  constructor(
    private offlineManager: MobileOfflineManagerService
  ) {}

  ngOnInit(): void {
    this.subscribeToOfflineStatus();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * S'abonner au statut hors ligne
   */
  private subscribeToOfflineStatus(): void {
    this.offlineManager.getOfflineStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.offlineStatus = status;
      });
  }

  /**
   * Basculer l'affichage des détails
   */
  async toggleDetails(): Promise<void> {
    this.showDetails = !this.showDetails;
    
    if (this.showDetails && !this.detailedStats) {
      this.detailedStats = await this.offlineManager.getDetailedStats();
    }
  }

  /**
   * Forcer la synchronisation
   */
  async forceSync(): Promise<void> {
    await this.offlineManager.forcSync();
  }

  /**
   * Nettoyer les données hors ligne
   */
  async clearOfflineData(): Promise<void> {
    await this.offlineManager.clearOfflineData();
    this.detailedStats = null;
  }

  /**
   * Obtenir la couleur du statut
   */
  getStatusColor(): string {
    if (this.offlineStatus.isOnline) {
      return this.offlineStatus.pendingActions > 0 ? 'warning' : 'success';
    }
    return 'danger';
  }

  /**
   * Obtenir l'icône du statut
   */
  getStatusIcon(): string {
    if (this.offlineStatus.isOnline) {
      return this.offlineStatus.pendingActions > 0 ? 'sync' : 'wifi';
    }
    return 'wifi-off';
  }

  /**
   * Obtenir le texte du statut
   */
  getStatusText(): string {
    if (this.offlineStatus.isOnline) {
      if (this.offlineStatus.pendingActions > 0) {
        return `En ligne - ${this.offlineStatus.pendingActions} action(s) en attente`;
      }
      return `En ligne - ${this.offlineStatus.connectionType}`;
    }
    
    const lastOnline = this.offlineStatus.lastOnlineTime;
    if (lastOnline) {
      const timeDiff = Date.now() - lastOnline.getTime();
      const minutes = Math.floor(timeDiff / 60000);
      const hours = Math.floor(minutes / 60);
      
      if (hours > 0) {
        return `Hors ligne depuis ${hours}h${minutes % 60}min`;
      } else {
        return `Hors ligne depuis ${minutes}min`;
      }
    }
    
    return 'Hors ligne';
  }
}
