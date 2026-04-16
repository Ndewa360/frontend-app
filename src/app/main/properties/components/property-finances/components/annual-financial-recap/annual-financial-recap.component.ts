import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import {
  StatisticRoomYearModel,
  StatisticPaymentOfAllPropertyByYear,
  EnrichedStatisticResponse
} from 'src/app/shared/store';
import { ExportData } from '../../property-finances.component';

export interface AnnualFinancialSummary {
  totalExpectedRevenue: number;
  totalReceivedRevenue: number;
  totalRevenue: number; // Alias pour totalReceivedRevenue
  totalDeposits: number;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number;
  collectionRate: number;
  performanceScore: number; // Score de performance global
  averageRentPerUnit: number;
  totalMissedRevenue: number;
  monthlyBreakdown: Array<{
    month: number;
    monthName: string;
    expected: number;
    received: number;
    rate: number;
    performance: number; // Performance du mois
    revenue: number; // Revenus du mois
    paymentsCount: number; // Nombre de paiements
  }>;
  unitBreakdown: Array<{
    unitCode: string;
    unitType: string;
    monthlyRent: number;
    totalExpected: number;
    totalReceived: number;
    collectionRate: number; // Taux de collecte
    monthsOccupied: number;
  }>;
  unitPerformance: Array<{
    unitCode: string;
    unitType: string;
    monthlyRent: number;
    totalExpected: number;
    totalReceived: number;
    performanceRate: number;
    monthsOccupied: number;
  }>;
}

@Component({
  selector: 'app-annual-financial-recap',
  templateUrl: './annual-financial-recap.component.html',
  styleUrls: ['./annual-financial-recap.component.scss']
})
export class AnnualFinancialRecapComponent implements OnInit, OnChanges {
  @Input() yearlyStats: StatisticRoomYearModel[] = [];
  @Input() recapitulation: StatisticPaymentOfAllPropertyByYear | null = null;
  @Input() enrichedData: EnrichedStatisticResponse | null = null; // ✅ Données enrichies backend
  @Input() selectedYear: number = new Date().getFullYear();
  @Input() isLoading: boolean = false;

  @Output() exportData = new EventEmitter<ExportData>();

  annualSummary: AnnualFinancialSummary = {
    totalExpectedRevenue: 0,
    totalReceivedRevenue: 0,
    totalRevenue: 0,
    totalDeposits: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    occupancyRate: 0,
    collectionRate: 0,
    performanceScore: 0,
    averageRentPerUnit: 0,
    totalMissedRevenue: 0,
    monthlyBreakdown: [],
    unitBreakdown: [],
    unitPerformance: []
  };

  // Comparaison avec l'année précédente
  yearComparison = {
    revenueGrowth: 0,
    occupancyGrowth: 0,
    collectionGrowth: 0
  };

  ngOnInit(): void {
    this.processAnnualData();
  }

  ngOnChanges(): void {
    this.processAnnualData();
  }

  private processAnnualData(): void {
    this.calculateAnnualSummary();
    this.buildMonthlyBreakdown();
    this.buildUnitPerformance();
    this.calculateYearComparison();
  }

  private calculateAnnualSummary(): void {
    if (this.enrichedData?.data?.propertyMetrics) {
      const m = this.enrichedData.data.propertyMetrics;
      const cautionsReceived = this.enrichedData.data.cautionsAnalysis?.summary?.totalCautionsReceived || 0;
      // totalCoveredInYear = montant couvert dans l'année par la projection du cumul
      const coveredInYear = (m as any).totalCoveredInYear ?? m.totalRevenue;
      this.annualSummary = {
        ...this.annualSummary,
        totalExpectedRevenue: m.totalExpected,
        totalReceivedRevenue: coveredInYear,   // couvert dans l'année
        totalRevenue:         coveredInYear,
        totalDeposits: cautionsReceived,
        totalUnits:    m.totalRooms,
        occupiedUnits: m.occupiedRooms,
        occupancyRate: m.occupancyRate,
        collectionRate: m.collectionRate,
        performanceScore: Math.round(m.collectionRate * 0.6 + m.occupancyRate * 0.4),
        averageRentPerUnit: m.averageRent,
        totalMissedRevenue: Math.max(0, m.totalExpected - coveredInYear)
      };
      return;
    }

    // Fallback sur yearlyStats si pas de données enrichies
    let totalExpected = 0, totalReceived = 0, totalRentSum = 0, occupiedUnits = 0;

    this.yearlyStats.forEach(roomStat => {
      const monthlyPayments = roomStat.paymentValue || [];
      const receivedForRoom = monthlyPayments.reduce((sum, payment) => sum + (payment || 0), 0);
      const roomPrice = roomStat.room?.price || 0;
      const monthsDue = roomStat.monthsDue ?? 12;
      totalExpected += roomPrice * monthsDue;
      totalReceived += receivedForRoom;
      totalRentSum += roomPrice;
      if (receivedForRoom > 0) occupiedUnits++;
    });

    const occupancyRate = this.yearlyStats.length > 0 ? (occupiedUnits / this.yearlyStats.length) * 100 : 0;
    const collectionRate = totalExpected > 0 ? Math.min((totalReceived / totalExpected) * 100, 100) : 0;

    this.annualSummary = {
      ...this.annualSummary,
      totalExpectedRevenue: totalExpected,
      totalReceivedRevenue: totalReceived,
      totalRevenue: totalReceived,
      totalDeposits: 0,
      totalUnits: this.yearlyStats.length,
      occupiedUnits,
      occupancyRate,
      collectionRate,
      performanceScore: Math.round(collectionRate * 0.6 + occupancyRate * 0.4), // FIX #F17
      averageRentPerUnit: this.yearlyStats.length > 0 ? totalRentSum / this.yearlyStats.length : 0,
      totalMissedRevenue: totalExpected - totalReceived
    };
  }

