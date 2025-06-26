import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { RoomState, LocationState, LocationPaymentState } from '../store';
import { RoomModel } from '../store/rooms/room.model';
import { LocationModel } from '../store/location/location.model';
import { LocationPaymentModel } from '../store/payment-location/location-payment.model';

export interface SmartNotification {
  id: string;
  type: 'payment_overdue' | 'lease_expiring' | 'maintenance_due' | 'vacancy_alert' | 'revenue_milestone';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  actionLabel?: string;
  actionRoute?: string;
  data?: any;
  createdAt: Date;
  isRead: boolean;
  autoHide?: boolean;
  hideAfter?: number; // en millisecondes
}

@Injectable({
  providedIn: 'root'
})
export class NotificationManagerService {
  private notifications$ = new BehaviorSubject<SmartNotification[]>([]);
  private notificationSettings = {
    paymentReminders: true,
    leaseExpirations: true,
    maintenanceAlerts: true,
    vacancyAlerts: true,
    revenueReports: true,
    soundEnabled: true,
    emailNotifications: true
  };

  constructor(
    private store: Store,
    private toastr: ToastrService
  ) {
    this.initializeNotificationSystem();
  }

  /**
   * Initialise le système de notifications intelligentes
   */
  private initializeNotificationSystem(): void {
    // Surveiller les paiements en retard
    this.monitorOverduePayments();
    
    // Surveiller les baux qui expirent
    this.monitorLeaseExpirations();
    
    // Surveiller les chambres vacantes
    this.monitorVacancies();
    
    // Surveiller les objectifs de revenus
    this.monitorRevenueGoals();
  }

