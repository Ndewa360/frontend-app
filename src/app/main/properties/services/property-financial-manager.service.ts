import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import {
  EnrichedStatisticResponse,
  AggregatedMetrics
} from '../../../shared/store';
import { StatisticState } from '../../../shared/store/statistic-data/statistic.state';
import { TranslationUtilsService } from '../../../shared/services/translation-utils.service';

export interface PropertyFinancialMetrics {
  totalRevenue: number;
  totalExpected: number;
  collectionRate: number;
  totalCoveredInYear: number;
  monthsDueInYear?: number;
  totalPaidAllTime: number;
  expectedSinceEntry: number;
  realCollectionRate: number;
  totalDebts: number;
  totalAdvances: number;
  averageRent: number;
  occupancyRate: number;
  totalRooms: number;
  occupiedRooms: number;
  totalDeposits: number;
  selectedYear: number;
  roomDetails: RoomFinancialDetail[];
}

export interface RoomFinancialDetail {
  roomId: string;
  roomCode: string;
  monthlyRent: number;
  monthsDue: number;
  totalReceived: number;
  expectedAmount: number;
  collectionRate: number;
  paymentStatus: string;
  advanceAmount: number;
  advanceMonths: number;
  debtAmount: number;
  lateMonths: number;
  monthlyPayments: number[];
  totalPaidAllTime?: number;
  expectedSinceEntry?: number;
  coveredMonthsInYear?: number;
  coveredAmountInYear?: number;
  coveredUntilDate?: Date | null;
  totalMonthsCovered?: number;
}

export interface MonthlyFinancialData {
  month: string;
  monthIndex: number;
  expected: number;
  received: number;
  projected?: number;
  rate: number;
  profit: number;
  growth?: number;
  performancePercentage?: number;
  monthName?: string;
  totalRevenue?: number;
  paymentsCount?: number;
  collectionRate?: number;
  activeUnits?: number;
}

/**
 * Service d'extraction des données financières depuis le store NGXS.
 * Aucun calcul financier n'est effectué ici : toutes les valeurs
 * viennent directement du backend (aggregatedMetrics, revenueDistribution).
 */
@Injectable({
  providedIn: 'root'
})
export class PropertyFinancialManagerService {

  constructor(
    private store: Store,
    private translationUtils: TranslationUtilsService
  ) {}

  loadPropertyFinancialData(propertyId: string, selectedYear: number): Observable<any> {
    return this.store.select(
      StatisticState.selectStateStatisticPropertyIdAndYear(propertyId, selectedYear)
    );
  }

  /**
   * Extrait les métriques financières depuis les données backend.
   * Utilise aggregatedMetrics (calculé backend) sans aucun recalcul frontend.
   */
  extractPropertyMetrics(data: EnrichedStatisticResponse): PropertyFinancialMetrics {
    if (!data || !data.data) return this.getEmptyMetrics();

    const propertyMetrics = data.data.propertyMetrics;
    const aggregated: AggregatedMetrics | undefined = data.data.aggregatedMetrics;
    const rooms           = data.data.rooms || [];

    const roomDetails: RoomFinancialDetail[] = rooms.map((roomData: any) => ({
      roomId:        roomData.room._id,
      roomCode:      roomData.room.code,
      monthlyRent:   roomData.room.price,
      monthsDue:     roomData.monthsDue,
      totalReceived: roomData.totalReceived,
      expectedAmount: roomData.expectedAmount,
      collectionRate: roomData.collectionRate,
      paymentStatus:  roomData.paymentStatus,
      advanceAmount:  roomData.advanceAmount  || 0,
      advanceMonths:  roomData.advanceMonths  || 0,
      debtAmount:     roomData.debtAmount     || 0,
      lateMonths:     roomData.lateMonths     || 0,
      monthlyPayments: roomData.paymentValue  || [],
      totalPaidAllTime:    roomData.totalPaidAllTime    ?? roomData.totalReceived,
      expectedSinceEntry:  roomData.expectedSinceEntry  ?? roomData.expectedAmount,
      coveredMonthsInYear: roomData.coveredMonthsInYear ?? null,
      coveredAmountInYear: roomData.coveredAmountInYear ?? null,
      coveredUntilDate:    roomData.coveredUntilDate    ? new Date(roomData.coveredUntilDate) : null,
      totalMonthsCovered:  roomData.totalMonthsCovered  ?? null
    }));

    return {
      totalRevenue:   propertyMetrics.totalRevenue,
      totalExpected:  propertyMetrics.totalExpected,
      collectionRate: propertyMetrics.collectionRate,
      totalCoveredInYear:  aggregated?.totalCoveredInYear  ?? propertyMetrics.totalCoveredInYear ?? propertyMetrics.totalRevenue,
      monthsDueInYear:     aggregated?.monthsDueInYear     ?? 0,
      totalPaidAllTime:    aggregated?.totalPaidAllTime    ?? 0,
      expectedSinceEntry:  aggregated?.expectedSinceEntry  ?? 0,
      realCollectionRate:  aggregated?.realCollectionRate  ?? 0,
      totalDebts:          aggregated?.totalDebts          ?? propertyMetrics.totalDebts    ?? 0,
      totalAdvances:       aggregated?.totalAdvances       ?? propertyMetrics.totalAdvances ?? 0,
      averageRent:   propertyMetrics.averageRent,
      occupancyRate: propertyMetrics.occupancyRate,
      totalRooms:    propertyMetrics.totalRooms,
      occupiedRooms: propertyMetrics.occupiedRooms,
      totalDeposits: data.data.cautionsAnalysis?.summary?.totalCautionsReceived || 0,
      selectedYear:  data.data.year ? parseInt(data.data.year) : new Date().getFullYear(),
      roomDetails
    };
  }

