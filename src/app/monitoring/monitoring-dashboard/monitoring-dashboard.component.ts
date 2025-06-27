import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subject, timer, combineLatest } from 'rxjs';
import { takeUntil, map, startWith } from 'rxjs/operators';
import { MonitoringService } from '../../shared/services/monitoring.service';
import {
  DashboardData,
  ErrorLog,
  SystemHealth,
  ErrorStats,
  ErrorLevel,
  ErrorSource,
  ErrorStatus,
  ServiceStatus,
  Alert,
  ErrorFilters
} from '../../shared/models/monitoring.models';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-monitoring-dashboard',
  templateUrl: './monitoring-dashboard.component.html',
  styleUrls: ['./monitoring-dashboard.component.scss']
})
export class MonitoringDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Données principales
  dashboardData$: Observable<DashboardData | null>;
  alerts$: Observable<Alert[]>;
  recentErrors$: Observable<ErrorLog[]>;
  systemHealth$: Observable<SystemHealth | null>;

  // États du composant
  private _isLoading = true;

  get isLoading(): boolean {
    return this._isLoading;
  }

  set isLoading(value: boolean) {
    this._isLoading = value;
  }
  private _selectedTab = 'overview';
  autoRefresh = true;
  refreshInterval = 30000; // 30 secondes

  get selectedTab(): string {
    return this._selectedTab;
  }

  set selectedTab(value: string) {
    this._selectedTab = value;
  }

  // Filtres pour les erreurs
  errorFilters: ErrorFilters = {
    limit: 50,
    skip: 0
  };

  // Données pour les graphiques
  errorLevelData: any[] = [];
  errorSourceData: any[] = [];
  errorTrendData: any[] = [];
  systemHealthHistory: any[] = [];

  // Données actuelles du dashboard
  currentDashboardData: DashboardData | null = null;

  // Énumérations pour les templates
  ErrorLevel = ErrorLevel;
  ErrorSource = ErrorSource;
  ErrorStatus = ErrorStatus;
  ServiceStatus = ServiceStatus;

  // Configuration des couleurs pour les graphiques
  colorScheme = {
    domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA', '#FF8C00']
  };

  constructor(
    private monitoringService: MonitoringService,
    private toastr: ToastrService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.dashboardData$ = this.monitoringService.getDashboardDataStream();
    this.alerts$ = this.monitoringService.getAlertsStream();
  }

  ngOnInit() {
    this.initializeData();
    this.setupAutoRefresh();
    this.loadRecentErrors();
    this.loadHealthHistory();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==================== INITIALIZATION ====================

  private initializeData() {
    // Charger les données initiales
    this.monitoringService.getDashboardData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.isLoading = false;
          this.processChartData(data);
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.error('Erreur lors du chargement des données', 'Monitoring');
          console.error('Dashboard loading error:', error);
        }
      });

    // Surveiller les changements de données
    this.dashboardData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        if (data) {
          this.currentDashboardData = data;
          this.processChartData(data);
        }
      });
  }

  private setupAutoRefresh() {
    // Auto-refresh si activé
    timer(0, this.refreshInterval)
      .pipe(
        takeUntil(this.destroy$),
        map(() => this.autoRefresh)
      )
      .subscribe(shouldRefresh => {
        if (shouldRefresh) {
          this.refreshData();
        }
      });
  }

  loadRecentErrors() {
    this.recentErrors$ = this.monitoringService.getErrors({
      limit: 20,
      skip: 0
    }).pipe(
      map(result => result.errors),
      startWith([])
    );
  }

  // ==================== DATA PROCESSING ====================

  private processChartData(data: DashboardData) {
    if (!data.errorStats) return;

    // Données pour le graphique des niveaux d'erreur
    this.errorLevelData = Object.entries(data.errorStats.errorsByLevel).map(([level, count]) => ({
      name: this.getErrorLevelLabel(level as ErrorLevel),
      value: count,
      level: level
    }));

    // Données pour le graphique des sources d'erreur
    this.errorSourceData = Object.entries(data.errorStats.errorsBySource).map(([source, count]) => ({
      name: this.getErrorSourceLabel(source as ErrorSource),
      value: count,
      source: source
    }));

    // Charger l'historique pour les tendances
    this.loadHealthHistory();
  }

  private loadHealthHistory() {
    this.monitoringService.getHealthHistory(24)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (history) => {
          this.systemHealthHistory = history.map(h => ({
            name: new Date(h.timestamp).toLocaleTimeString(),
            timestamp: h.timestamp,
            status: h.overallStatus,
            memoryUsage: h.systemMetrics?.memoryUsage || 0,
            responseTime: this.calculateAverageResponseTime(h),
            errorCount: this.getErrorCountFromHealth(h)
          }));
        },
        error: (error) => {
          console.error('Erreur lors du chargement de l\'historique:', error);
        }
      });
  }

  // ==================== ACTIONS ====================

  refreshData() {
    this.isLoading = true;

    // Recharger toutes les données
    this.monitoringService.getDashboardData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.loadRecentErrors();
          this.loadHealthHistory();
          this.toastr.success('Données mises à jour', 'Monitoring');
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.error('Erreur lors de la mise à jour', 'Monitoring');
          console.error('Erreur lors de l\'actualisation:', error);
        }
      });
  }

  toggleAutoRefresh() {
    this.autoRefresh = !this.autoRefresh;
    const message = this.autoRefresh ? 'Auto-refresh activé' : 'Auto-refresh désactivé';
    this.toastr.info(message, 'Monitoring');
  }

  changeRefreshInterval(interval: number) {
    this.refreshInterval = interval;
    this.toastr.info(`Intervalle changé à ${interval/1000}s`, 'Monitoring');
  }

  selectTab(tab: string) {
    this.selectedTab = tab;

    // Forcer la détection de changement
    this.cdr.detectChanges();

    // Forcer le rechargement des données pour l'onglet sélectionné
    if (tab === 'errors') {
      this.loadRecentErrors();
    } else if (tab === 'system') {
      this.loadHealthHistory();
    }
  }

  // ==================== ERROR MANAGEMENT ====================

  updateErrorStatus(errorId: string, status: ErrorStatus) {
    this.monitoringService.updateErrorStatus(errorId, status, 'Admin', `Status changed to ${status}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastr.success('Statut mis à jour', 'Monitoring');
          this.loadRecentErrors();
        },
        error: (error) => {
          this.toastr.error('Erreur lors de la mise à jour', 'Monitoring');
        }
      });
  }

  deleteError(errorId: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette erreur ?')) {
      this.monitoringService.deleteError(errorId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastr.success('Erreur supprimée', 'Monitoring');
            this.loadRecentErrors();
          },
          error: (error) => {
            this.toastr.error('Erreur lors de la suppression', 'Monitoring');
          }
        });
    }
  }

  bulkUpdateErrors(errorIds: string[], updates: Partial<ErrorLog>) {
    this.monitoringService.bulkUpdateErrors({ ids: errorIds, updates })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (count) => {
          this.toastr.success(`${count} erreurs mises à jour`, 'Monitoring');
          this.loadRecentErrors();
        },
        error: (error) => {
          this.toastr.error('Erreur lors de la mise à jour en lot', 'Monitoring');
        }
      });
  }

  // ==================== ALERTS MANAGEMENT ====================

  dismissAlert(alertId: string) {
    this.monitoringService.removeAlert(alertId);
  }

  clearAllAlerts() {
    this.monitoringService.clearAllAlerts();
    this.toastr.info('Toutes les alertes ont été effacées', 'Monitoring');
  }

  // ==================== UTILITY METHODS ====================

  getErrorLevelLabel(level: ErrorLevel): string {
    const labels = {
      [ErrorLevel.LOW]: 'Faible',
      [ErrorLevel.MEDIUM]: 'Moyen',
      [ErrorLevel.HIGH]: 'Élevé',
      [ErrorLevel.CRITICAL]: 'Critique'
    };
    return labels[level] || level;
  }

  getErrorSourceLabel(source: ErrorSource): string {
    const labels = {
      [ErrorSource.FRONTEND]: 'Frontend',
      [ErrorSource.BACKEND]: 'Backend',
      [ErrorSource.DATABASE]: 'Base de données',
      [ErrorSource.EXTERNAL_API]: 'API externe',
      [ErrorSource.AUTHENTICATION]: 'Authentification',
      [ErrorSource.AUTHORIZATION]: 'Autorisation',
      [ErrorSource.VALIDATION]: 'Validation',
      [ErrorSource.NETWORK]: 'Réseau'
    };
    return labels[source] || source;
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

  getErrorLevelClass(level: ErrorLevel): string {
    const classes = {
      [ErrorLevel.LOW]: 'level-low',
      [ErrorLevel.MEDIUM]: 'level-medium',
      [ErrorLevel.HIGH]: 'level-high',
      [ErrorLevel.CRITICAL]: 'level-critical'
    };
    return classes[level] || 'level-medium';
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleString('fr-FR');
  }

  formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  private calculateAverageResponseTime(health: SystemHealth): number {
    const services = Object.values(health.services);
    const responseTimes = services
      .map(s => s.responseTime)
      .filter(rt => rt !== undefined) as number[];
    
    if (responseTimes.length === 0) return 0;
    return responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length;
  }

  private getErrorCountFromHealth(health: SystemHealth): number {
    return health.applicationMetrics?.recentErrors || 0;
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

  getServicesArray(services: any): any[] {
    if (!services) return [];
    return Object.values(services);
  }

  // Méthodes pour les graphiques CSS
  getColorForLevel(level: string): string {
    const colors = {
      'LOW': '#17a2b8',
      'MEDIUM': '#ffc107',
      'HIGH': '#fd7e14',
      'CRITICAL': '#dc3545'
    };
    return colors[level] || '#6c757d';
  }

  getColorForSource(source: string): string {
    const colors = {
      'FRONTEND': '#007bff',
      'BACKEND': '#28a745',
      'DATABASE': '#dc3545',
      'NETWORK': '#ffc107',
      'AUTHENTICATION': '#6f42c1',
      'VALIDATION': '#fd7e14'
    };
    return colors[source] || '#6c757d';
  }

  getTotalErrors(): number {
    if (!this.currentDashboardData?.errorStats) return 1;
    return this.currentDashboardData.errorStats.totalErrors || 1;
  }

  getMaxSourceValue(): number {
    if (!this.errorSourceData || this.errorSourceData.length === 0) return 1;
    return Math.max(...this.errorSourceData.map(item => item.value));
  }

}
