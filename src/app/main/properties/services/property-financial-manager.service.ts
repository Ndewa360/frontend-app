import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import {
  EnrichedStatisticResponse
} from '../../../shared/store';
import { StatisticState } from '../../../shared/store/statistic-data/statistic.state';
import { TranslationUtilsService } from '../../../shared/services/translation-utils.service';

/**
 * Interface pour les métriques financières extraites du backend
 */
export interface PropertyFinancialMetrics {
  // --- Revenus de l'année sélectionnée (onglet Revenus) ---
  totalRevenue: number;
  totalExpected: number;
  collectionRate: number;
  // --- Projection cumul sur l'année ---
  totalCoveredInYear: number;
  monthsDueInYear?: number;    // mois dus dans l'année (agrégé sur toutes les chambres)
  totalPaidAllTime: number;
  expectedSinceEntry: number;
  realCollectionRate: number;
  totalDebts: number;
  totalAdvances: number;
  // --- Occupation ---
  averageRent: number;
  occupancyRate: number;
  totalRooms: number;
  occupiedRooms: number;
  // --- Cautions ---
  totalDeposits: number;
  selectedYear: number;
  roomDetails: RoomFinancialDetail[];
}

/**
 * Interface pour les détails financiers d'une chambre (depuis backend)
 */
export interface RoomFinancialDetail {
  roomId: string;
  roomCode: string;
  monthlyRent: number;
  monthsDue: number;              // mois dus dans l'année
  totalReceived: number;          // encaissé dans l'année
  expectedAmount: number;         // attendu pour l'année
  collectionRate: number;         // taux basé sur la projection
  paymentStatus: string;          // statut projeté sur l'année
  advanceAmount: number;          // montant en avance
  advanceMonths: number;          // mois d'avance
  debtAmount: number;             // montant en retard
  lateMonths: number;             // mois de retard
  monthlyPayments: number[];      // encaissements de l'année (12 cases)
  totalPaidAllTime?: number;      // cumul depuis l'entrée
  expectedSinceEntry?: number;    // attendu depuis l'entrée jusqu'à aujourd'hui
  coveredMonthsInYear?: number;   // mois de l'année couverts par le cumul
  coveredAmountInYear?: number;   // montant couvert dans l'année
  coveredUntilDate?: Date | null; // couvert jusqu'à cette date
  totalMonthsCovered?: number;    // total mois couverts depuis l'entrée
}

/**
 * Interface pour les données mensuelles (depuis backend)
 */
export interface MonthlyFinancialData {
  month: string;
  monthIndex: number;
  expected: number;    // attendu pour ce mois
  received: number;    // encaissé dans ce mois
  projected?: number;  // couvert par la projection du cumul
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
 * Service simplifié pour extraire les données financières du backend
 * Toute la logique de calcul est maintenant côté backend
 */
@Injectable({
  providedIn: 'root'
})
export class PropertyFinancialManagerService {

  constructor(
    private store: Store,
    private translationUtils: TranslationUtilsService
  ) {}

  /**
   * Charge les données financières centralisées depuis le backend.
   * Ne dispatche PAS si les données sont déjà présentes dans le store
   * (le parent PropertyFinancesComponent dispatche déjà FetchStaticByPropertyIdAndYear).
   */
  loadPropertyFinancialData(propertyId: string, selectedYear: number): Observable<any> {
    return this.store.select(
      StatisticState.selectStateStatisticPropertyIdAndYear(propertyId, selectedYear)
    );
  }