  /**
   * Extrait les données mensuelles depuis le backend.
   *
   * Utilise directement les champs calculés backend dans monthlyAnalysis :
   *   - item.realReceived   : encaissements réels (datePayment dans le mois)
   *   - item.distributed    : projection cumul (règle d'anniversaire)
   *   - item.fulfillmentRate: taux de couverture par projection
   *   - item.realRate       : taux basé sur encaissements réels
   *
   * Aucun recalcul côté frontend.
   */
  extractMonthlyData(data: EnrichedStatisticResponse): MonthlyFinancialData[] {
    if (!data || !data.data || !data.data.revenueDistribution) {
      return this.getEmptyMonthlyData();
    }

    const monthlyAnalysis     = data.data.revenueDistribution.monthlyAnalysis;
    const monthlyRealReceived: number[] = data.data.revenueDistribution.monthlyRealReceived ?? [];

    return monthlyAnalysis.map((item: any, month: number) => {
      const projected       = item.distributed    ?? 0;
      const realReceived    = item.realReceived    ?? monthlyRealReceived[month] ?? 0;
      const expected        = item.expected        ?? 0;
      const fulfillmentRate = item.fulfillmentRate ?? 0;
      const realRate        = item.realRate        ?? (expected > 0 ? Math.min((realReceived / expected) * 100, 100) : 0);

      let growth = 0;
      if (month > 0) {
        const prevReal = monthlyAnalysis[month - 1]?.realReceived
          ?? monthlyRealReceived[month - 1]
          ?? 0;
        growth = prevReal > 0
          ? Math.round(((realReceived - prevReal) / prevReal) * 100 * 100) / 100
          : 0;
      }

      return {
        month:      this.translationUtils.getMonthName(month + 1),
        monthIndex: month,
        expected:   Math.round(expected       * 100) / 100,
        received:   Math.round(realReceived   * 100) / 100,
        projected:  Math.round(projected      * 100) / 100,
        rate:       Math.round(fulfillmentRate * 100) / 100,
        profit:     Math.round(realReceived   * 100) / 100,
        growth:     Math.round(growth         * 100) / 100,
        performancePercentage: Math.round(fulfillmentRate * 100) / 100,
        monthName:  this.translationUtils.getMonthName(month + 1),
        totalRevenue: Math.round(realReceived * 100) / 100,
        paymentsCount: item.totalActiveRooms ?? 0,
        collectionRate: Math.round(realRate   * 100) / 100,
        activeUnits: item.totalActiveRooms ?? 0
      };
    });
  }

