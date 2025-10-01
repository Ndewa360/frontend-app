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
   * Calculer les métriques financières principales (DEPRECATED - utiliser PropertyFinancialManagerService)
   * @deprecated Utiliser PropertyFinancialManagerService.calculatePropertyMetrics() à la place
   */
  calculateFinancialMetrics(
    yearlyStats: StatisticRoomYearModel[],
    recapitulation?: StatisticPaymentOfAllPropertyByYear | null,
    locations?: LocationModel[],
    selectedYear?: number
  ): FinancialMetrics {
    console.warn('⚠️ DEPRECATED: Utiliser PropertyFinancialManagerService.calculatePropertyMetrics() à la place');
    
    // Rediriger vers le nouveau service si possible
    if (!yearlyStats || yearlyStats.length === 0) {
      return this.getEmptyMetrics();
    }

    // Calcul simplifié pour compatibilité descendante
    let totalRevenue = 0;
    let totalExpected = 0;
    let totalRooms = yearlyStats.length;
    let occupiedRooms = 0;
    let totalRentSum = 0;

    yearlyStats.forEach(roomStat => {
      const monthlyPayments = roomStat.paymentValue || [];
      const receivedForRoom = monthlyPayments.reduce((sum, payment) => sum + (payment || 0), 0);
      const roomPrice = roomStat.room?.price || 0;
      
      totalRevenue += receivedForRoom;
      totalExpected += roomPrice * 12; // Estimation simple
      totalRentSum += roomPrice;
      
      if (receivedForRoom > 0 || !roomStat.room?.isFree) {
        occupiedRooms++;
      }
    });

    const collectionRate = totalExpected > 0 ? (totalRevenue / totalExpected) * 100 : 0;
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
    const averageRent = totalRooms > 0 ? totalRentSum / totalRooms : 0;
    const estimatedCosts = this.estimateOperatingCosts(totalRevenue, totalRooms);
    const netProfit = totalRevenue - estimatedCosts;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalExpected: Math.round(totalExpected * 100) / 100,
      collectionRate: Math.round(collectionRate * 100) / 100,
      totalRooms,
      occupiedRooms,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
      averageRent: Math.round(averageRent * 100) / 100,
      totalDeposits: Math.round((occupiedRooms * averageRent * 2) * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      profitMargin: Math.round(profitMargin * 100) / 100
    };
  }

  /**
   * Construire les données mensuelles (DEPRECATED - utiliser PropertyFinancialManagerService)
   * @deprecated Utiliser PropertyFinancialManagerService.generateMonthlyData() à la place
   */
  buildMonthlyData(
    yearlyStats: StatisticRoomYearModel[],
    recapitulation?: StatisticPaymentOfAllPropertyByYear | null
  ): MonthlyFinancialData[] {
    console.warn('⚠️ DEPRECATED: Utiliser PropertyFinancialManagerService.generateMonthlyData() à la place');

    // Version simplifiée pour compatibilité
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
   * Calcule le nombre de mois réellement occupés (DEPRECATED)
   * @deprecated Utiliser PropertyFinancialManagerService.calculatePreciseMonthsDue() à la place
   */
  private calculateMonthsOccupied(entryDate: Date, currentDate: Date, selectedYear: number): number {
    console.warn('⚠️ DEPRECATED: Utiliser PropertyFinancialManagerService.calculatePreciseMonthsDue()');
    
    const yearStart = new Date(selectedYear, 0, 1);
    const yearEnd = new Date(selectedYear, 11, 31);

    const startDate = entryDate > yearStart ? entryDate : yearStart;
    const endDate = currentDate < yearEnd ? currentDate : yearEnd;

    if (startDate > endDate) return 0;

    const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                      (endDate.getMonth() - startDate.getMonth());

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
   * 📊 EXTRACTION DES MÉTRIQUES DEPUIS LES CALCULS CENTRALISÉS DU BACKEND
   */
  extractFinancialMetricsFromBackend(backendData: any): FinancialMetrics {
    console.log('📊 Extraction des métriques depuis les calculs centralisés du backend');
    
    if (!backendData || !backendData.propertyMetrics) {
      console.warn('⚠️ Données backend manquantes ou incompletes');
      return this.getEmptyMetrics();
    }

    const metrics = backendData.propertyMetrics;
    const estimatedCosts = this.estimateOperatingCosts(metrics.totalRevenue, metrics.totalRooms);
    const netProfit = metrics.totalRevenue - estimatedCosts;
    const profitMargin = metrics.totalRevenue > 0 ? (netProfit / metrics.totalRevenue) * 100 : 0;

    const result = {
      totalRevenue: metrics.totalRevenue,
      totalExpected: metrics.totalExpected,
      collectionRate: metrics.collectionRate,
      totalRooms: metrics.totalRooms,
      occupiedRooms: metrics.occupiedRooms,
      occupancyRate: metrics.occupancyRate,
      averageRent: metrics.averageRent,
      totalDeposits: Math.round((metrics.occupiedRooms * metrics.averageRent * 2) * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      profitMargin: Math.round(profitMargin * 100) / 100
    };

    console.log('✅ Métriques extraites:', {
      revenus: `${result.totalRevenue}/${result.totalExpected} FCFA`,
      taux: `${result.collectionRate}%`,
      occupation: `${result.occupiedRooms}/${result.totalRooms}`
    });

    return result;
  }

  /**
   * 📅 EXTRACTION DES DONNÉES MENSUELLES DEPUIS LE BACKEND
   */
  extractMonthlyDataFromBackend(backendData: any): MonthlyFinancialData[] {
    console.log('📅 Extraction des données mensuelles depuis les calculs centralisés du backend');
    
    if (!backendData || !backendData.rooms) {
      console.warn('⚠️ Données backend manquantes pour les données mensuelles');
      return this.getEmptyMonthlyData();
    }

    const monthlyData: MonthlyFinancialData[] = [];
    
    for (let month = 0; month < 12; month++) {
      let monthlyReceived = 0;
      let monthlyExpected = 0;

      backendData.rooms.forEach(roomData => {
        const monthlyPayment = roomData.paymentValue[month] || 0;
        monthlyReceived += monthlyPayment;
        
        if (roomData.monthsDue > month || monthlyPayment > 0) {
          monthlyExpected += roomData.room.price || 0;
        }
      });

      const collectionRate = monthlyExpected > 0 ? (monthlyReceived / monthlyExpected) * 100 : 0;
      const costs = this.estimateOperatingCosts(monthlyReceived);
      const profit = monthlyReceived - costs;

      monthlyData.push({
        month: this.getMonthName(month),
        monthIndex: month,
        expected: Math.round(monthlyExpected * 100) / 100,
        received: Math.round(monthlyReceived * 100) / 100,
        rate: Math.round(collectionRate * 100) / 100,
        profit: Math.round(profit * 100) / 100
      });
    }

    console.log('✅ Données mensuelles extraites:', monthlyData.length, 'mois');
    return monthlyData;
  }

  /**
   * 👥 EXTRACTION DES PERFORMANCES DES LOCATAIRES DEPUIS LE BACKEND
   */
  extractTenantPerformanceFromBackend(backendData: any): TenantFinancialSummary[] {
    console.log('👥 Extraction des performances locataires depuis les calculs centralisés du backend');

    if (!backendData || !backendData.rooms) {
      console.warn('⚠️ Données backend manquantes pour l\'analyse des locataires');
      return [];
    }

    const tenantSummaries = backendData.rooms
      .filter(roomData => roomData.totalReceived > 0)
      .map(roomData => {
        const monthsActive = roomData.monthsDue || 12;
        const averageMonthlyPayment = monthsActive > 0 ? roomData.totalReceived / monthsActive : 0;
        
        return {
          tenantId: roomData.room._id || '',
          tenantName: `Chambre ${roomData.room.code}`,
          totalPaid: roomData.totalReceived,
          totalDue: roomData.expectedAmount,
          paymentRate: roomData.collectionRate,
          monthsActive,
          averageMonthlyPayment: Math.round(averageMonthlyPayment * 100) / 100
        };
      });

    console.log(`✅ Performances extraites pour ${tenantSummaries.length} locataires/chambres`);
    return tenantSummaries;
  }

  /**
   * Valide les données du backend
   */
  validateBackendData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      if (!data) {
        errors.push('Données manquantes');
        return { isValid: false, errors };
      }

      if (data.rooms && Array.isArray(data.rooms)) {
        data.rooms.forEach((room: any, index: number) => {
          if (!room.room) errors.push(`Chambre ${index}: données de chambre manquantes`);
          if (typeof room.totalReceived !== 'number') errors.push(`Chambre ${index}: totalReceived invalide`);
          if (typeof room.expectedAmount !== 'number') errors.push(`Chambre ${index}: expectedAmount invalide`);
        });
      }

      if (data.propertyMetrics) {
        const metrics = data.propertyMetrics;
        if (typeof metrics.totalRevenue !== 'number') errors.push('totalRevenue invalide');
        if (typeof metrics.collectionRate !== 'number') errors.push('collectionRate invalide');
      }

      return {
        isValid: errors.length === 0,
        errors
      };
      
    } catch (error) {
      return {
        isValid: false,
        errors: ['Erreur lors de la validation']
      };
    }
  }

  /**
   * Construit les données mensuelles depuis les statistiques de chambres
   */
  private buildMonthlyFromRoomStats(yearlyStats: StatisticRoomYearModel[]): MonthlyFinancialData[] {
    const monthlyData: MonthlyFinancialData[] = [];
    
    for (let month = 0; month < 12; month++) {
      let monthlyReceived = 0;
      let monthlyExpected = 0;

      yearlyStats.forEach(roomStat => {
        const monthlyPayment = roomStat.paymentValue?.[month] || 0;
        monthlyReceived += monthlyPayment;
        monthlyExpected += roomStat.room?.price || 0;
      });

      const collectionRate = monthlyExpected > 0 ? (monthlyReceived / monthlyExpected) * 100 : 0;
      const costs = this.estimateOperatingCosts(monthlyReceived);
      const profit = monthlyReceived - costs;

      monthlyData.push({
        month: this.getMonthName(month),
        monthIndex: month,
        expected: Math.round(monthlyExpected * 100) / 100,
        received: Math.round(monthlyReceived * 100) / 100,
        rate: Math.round(collectionRate * 100) / 100,
        profit: Math.round(profit * 100) / 100
      });
    }

    return monthlyData;
  }

  /**
   * Construit les données mensuelles depuis la récapitulation
   */
  private buildMonthlyFromRecapitulation(recapitulation: StatisticPaymentOfAllPropertyByYear): MonthlyFinancialData[] {
    const monthlyData: MonthlyFinancialData[] = [];
    
    if (recapitulation.paymentProperty && recapitulation.paymentProperty[0]?.amountMonth) {
      recapitulation.paymentProperty[0].amountMonth.forEach((monthData: any, index: number) => {
        const costs = this.estimateOperatingCosts(monthData.totalAmountReceived);
        const profit = monthData.totalAmountReceived - costs;
        const rate = monthData.totalAmountToBeReceveid > 0 ? 
          (monthData.totalAmountReceived / monthData.totalAmountToBeReceveid) * 100 : 0;

        monthlyData.push({
          month: this.getMonthName(index),
          monthIndex: index,
          expected: monthData.totalAmountToBeReceveid,
          received: monthData.totalAmountReceived,
          rate: Math.round(rate * 100) / 100,
          profit: Math.round(profit * 100) / 100
        });
      });
    }

    return monthlyData.length > 0 ? monthlyData : this.getEmptyMonthlyData();
  }

  /**
   * Valide les données financières pour détecter les incohérences
   */
  validateFinancialData(metrics: FinancialMetrics): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    try {
      if (metrics.totalRevenue < 0) warnings.push('Revenus totaux négatifs détectés');
      if (metrics.totalExpected < 0) warnings.push('Revenus attendus négatifs détectés');
      if (metrics.netProfit < -metrics.totalRevenue) warnings.push('Perte nette excessive détectée');
      if (metrics.collectionRate > 200) warnings.push('Taux de collection anormalement élevé (>200%)');
      if (metrics.occupancyRate > 100) warnings.push('Taux d\'occupation supérieur à 100%');
      if (metrics.profitMargin < -200 || metrics.profitMargin > 200) warnings.push('Marge de profit anormale');
      if (metrics.occupiedRooms > metrics.totalRooms) warnings.push('Plus de chambres occupées que le total');
      if (metrics.totalRevenue > metrics.totalExpected * 3) warnings.push('Revenus excessivement supérieurs aux attentes');
      
      if (metrics.totalRooms === 0 && (metrics.totalRevenue > 0 || metrics.totalExpected > 0)) {
        warnings.push('Revenus détectés sans chambres');
      }
      
      if (metrics.averageRent <= 0 && metrics.totalRooms > 0) {
        warnings.push('Loyer moyen invalide');
      }

      return {
        isValid: warnings.length === 0,
        warnings
      };
      
    } catch (error) {
      console.error('❌ Erreur lors de la validation des données financières:', error);
      return {
        isValid: false,
        warnings: ['Erreur lors de la validation des données']
      };
    }
  }

}