  private buildMonthlyBreakdown(): void {
    this.annualSummary.monthlyBreakdown = [];

    // FIX #F16 : priorité aux données enrichies du backend (revenueDistribution.monthlyAnalysis)
    // qui contiennent les vraies données mensuelles calculées par le moteur financier
    if (this.enrichedData?.data?.revenueDistribution?.monthlyAnalysis) {
      this.annualSummary.monthlyBreakdown = this.enrichedData.data.revenueDistribution.monthlyAnalysis.map(item => ({
        month: item.month - 1, // monthlyAnalysis.month est 1-based, on le convertit en 0-based
        monthName: this.getMonthName(item.month - 1),
        expected: item.expected,
        received: item.distributed,
        rate: item.fulfillmentRate,
        performance: item.fulfillmentRate,
        revenue: item.distributed,
        paymentsCount: item.roomsAtQuota
      }));
      return;
    }

    // Fallback : recapitulation avec le bon nom de champ (totalAmountToBeReceveid avec typo backend)
    if (this.recapitulation?.paymentProperty && Array.isArray(this.recapitulation.paymentProperty)) {
      const monthlyData: { [key: number]: { expected: number; received: number; count: number } } = {};
      for (let i = 0; i < 12; i++) {
        monthlyData[i] = { expected: 0, received: 0, count: 0 };
      }

      this.recapitulation.paymentProperty.forEach(propertyData => {
        if (propertyData?.amountMonth && Array.isArray(propertyData.amountMonth)) {
          propertyData.amountMonth.forEach(monthData => {
            if (monthData && typeof monthData.month === 'number') {
              const monthIndex = (monthData.month - 1) % 12;
              if (monthIndex >= 0 && monthIndex < 12) {
                // FIX #F16 : utiliser le bon nom de champ du modèle (typo conservée pour cohérence backend/frontend)
                monthlyData[monthIndex].expected += monthData.totalAmountToBeReceveid || 0;
                monthlyData[monthIndex].received += monthData.totalAmountReceived || 0;
                monthlyData[monthIndex].count += 1;
              }
            }
          });
        }
      });

      this.annualSummary.monthlyBreakdown = Object.keys(monthlyData).map(monthKey => {
        const monthIndex = parseInt(monthKey);
        const data = monthlyData[monthIndex];
        const rate = data.expected > 0 ? (data.received / data.expected) * 100 : 0;
        return {
          month: monthIndex,
          monthName: this.getMonthName(monthIndex),
          expected: data.expected,
          received: data.received,
          rate,
          performance: rate,
          revenue: data.received,
          paymentsCount: data.count
        };
      });
    } else {
      for (let i = 0; i < 12; i++) {
        this.annualSummary.monthlyBreakdown.push({
          month: i,
          monthName: this.getMonthName(i),
          expected: 0, received: 0, rate: 0,
          performance: 0, revenue: 0, paymentsCount: 0
        });
      }
    }
  }