  /**
   * Surveille les paiements en retard
   * Note: Cette fonctionnalité nécessiterait une logique métier plus complexe
   * pour déterminer les paiements en retard basée sur les dates d'échéance
   */
  private monitorOverduePayments(): void {
    // Pour l'instant, on surveille les locations actives sans paiements récents
    combineLatest([
      this.store.select(LocationPaymentState.selectStateLocationPayments),
      this.store.select(LocationState.selectStateLocations)
    ]).pipe(
      filter(([payments, locations]) => Array.isArray(payments) && Array.isArray(locations)),
      map(([payments, locations]) => {
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));

        // Trouver les locations actives sans paiements récents
        const locationsWithoutRecentPayments = locations.filter(location => {
          if (!location.isRunning) return false;

          const recentPayments = payments.filter(payment =>
            payment.location === location._id &&
            new Date(payment.datePayment) > thirtyDaysAgo
          );

          return recentPayments.length === 0;
        });

        return locationsWithoutRecentPayments;
      }),
      filter(overdueLocations => overdueLocations.length > 0)
    ).subscribe(overdueLocations => {
      overdueLocations.forEach(location => {
        this.createNotification({
          type: 'payment_overdue',
          priority: 'high',
          title: 'Paiement potentiellement en retard',
          message: `Aucun paiement reçu depuis 30 jours pour cette location`,
          actionLabel: 'Voir détails',
          actionRoute: `/app/properties/${location.property}/payments`,
          data: { locationId: location._id, propertyId: location.property }
        });
      });
    });
  }

  /**
   * Surveille les baux qui expirent bientôt
   */
  private monitorLeaseExpirations(): void {
    this.store.select(state => state.locations?.locations || []).pipe(
      filter(locations => Array.isArray(locations) && locations.length > 0),
      map(locations => {
        const today = new Date();
        const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));

        return locations.filter((location: LocationModel) => {
          if (!location.endedAt || !location.isRunning) return false;
          const endDate = new Date(location.endedAt);
          return endDate <= thirtyDaysFromNow && endDate > today;
        });
      }),
      filter(expiringLeases => expiringLeases.length > 0)
    ).subscribe(expiringLeases => {
      expiringLeases.forEach((lease: LocationModel) => {
        const daysUntilExpiry = this.getDaysUntilDate(lease.endedAt!.toString());

        this.createNotification({
          type: 'lease_expiring',
          priority: daysUntilExpiry <= 7 ? 'high' : 'medium',
          title: 'Bail bientôt expiré',
          message: `Un bail expire dans ${daysUntilExpiry} jours`,
          actionLabel: 'Voir détails',
          actionRoute: `/app/properties/${lease.property}/locations`,
          data: { leaseId: lease._id, locataireId: lease.locataire }
        });
      });
    });
  }

  /**
   * Surveille les chambres vacantes depuis longtemps
   */
  private monitorVacancies(): void {
    this.store.select(state => state.rooms?.rooms || []).pipe(
      filter(rooms => Array.isArray(rooms) && rooms.length > 0),
      map(rooms => {
        return rooms.filter((room: RoomModel) => {
          // Pour l'instant, on considère les chambres libres
          // Note: lastOccupiedDate n'existe pas dans le modèle actuel
          return room.isFree;
        });
      }),
      filter(longVacantRooms => longVacantRooms.length > 0)
    ).subscribe(longVacantRooms => {
      longVacantRooms.forEach((room: RoomModel) => {
        this.createNotification({
          type: 'vacancy_alert',
          priority: 'medium',
          title: 'Unité disponible',
          message: `L'unité ${room.code} est actuellement libre`,
          actionLabel: 'Voir détails',
          actionRoute: `/app/properties/${room.property}/rooms`,
          data: { roomId: room._id, propertyId: room.property }
        });
      });
    });
  }

  /**
   * Surveille les objectifs de revenus
   */
  private monitorRevenueGoals(): void {
    // Logique pour surveiller les objectifs de revenus mensuels/annuels
    this.store.select(state => state.statistics).subscribe(stats => {
      if (stats.monthlyRevenue && stats.revenueGoal) {
        const achievementRate = (stats.monthlyRevenue / stats.revenueGoal) * 100;
        
        if (achievementRate >= 100) {
          this.createNotification({
            type: 'revenue_milestone',
            priority: 'low',
            title: 'Objectif atteint !',
            message: `Félicitations ! Vous avez atteint ${achievementRate.toFixed(1)}% de votre objectif mensuel`,
            autoHide: true,
            hideAfter: 10000
          });
        }
      }
    });
  }

  /**
   * Crée une nouvelle notification
   */
  createNotification(notification: Partial<SmartNotification>): void {
    const newNotification: SmartNotification = {
      id: this.generateId(),
      createdAt: new Date(),
      isRead: false,
      ...notification
    } as SmartNotification;

    const currentNotifications = this.notifications$.value;
    
    // Éviter les doublons
    const exists = currentNotifications.some(n => 
      n.type === newNotification.type && 
      JSON.stringify(n.data) === JSON.stringify(newNotification.data)
    );
    
    if (!exists) {
      this.notifications$.next([newNotification, ...currentNotifications]);
      this.showToastNotification(newNotification);
      
      // Auto-hide si configuré
      if (newNotification.autoHide && newNotification.hideAfter) {
        setTimeout(() => {
          this.markAsRead(newNotification.id);
        }, newNotification.hideAfter);
      }
    }
  }

  /**
   * Affiche une notification toast
   */
  private showToastNotification(notification: SmartNotification): void {
    if (!this.notificationSettings.soundEnabled) return;

    const toastConfig = {
      timeOut: notification.autoHide ? notification.hideAfter : 5000,
      closeButton: true,
      progressBar: true,
      tapToDismiss: true
    };

    switch (notification.priority) {
      case 'critical':
        this.toastr.error(notification.message, notification.title, toastConfig);
        break;
      case 'high':
        this.toastr.warning(notification.message, notification.title, toastConfig);
        break;
      case 'medium':
        this.toastr.info(notification.message, notification.title, toastConfig);
        break;
      case 'low':
        this.toastr.success(notification.message, notification.title, toastConfig);
        break;
    }
  }

  /**
   * Marque une notification comme lue
   */
  markAsRead(notificationId: string): void {
    const notifications = this.notifications$.value.map(n => 
      n.id === notificationId ? { ...n, isRead: true } : n
    );
    this.notifications$.next(notifications);
  }

  /**
   * Supprime une notification
   */
  removeNotification(notificationId: string): void {
    const notifications = this.notifications$.value.filter(n => n.id !== notificationId);
    this.notifications$.next(notifications);
  }

  /**
   * Obtient toutes les notifications
   */
  getNotifications(): Observable<SmartNotification[]> {
    return this.notifications$.asObservable();
  }

  /**
   * Obtient les notifications non lues
   */
  getUnreadNotifications(): Observable<SmartNotification[]> {
    return this.notifications$.pipe(
      map(notifications => notifications.filter(n => !n.isRead))
    );
  }

  /**
   * Obtient le nombre de notifications non lues
   */
  getUnreadCount(): Observable<number> {
    return this.getUnreadNotifications().pipe(
      map(notifications => notifications.length)
    );
  }

  // Méthodes utilitaires
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  private getDaysUntilDate(date: string): number {
    const today = new Date();
    const targetDate = new Date(date);
    return Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }
}