  /**
   * Extrait les métriques financières depuis les calculs centralisés du backend
   */
  extractPropertyMetrics(data: EnrichedStatisticResponse): PropertyFinancialMetrics {
    if (!data || !data.data) return this.getEmptyMetrics();

    const propertyMetrics = data.data.propertyMetrics;
    const rooms = data.data.rooms || [];

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
      // Projection
      totalPaidAllTime:    roomData.totalPaidAllTime    ?? roomData.totalReceived,
      expectedSinceEntry:  roomData.expectedSinceEntry  ?? roomData.expectedAmount,
      coveredMonthsInYear: roomData.coveredMonthsInYear ?? null,
      coveredAmountInYear: roomData.coveredAmountInYear ?? null,
      coveredUntilDate:    roomData.coveredUntilDate    ? new Date(roomData.coveredUntilDate) : null,
      totalMonthsCovered:  roomData.totalMonthsCovered  ?? null
    }));

    // Totaux agrégés
    const totalPaidAllTime   = rooms.reduce((s, r: any) => s + (r.totalPaidAllTime   ?? r.totalReceived  ?? 0), 0);
    const expectedSinceEntry = rooms.reduce((s, r: any) => s + (r.expectedSinceEntry ?? r.expectedAmount ?? 0), 0);
    const realCollectionRate = expectedSinceEntry > 0
      ? Math.min((totalPaidAllTime / expectedSinceEntry) * 100, 100) : 0;
    // Avances et retards basés sur la projection
    const totalDebts    = rooms.reduce((s, r: any) => s + (r.debtAmount    || 0), 0);
    const totalAdvances = rooms.reduce((s, r: any) => s + (r.advanceAmount || 0), 0);
    // Mois dus dans l'année (agrégé sur toutes les chambres occupées)
    const monthsDueInYear = rooms.reduce((s, r: any) => s + (r.monthsDue ?? 0), 0);

    return {
      // revenus année
      totalRevenue:   propertyMetrics.totalRevenue,
      totalExpected:  propertyMetrics.totalExpected,
      collectionRate: propertyMetrics.collectionRate,
      // montant couvert dans l'année (projection cumul)
      totalCoveredInYear: (propertyMetrics as any).totalCoveredInYear ?? propertyMetrics.totalRevenue,
      monthsDueInYear,
      // état réel
      totalPaidAllTime:   Math.round(totalPaidAllTime   * 100) / 100,
      expectedSinceEntry: Math.round(expectedSinceEntry * 100) / 100,
      realCollectionRate: Math.round(realCollectionRate * 100) / 100,
      totalDebts:    Math.round(totalDebts    * 100) / 100,
      totalAdvances: Math.round(totalAdvances * 100) / 100,
      // occupation
      averageRent:   propertyMetrics.averageRent,
      occupancyRate: propertyMetrics.occupancyRate,
      totalRooms:    propertyMetrics.totalRooms,
      occupiedRooms: propertyMetrics.occupiedRooms,
      // cautions
      totalDeposits: data.data.cautionsAnalysis?.summary?.totalCautionsReceived || 0,
      selectedYear:  data.data.year ? parseInt(data.data.year) : new Date().getFullYear(),
      roomDetails
    };
  }

  /**
   * Extrait les données mensuelles avec PROJECTION cumulé — utilisé par financial-overview
   */
  extractMonthlyData(data: EnrichedStatisticResponse): MonthlyFinancialData[] {
    if (!data || !data.data || !data.data.revenueDistribution) {
      return this.getEmptyMonthlyData();
    }

    const rooms = data.data.rooms || [];
    const monthlyAnalysis = data.data.revenueDistribution.monthlyAnalysis;
    const selectedYear = data.data.year ? parseInt(data.data.year) : new Date().getFullYear();

    // Projection mensuelle agrégée : mois couverts par le cumul des paiements depuis l'entrée
    const projectedByMonth = Array(12).fill(0);
    rooms.forEach((roomData: any) => {
      const coveredUntil = roomData.coveredUntilDate ? new Date(roomData.coveredUntilDate) : null;
      const entryDate    = roomData.entryDate ? new Date(roomData.entryDate) : null;
      const price        = roomData.room?.price || 0;
      if (coveredUntil && entryDate && price > 0) {
        for (let m = 0; m < 12; m++) {
          const monthStart = new Date(selectedYear, m, 1);
          const monthEnd   = new Date(selectedYear, m + 1, 0, 23, 59, 59);
          const isOccupied = entryDate <= monthEnd;
          if (isOccupied && coveredUntil >= monthStart) {
            projectedByMonth[m] += price;
          }
        }
      }
    });

    return monthlyAnalysis.map((item, month) => {
      const monthlyReceived = item.distributed;
      const monthlyExpected = item.expected;
      const projectedAmount = projectedByMonth[month];
      const collectionRate  = item.fulfillmentRate;

      let growth = 0;
      if (month > 0) {
        const currentRaw  = rooms.reduce((s: number, r: any) => s + (r.paymentValue?.[month]   || 0), 0);
        const previousRaw = rooms.reduce((s: number, r: any) => s + (r.paymentValue?.[month-1] || 0), 0);
        growth = previousRaw > 0 ? ((currentRaw - previousRaw) / previousRaw) * 100 : 0;
      }

      const paymentsCount = rooms.filter((r: any) => (r.paymentValue?.[month] || 0) > 0).length;

      return {
        month:      this.translationUtils.getMonthName(month + 1),
        monthIndex: month,
        expected:   Math.round(monthlyExpected  * 100) / 100,
        received:   Math.round(monthlyReceived  * 100) / 100,
        projected:  Math.round(projectedAmount  * 100) / 100,
        rate:       Math.round(collectionRate   * 100) / 100,
        profit:     Math.round(monthlyReceived  * 100) / 100,
        growth:     Math.round(growth           * 100) / 100,
        performancePercentage: Math.round(collectionRate * 100) / 100,
        monthName:  this.translationUtils.getMonthName(month + 1),
        totalRevenue: Math.round(monthlyReceived * 100) / 100,
        paymentsCount,
        collectionRate: Math.round(collectionRate * 100) / 100,
        activeUnits: item.totalActiveRooms
      };
    });
  }

  /**
   * Extrait les paiements bruts réels par mois — utilisé par monthly-revenue-analysis
   * Un versement de 150 000 FCFA en janvier apparaît intégralement en janvier.
   */
  extractRawMonthlyData(data: EnrichedStatisticResponse): MonthlyFinancialData[] {
    if (!data || !data.data || !data.data.revenueDistribution) {
      return this.getEmptyMonthlyData();
    }

    const rooms = data.data.rooms || [];
    const monthlyAnalysis = data.data.revenueDistribution.monthlyAnalysis;

    return monthlyAnalysis.map((item, month) => {
      // Somme brute des paiements reçus ce mois (datePayment dans le mois)
      const rawReceived = rooms.reduce(
        (sum: number, r: any) => sum + (r.paymentValue?.[month] || 0), 0
      );
      const monthlyExpected = item.expected;
      const collectionRate  = monthlyExpected > 0
        ? Math.round((rawReceived / monthlyExpected) * 100 * 100) / 100
        : 0;

      let growth = 0;
      if (month > 0) {
        const prevReceived = rooms.reduce(
          (sum: number, r: any) => sum + (r.paymentValue?.[month - 1] || 0), 0
        );
        growth = prevReceived > 0
          ? Math.round(((rawReceived - prevReceived) / prevReceived) * 100 * 100) / 100
          : 0;
      }

      const paymentsCount = rooms.filter(
        (r: any) => (r.paymentValue?.[month] || 0) > 0
      ).length;

      return {
        month:      this.translationUtils.getMonthName(month + 1),
        monthIndex: month,
        expected:   Math.round(monthlyExpected * 100) / 100,
        received:   Math.round(rawReceived     * 100) / 100,
        projected:  0,
        rate:       collectionRate,
        profit:     Math.round(rawReceived     * 100) / 100,
        growth,
        performancePercentage: Math.min(collectionRate, 100),
        monthName:  this.translationUtils.getMonthName(month + 1),
        totalRevenue: Math.round(rawReceived   * 100) / 100,
        paymentsCount,
        collectionRate,
        activeUnits: item.totalActiveRooms
      };
    });
  }

  /**
   * Extrait les performances des locataires depuis les données backend
   */
  extractTenantPerformances(data: EnrichedStatisticResponse): any[] {
    if (!data) return [];
    const rooms = data.data.rooms || [];

    // FIX #F1 : inclure TOUTES les chambres occupées, même celles sans paiement
    // Un locataire avec 0 paiement doit apparaître avec taux 0% pour alerter le propriétaire
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

  /**
   * Retourne des métriques vides
   */
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

  /**
   * Retourne des données mensuelles vides
   */
  private getEmptyMonthlyData(): MonthlyFinancialData[] {
    const data: MonthlyFinancialData[] = [];
    for (let i = 0; i < 12; i++) {
      data.push({
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
      });
    }
    return data;
  }

  /**
   * Génère les données pour les graphiques de revenus depuis les données backend
   */
  generateRevenueChartData(monthlyData: MonthlyFinancialData[]): {
    months: string[];
    revenues: number[];
    expected: number[];
  } {
    return {
      months: monthlyData.map(m => this.translationUtils.getMonthShortName(m.monthIndex + 1)),
      revenues: monthlyData.map(m => m.received),
      expected: monthlyData.map(m => m.expected)
    };
  }

  /**
   * Génère les données pour les graphiques de statuts de paiement depuis les données backend
   */
  generatePaymentStatusData(roomDetails: RoomFinancialDetail[]): {
    name: string;
    value: number;
    color: string;
  }[] {
    const statusCounts = {
      up_to_date: 0,
      late: 0,
      advance: 0,
      critical: 0,
      no_payment: 0
    };

    roomDetails.forEach(room => {
      const status = room.paymentStatus;
      // FIX #F3 : mapper tous les statuts connus du backend
      // Backend envoie : 'up_to_date' | 'advance' | 'late' | 'critical' | 'no_payment' | 'behind'
      let normalizedStatus = status;
      if (status === 'behind') normalizedStatus = 'late'; // alias
      if (!statusCounts.hasOwnProperty(normalizedStatus)) {
        // Statut inconnu ('unknown', etc.) → no_payment par défaut
        normalizedStatus = 'no_payment';
      }
      statusCounts[normalizedStatus]++;
    });

    return [
      { name: 'À jour', value: statusCounts.up_to_date, color: '#10B981' },
      { name: 'En retard', value: statusCounts.late, color: '#F59E0B' },
      { name: 'En avance', value: statusCounts.advance, color: '#3B82F6' },
      { name: 'Critique', value: statusCounts.critical, color: '#DC2626' },
      { name: 'Aucun paiement', value: statusCounts.no_payment, color: '#6B7280' }
    ].filter(item => item.value > 0);
  }

  /**
   * Formate les montants en devise locale
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Formate les pourcentages
   */
  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }
}
