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

    try {
      // Validation des données d'entrée
      if (!yearlyStats || yearlyStats.length === 0) {
        console.warn('⚠️ Aucune donnée de statistiques annuelles disponible');
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

      // Calculer les métriques dérivées avec validation
      let collectionRate = 0;
      if (totalExpected > 0 && !isNaN(totalRevenue) && !isNaN(totalExpected)) {
        collectionRate = Math.min((totalRevenue / totalExpected) * 100, 100);
        collectionRate = Math.max(collectionRate, 0); // Pas de taux négatif
      }

      let occupancyRate = 0;
      if (totalRooms > 0) {
        occupancyRate = (occupiedRooms / totalRooms) * 100;
      }

      let averageRent = 0;
      if (totalRooms > 0 && totalRentSum > 0) {
        averageRent = totalRentSum / totalRooms;
      }

      // Estimer les coûts et le profit net avec validation
      const estimatedCosts = this.estimateOperatingCosts(totalRevenue, totalRooms);
      const netProfit = totalRevenue - estimatedCosts;

      let profitMargin = 0;
      if (totalRevenue > 0 && !isNaN(netProfit)) {
        profitMargin = (netProfit / totalRevenue) * 100;
      }

      const metrics: FinancialMetrics = {
        totalRevenue: Math.round(totalRevenue * 100) / 100, // Arrondir à 2 décimales
        totalExpected: Math.round(totalExpected * 100) / 100,
        collectionRate: Math.round(collectionRate * 100) / 100,
        totalRooms,
        occupiedRooms,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        averageRent: Math.round(averageRent * 100) / 100,
        totalDeposits: Math.round(totalDeposits * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        profitMargin: Math.round(profitMargin * 100) / 100
      };

      console.log('✅ Métriques calculées:', metrics);
      return metrics;

    } catch (error) {
      console.error('❌ Erreur lors du calcul des métriques financières:', error);
      return this.getEmptyMetrics();
    }
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

  /**
   * Estime les coûts opérationnels basés sur des données réelles du marché camerounais
   */
  private estimateOperatingCosts(revenue: number, totalRooms?: number): number {
    try {
      // Validation des paramètres
      if (!revenue || revenue <= 0) {
        return 0;
      }

      // Coûts fixes mensuels par unité (en FCFA) - Moyennes du marché camerounais
      const fixedCostsPerUnit = {
        maintenance: 50000,    // Maintenance générale
        insurance: 25000,      // Assurance
        taxes: 30000,          // Taxes foncières
        utilities: 40000,      // Eau, électricité communes
        repairs: 35000,        // Réparations
        cleaning: 20000,       // Nettoyage
        security: 45000,       // Sécurité
        management: 15000,     // Gestion
        other: 15000          // Divers
      };

      const totalFixedCostsPerUnit = Object.values(fixedCostsPerUnit).reduce((sum, cost) => sum + cost, 0);

      // Si on connaît le nombre d'unités, utiliser les coûts fixes
      if (totalRooms && totalRooms > 0) {
        const totalFixedCosts = totalFixedCostsPerUnit * totalRooms;

        // Ajouter des coûts variables (5-10% du revenu)
        const variableCosts = revenue * 0.08; // 8% pour les coûts variables

        const totalCosts = totalFixedCosts + variableCosts;

        console.log(`💰 Coûts estimés: ${totalFixedCosts} FCFA (fixes) + ${variableCosts} FCFA (variables) = ${totalCosts} FCFA`);
        return Math.round(totalCosts);
      }

      // Fallback: utiliser un pourcentage du revenu (plus conservateur)
      // Basé sur les standards du marché immobilier camerounais (25-35%)
      const costRatio = 0.30; // 30% du revenu
      const estimatedCosts = revenue * costRatio;

      console.log(`💰 Coûts estimés (${costRatio * 100}% du revenu): ${estimatedCosts} FCFA`);
      return Math.round(estimatedCosts);

    } catch (error) {
      console.error('❌ Erreur lors de l\'estimation des coûts opérationnels:', error);
      // Fallback sécurisé
      return Math.round(revenue * 0.25); // 25% par défaut
    }
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

  /**
   * Calcule la croissance des revenus par rapport à la période précédente
   */
  calculateRevenueGrowth(currentPeriodData: any[], previousPeriodData?: any[]): number {
    try {
      if (!currentPeriodData || currentPeriodData.length === 0) {
        return 0;
      }

      // Si pas de données précédentes, retourner 0
      if (!previousPeriodData || previousPeriodData.length === 0) {
        console.log('📊 Pas de données de période précédente pour calculer la croissance');
        return 0;
      }

      // Calculer les revenus des deux périodes
      const currentRevenue = currentPeriodData.reduce((sum, item) => {
        return sum + (item.locationPaymentPrice || item.amount || item.value || 0);
      }, 0);

      const previousRevenue = previousPeriodData.reduce((sum, item) => {
        return sum + (item.locationPaymentPrice || item.amount || item.value || 0);
      }, 0);

      // Calculer la croissance en pourcentage
      if (previousRevenue === 0) {
        return currentRevenue > 0 ? 100 : 0; // 100% de croissance si on part de 0
      }

      const growth = ((currentRevenue - previousRevenue) / previousRevenue) * 100;

      console.log(`📈 Croissance des revenus: ${growth.toFixed(2)}% (${currentRevenue} vs ${previousRevenue})`);
      return Math.round(growth * 100) / 100; // Arrondir à 2 décimales

    } catch (error) {
      console.error('❌ Erreur lors du calcul de la croissance des revenus:', error);
      return 0;
    }
  }

  /**
   * Valide les données financières pour détecter les incohérences
   */
  validateFinancialData(metrics: FinancialMetrics): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    // Vérifier les valeurs négatives
    if (metrics.totalRevenue < 0) warnings.push('Revenus totaux négatifs détectés');
    if (metrics.totalExpected < 0) warnings.push('Revenus attendus négatifs détectés');
    if (metrics.netProfit < -metrics.totalRevenue) warnings.push('Perte nette excessive détectée');

    // Vérifier les pourcentages
    if (metrics.collectionRate > 100) warnings.push('Taux de collection supérieur à 100%');
    if (metrics.occupancyRate > 100) warnings.push('Taux d\'occupation supérieur à 100%');
    if (metrics.profitMargin < -100 || metrics.profitMargin > 100) warnings.push('Marge de profit anormale');

    // Vérifier la cohérence
    if (metrics.occupiedRooms > metrics.totalRooms) warnings.push('Plus de chambres occupées que le total');
    if (metrics.totalRevenue > metrics.totalExpected * 1.5) warnings.push('Revenus très supérieurs aux attentes');

    return {
      isValid: warnings.length === 0,
      warnings
    };
  }

}
