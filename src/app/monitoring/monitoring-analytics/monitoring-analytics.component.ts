import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Subject, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MonitoringService } from '../../shared/services/monitoring.service';
import {
  ErrorStats,
  SystemHealth,
  ErrorLevel,
  ErrorSource,
  ErrorStatus
} from '../../shared/models/monitoring.models';

@Component({
  selector: 'app-monitoring-analytics',
  templateUrl: './monitoring-analytics.component.html',
  styleUrls: ['./monitoring-analytics.component.scss']
})
export class MonitoringAnalyticsComponent implements OnInit, OnDestroy {
  @Input() set errorStats(value: ErrorStats | null) {
    console.log('📈 ErrorStats reçu:', value);
    this._errorStats = value;
  }
  get errorStats(): ErrorStats | null {
    return this._errorStats;
  }
  private _errorStats: ErrorStats | null = null;

  @Input() set systemHealth(value: SystemHealth | null) {
    console.log('🔧 SystemHealth reçu dans Analytics:', value);
    this._systemHealth = value;
  }
  get systemHealth(): SystemHealth | null {
    return this._systemHealth;
  }
  private _systemHealth: SystemHealth | null = null;

  private destroy$ = new Subject<void>();

  // Données pour les graphiques
  errorTrendData: any[] = [];
  errorDistributionData: any[] = [];
  errorResolutionData: any[] = [];
  systemPerformanceData: any[] = [];
  topErrorsData: any[] = [];

  // Métriques calculées
  errorRate = 0;
  resolutionRate = 0;
  averageResolutionTime = 0;
  criticalErrorsCount = 0;

  // Période d'analyse
  selectedPeriod = '24h';
  periodOptions = [
    { value: '1h', label: '1 heure' },
    { value: '24h', label: '24 heures' },
    { value: '7d', label: '7 jours' },
    { value: '30d', label: '30 jours' }
  ];

  // Configuration des couleurs
  colorScheme = {
    domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5']
  };

  // États du composant
  isLoading = false;

  constructor(private monitoringService: MonitoringService) {}

  ngOnInit() {
    console.log('📈 MonitoringAnalyticsComponent initialisé');
    this.processAnalyticsData();
    this.setupAutoRefresh();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==================== DATA PROCESSING ====================

  private processAnalyticsData() {
    if (this.errorStats) {
      this.processErrorStats();
    }
    if (this.systemHealth) {
      this.processSystemHealth();
    }
    this.calculateMetrics();
  }

  private processErrorStats() {
    if (!this.errorStats) return;

    // Distribution des erreurs par niveau
    this.errorDistributionData = Object.entries(this.errorStats.errorsByLevel).map(([level, count]) => ({
      name: this.getErrorLevelLabel(level as ErrorLevel),
      value: count,
      level: level
    }));

    // Distribution par statut (taux de résolution)
    this.errorResolutionData = Object.entries(this.errorStats.errorsByStatus).map(([status, count]) => ({
      name: this.getErrorStatusLabel(status as ErrorStatus),
      value: count,
      status: status
    }));

    // Top des erreurs
    this.topErrorsData = this.errorStats.topErrors.map(error => ({
      name: this.truncateText(error.message, 30),
      value: error.count,
      level: error.level
    }));
  }

  private processSystemHealth() {
    if (!this.systemHealth) return;

    // Données de performance système
    const services = Object.values(this.systemHealth.services);
    this.systemPerformanceData = services.map(service => ({
      name: service.name,
      value: service.responseTime || 0,
      status: service.status
    }));
  }

  private calculateMetrics() {
    if (!this.errorStats) return;

    // Taux d'erreur (erreurs récentes / total)
    this.errorRate = this.errorStats.totalErrors > 0 
      ? (this.errorStats.recentErrors / this.errorStats.totalErrors) * 100 
      : 0;

    // Taux de résolution
    const resolvedErrors = this.errorStats.errorsByStatus[ErrorStatus.RESOLVED] || 0;
    this.resolutionRate = this.errorStats.totalErrors > 0 
      ? (resolvedErrors / this.errorStats.totalErrors) * 100 
      : 0;

    // Nombre d'erreurs critiques
    this.criticalErrorsCount = this.errorStats.errorsByLevel[ErrorLevel.CRITICAL] || 0;
  }

  private setupAutoRefresh() {
    // Actualiser les données toutes les 2 minutes
    timer(0, 120000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.refreshAnalytics();
      });
  }

  // ==================== ACTIONS ====================

