import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { StatisticPaymentOfAllPropertyByYear, EnrichedStatisticResponse } from 'src/app/shared/store';

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'danger' | 'info' | 'success';
  title: string;
  message: string;
  value?: number;
  threshold?: number;
  propertyId?: string;
  propertyName?: string;
  timestamp: Date;
  isRead: boolean;
  actionRequired: boolean;
}

export interface AlertThresholds {
  lowOccupancyRate: number;
  highArrearsRate: number;
  lowCollectionRate: number;
  significantRevenueDropMonth: number;
  significantRevenueDropYear: number;
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceAlertsService {
  private alertsSubject = new BehaviorSubject<PerformanceAlert[]>([]);
  public alerts$ = this.alertsSubject.asObservable();

  private defaultThresholds: AlertThresholds = {
    lowOccupancyRate: 70,
    highArrearsRate: 15,
    lowCollectionRate: 85,
    significantRevenueDropMonth: 20,
    significantRevenueDropYear: 10
  };

  private currentThresholds: AlertThresholds = { ...this.defaultThresholds };

  constructor() {
    this.loadThresholds();
  }

  /**
   * Alimente les alertes depuis les données enrichies du backend (par propriété).
   * Utilise comprehensiveReport.alerts et tenantsAnalysis pour éviter tout recalcul frontend.
   */
  loadAlertsFromEnrichedData(data: EnrichedStatisticResponse, propertyName: string): void {
    if (!data?.data) return;

    const alerts: PerformanceAlert[] = [];
    const report = data.data.comprehensiveReport;
    const metrics = data.data.propertyMetrics;
    const cautionsAlerts = data.data.cautionsAnalysis?.alerts || [];

    // Alertes du rapport complet backend
    (report?.alerts || []).forEach((msg, i) => {
      alerts.push({
        id: `backend-alert-${i}-${Date.now()}`,
        type: 'warning',
        title: 'Alerte performance',
        message: msg,
        propertyName,
        timestamp: new Date(),
        isRead: false,
        actionRequired: true
      });
    });

    // Recommandations backend → info
    (report?.recommendations || []).forEach((msg, i) => {
      alerts.push({
        id: `backend-rec-${i}-${Date.now()}`,
        type: 'info',
        title: 'Recommandation',
        message: msg,
        propertyName,
        timestamp: new Date(),
        isRead: false,
        actionRequired: false
      });
    });

    // Alertes cautions backend
    cautionsAlerts.forEach((msg, i) => {
      alerts.push({
        id: `caution-alert-${i}-${Date.now()}`,
        type: 'warning',
        title: 'Alerte caution',
        message: msg,
        propertyName,
        timestamp: new Date(),
        isRead: false,
        actionRequired: true
      });
    });

    // Alerte taux d'occupation faible (depuis métriques backend)
    if (metrics && metrics.occupancyRate < this.currentThresholds.lowOccupancyRate) {
      alerts.push({
        id: `occupancy-${Date.now()}`,
        type: 'warning',
        title: "Taux d'occupation faible",
        message: `${propertyName} : taux d'occupation de ${metrics.occupancyRate.toFixed(1)}%`,
        value: metrics.occupancyRate,
        threshold: this.currentThresholds.lowOccupancyRate,
        propertyName,
        timestamp: new Date(),
        isRead: false,
        actionRequired: true
      });
    }

    // Alerte taux de recouvrement faible (depuis métriques backend)
    if (metrics && metrics.collectionRate < this.currentThresholds.lowCollectionRate) {
      alerts.push({
        id: `collection-${Date.now()}`,
        type: 'danger',
        title: 'Taux de recouvrement faible',
        message: `${propertyName} : taux de recouvrement de ${metrics.collectionRate.toFixed(1)}%`,
        value: metrics.collectionRate,
        threshold: this.currentThresholds.lowCollectionRate,
        propertyName,
        timestamp: new Date(),
        isRead: false,
        actionRequired: true
      });
    }

    this.addAlerts(alerts);
  }

  /**
   * Alimente les alertes depuis le récapitulatif annuel toutes propriétés.
   * Utilise globalAlerts et globalRecommendations du backend — aucun recalcul frontend.
   */
  loadAlertsFromRecapitulation(data: StatisticPaymentOfAllPropertyByYear): void {
    if (!data) return;

    const alerts: PerformanceAlert[] = [];

    // Alertes globales backend
    (data.globalAlerts || []).forEach((msg, i) => {
      alerts.push({
        id: `global-alert-${i}-${Date.now()}`,
        type: 'warning',
        title: 'Alerte globale',
        message: msg,
        timestamp: new Date(),
        isRead: false,
        actionRequired: true
      });
    });

    // Recommandations globales backend → info
    (data.globalRecommendations || []).forEach((msg, i) => {
      alerts.push({
        id: `global-rec-${i}-${Date.now()}`,
        type: 'info',
        title: 'Recommandation globale',
        message: msg,
        timestamp: new Date(),
        isRead: false,
        actionRequired: false
      });
    });

    // Alertes par propriété depuis detailedMetrics backend
    (data.paymentProperty || []).forEach(prop => {
      const metrics = prop.detailedMetrics;
      if (!metrics) return;

      if (metrics.collectionRate < this.currentThresholds.lowCollectionRate) {
        alerts.push({
          id: `prop-collection-${prop.property._id}-${Date.now()}`,
          type: 'warning',
          title: 'Performance propriété faible',
          message: `${prop.property.name} : taux de recouvrement de ${metrics.collectionRate.toFixed(1)}%`,
          value: metrics.collectionRate,
          threshold: this.currentThresholds.lowCollectionRate,
          propertyId: prop.property._id,
          propertyName: prop.property.name,
          timestamp: new Date(),
          isRead: false,
          actionRequired: true
        });
      }

      if (metrics.occupancyRate < this.currentThresholds.lowOccupancyRate) {
        alerts.push({
          id: `prop-occupancy-${prop.property._id}-${Date.now()}`,
          type: 'warning',
          title: "Taux d'occupation faible",
          message: `${prop.property.name} : taux d'occupation de ${metrics.occupancyRate.toFixed(1)}%`,
          value: metrics.occupancyRate,
          threshold: this.currentThresholds.lowOccupancyRate,
          propertyId: prop.property._id,
          propertyName: prop.property.name,
          timestamp: new Date(),
          isRead: false,
          actionRequired: true
        });
      }
    });

    // Alerte taux d'arriérés global (depuis globalMetrics backend)
    const globalMetrics = data.globalMetrics;
    if (globalMetrics) {
      // riskLevel est calculé backend : 'high' si dettes > 30% des revenus
      if (globalMetrics.riskLevel === 'high') {
        alerts.push({
          id: `arrears-${Date.now()}`,
          type: 'danger',
          title: "Taux d'arriérés élevé",
          message: `Niveau de risque élevé : dettes importantes détectées sur le portefeuille`,
          timestamp: new Date(),
          isRead: false,
          actionRequired: true
        });
      }
    }

    this.addAlerts(alerts);
  }

  addAlerts(newAlerts: PerformanceAlert[]): void {
    const currentAlerts = this.alertsSubject.value;
    this.alertsSubject.next([...currentAlerts, ...newAlerts]);
  }

  markAsRead(alertId: string): void {
    const alerts = this.alertsSubject.value.map(alert =>
      alert.id === alertId ? { ...alert, isRead: true } : alert
    );
    this.alertsSubject.next(alerts);
  }

  removeAlert(alertId: string): void {
    const alerts = this.alertsSubject.value.filter(alert => alert.id !== alertId);
    this.alertsSubject.next(alerts);
  }

  clearAllAlerts(): void {
    this.alertsSubject.next([]);
  }

  getUnreadCount(): Observable<number> {
    return new Observable(observer => {
      this.alerts$.subscribe(alerts => {
        observer.next(alerts.filter(alert => !alert.isRead).length);
      });
    });
  }

  updateThresholds(thresholds: Partial<AlertThresholds>): void {
    this.currentThresholds = { ...this.currentThresholds, ...thresholds };
    this.saveThresholds();
  }

  getThresholds(): AlertThresholds {
    return { ...this.currentThresholds };
  }

  resetThresholds(): void {
    this.currentThresholds = { ...this.defaultThresholds };
    this.saveThresholds();
  }

  private saveThresholds(): void {
    localStorage.setItem('performance-alert-thresholds', JSON.stringify(this.currentThresholds));
  }

  private loadThresholds(): void {
    const saved = localStorage.getItem('performance-alert-thresholds');
    if (saved) {
      try {
        this.currentThresholds = { ...this.defaultThresholds, ...JSON.parse(saved) };
      } catch {
        // utiliser les valeurs par défaut
      }
    }
  }
}
