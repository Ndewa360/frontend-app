import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';

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
   */
  private monitorOverduePayments(): void {
    // Logique pour détecter les paiements en retard
    // Cette méthode serait appelée périodiquement ou en réponse à des changements d'état
    
    combineLatest([
      this.store.select(state => state.locationPayments),
      this.store.select(state => state.locations)
    ]).pipe(
      map(([payments, locations]) => {
        const today = new Date();
        const overduePayments = payments.filter(payment => {
          const dueDate = new Date(payment.dueDate);
          return dueDate < today && !payment.isPaid;
        });
        
        return overduePayments;
      }),
      filter(overduePayments => overduePayments.length > 0)
    ).subscribe(overduePayments => {
      overduePayments.forEach(payment => {
        this.createNotification({
          type: 'payment_overdue',
          priority: this.getPaymentOverduePriority(payment),
          title: 'Paiement en retard',
          message: `Le loyer de ${payment.tenantName} est en retard de ${this.getDaysOverdue(payment)} jours`,
          actionLabel: 'Voir détails',
          actionRoute: `/app/properties/${payment.propertyId}/payments`,
          data: { paymentId: payment.id, tenantId: payment.tenantId }
        });
      });
    });
  }

  /**
   * Surveille les baux qui expirent bientôt
   */
  private monitorLeaseExpirations(): void {
    this.store.select(state => state.locations).pipe(
      map(locations => {
        const today = new Date();
        const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
        
        return locations.filter(location => {
          const endDate = new Date(location.endedAt);
          return endDate <= thirtyDaysFromNow && endDate > today && location.isRunning;
        });
      }),
      filter(expiringLeases => expiringLeases.length > 0)
    ).subscribe(expiringLeases => {
      expiringLeases.forEach(lease => {
        const daysUntilExpiry = this.getDaysUntilDate(lease.endedAt);
        
        this.createNotification({
          type: 'lease_expiring',
          priority: daysUntilExpiry <= 7 ? 'high' : 'medium',
          title: 'Bail bientôt expiré',
          message: `Le bail de ${lease.tenantName} expire dans ${daysUntilExpiry} jours`,
          actionLabel: 'Renouveler',
          actionRoute: `/app/contracts/${lease.id}/renew`,
          data: { leaseId: lease.id, tenantId: lease.tenantId }
        });
      });
    });
  }

  /**
   * Surveille les chambres vacantes depuis longtemps
   */
  private monitorVacancies(): void {
    this.store.select(state => state.rooms).pipe(
      map(rooms => {
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
        
        return rooms.filter(room => {
          return room.isFree && 
                 room.lastOccupiedDate && 
                 new Date(room.lastOccupiedDate) < thirtyDaysAgo;
        });
      }),
      filter(longVacantRooms => longVacantRooms.length > 0)
    ).subscribe(longVacantRooms => {
      longVacantRooms.forEach(room => {
        const daysVacant = this.getDaysSinceDate(room.lastOccupiedDate);
        
        this.createNotification({
          type: 'vacancy_alert',
          priority: daysVacant > 60 ? 'high' : 'medium',
          title: 'Chambre vacante depuis longtemps',
          message: `${room.code} est libre depuis ${daysVacant} jours`,
          actionLabel: 'Promouvoir',
          actionRoute: `/app/properties/${room.propertyId}/rooms/${room.id}/promote`,
          data: { roomId: room.id, propertyId: room.propertyId }
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
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getDaysOverdue(payment: any): number {
    const today = new Date();
    const dueDate = new Date(payment.dueDate);
    return Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  private getDaysUntilDate(date: string): number {
    const today = new Date();
    const targetDate = new Date(date);
    return Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  private getDaysSinceDate(date: string): number {
    const today = new Date();
    const pastDate = new Date(date);
    return Math.floor((today.getTime() - pastDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  private getPaymentOverduePriority(payment: any): 'low' | 'medium' | 'high' | 'critical' {
    const daysOverdue = this.getDaysOverdue(payment);
    if (daysOverdue > 30) return 'critical';
    if (daysOverdue > 15) return 'high';
    if (daysOverdue > 7) return 'medium';
    return 'low';
  }
}
