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

  constructor() { }

  /**
   * Calculer les métriques financières principales
   */
  calculateFinancialMetrics(
    yearlyStats: StatisticRoomYearModel[],
    recapitulation?: StatisticPaymentOfAllPropertyByYear | null,
    locations?: LocationModel[],
    selectedYear?: number
  ): FinancialMetrics {
    console.log('🧮 Service - Calcul des métriques financières:', {
      yearlyStatsLength: yearlyStats.length,
      hasRecapitulation: !!recapitulation
    });

    if (!yearlyStats || yearlyStats.length === 0) {
      return this.getEmptyMetrics();
    }

    let totalRevenue = 0;
    let totalExpected = 0;
    let totalRooms = yearlyStats.length;
    let occupiedRooms = 0;
    let totalRentSum = 0;
    let totalDeposits = 0;

    // Analyser chaque chambre
    yearlyStats.forEach((roomStat, index) => {
      const monthlyPayments = roomStat.paymentValue || [];
      const receivedForRoom = monthlyPayments.reduce((sum, payment) => sum + (payment || 0), 0);
      const roomPrice = roomStat.room?.price || 0;

      // Calculer l'attendu basé sur la date d'entrée réelle si disponible
      let expectedForYear = roomPrice * 12; // Fallback

      if (locations && selectedYear && roomStat.room?._id) {
        const roomLocation = locations.find(loc =>
          loc.room === roomStat.room._id &&
          loc.isRunning === true
        );

        if (roomLocation && roomLocation.startedAt) {
          const monthsOccupied = this.calculateMonthsOccupied(
            new Date(roomLocation.startedAt),
            new Date(),
            selectedYear
          );
          expectedForYear = roomPrice * Math.ceil(monthsOccupied);
        } else {
          // Utiliser les mois où il y a eu des paiements
          const monthsWithPayments = monthlyPayments.filter(payment => payment > 0).length;
          expectedForYear = roomPrice * Math.max(monthsWithPayments, 1);
        }
      }

      // Debug pour chaque chambre
      console.log(`  Chambre ${index + 1}:`, {
        code: roomStat.room?.code,
        price: roomPrice,
        received: receivedForRoom,
        expected: expectedForYear,
        payments: monthlyPayments
      });

      totalRevenue += receivedForRoom;
      totalExpected += expectedForYear;
      totalRentSum += roomPrice;

      // Déterminer si la chambre est occupée
      const hasPayments = receivedForRoom > 0;
      const hasActiveContract = !roomStat.room?.isFree; // isFree = false signifie occupée
      if (hasPayments || hasActiveContract) {
        occupiedRooms++;
      }

      // Calculer les cautions seulement pour les chambres occupées
      if (hasPayments || hasActiveContract) {
        const depositAmount = roomStat.room?.cautionPrice || (roomPrice * 2);
        totalDeposits += depositAmount;
      }
    });

    // Calculer les métriques dérivées
    const collectionRate = totalExpected > 0 ? (totalRevenue / totalExpected) * 100 : 0;
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
    const averageRent = totalRooms > 0 ? totalRentSum / totalRooms : 0;

    // Estimer les coûts et le profit net
    const estimatedCosts = this.estimateOperatingCosts(totalRevenue);
    const netProfit = totalRevenue - estimatedCosts;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const metrics: FinancialMetrics = {
      totalRevenue,
      totalExpected,
      collectionRate,
      totalRooms,
      occupiedRooms,
      occupancyRate,
      averageRent,
      totalDeposits,
      netProfit,
      profitMargin
    };

    console.log('✅ Métriques calculées:', metrics);
    return metrics;
  }

  /**
   * Construire les données mensuelles
   */
  buildMonthlyData(
    yearlyStats: StatisticRoomYearModel[],
    recapitulation?: StatisticPaymentOfAllPropertyByYear | null
  ): MonthlyFinancialData[] {
    console.log('📅 Service - Construction des données mensuelles');

    // Méthode 1: Utiliser la récapitulation si disponible
    if (recapitulation?.paymentProperty && Array.isArray(recapitulation.paymentProperty)) {
      return this.buildMonthlyFromRecapitulation(recapitulation);
    }

    // Méthode 2: Construire à partir des statistiques de chambres
    if (yearlyStats && yearlyStats.length > 0) {
      return this.buildMonthlyFromRoomStats(yearlyStats);
    }

    // Méthode 3: Données vides
    return this.getEmptyMonthlyData();
  }

  /**
   * Analyser les performances des locataires
   */
  analyzeTenantPerformance(
    tenantStats: StatisticLocataireYearModel[],
    paymentStats: StatisticAllPaymentLocataireYearModel[]
  ): TenantFinancialSummary[] {
    console.log('👥 Service - Analyse des performances locataires');

    if (!tenantStats || tenantStats.length === 0) {
      return [];
    }

    return tenantStats.map(tenantStat => {
      // Trouver les paiements correspondants
      const tenantPayments = paymentStats.filter(payment =>
        payment.locataire?._id === tenantStat.locataire?._id
      );

      // Calculer les totaux à partir des paymentState
      let totalPaid = 0;
      let totalDue = 0;

      tenantPayments.forEach(payment => {
        payment.paymentState?.forEach(state => {
          totalDue += state.price || 0;
          if (state.state === 'payed') {
            totalPaid += state.unitLocationPaymentPrice || state.price || 0;
          } else if (state.state === 'partialPayment') {
            totalPaid += state.price || 0;
          }
        });
      });

      const paymentRate = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;
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

  /**
   * Formater les montants en devise locale
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Formater les pourcentages
   */
  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  /**
   * Obtenir le nom du mois
   */
  getMonthName(monthIndex: number): string {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[monthIndex] || `Mois ${monthIndex + 1}`;
  }

  // === MÉTHODES PRIVÉES ===

  private getEmptyMetrics(): FinancialMetrics {
    return {
      totalRevenue: 0,
      totalExpected: 0,
      collectionRate: 0,
      totalRooms: 0,
      occupiedRooms: 0,
      occupancyRate: 0,
      averageRent: 0,
      totalDeposits: 0,
      netProfit: 0,
      profitMargin: 0
    };
  }

  private getEmptyMonthlyData(): MonthlyFinancialData[] {
    const data: MonthlyFinancialData[] = [];
    for (let i = 0; i < 12; i++) {
      data.push({
        month: this.getMonthName(i),
        monthIndex: i,
        expected: 0,
        received: 0,
        rate: 0,
        profit: 0
      });
    }
    return data;
  }

  private buildMonthlyFromRecapitulation(
    recapitulation: StatisticPaymentOfAllPropertyByYear
  ): MonthlyFinancialData[] {
    const monthlyAggregated: { [key: number]: { expected: number, received: number } } = {};

    // Initialiser les 12 mois
    for (let i = 0; i < 12; i++) {
      monthlyAggregated[i] = { expected: 0, received: 0 };
    }

    // Agréger les données
    recapitulation.paymentProperty.forEach(propertyData => {
      if (propertyData?.amountMonth && Array.isArray(propertyData.amountMonth)) {
        propertyData.amountMonth.forEach(monthData => {
          if (monthData && typeof monthData.month === 'number') {
            const monthIndex = (monthData.month - 1) % 12;
            if (monthIndex >= 0 && monthIndex < 12) {
              monthlyAggregated[monthIndex].expected += monthData.totalAmountToBeReceveid || 0;
              monthlyAggregated[monthIndex].received += monthData.totalAmountReceived || 0;
            }
          }
        });
      }
    });

    // Convertir en format final
    return Object.keys(monthlyAggregated).map(monthKey => {
      const monthIndex = parseInt(monthKey);
      const data = monthlyAggregated[monthIndex];
      const rate = data.expected > 0 ? (data.received / data.expected) * 100 : 0;
      const costs = this.estimateOperatingCosts(data.received);
      const profit = data.received - costs;

      return {
        month: this.getMonthName(monthIndex),
        monthIndex,
        expected: data.expected,
        received: data.received,
        rate,
        profit
      };
    });
  }

  private buildMonthlyFromRoomStats(yearlyStats: StatisticRoomYearModel[]): MonthlyFinancialData[] {
    const monthlyAggregated: { [key: number]: { expected: number, received: number } } = {};

    // Initialiser les 12 mois
    for (let i = 0; i < 12; i++) {
      monthlyAggregated[i] = { expected: 0, received: 0 };
    }

    // Agréger les données de toutes les chambres
    yearlyStats.forEach(roomStat => {
      const roomPrice = roomStat.room?.price || 0;
      const monthlyPayments = roomStat.paymentValue || [];

      for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
        monthlyAggregated[monthIndex].expected += roomPrice;
        const paymentForMonth = monthlyPayments[monthIndex] || 0;
        monthlyAggregated[monthIndex].received += paymentForMonth;
      }
    });

    // Convertir en format final
    return Object.keys(monthlyAggregated).map(monthKey => {
      const monthIndex = parseInt(monthKey);
      const data = monthlyAggregated[monthIndex];
      const rate = data.expected > 0 ? (data.received / data.expected) * 100 : 0;
      const costs = this.estimateOperatingCosts(data.received);
      const profit = data.received - costs;

      return {
        month: this.getMonthName(monthIndex),
        monthIndex,
        expected: data.expected,
        received: data.received,
        rate,
        profit
      };
    });
  }

  private estimateOperatingCosts(revenue: number): number {
    // Estimation des coûts opérationnels (maintenance, gestion, etc.)
    // Généralement 15-25% des revenus
    return revenue * 0.20;
  }

  private calculateActiveMonths(payments: StatisticAllPaymentLocataireYearModel[]): number {
    // Compter les mois avec des paiements
    const monthsWithPayments = new Set();

    payments.forEach(payment => {
      payment.paymentState?.forEach(state => {
        if (state.state === 'payed' || state.state === 'partialPayment') {
          monthsWithPayments.add(state.month);
        }
      });
    });

    return monthsWithPayments.size;
  }

  /**
   * Calcule le nombre de mois réellement occupés
   */
  private calculateMonthsOccupied(entryDate: Date, currentDate: Date, selectedYear: number): number {
    const yearStart = new Date(selectedYear, 0, 1);
    const yearEnd = new Date(selectedYear, 11, 31);

    // Utiliser la date d'entrée si elle est dans l'année sélectionnée
    const startDate = entryDate > yearStart ? entryDate : yearStart;
    const endDate = currentDate < yearEnd ? currentDate : yearEnd;

    if (startDate > endDate) return 0;

    // Calculer les mois complets + fraction du mois en cours
    const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                      (endDate.getMonth() - startDate.getMonth());

    // Ajouter la fraction du mois en cours
    const daysFraction = endDate.getDate() / new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate();

    return Math.max(0, monthsDiff + daysFraction);
  }
}
