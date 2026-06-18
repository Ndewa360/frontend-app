import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, fromEvent, merge } from 'rxjs';
import { map, startWith, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { ToastrService, ActiveToast } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
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
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isBackendReachable: false,
    lastChecked: new Date()
  });

  public networkStatus$ = this.networkStatusSubject.asObservable();

  private backendCheckInterval: any;
  private lastNotificationTime = 0;
  private readonly NOTIFICATION_COOLDOWN = 30000;
  private hasShownInitialOfflineWarning = false;
  private persistentToastRef: ActiveToast<any> | null = null;

  constructor(
    private toastr: ToastrService,
    private translate: TranslateService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeNetworkMonitoring();
      this.startBackendHealthCheck();
    }
  }

  private initializeNetworkMonitoring(): void {
    const online$ = fromEvent(window, 'online').pipe(map(() => true));
    const offline$ = fromEvent(window, 'offline').pipe(map(() => false));

    merge(online$, offline$)
      .pipe(
        startWith(navigator.onLine),
        distinctUntilChanged(),
        debounceTime(1000)
      )
      .subscribe(isOnline => {
        this.updateNetworkStatus({ isOnline });
        if (isOnline) {
          this.updatePersistentToast(this.translate.instant('NOTIFICATIONS.NETWORK_RESTORED'), 'success');
          this.checkBackendHealth();
        } else {
          this.showPersistentToast(this.translate.instant('NOTIFICATIONS.NETWORK_LOST'), 'warning');
        }
      });

    const status = this.networkStatusSubject.value;
    if (!status.isOnline) {
      this.showPersistentToast(this.translate.instant('NOTIFICATIONS.NETWORK_LOST'), 'warning');
    }
  }

  private startBackendHealthCheck(): void {
    this.checkBackendHealth();
    this.backendCheckInterval = setInterval(() => {
      if (navigator.onLine) {
        this.checkBackendHealth();
      }
    }, 30000);
  }

  private async checkBackendHealth(): Promise<void> {
    if (!navigator.onLine) {
      this.updateNetworkStatus({ isBackendReachable: false });
      return;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${environment.apiUrl}/monitoring/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' }
      });
      clearTimeout(timeoutId);
      this.updateNetworkStatus({ isBackendReachable: response.ok });
    } catch (error) {
      this.updateNetworkStatus({ isBackendReachable: false });
    }
  }

  private updateNetworkStatus(updates: Partial<NetworkStatus>): void {
    const currentStatus = this.networkStatusSubject.value;
    this.networkStatusSubject.next({ ...currentStatus, ...updates, lastChecked: new Date() });
  }

  private showPersistentToast(message: string, type: 'success' | 'warning' | 'error'): void {
    if (this.persistentToastRef) {
      this.updatePersistentToast(message, type);
      return;
    }
    const options = { disableTimeOut: true, closeButton: true, tapToDismiss: false, positionClass: 'toast-bottom-right' } as any;
    switch (type) {
      case 'success': this.persistentToastRef = this.toastr.success(message, 'Réseau', options); break;
      case 'warning': this.persistentToastRef = this.toastr.warning(message, 'Réseau', options); break;
      case 'error':   this.persistentToastRef = this.toastr.error(message, 'Réseau', options); break;
    }
  }

  private updatePersistentToast(message: string, type: 'success' | 'warning' | 'error'): void {
    if (!this.persistentToastRef) {
      if (type !== 'success') this.showPersistentToast(message, type);
      return;
    }
    this.toastr.clear(this.persistentToastRef.toastId);
    this.persistentToastRef = null;
    if (type === 'success') {
      this.toastr.success(message, 'Réseau', { timeOut: 2000, positionClass: 'toast-bottom-right' });
    } else {
      this.showPersistentToast(message, type);
    }
  }

  getCurrentStatus(): NetworkStatus { return this.networkStatusSubject.value; }
  isOnline(): boolean { return this.networkStatusSubject.value.isOnline; }
  isBackendReachable(): boolean { return this.networkStatusSubject.value.isBackendReachable; }
  isFullyOperational(): boolean { const s = this.networkStatusSubject.value; return s.isOnline && s.isBackendReachable; }
  forceBackendCheck(): void { if (isPlatformBrowser(this.platformId)) this.checkBackendHealth(); }
  resetNotifications(): void { this.lastNotificationTime = 0; this.hasShownInitialOfflineWarning = false; }

  destroy(): void {
    if (this.backendCheckInterval) clearInterval(this.backendCheckInterval);
  }

  getStatusDescription(): string {
    const s = this.networkStatusSubject.value;
    if (!s.isOnline) return 'Hors ligne';
    if (!s.isBackendReachable) return 'Serveur indisponible';
    return 'En ligne';
  }

  getStatusColor(): 'success' | 'warning' | 'danger' {
    const s = this.networkStatusSubject.value;
    if (!s.isOnline) return 'danger';
    if (!s.isBackendReachable) return 'warning';
    return 'success';
  }

  getStatusIcon(): string {
    const s = this.networkStatusSubject.value;
    if (!s.isOnline) return 'wifi-off';
    if (!s.isBackendReachable) return 'cloud-offline';
    return 'wifi';
  }
}
