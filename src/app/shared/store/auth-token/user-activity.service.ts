import { Injectable, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, fromEvent, merge, timer, Subject } from 'rxjs';
import { debounceTime, takeUntil, filter } from 'rxjs/operators';

export interface UserActivityConfig {
  /** Délai d'inactivité en millisecondes avant de considérer l'utilisateur comme inactif (défaut: 15 minutes) */
  inactivityTimeout: number;
  /** Délai d'inactivité critique en millisecondes pour forcer la déconnexion (défaut: 30 minutes) */
  criticalInactivityTimeout: number;
  /** Intervalle de vérification de l'activité en millisecondes (défaut: 1 minute) */
  checkInterval: number;
  /** Délai de debounce pour les événements d'activité en millisecondes (défaut: 1 seconde) */
  debounceTime: number;
}

export enum UserActivityState {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  CRITICAL_INACTIVE = 'CRITICAL_INACTIVE'
}

export interface UserActivityStatus {
  state: UserActivityState;
  lastActivity: Date;
  timeUntilInactive: number;
  timeUntilCritical: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserActivityService implements OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly defaultConfig: UserActivityConfig = {
    inactivityTimeout: 15 * 60 * 1000, // 15 minutes
    criticalInactivityTimeout: 30 * 60 * 1000, // 30 minutes
    checkInterval: 60 * 1000, // 1 minute
    debounceTime: 1000 // 1 seconde
  };

