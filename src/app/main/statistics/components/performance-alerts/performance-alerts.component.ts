import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PerformanceAlertsService, PerformanceAlert, AlertThresholds } from '../../services/performance-alerts.service';

@Component({
  selector: 'performance-alerts',
  templateUrl: './performance-alerts.component.html',
  styleUrls: ['./performance-alerts.component.css']
})
export class PerformanceAlertsComponent implements OnInit, OnDestroy {
  alerts: PerformanceAlert[] = [];
  unreadCount: number = 0;
  isExpanded: boolean = false;
  showSettings: boolean = false;
  thresholds: AlertThresholds;

  private destroy$ = new Subject<void>();

  constructor(private alertsService: PerformanceAlertsService) {
    this.thresholds = this.alertsService.getThresholds();
  }

  ngOnInit(): void {
    this.loadAlerts();
    this.loadUnreadCount();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAlerts(): void {
    this.alertsService.alerts$
      .pipe(takeUntil(this.destroy$))
      .subscribe(alerts => {
        this.alerts = alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      });
  }

  private loadUnreadCount(): void {
    this.alertsService.getUnreadCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.unreadCount = count;
      });
  }

  toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
  }

  toggleSettings(): void {
    this.showSettings = !this.showSettings;
  }

  onAlertClick(alert: PerformanceAlert): void {
    if (!alert.isRead) {
      this.alertsService.markAsRead(alert.id);
    }
  }

  onRemoveAlert(alert: PerformanceAlert, event: Event): void {
    event.stopPropagation();
    this.alertsService.removeAlert(alert.id);
  }

  onClearAll(): void {
    this.alertsService.clearAllAlerts();
  }

  onUpdateThresholds(): void {
    this.alertsService.updateThresholds(this.thresholds);
    this.showSettings = false;
  }

  onResetThresholds(): void {
    this.alertsService.resetThresholds();
    this.thresholds = this.alertsService.getThresholds();
  }

  getAlertIcon(type: string): string {
    switch (type) {
      case 'danger':
        return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z';
      case 'warning':
        return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z';
      case 'info':
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'success':
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      default:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  getAlertColor(type: string): string {
    switch (type) {
      case 'danger':
        return '#dc2626';
      case 'warning':
        return '#d97706';
      case 'info':
        return '#2563eb';
      case 'success':
        return '#059669';
      default:
        return '#6b7280';
    }
  }

  formatTimestamp(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    
    return timestamp.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getFilteredAlerts(type?: string): PerformanceAlert[] {
    if (!type) return this.alerts;
    return this.alerts.filter(alert => alert.type === type);
  }

  getAlertsByType(): { [key: string]: PerformanceAlert[] } {
    return {
      danger: this.getFilteredAlerts('danger'),
      warning: this.getFilteredAlerts('warning'),
      info: this.getFilteredAlerts('info'),
      success: this.getFilteredAlerts('success')
    };
  }
}
