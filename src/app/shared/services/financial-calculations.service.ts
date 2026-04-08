import { Injectable } from '@angular/core';
import {
  StatisticRoomYearModel,
  StatisticLocataireYearModel,
  StatisticAllPaymentLocataireYearModel,
  StatisticPaymentOfAllPropertyByYear,
  LocationModel
} from '../store';

export interface FinancialMetrics {
  totalRevenue: number;
  totalExpected: number;
  collectionRate: number;
  totalRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  averageRent: number;
  totalDeposits: number;
  netProfit: number;
  profitMargin: number;
}

export interface MonthlyFinancialData {
  month: string;
  monthIndex: number;
  expected: number;
  received: number;
  rate: number;
  profit: number;
}

export interface TenantFinancialSummary {
  tenantId: string;
  tenantName: string;
  totalPaid: number;
  totalDue: number;
  paymentRate: number;
  monthsActive: number;
  averageMonthlyPayment: number;
}

@Injectable({
  providedIn: 'root'
})
export class FinancialCalculationsService {

  constructor() {}

  /**
   * Calcule les métriques financières principales
   * @deprecated Utiliser PropertyFinancialManagerService.extractPropertyMetrics() à la place
   */
  calculateFinancialMetrics(
    yearlyStats: StatisticRoomYearModel[],
    recapitulation?: StatisticPaymentOfAllPropertyByYear | null,
    locations?: LocationModel[],
    selectedYear?: number
  ): FinancialMetrics {
    if (!yearlyStats || yearlyStats.length === 0) return this.getEmptyMetrics();

    let totalRevenue = 0, totalExpected = 0, totalRentSum = 0, occupiedRooms = 0;
    const totalRooms = yearlyStats.length;

    yearlyStats.forEach(roomStat => {
      const received = (roomStat.paymentValue || []).reduce((s, p) => s + (p || 0), 0);
      const price = roomStat.room?.price || 0;
      totalRevenue += received;
      // ✅ Utiliser monthsDue du backend si disponible, sinon 12
      totalExpected += price * (roomStat.monthsDue ?? 12);
      totalRentSum += price;
      if (received > 0 || !roomStat.room?.isFree) occupiedRooms++;
    });

    const collectionRate = totalExpected > 0 ? Math.min((totalRevenue / totalExpected) * 100, 100) : 0;
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
    const averageRent = totalRooms > 0 ? totalRentSum / totalRooms : 0;

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalExpected: Math.round(totalExpected * 100) / 100,
      collectionRate: Math.round(collectionRate * 100) / 100,
      totalRooms,
      occupiedRooms,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
      averageRent: Math.round(averageRent * 100) / 100,
      totalDeposits: 0,  // ✅ Les vraies cautions viennent du backend (cautionsAnalysis)
      netProfit: 0,      // ✅ Pas de coûts fictifs
      profitMargin: 0
    };
  }

  /**
   * Construire les données mensuelles
   * @deprecated Utiliser PropertyFinancialManagerService.extractMonthlyData() à la place
   */
  buildMonthlyData(
    yearlyStats: StatisticRoomYearModel[],
    recapitulation?: StatisticPaymentOfAllPropertyByYear | null
  ): MonthlyFinancialData[] {
    if (recapitulation?.paymentProperty && Array.isArray(recapitulation.paymentProperty)) {
      return this.buildMonthlyFromRecapitulation(recapitulation);
    }
    if (yearlyStats && yearlyStats.length > 0) {
      return this.buildMonthlyFromRoomStats(yearlyStats);
    }
    return this.getEmptyMonthlyData();
  }

  /**
   * Analyser les performances des locataires
   */
  analyzeTenantPerformance(
    tenantStats: StatisticLocataireYearModel[],
    paymentStats: StatisticAllPaymentLocataireYearModel[]
  ): TenantFinancialSummary[] {
    if (!tenantStats || tenantStats.length === 0) return [];

    return tenantStats.map(tenantStat => {
      const tenantPayments = paymentStats.filter(p => p.locataire?._id === tenantStat.locataire?._id);
      let totalPaid = 0, totalDue = 0;

      tenantPayments.forEach(payment => {
        payment.paymentState?.forEach(state => {
          // ✅ Correction : utiliser price (montant réellement payé)
          if (state.state === 'payed') {
            totalPaid += state.price || 0;
            totalDue += state.unitLocationPaymentPrice || state.price || 0;
          } else if (state.state === 'partialPayment') {
            totalPaid += state.price || 0;
            totalDue += state.unitLocationPaymentPrice || 0;
          } else if (state.state === 'unpayed') {
            totalDue += state.unitLocationPaymentPrice || 0;
          }
        });
      });

      const paymentRate = totalDue > 0 ? Math.min((totalPaid / totalDue) * 100, 100) : 0;
      const monthsActive = this.calculateActiveMonths(tenantPayments);
      const averageMonthlyPayment = monthsActive > 0 ? totalPaid / monthsActive : 0;

      return {
        tenantId: tenantStat.locataire?._id || '',
        tenantName: tenantStat.locataire?.fullName || 'Locataire inconnu',
        totalPaid,
        totalDue,
        paymentRate,
        monthsActive,
        averageMonthlyPayment
      };
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency', currency: 'XAF', minimumFractionDigits: 0
    }).format(amount);
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  getMonthName(monthIndex: number): string {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return months[monthIndex] || `Mois ${monthIndex + 1}`;
  }

  /**
   * Extraction des métriques depuis les calculs centralisés du backend
   */
  extractFinancialMetricsFromBackend(backendData: any): FinancialMetrics {
    if (!backendData || !backendData.propertyMetrics) return this.getEmptyMetrics();
    const m = backendData.propertyMetrics;
    return {
      totalRevenue: m.totalRevenue,
      totalExpected: m.totalExpected,
      collectionRate: m.collectionRate,
      totalRooms: m.totalRooms,
      occupiedRooms: m.occupiedRooms,
      occupancyRate: m.occupancyRate,
      averageRent: m.averageRent,
      // ✅ Cautions réelles depuis le backend
      totalDeposits: backendData.cautionsAnalysis?.summary?.totalCautionsReceived || 0,
      netProfit: 0,
      profitMargin: 0
    };
  }

  /**
   * Extraction des données mensuelles depuis le backend
   * Utilise revenueDistribution.monthlyAnalysis pour des données précises.
   */
  extractMonthlyDataFromBackend(backendData: any): MonthlyFinancialData[] {
    if (!backendData?.revenueDistribution?.monthlyAnalysis) {
      return this.getEmptyMonthlyData();
    }
    return backendData.revenueDistribution.monthlyAnalysis.map((item: any, index: number) => ({
      month: this.getMonthName(index),
      monthIndex: index,
      expected: Math.round((item.expected || 0) * 100) / 100,
      received: Math.round((item.distributed || 0) * 100) / 100,
      rate: Math.round((item.fulfillmentRate || 0) * 100) / 100,
      profit: Math.round((item.distributed || 0) * 100) / 100
    }));
  }

  /**
   * Extraction des performances des locataires depuis le backend
   */
  extractTenantPerformanceFromBackend(backendData: any): TenantFinancialSummary[] {
    if (!backendData?.rooms) return [];
    return backendData.rooms
      .filter((r: any) => r.totalReceived > 0)
      .map((r: any) => {
        const monthsActive = r.monthsDue || 12;
        return {
          tenantId: r.room._id || '',
          tenantName: `Chambre ${r.room.code}`,
          totalPaid: r.totalReceived,
          totalDue: r.expectedAmount,
          paymentRate: r.collectionRate,
          monthsActive,
          averageMonthlyPayment: Math.round((r.totalReceived / monthsActive) * 100) / 100
        };
      });
  }

  /**
   * Valide les données du backend
   */
  validateBackendData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!data) { errors.push('Données manquantes'); return { isValid: false, errors }; }
    if (data.rooms && Array.isArray(data.rooms)) {
      data.rooms.forEach((room: any, i: number) => {
        if (!room.room) errors.push(`Chambre ${i}: données manquantes`);
        if (typeof room.totalReceived !== 'number') errors.push(`Chambre ${i}: totalReceived invalide`);
        if (typeof room.expectedAmount !== 'number') errors.push(`Chambre ${i}: expectedAmount invalide`);
      });
    }
    if (data.propertyMetrics) {
      if (typeof data.propertyMetrics.totalRevenue !== 'number') errors.push('totalRevenue invalide');
      if (typeof data.propertyMetrics.collectionRate !== 'number') errors.push('collectionRate invalide');
    }
    return { isValid: errors.length === 0, errors };
  }

  /**
   * Valide les données financières pour détecter les incohérences
   */
  validateFinancialData(metrics: FinancialMetrics): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];
    if (metrics.totalRevenue < 0) warnings.push('Revenus totaux négatifs détectés');
    if (metrics.totalExpected < 0) warnings.push('Revenus attendus négatifs détectés');
    if (metrics.collectionRate > 100) warnings.push('Taux de collection supérieur à 100%');
    if (metrics.occupancyRate > 100) warnings.push('Taux d\'occupation supérieur à 100%');
    if (metrics.occupiedRooms > metrics.totalRooms) warnings.push('Plus de chambres occupées que le total');
    if (metrics.totalRooms === 0 && metrics.totalRevenue > 0) warnings.push('Revenus détectés sans chambres');
    if (metrics.averageRent <= 0 && metrics.totalRooms > 0) warnings.push('Loyer moyen invalide');
    return { isValid: warnings.length === 0, warnings };
  }

  calculateRevenueGrowth(currentPeriodData: any[], previousPeriodData?: any[]): number {
    if (!currentPeriodData?.length || !previousPeriodData?.length) return 0;
    const current = currentPeriodData.reduce((s, i) => s + (i.locationPaymentPrice || i.amount || i.value || 0), 0);
    const previous = previousPeriodData.reduce((s, i) => s + (i.locationPaymentPrice || i.amount || i.value || 0), 0);
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 100) / 100;
  }

  // ─── Méthodes privées ────────────────────────────────────────────────────────

  private getEmptyMetrics(): FinancialMetrics {
    return { totalRevenue: 0, totalExpected: 0, collectionRate: 0, totalRooms: 0,
      occupiedRooms: 0, occupancyRate: 0, averageRent: 0, totalDeposits: 0, netProfit: 0, profitMargin: 0 };
  }

  private getEmptyMonthlyData(): MonthlyFinancialData[] {
    return Array.from({ length: 12 }, (_, i) => ({
      month: this.getMonthName(i), monthIndex: i, expected: 0, received: 0, rate: 0, profit: 0
    }));
  }

  private calculateActiveMonths(payments: StatisticAllPaymentLocataireYearModel[]): number {
    const months = new Set<number>();
    payments.forEach(p => p.paymentState?.forEach(s => {
      if (s.state === 'payed' || s.state === 'partialPayment') months.add(s.month);
    }));
    return months.size;
  }

  private buildMonthlyFromRoomStats(yearlyStats: StatisticRoomYearModel[]): MonthlyFinancialData[] {
    return Array.from({ length: 12 }, (_, month) => {
      let received = 0, expected = 0;
      yearlyStats.forEach(r => {
        received += r.paymentValue?.[month] || 0;
        expected += r.room?.price || 0;
      });
      const rate = expected > 0 ? Math.min((received / expected) * 100, 100) : 0;
      return {
        month: this.getMonthName(month), monthIndex: month,
        expected: Math.round(expected * 100) / 100,
        received: Math.round(received * 100) / 100,
        rate: Math.round(rate * 100) / 100,
        profit: Math.round(received * 100) / 100
      };
    });
  }

  private buildMonthlyFromRecapitulation(recapitulation: StatisticPaymentOfAllPropertyByYear): MonthlyFinancialData[] {
    const data: MonthlyFinancialData[] = [];
    recapitulation.paymentProperty?.[0]?.amountMonth?.forEach((m: any, i: number) => {
      const received = m.totalAmountReceived || 0;
      const expected = m.totalAmountToBeReceveid || 0;
      const rate = expected > 0 ? Math.min((received / expected) * 100, 100) : 0;
      data.push({
        month: this.getMonthName(i), monthIndex: i,
        expected, received,
        rate: Math.round(rate * 100) / 100,
        profit: received
      });
    });
    return data.length > 0 ? data : this.getEmptyMonthlyData();
  }
}