  /**
   * Extrait les paiements bruts réels par mois — utilisé par monthly-revenue-analysis.
   * Utilise item.realReceived du backend (encaissements réels basés sur datePayment).
   */
  extractRawMonthlyData(data: EnrichedStatisticResponse): MonthlyFinancialData[] {
    if (!data || !data.data || !data.data.revenueDistribution) {
      return this.getEmptyMonthlyData();
    }

    const monthlyAnalysis     = data.data.revenueDistribution.monthlyAnalysis;
    const monthlyRealReceived: number[] = data.data.revenueDistribution.monthlyRealReceived ?? [];

    return monthlyAnalysis.map((item: any, month: number) => {
      const rawReceived     = item.realReceived    ?? monthlyRealReceived[month] ?? 0;
      const monthlyExpected = item.expected        ?? 0;
      const realRate        = item.realRate        ?? (monthlyExpected > 0
        ? Math.round(Math.min((rawReceived / monthlyExpected) * 100, 100) * 100) / 100
        : 0);

      let growth = 0;
      if (month > 0) {
        const prevReal = monthlyAnalysis[month - 1]?.realReceived
          ?? monthlyRealReceived[month - 1]
          ?? 0;
        growth = prevReal > 0
          ? Math.round(((rawReceived - prevReal) / prevReal) * 100 * 100) / 100
          : 0;
      }

      return {
        month:      this.translationUtils.getMonthName(month + 1),
        monthIndex: month,
        expected:   Math.round(monthlyExpected * 100) / 100,
        received:   Math.round(rawReceived     * 100) / 100,
        projected:  0,
        rate:       realRate,
        profit:     Math.round(rawReceived     * 100) / 100,
        growth,
        performancePercentage: Math.min(realRate, 100),
        monthName:  this.translationUtils.getMonthName(month + 1),
        totalRevenue: Math.round(rawReceived   * 100) / 100,
        paymentsCount: item.totalActiveRooms   ?? 0,
        collectionRate: realRate,
        activeUnits: item.totalActiveRooms     ?? 0
      };
    });
  }

  extractTenantPerformances(data: EnrichedStatisticResponse): any[] {
    if (!data) return [];
    const rooms = data.data.rooms || [];

    return rooms
      .filter((roomData: any) => roomData.room?.isFree === false)
      .map((roomData: any) => {
        const monthsActive = roomData.monthsDue || 12;
        const averageMonthlyPayment = monthsActive > 0 ? roomData.totalReceived / monthsActive : 0;

        return {
          tenantId: roomData.room._id || '',
          tenantName: `Chambre ${roomData.room.code}`,
          totalPaid: roomData.totalReceived,
          totalDue: roomData.expectedAmount,
          paymentRate: roomData.collectionRate,
          monthsActive,
          averageMonthlyPayment: Math.round(averageMonthlyPayment * 100) / 100,
          paymentStatus: roomData.paymentStatus,
          advanceAmount: roomData.advanceAmount || 0,
          debtAmount: roomData.debtAmount || 0
        };
      });
  }

  private getEmptyMetrics(): PropertyFinancialMetrics {
    return {
      totalRevenue: 0, totalExpected: 0, collectionRate: 0,
      totalCoveredInYear: 0,
      totalPaidAllTime: 0, expectedSinceEntry: 0, realCollectionRate: 0,
      totalDebts: 0, totalAdvances: 0,
      averageRent: 0, occupancyRate: 0, totalRooms: 0, occupiedRooms: 0,
      totalDeposits: 0, selectedYear: new Date().getFullYear(), roomDetails: []
    };
  }

  private getEmptyMonthlyData(): MonthlyFinancialData[] {
    return Array.from({ length: 12 }, (_, i) => ({
      month: this.translationUtils.getMonthName(i + 1),
      monthIndex: i,
      expected: 0,
      received: 0,
      rate: 0,
      profit: 0,
      growth: 0,
      performancePercentage: 0,
      monthName: this.translationUtils.getMonthName(i + 1),
      totalRevenue: 0,
      paymentsCount: 0,
      collectionRate: 0,
      activeUnits: 0
    }));
  }

  generateRevenueChartData(monthlyData: MonthlyFinancialData[]): {
    months: string[];
    revenues: number[];
    expected: number[];
  } {
    return {
      months:   monthlyData.map(m => this.translationUtils.getMonthShortName(m.monthIndex + 1)),
      revenues: monthlyData.map(m => m.received),
      expected: monthlyData.map(m => m.expected)
    };
  }

  generatePaymentStatusData(roomDetails: RoomFinancialDetail[]): {
    name: string;
    value: number;
    color: string;
  }[] {
    const statusCounts = { up_to_date: 0, late: 0, advance: 0, critical: 0, no_payment: 0 };

    roomDetails.forEach(room => {
      let s = room.paymentStatus;
      if (s === 'behind') s = 'late';
      if (!statusCounts.hasOwnProperty(s)) s = 'no_payment';
      statusCounts[s as keyof typeof statusCounts]++;
    });

    return [
      { name: 'À jour',         value: statusCounts.up_to_date, color: '#10B981' },
      { name: 'En retard',      value: statusCounts.late,       color: '#F59E0B' },
      { name: 'En avance',      value: statusCounts.advance,    color: '#3B82F6' },
      { name: 'Critique',       value: statusCounts.critical,   color: '#DC2626' },
      { name: 'Aucun paiement', value: statusCounts.no_payment, color: '#6B7280' }
    ].filter(item => item.value > 0);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }
}
