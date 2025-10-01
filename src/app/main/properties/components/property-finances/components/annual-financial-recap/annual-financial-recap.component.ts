import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import {
  StatisticRoomYearModel,
  StatisticPaymentOfAllPropertyByYear
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
    let totalExpected = 0;
    let totalReceived = 0;
    let totalDeposits = 0;
    let totalRentSum = 0;
    let occupiedUnits = 0;

    this.yearlyStats.forEach(roomStat => {
      // Calculer les totaux à partir des paymentValue (tableau des paiements mensuels)
      const monthlyPayments = roomStat.paymentValue || [];
      const receivedForRoom = monthlyPayments.reduce((sum, payment) => sum + (payment || 0), 0);
      const roomPrice = roomStat.room?.price || 0;
      const expectedForYear = roomPrice * 12; // Loyer annuel attendu

      totalExpected += expectedForYear;
      totalReceived += receivedForRoom;
      totalRentSum += roomPrice;

      if (receivedForRoom > 0) {
        occupiedUnits++;
      }
    });

    const occupancyRate = this.yearlyStats.length > 0 ? (occupiedUnits / this.yearlyStats.length) * 100 : 0;
    const collectionRate = totalExpected > 0 ? (totalReceived / totalExpected) * 100 : 0;

    this.annualSummary = {
      ...this.annualSummary,
      totalExpectedRevenue: totalExpected,
      totalReceivedRevenue: totalReceived,
      totalRevenue: totalReceived, // Alias
      totalDeposits,
      totalUnits: this.yearlyStats.length,
      occupiedUnits,
      occupancyRate,
      collectionRate,
      performanceScore: Math.round((occupancyRate + collectionRate) / 2), // Score basé sur occupation et collecte
      averageRentPerUnit: this.yearlyStats.length > 0 ? totalRentSum / this.yearlyStats.length : 0,
      totalMissedRevenue: totalExpected - totalReceived
    };
  }

  private buildMonthlyBreakdown(): void {
    this.annualSummary.monthlyBreakdown = [];

    if (this.recapitulation?.paymentProperty && Array.isArray(this.recapitulation.paymentProperty)) {
      // Construire les données mensuelles à partir de la structure réelle
      const monthlyData: { [key: number]: { expected: number, received: number, count: number } } = {};

      // Initialiser les 12 mois
      for (let i = 0; i < 12; i++) {
        monthlyData[i] = { expected: 0, received: 0, count: 0 };
      }

      // Agréger les données de toutes les propriétés avec vérifications de sécurité
      this.recapitulation.paymentProperty.forEach(propertyData => {
        if (propertyData?.amountMonth && Array.isArray(propertyData.amountMonth)) {
          propertyData.amountMonth.forEach(monthData => {
            if (monthData && typeof monthData.month === 'number') {
              const monthIndex = (monthData.month - 1) % 12; // Convertir 1-12 en 0-11
              if (monthIndex >= 0 && monthIndex < 12) {
                monthlyData[monthIndex].expected += monthData.totalAmountToBeReceived || 0;
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
      // Créer des données vides pour les 12 mois
      for (let i = 0; i < 12; i++) {
        this.annualSummary.monthlyBreakdown.push({
          month: i,
          monthName: this.getMonthName(i),
          expected: 0,
          received: 0,
          rate: 0,
          performance: 0,
          revenue: 0,
          paymentsCount: 0
        });
      }
    }
  }

  private buildUnitPerformance(): void {
    this.annualSummary.unitPerformance = this.yearlyStats.map(roomStat => {
      const monthlyPayments = roomStat.paymentValue || [];
      const totalReceived = monthlyPayments.reduce((sum, payment) => sum + (payment || 0), 0);
      const monthlyRent = roomStat.room?.price || 0;
      const totalExpected = monthlyRent * 12;

      // Calculer le nombre de mois d'occupation basé sur les paiements
      const monthsOccupied = monthlyRent > 0 ? Math.round(totalReceived / monthlyRent) : 0;

      return {
        unitCode: roomStat.room?.code || 'N/A',
        unitType: this.getRoomTypeLabel(roomStat.room?.type),
        monthlyRent,
        totalExpected,
        totalReceived,
        performanceRate: totalExpected > 0 ? (totalReceived / totalExpected) * 100 : 0,
        monthsOccupied: Math.min(monthsOccupied, 12)
      };
    }).sort((a, b) => b.performanceRate - a.performanceRate);

    // Construire aussi unitBreakdown pour le template
    this.annualSummary.unitBreakdown = this.yearlyStats.map(roomStat => {
      const monthlyPayments = roomStat.paymentValue || [];
      const totalReceived = monthlyPayments.reduce((sum, payment) => sum + (payment || 0), 0);
      const monthlyRent = roomStat.room?.price || 0;
      const totalExpected = monthlyRent * 12;
      const monthsOccupied = monthlyRent > 0 ? Math.round(totalReceived / monthlyRent) : 0;
      const collectionRate = totalExpected > 0 ? (totalReceived / totalExpected) * 100 : 0;

      return {
        unitCode: roomStat.room?.code || 'N/A',
        unitType: this.getRoomTypeLabel(roomStat.room?.type),
        monthlyRent,
        totalExpected,
        totalReceived,
        collectionRate,
        monthsOccupied: Math.min(monthsOccupied, 12)
      };
    }).sort((a, b) => b.collectionRate - a.collectionRate);
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
      case 'room': return 'Chambre';
      case 'studio': return 'Studio';
      case 'simple_apartment': return 'Appartement';
      case 'furnished_apartment': return 'App. Meublé';
      default: return 'Inconnu';
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