  private buildUnitPerformance(): void {
    if (this.enrichedData?.data?.rooms) {
      const rooms = this.enrichedData.data.rooms;
      this.annualSummary.unitPerformance = rooms.map((roomData: any) => {
        // Utiliser coveredAmountInYear (projection) comme montant reçu pour l'année
        const coveredInYear = (roomData as any).coveredAmountInYear ?? roomData.totalReceived ?? 0;
        const expectedInYear = roomData.expectedAmount || 0;
        const perfRate = expectedInYear > 0
          ? Math.min((coveredInYear / expectedInYear) * 100, 100)
          : 0;
        return {
          unitCode: roomData.room?.code || 'N/A',
          unitType: this.getRoomTypeLabel(roomData.room?.type),
          monthlyRent: roomData.room?.price || 0,
          totalExpected: expectedInYear,
          totalReceived: coveredInYear,
          performanceRate: Math.round(perfRate * 100) / 100,
          monthsOccupied: roomData.monthsDue || 0
        };
      }).sort((a, b) => b.performanceRate - a.performanceRate);

      this.annualSummary.unitBreakdown = this.annualSummary.unitPerformance.map(u => ({
        unitCode: u.unitCode,
        unitType: u.unitType,
        monthlyRent: u.monthlyRent,
        totalExpected: u.totalExpected,
        totalReceived: u.totalReceived,
        collectionRate: u.performanceRate,
        monthsOccupied: u.monthsOccupied
      }));
      return;
    }

    // Fallback sur yearlyStats
    this.annualSummary.unitPerformance = this.yearlyStats.map(roomStat => {
      const monthlyPayments = roomStat.paymentValue || [];
      const totalReceived = monthlyPayments.reduce((sum, payment) => sum + (payment || 0), 0);
      const monthlyRent = roomStat.room?.price || 0;
      const monthsDue = roomStat.monthsDue ?? 12;
      const totalExpected = monthlyRent * monthsDue;
      return {
        unitCode: roomStat.room?.code || 'N/A',
        unitType: this.getRoomTypeLabel(roomStat.room?.type),
        monthlyRent,
        totalExpected,
        totalReceived,
        performanceRate: totalExpected > 0 ? Math.min((totalReceived / totalExpected) * 100, 100) : 0,
        monthsOccupied: monthsDue
      };
    }).sort((a, b) => b.performanceRate - a.performanceRate);

    this.annualSummary.unitBreakdown = this.annualSummary.unitPerformance.map(u => ({
      unitCode: u.unitCode,
      unitType: u.unitType,
      monthlyRent: u.monthlyRent,
      totalExpected: u.totalExpected,
      totalReceived: u.totalReceived,
      collectionRate: u.performanceRate,
      monthsOccupied: u.monthsOccupied
    }));
  }

  private calculateYearComparison(): void {
    // Pas de données de comparaison disponibles - réinitialiser à zéro
    // En production, cette fonctionnalité nécessiterait de charger les données de l'année précédente
    this.yearComparison = {
      revenueGrowth: 0, // Pas de données de comparaison
      occupancyGrowth: 0, // Pas de données de comparaison
      collectionGrowth: 0 // Pas de données de comparaison
    };

    // TODO: Implémenter la vraie logique de comparaison quand les données historiques seront disponibles
    /*
    // Code à activer quand les données historiques seront disponibles :
    const previousYearData = await this.statisticsService.getYearlyStats(this.selectedYear - 1);
    if (previousYearData && previousYearData.length > 0) {
      const previousYearSummary = this.calculateSummaryForYear(previousYearData);

      this.yearComparison = {
        revenueGrowth: this.calculateGrowthRate(previousYearSummary.totalRevenue, this.annualSummary.totalRevenue),
        occupancyGrowth: this.calculateGrowthRate(previousYearSummary.occupancyRate, this.annualSummary.occupancyRate),
        collectionGrowth: this.calculateGrowthRate(previousYearSummary.collectionRate, this.annualSummary.collectionRate)
      };
    }
    */
  }

  // Méthode utilitaire pour calculer le taux de croissance
  private calculateGrowthRate(previousValue: number, currentValue: number): number {
    if (previousValue === 0) return currentValue > 0 ? 100 : 0;
    return ((currentValue - previousValue) / previousValue) * 100;
  }

  // === MÉTHODES D'EXPORT ===

