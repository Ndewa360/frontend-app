import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { StatisticRoomYearModel, StatisticLocataireYearModel, StatisticPaymentOfAllPropertyByYear } from 'src/app/shared/store';

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
  lowOccupancyRate: number; // %
  highArrearsRate: number; // %
  lowCollectionRate: number; // %
  significantRevenueDropMonth: number; // %
  significantRevenueDropYear: number; // %
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceAlertsService {
  private alertsSubject = new BehaviorSubject<PerformanceAlert[]>([]);
  public alerts$ = this.alertsSubject.asObservable();

  private defaultThresholds: AlertThresholds = {
    lowOccupancyRate: 70, // Alert if occupancy < 70%
    highArrearsRate: 15, // Alert if arrears > 15%
    lowCollectionRate: 85, // Alert if collection rate < 85%
    significantRevenueDropMonth: 20, // Alert if monthly revenue drops > 20%
    significantRevenueDropYear: 10 // Alert if yearly revenue drops > 10%
  };

  private currentThresholds: AlertThresholds = { ...this.defaultThresholds };

  constructor() {
    this.loadThresholds();
  }

  /**
   * Analyze room statistics and generate alerts
   */
  analyzeRoomStatistics(data: StatisticRoomYearModel[], propertyName: string): PerformanceAlert[] {
    const alerts: PerformanceAlert[] = [];

    data.forEach(roomStat => {
      // Calculate room occupancy rate
      const totalMonths = 12;
      const occupiedMonths = roomStat.paymentValue.filter(value => value > 0).length;
      const occupancyRate = (occupiedMonths / totalMonths) * 100;

      if (occupancyRate < this.currentThresholds.lowOccupancyRate) {
        alerts.push({
          id: `room-occupancy-${roomStat.room._id}-${Date.now()}`,
          type: 'warning',
          title: 'Taux d\'occupation faible',
          message: `La chambre ${roomStat.room.code} a un taux d'occupation de ${occupancyRate.toFixed(1)}%`,
          value: occupancyRate,
          threshold: this.currentThresholds.lowOccupancyRate,
          propertyName,
          timestamp: new Date(),
          isRead: false,
          actionRequired: true
        });
      }

      // Check for revenue drops
      const monthlyRevenues = roomStat.paymentValue;
      for (let i = 1; i < monthlyRevenues.length; i++) {
        if (monthlyRevenues[i-1] > 0 && monthlyRevenues[i] === 0) {
          alerts.push({
            id: `room-revenue-drop-${roomStat.room._id}-${i}-${Date.now()}`,
            type: 'danger',
            title: 'Arrêt de revenus détecté',
            message: `La chambre ${roomStat.room.code} n'a généré aucun revenu au mois ${i + 1}`,
            propertyName,
            timestamp: new Date(),
            isRead: false,
            actionRequired: true
          });
        }
      }
    });

    return alerts;
  }

  /**
   * Analyze tenant statistics and generate alerts
   */
  analyzeTenantStatistics(data: StatisticLocataireYearModel[], propertyName: string): PerformanceAlert[] {
    const alerts: PerformanceAlert[] = [];

    data.forEach(tenantStat => {
      // Calculate payment consistency
      const totalExpected = tenantStat.paymentValue.length * (tenantStat.paymentValue[0] || 0);
      const totalReceived = tenantStat.paymentValue.reduce((sum, val) => sum + val, 0);
      const collectionRate = totalExpected > 0 ? (totalReceived / totalExpected) * 100 : 0;

      if (collectionRate < this.currentThresholds.lowCollectionRate) {
        alerts.push({
          id: `tenant-collection-${tenantStat.locataire._id}-${Date.now()}`,
          type: 'warning',
          title: 'Taux de recouvrement faible',
          message: `${tenantStat.locataire.fullName} a un taux de paiement de ${collectionRate.toFixed(1)}%`,
          value: collectionRate,
          threshold: this.currentThresholds.lowCollectionRate,
          propertyName,
          timestamp: new Date(),
          isRead: false,
          actionRequired: true
        });
      }

      // Check for consecutive missed payments
      let consecutiveMissed = 0;
      let maxConsecutiveMissed = 0;
      
      tenantStat.paymentValue.forEach(payment => {
        if (payment === 0) {
          consecutiveMissed++;
          maxConsecutiveMissed = Math.max(maxConsecutiveMissed, consecutiveMissed);
        } else {
          consecutiveMissed = 0;
        }
      });

      if (maxConsecutiveMissed >= 3) {
        alerts.push({
          id: `tenant-missed-payments-${tenantStat.locataire._id}-${Date.now()}`,
          type: 'danger',
          title: 'Paiements manqués consécutifs',
          message: `${tenantStat.locataire.fullName} a manqué ${maxConsecutiveMissed} paiements consécutifs`,
          value: maxConsecutiveMissed,
          propertyName,
          timestamp: new Date(),
          isRead: false,
          actionRequired: true
        });
      }
    });

    return alerts;
  }

  /**
   * Analyze payment recapitulation and generate alerts
   */
  analyzePaymentRecapitulation(data: StatisticPaymentOfAllPropertyByYear): PerformanceAlert[] {
    const alerts: PerformanceAlert[] = [];

    // Analyze overall collection rate
    const totalExpected = data.paymentYear.totalAmountToBeReceveid;
    const totalReceived = data.paymentYear.totalAmountReceived;
    const overallCollectionRate = totalExpected > 0 ? (totalReceived / totalExpected) * 100 : 0;

    if (overallCollectionRate < this.currentThresholds.lowCollectionRate) {
      alerts.push({
        id: `overall-collection-${Date.now()}`,
        type: 'warning',
        title: 'Taux de recouvrement global faible',
        message: `Le taux de recouvrement global est de ${overallCollectionRate.toFixed(1)}%`,
        value: overallCollectionRate,
        threshold: this.currentThresholds.lowCollectionRate,
        timestamp: new Date(),
        isRead: false,
        actionRequired: true
      });
    }

    // Analyze arrears rate
    const arrearsRate = totalExpected > 0 ? (data.paymentYear.totalAmountRelicat / totalExpected) * 100 : 0;

    if (arrearsRate > this.currentThresholds.highArrearsRate) {
      alerts.push({
        id: `high-arrears-${Date.now()}`,
        type: 'danger',
        title: 'Taux d\'arriérés élevé',
        message: `Le taux d'arriérés global est de ${arrearsRate.toFixed(1)}%`,
        value: arrearsRate,
        threshold: this.currentThresholds.highArrearsRate,
        timestamp: new Date(),
        isRead: false,
        actionRequired: true
      });
    }

    // Analyze property performance
    data.paymentProperty.forEach(property => {
      const propertyExpected = property.amountProperty.totalAmountToBeReceveid;
      const propertyReceived = property.amountProperty.totalAmountReceived;
      const propertyCollectionRate = propertyExpected > 0 ? (propertyReceived / propertyExpected) * 100 : 0;

      if (propertyCollectionRate < this.currentThresholds.lowCollectionRate) {
        alerts.push({
          id: `property-collection-${property.property._id}-${Date.now()}`,
          type: 'warning',
          title: 'Performance propriété faible',
          message: `${property.property.name} a un taux de recouvrement de ${propertyCollectionRate.toFixed(1)}%`,
          value: propertyCollectionRate,
          threshold: this.currentThresholds.lowCollectionRate,
          propertyId: property.property._id,
          propertyName: property.property.name,
          timestamp: new Date(),
          isRead: false,
          actionRequired: true
        });
      }
    });

    return alerts;
  }

  /**
   * Add alerts to the current list
   */
  addAlerts(newAlerts: PerformanceAlert[]): void {
    const currentAlerts = this.alertsSubject.value;
    const updatedAlerts = [...currentAlerts, ...newAlerts];
    this.alertsSubject.next(updatedAlerts);
  }

  /**
   * Mark alert as read
   */
  markAsRead(alertId: string): void {
    const alerts = this.alertsSubject.value.map(alert =>
      alert.id === alertId ? { ...alert, isRead: true } : alert
    );
    this.alertsSubject.next(alerts);
  }

  /**
   * Remove alert
   */
  removeAlert(alertId: string): void {
    const alerts = this.alertsSubject.value.filter(alert => alert.id !== alertId);
    this.alertsSubject.next(alerts);
  }

  /**
   * Clear all alerts
   */
  clearAllAlerts(): void {
    this.alertsSubject.next([]);
  }

  /**
   * Get unread alerts count
   */
  getUnreadCount(): Observable<number> {
    return new Observable(observer => {
      this.alerts$.subscribe(alerts => {
        const unreadCount = alerts.filter(alert => !alert.isRead).length;
        observer.next(unreadCount);
      });
    });
  }

  /**
   * Update alert thresholds
   */
  updateThresholds(thresholds: Partial<AlertThresholds>): void {
    this.currentThresholds = { ...this.currentThresholds, ...thresholds };
    this.saveThresholds();
  }

  /**
   * Get current thresholds
   */
  getThresholds(): AlertThresholds {
    return { ...this.currentThresholds };
  }

  /**
   * Reset thresholds to default
   */
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
      } catch (error) {
        console.warn('Failed to load alert thresholds, using defaults');
      }
    }
  }
}
