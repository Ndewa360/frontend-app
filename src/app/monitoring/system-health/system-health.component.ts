import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Subject, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MonitoringService } from '../../shared/services/monitoring.service';
import {
  SystemHealth,
  ServiceStatus,
  ServiceMetric
} from '../../shared/models/monitoring.models';

@Component({
  selector: 'app-system-health',
  templateUrl: './system-health.component.html',
  styleUrls: ['./system-health.component.scss']
})
export class SystemHealthComponent implements OnInit, OnDestroy {
  @Input() set systemHealth(value: SystemHealth | null) {
    console.log('🔧 SystemHealth reçu:', value);
    this._systemHealth = value;
  }
  get systemHealth(): SystemHealth | null {
    return this._systemHealth;
  }
  private _systemHealth: SystemHealth | null = null;

  @Input() set healthHistory(value: any[]) {
    console.log('📊 HealthHistory reçu:', value?.length || 0, 'entrées');
    this._healthHistory = value;
  }
  get healthHistory(): any[] {
    return this._healthHistory;
  }
  private _healthHistory: any[] = [];

  private destroy$ = new Subject<void>();

  // États du composant
  isLoading = false;
  selectedService: ServiceMetric | null = null;
  showServiceDetailsModal = false;

  // Données pour les graphiques
  uptimeData: any[] = [];
  memoryUsageData: any[] = [];
  responseTimeData: any[] = [];

  // Énumérations
  ServiceStatus = ServiceStatus;

  // Configuration des couleurs
  colorScheme = {
    domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5']
  };

  constructor(private monitoringService: MonitoringService) {}

  ngOnInit() {
    console.log('🔧 SystemHealthComponent initialisé');
    this.processHealthHistory();
    this.setupAutoRefresh();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==================== DATA PROCESSING ====================

  private processHealthHistory() {
    if (!this.healthHistory || this.healthHistory.length === 0) return;

    // Données pour le graphique d'uptime
    this.uptimeData = this.healthHistory.map(h => ({
      name: new Date(h.timestamp).toLocaleTimeString(),
      value: h.systemMetrics?.uptime || 0
    }));

    // Données pour l'utilisation mémoire
    this.memoryUsageData = this.healthHistory.map(h => ({
      name: new Date(h.timestamp).toLocaleTimeString(),
      value: h.systemMetrics?.memoryUsage || 0
    }));

    // Données pour les temps de réponse
    this.responseTimeData = this.healthHistory.map(h => ({
      name: new Date(h.timestamp).toLocaleTimeString(),
      value: h.responseTime || 0
    }));
  }

  private setupAutoRefresh() {
    // Actualiser les données toutes les 30 secondes
    timer(0, 30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.refreshHealthData();
      });
  }

  // ==================== ACTIONS ====================

  refreshHealthData() {
    this.isLoading = true;
    this.monitoringService.getSystemHealth()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (health) => {
          this.systemHealth = health;
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error refreshing health data:', error);
        }
      });
  }

  showServiceDetails(service: ServiceMetric) {
    this.selectedService = service;
    this.showServiceDetailsModal = true;
  }

  closeServiceDetails() {
    this.showServiceDetailsModal = false;
    this.selectedService = null;
  }

  // ==================== UTILITY METHODS ====================

  getServicesArray(): ServiceMetric[] {
    if (!this.systemHealth?.services) return [];
    return Object.values(this.systemHealth.services);
  }

  getOverallStatusClass(): string {
    if (!this.systemHealth) return 'status-unknown';
    return this.getServiceStatusClass(this.systemHealth.overallStatus);
  }

  getServiceStatusClass(status: ServiceStatus): string {
    const classes = {
      [ServiceStatus.HEALTHY]: 'status-healthy',
      [ServiceStatus.WARNING]: 'status-warning',
      [ServiceStatus.ERROR]: 'status-error',
      [ServiceStatus.CRITICAL]: 'status-critical',
      [ServiceStatus.UNKNOWN]: 'status-unknown'
    };
    return classes[status] || 'status-unknown';
  }

  getStatusIcon(status: ServiceStatus): string {
    const icons = {
      [ServiceStatus.HEALTHY]: '✅',
      [ServiceStatus.WARNING]: '⚠️',
      [ServiceStatus.ERROR]: '❌',
      [ServiceStatus.CRITICAL]: '🚨',
      [ServiceStatus.UNKNOWN]: '❓'
    };
    return icons[status] || '❓';
  }

  getStatusLabel(status: ServiceStatus): string {
    const labels = {
      [ServiceStatus.HEALTHY]: 'Sain',
      [ServiceStatus.WARNING]: 'Attention',
      [ServiceStatus.ERROR]: 'Erreur',
      [ServiceStatus.CRITICAL]: 'Critique',
      [ServiceStatus.UNKNOWN]: 'Inconnu'
    };
    return labels[status] || 'Inconnu';
  }

  formatUptime(seconds: number): string {
    if (!seconds) return '0s';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}j ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleString('fr-FR');
  }

  formatBytes(bytes: number): string {
    if (!bytes) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getMemoryUsageClass(usage: number): string {
    if (usage >= 90) return 'usage-critical';
    if (usage >= 80) return 'usage-high';
    if (usage >= 60) return 'usage-medium';
    return 'usage-low';
  }

  getResponseTimeClass(responseTime: number): string {
    if (responseTime >= 2000) return 'response-slow';
    if (responseTime >= 1000) return 'response-medium';
    return 'response-fast';
  }

  getHealthScore(): number {
    if (!this.systemHealth) return 0;
    
    const services = this.getServicesArray();
    if (services.length === 0) return 0;
    
    const healthyServices = services.filter(s => s.status === ServiceStatus.HEALTHY).length;
    return Math.round((healthyServices / services.length) * 100);
  }

  getHealthScoreClass(): string {
    const score = this.getHealthScore();
    if (score >= 90) return 'score-excellent';
    if (score >= 70) return 'score-good';
    if (score >= 50) return 'score-fair';
    return 'score-poor';
  }

  hasAlerts(): boolean {
    return this.systemHealth?.alerts && this.systemHealth.alerts.length > 0;
  }

  getCriticalAlerts(): string[] {
    if (!this.systemHealth?.alerts) return [];
    return this.systemHealth.alerts.filter(alert => alert.includes('CRITICAL'));
  }

  getWarningAlerts(): string[] {
    if (!this.systemHealth?.alerts) return [];
    return this.systemHealth.alerts.filter(alert => alert.includes('WARNING'));
  }

  getInfoAlerts(): string[] {
    if (!this.systemHealth?.alerts) return [];
    return this.systemHealth.alerts.filter(alert =>
      !alert.includes('CRITICAL') && !alert.includes('WARNING')
    );
  }

  getMaxResponseTime(): number {
    if (!this.responseTimeData || this.responseTimeData.length === 0) return 1;
    return Math.max(...this.responseTimeData.map(point => point.value));
  }
}