  onExportAnnualSummary(): void {
    const summaryData = [
      {
        'Métrique': 'Revenus attendus',
        'Valeur': this.annualSummary.totalExpectedRevenue,
        'Unité': 'FCFA'
      },
      {
        'Métrique': 'Revenus reçus',
        'Valeur': this.annualSummary.totalReceivedRevenue,
        'Unité': 'FCFA'
      },
      {
        'Métrique': 'Taux de recouvrement',
        'Valeur': this.annualSummary.collectionRate,
        'Unité': '%'
      },
      {
        'Métrique': 'Total des cautions',
        'Valeur': this.annualSummary.totalDeposits,
        'Unité': 'FCFA'
      },
      {
        'Métrique': 'Taux d\'occupation',
        'Valeur': this.annualSummary.occupancyRate,
        'Unité': '%'
      },
      {
        'Métrique': 'Loyer moyen',
        'Valeur': this.annualSummary.averageRentPerUnit,
        'Unité': 'FCFA'
      },
      {
        'Métrique': 'Manque à gagner',
        'Valeur': this.annualSummary.totalMissedRevenue,
        'Unité': 'FCFA'
      }
    ];

    this.exportData.emit({
      type: 'excel',
      data: summaryData,
      filename: `recapitulatif-annuel-${this.selectedYear}`
    });
  }

  onExportMonthlyBreakdown(): void {
    const monthlyData = this.annualSummary.monthlyBreakdown.map(month => ({
      'Mois': month.monthName,
      'Revenus attendus': month.expected,
      'Revenus reçus': month.received,
      'Taux de recouvrement': month.rate,
      'Écart': month.expected - month.received
    }));

    this.exportData.emit({
      type: 'excel',
      data: monthlyData,
      filename: `breakdown-mensuel-${this.selectedYear}`
    });
  }

  onExportUnitPerformance(): void {
    const unitData = this.annualSummary.unitPerformance.map(unit => ({
      'Code unité': unit.unitCode,
      'Type': unit.unitType,
      'Loyer mensuel': unit.monthlyRent,
      'Total attendu': unit.totalExpected,
      'Total reçu': unit.totalReceived,
      'Taux de performance': unit.performanceRate,
      'Mois d\'occupation': unit.monthsOccupied,
      'Revenus manqués': unit.totalExpected - unit.totalReceived
    }));

    this.exportData.emit({
      type: 'excel',
      data: unitData,
      filename: `performance-unites-${this.selectedYear}`
    });
  }

  // === MÉTHODES UTILITAIRES ===

  formatPrice(price: number | null | undefined): string {
    if (!price) return '0 FCFA';
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(price);
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  getMonthName(monthIndex: number): string {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[monthIndex] || 'Mois inconnu';
  }

  getRoomTypeLabel(type: string): string {
    switch (type) {
      case 'room': return 'ROOM_TYPES.ROOM';
      case 'studio': return 'ROOM_TYPES.STUDIO';
      case 'simple_apartment': return 'ROOM_TYPES.SIMPLE_APARTMENT';
      case 'furnished_apartment': return 'ROOM_TYPES.FURNISHED_APARTMENT';
      default: return 'ROOM_TYPES.ROOM';
    }
  }

  getPerformanceColor(rate: number): string {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  }

  getGrowthColor(growth: number): string {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  }

  getGrowthIcon(growth: number): string {
    if (growth > 0) return 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6';
    if (growth < 0) return 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6';
    return 'M5 12h14';
  }

  trackByMonth(_: number, month: AnnualFinancialSummary['monthlyBreakdown'][0]): number {
    return month.month;
  }

  trackByUnitCode(_: number, unit: AnnualFinancialSummary['unitPerformance'][0]): string {
    return unit.unitCode;
  }

  // Méthodes d'export
  exportToExcel(): void {
    const data = this.prepareExportData();
    this.exportData.emit({
      type: 'excel',
      data: data,
      filename: `recap-financier-annuel-${this.selectedYear}.xlsx`
    });
  }

  exportToCSV(): void {
    const data = this.prepareExportData();
    this.exportData.emit({
      type: 'csv',
      data: data,
      filename: `recap-financier-annuel-${this.selectedYear}.csv`
    });
  }

  private prepareExportData(): any[] {
    return [
      {
        'Année': this.selectedYear,
        'Revenus totaux': this.annualSummary.totalRevenue,
        'Revenus attendus': this.annualSummary.totalExpectedRevenue,
        'Taux de collecte': this.annualSummary.collectionRate,
        'Taux d\'occupation': this.annualSummary.occupancyRate,
        'Score de performance': this.annualSummary.performanceScore,
        'Dépôts de garantie': this.annualSummary.totalDeposits,
        'Unités totales': this.annualSummary.totalUnits,
        'Unités occupées': this.annualSummary.occupiedUnits,
        'Loyer moyen': this.annualSummary.averageRentPerUnit,
        'Revenus manqués': this.annualSummary.totalMissedRevenue
      }
    ];
  }
}