  refreshAnalytics() {
    this.isLoading = true;
    this.monitoringService.getDashboardData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.errorStats = data.errorStats;
          this.systemHealth = data.systemHealth;
          this.processAnalyticsData();
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error refreshing analytics:', error);
        }
      });
  }

  onPeriodChange() {
    // Recharger les données pour la nouvelle période
    this.refreshAnalytics();
  }

  // ==================== CHART EVENTS ====================

  onChartSelect(event: any) {
    console.log('Chart selection:', event);
  }

  onChartActivate(event: any) {
    console.log('Chart activate:', event);
  }

  onChartDeactivate(event: any) {
    console.log('Chart deactivate:', event);
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

  getErrorStatusLabel(status: ErrorStatus): string {
    const labels = {
      [ErrorStatus.NEW]: 'Nouveau',
      [ErrorStatus.ACKNOWLEDGED]: 'Reconnu',
      [ErrorStatus.IN_PROGRESS]: 'En cours',
      [ErrorStatus.RESOLVED]: 'Résolu',
      [ErrorStatus.IGNORED]: 'Ignoré'
    };
    return labels[status] || status;
  }

  getMetricClass(value: number, thresholds: { good: number; warning: number }): string {
    if (value <= thresholds.good) return 'metric-good';
    if (value <= thresholds.warning) return 'metric-warning';
    return 'metric-critical';
  }

  getErrorRateClass(): string {
    return this.getMetricClass(this.errorRate, { good: 1, warning: 5 });
  }

  getResolutionRateClass(): string {
    if (this.resolutionRate >= 90) return 'metric-good';
    if (this.resolutionRate >= 70) return 'metric-warning';
    return 'metric-critical';
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  formatDuration(milliseconds: number): string {
    if (milliseconds < 1000) return `${milliseconds}ms`;
    if (milliseconds < 60000) return `${(milliseconds / 1000).toFixed(1)}s`;
    return `${(milliseconds / 60000).toFixed(1)}min`;
  }

  truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
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

  getColorForStatus(status: string): string {
    const colors = {
      'NEW': '#ffc107',
      'ACKNOWLEDGED': '#17a2b8',
      'IN_PROGRESS': '#007bff',
      'RESOLVED': '#28a745',
      'IGNORED': '#6c757d'
    };
    return colors[status] || '#6c757d';
  }

  getColorForPerformance(value: number): string {
    if (value < 100) return '#28a745'; // Vert - Rapide
    if (value < 500) return '#ffc107'; // Jaune - Moyen
    if (value < 1000) return '#fd7e14'; // Orange - Lent
    return '#dc3545'; // Rouge - Très lent
  }

  getTotalErrors(): number {
    if (!this.errorStats) return 1;
    return this.errorStats.totalErrors || 1;
  }

  getMaxTopErrorValue(): number {
    if (!this.topErrorsData || this.topErrorsData.length === 0) return 1;
    return Math.max(...this.topErrorsData.map(item => item.value));
  }

  getMaxPerformanceValue(): number {
    if (!this.systemPerformanceData || this.systemPerformanceData.length === 0) return 1;
    return Math.max(...this.systemPerformanceData.map(item => item.value));
  }

  // Exposer Object pour les templates
  Object = Object;

  // Helper pour les statuts
  getStatusLabel(status: string): string {
    return this.getErrorStatusLabel(status as ErrorStatus);
  }

  // Helper pour les sources
  getSourceLabel(source: string): string {
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
    return labels[source as ErrorSource] || source;
  }

  getHealthScore(): number {
    if (!this.systemHealth) return 0;
    
    const services = Object.values(this.systemHealth.services);
    if (services.length === 0) return 0;
    
    const healthyServices = services.filter(s => s.status === 'HEALTHY').length;
    return Math.round((healthyServices / services.length) * 100);
  }

  getRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.errorRate > 5) {
      recommendations.push('🚨 Taux d\'erreur élevé - Investiguer les causes principales');
    }

    if (this.resolutionRate < 70) {
      recommendations.push('⚠️ Taux de résolution faible - Améliorer les processus de correction');
    }

    if (this.criticalErrorsCount > 0) {
      recommendations.push('🔥 Erreurs critiques détectées - Traitement prioritaire requis');
    }

    if (this.systemHealth?.systemMetrics?.memoryUsage && this.systemHealth.systemMetrics.memoryUsage > 80) {
      recommendations.push('💾 Utilisation mémoire élevée - Optimisation recommandée');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Système en bon état - Continuer la surveillance');
    }

    return recommendations;
  }

  getInsights(): string[] {
    const insights: string[] = [];

    if (this.errorStats?.topErrors && this.errorStats.topErrors.length > 0) {
      const topError = this.errorStats.topErrors[0];
      insights.push(`📊 Erreur la plus fréquente: "${this.truncateText(topError.message, 50)}" (${topError.count} occurrences)`);
    }

    if (this.errorStats?.errorsBySource) {
      const sources = Object.entries(this.errorStats.errorsBySource);
      const topSource = sources.reduce((max, current) => current[1] > max[1] ? current : max, ['', 0]);
      if (topSource[1] > 0) {
        insights.push(`🎯 Source principale d'erreurs: ${topSource[0]} (${topSource[1]} erreurs)`);
      }
    }

    const healthScore = this.getHealthScore();
    if (healthScore >= 90) {
      insights.push('🌟 Excellente santé système - Tous les services fonctionnent correctement');
    } else if (healthScore >= 70) {
      insights.push('👍 Bonne santé système - Quelques services nécessitent une attention');
    } else {
      insights.push('⚠️ Santé système dégradée - Plusieurs services en difficulté');
    }

    return insights;
  }
}