  private config: UserActivityConfig;
  private lastActivityTime: Date = new Date();
  private activityState$ = new BehaviorSubject<UserActivityState>(UserActivityState.ACTIVE);
  private activityStatus$: BehaviorSubject<UserActivityStatus>;
  private isMonitoring = false;
  private inactivityTimer?: any;
  private criticalTimer?: any;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.config = { ...this.defaultConfig };
    this.activityStatus$ = new BehaviorSubject<UserActivityStatus>(this.getInitialStatus());
  }

  /**
   * Démarre la surveillance de l'activité utilisateur
   */
  startMonitoring(config?: Partial<UserActivityConfig>): void {
    if (this.isMonitoring) {
      return;
    }

    // Fusionner la configuration personnalisée avec la configuration par défaut
    if (config) {
      this.config = { ...this.defaultConfig, ...config };
    }

    this.isMonitoring = true;
    this.lastActivityTime = new Date();
    this.updateActivityState(UserActivityState.ACTIVE);

    // Écouter les événements d'activité utilisateur
    this.setupActivityListeners();

    // Démarrer le timer de vérification périodique
    this.startPeriodicCheck();

    console.log('🟢 UserActivityService: Surveillance démarrée', this.config);
  }

  /**
   * Arrête la surveillance de l'activité utilisateur
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    this.clearTimers();
    console.log('🔴 UserActivityService: Surveillance arrêtée');
  }

  /**
   * Obtient l'état actuel de l'activité utilisateur
   */
  getActivityState(): Observable<UserActivityState> {
    return this.activityState$.asObservable();
  }

  /**
   * Obtient le statut détaillé de l'activité utilisateur
   */
  getActivityStatus(): Observable<UserActivityStatus> {
    return this.activityStatus$.asObservable();
  }

  /**
   * Vérifie si l'utilisateur est actuellement actif
   */
  isUserActive(): boolean {
    return this.activityState$.value === UserActivityState.ACTIVE;
  }

  /**
   * Vérifie si l'utilisateur est inactif
   */
  isUserInactive(): boolean {
    return this.activityState$.value === UserActivityState.INACTIVE;
  }

  /**
   * Vérifie si l'utilisateur est dans un état d'inactivité critique
   */
  isUserCriticallyInactive(): boolean {
    return this.activityState$.value === UserActivityState.CRITICAL_INACTIVE;
  }

  /**
   * Force la mise à jour de l'activité utilisateur (utile pour les actions programmatiques)
   */
  recordActivity(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.lastActivityTime = new Date();
    this.updateActivityState(UserActivityState.ACTIVE);
    this.resetTimers();
  }

  /**
   * Obtient la configuration actuelle
   */
  getConfig(): UserActivityConfig {
    return { ...this.config };
  }

  /**
   * Met à jour la configuration
   */
  updateConfig(config: Partial<UserActivityConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.isMonitoring) {
      // Redémarrer la surveillance avec la nouvelle configuration
      this.stopMonitoring();
      this.startMonitoring();
    }
  }

  ngOnDestroy(): void {
    this.stopMonitoring();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupActivityListeners(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const activityEvents = [
      fromEvent(document, 'mousedown'),
      fromEvent(document, 'mousemove'),
      fromEvent(document, 'keypress'),
      fromEvent(document, 'scroll'),
      fromEvent(document, 'touchstart'),
      fromEvent(document, 'click'),
      fromEvent(window, 'focus')
    ];

    // Fusionner tous les événements et appliquer un debounce
    merge(...activityEvents)
      .pipe(
        debounceTime(this.config.debounceTime),
        takeUntil(this.destroy$),
        filter(() => this.isMonitoring)
      )
      .subscribe(() => {
        this.recordActivity();
      });
  }

  private startPeriodicCheck(): void {
    timer(0, this.config.checkInterval)
      .pipe(
        takeUntil(this.destroy$),
        filter(() => this.isMonitoring)
      )
      .subscribe(() => {
        this.checkActivityStatus();
      });
  }

  private checkActivityStatus(): void {
    const now = new Date();
    const timeSinceLastActivity = now.getTime() - this.lastActivityTime.getTime();
    
    let newState = UserActivityState.ACTIVE;
    
    if (timeSinceLastActivity >= this.config.criticalInactivityTimeout) {
      newState = UserActivityState.CRITICAL_INACTIVE;
    } else if (timeSinceLastActivity >= this.config.inactivityTimeout) {
      newState = UserActivityState.INACTIVE;
    }

    if (newState !== this.activityState$.value) {
      this.updateActivityState(newState);
    }

    // Mettre à jour le statut détaillé
    this.updateActivityStatus();
  }

  private updateActivityState(state: UserActivityState): void {
    const previousState = this.activityState$.value;
    this.activityState$.next(state);

    if (previousState !== state) {
      console.log(`🔄 UserActivityService: État changé de ${previousState} à ${state}`);
    }
  }

  private updateActivityStatus(): void {
    const now = new Date();
    const timeSinceLastActivity = now.getTime() - this.lastActivityTime.getTime();
    
    const status: UserActivityStatus = {
      state: this.activityState$.value,
      lastActivity: this.lastActivityTime,
      timeUntilInactive: Math.max(0, this.config.inactivityTimeout - timeSinceLastActivity),
      timeUntilCritical: Math.max(0, this.config.criticalInactivityTimeout - timeSinceLastActivity)
    };

    this.activityStatus$.next(status);
  }

  private resetTimers(): void {
    this.clearTimers();
    this.setInactivityTimer();
    this.setCriticalTimer();
  }

  private setInactivityTimer(): void {
    this.inactivityTimer = setTimeout(() => {
      if (this.isMonitoring) {
        this.updateActivityState(UserActivityState.INACTIVE);
      }
    }, this.config.inactivityTimeout);
  }

  private setCriticalTimer(): void {
    this.criticalTimer = setTimeout(() => {
      if (this.isMonitoring) {
        this.updateActivityState(UserActivityState.CRITICAL_INACTIVE);
      }
    }, this.config.criticalInactivityTimeout);
  }

  private clearTimers(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = undefined;
    }
    if (this.criticalTimer) {
      clearTimeout(this.criticalTimer);
      this.criticalTimer = undefined;
    }
  }

  private getInitialStatus(): UserActivityStatus {
    return {
      state: UserActivityState.ACTIVE,
      lastActivity: new Date(),
      timeUntilInactive: this.config.inactivityTimeout,
      timeUntilCritical: this.config.criticalInactivityTimeout
    };
  }
}
