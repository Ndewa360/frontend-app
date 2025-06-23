import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { BaseComponent } from '../../utils/base-component';
import { NotificationManagerService, SmartNotification } from '../../services/notification-manager.service';

interface QuickFilter {
  type: string;
  label: string;
  icon: string;
  count: number;
}

@Component({
  selector: 'app-smart-notifications',
  templateUrl: './smart-notifications.component.html',
  styleUrls: ['./smart-notifications.component.scss']
})
export class SmartNotificationsComponent extends BaseComponent implements OnInit {
  @Input() isOpen: boolean = false;
  @Output() closeRequested = new EventEmitter<void>();

  notifications: SmartNotification[] = [];
  filteredNotifications: SmartNotification[] = [];
  unreadCount: number = 0;
  activeFilter: string = 'all';
  hasMore: boolean = false;

  quickFilters: QuickFilter[] = [
    { type: 'all', label: 'Toutes', icon: 'notification', count: 0 },
    { type: 'payment_overdue', label: 'Paiements', icon: 'currency--dollar', count: 0 },
    { type: 'lease_expiring', label: 'Baux', icon: 'calendar', count: 0 },
    { type: 'vacancy_alert', label: 'Vacances', icon: 'home', count: 0 },
    { type: 'maintenance_due', label: 'Maintenance', icon: 'tools', count: 0 },
    { type: 'revenue_milestone', label: 'Revenus', icon: 'chart--line', count: 0 }
  ];

  constructor(
    private notificationManager: NotificationManagerService,
    private router: Router
  ) {
    super();
  }

  ngOnInit(): void {
    this.loadNotifications();
    this.setupSubscriptions();
  }

  private loadNotifications(): void {
    this.notificationManager.getNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifications => {
        this.notifications = notifications;
        this.updateFilteredNotifications();
        this.updateFilterCounts();
      });

    this.notificationManager.getUnreadCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.unreadCount = count;
      });
  }

  private setupSubscriptions(): void {
    // Écouter les nouvelles notifications
    this.notificationManager.getNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateFilteredNotifications();
        this.updateFilterCounts();
      });
  }

  private updateFilteredNotifications(): void {
    if (this.activeFilter === 'all') {
      this.filteredNotifications = [...this.notifications];
    } else {
      this.filteredNotifications = this.notifications.filter(
        notification => notification.type === this.activeFilter
      );
    }
  }

  private updateFilterCounts(): void {
    this.quickFilters.forEach(filter => {
      if (filter.type === 'all') {
        filter.count = this.notifications.length;
      } else {
        filter.count = this.notifications.filter(n => n.type === filter.type).length;
      }
    });
  }

  setActiveFilter(filterType: string): void {
    this.activeFilter = filterType;
    this.updateFilteredNotifications();
  }

  getFilterButtonClass(filter: QuickFilter): string {
    const baseClass = 'px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors';
    const activeClass = 'bg-blue-500 text-white border-blue-500';
    
    return this.activeFilter === filter.type ? `${baseClass} ${activeClass}` : baseClass;
  }

  onNotificationClick(notification: SmartNotification): void {
    // Marquer comme lu
    if (!notification.isRead) {
      this.notificationManager.markAsRead(notification.id);
    }

    // Naviguer vers l'action si définie
    if (notification.actionRoute) {
      this.router.navigate([notification.actionRoute]);
      this.close();
    }
  }

  onActionClick(notification: SmartNotification, event: Event): void {
    event.stopPropagation();
    
    if (notification.actionRoute) {
      this.router.navigate([notification.actionRoute]);
      this.close();
    }
  }

  toggleReadStatus(notification: SmartNotification, event: Event): void {
    event.stopPropagation();
    
    if (notification.isRead) {
      // Marquer comme non lu (fonctionnalité à implémenter dans le service)
      // this.notificationManager.markAsUnread(notification.id);
    } else {
      this.notificationManager.markAsRead(notification.id);
    }
  }

  removeNotification(notification: SmartNotification, event: Event): void {
    event.stopPropagation();
    this.notificationManager.removeNotification(notification.id);
  }

  markAllAsRead(): void {
    this.notifications
      .filter(n => !n.isRead)
      .forEach(n => this.notificationManager.markAsRead(n.id));
  }

  close(): void {
    this.closeRequested.emit();
  }

  openSettings(): void {
    // Ouvrir les paramètres de notification
    this.router.navigate(['/app/profile/notifications']);
    this.close();
  }

  loadMore(): void {
    // Charger plus de notifications (pagination)
    // À implémenter selon les besoins
  }

  viewAllNotifications(): void {
    this.router.navigate(['/app/notifications']);
    this.close();
  }

  // Méthodes utilitaires pour le template
  trackByNotificationId(index: number, notification: SmartNotification): string {
    return notification.id;
  }

  getNotificationIcon(type: string): string {
    const iconMap = {
      'payment_overdue': 'currency--dollar',
      'lease_expiring': 'calendar',
      'maintenance_due': 'tools',
      'vacancy_alert': 'home',
      'revenue_milestone': 'chart--line'
    };
    
    return iconMap[type] || 'notification';
  }

  getNotificationIconClass(priority: string): string {
    const classMap = {
      'critical': 'text-red-600',
      'high': 'text-orange-600',
      'medium': 'text-yellow-600',
      'low': 'text-green-600'
    };
    
    return classMap[priority] || 'text-gray-600';
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}j`;
    
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short' 
    });
  }

  getEmptyStateMessage(): string {
    if (this.activeFilter === 'all') {
      return 'Vous n\'avez aucune notification pour le moment.';
    }
    
    const filterLabel = this.quickFilters.find(f => f.type === this.activeFilter)?.label || '';
    return `Aucune notification de type "${filterLabel}".`;
  }
}
