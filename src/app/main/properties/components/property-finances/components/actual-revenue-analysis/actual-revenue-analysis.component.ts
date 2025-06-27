import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { 
  StatisticRoomYearModel,
  StatisticPaymentOfAllPropertyByYear
} from 'src/app/shared/store';
import { ExportData } from '../../property-finances.component';

export interface ActualRevenueData {
  unitCode: string;
  unitType: string;
  monthlyRent: number;
  monthlyDetails: Array<{
    month: number;
    monthName: string;
    expectedAmount: number;
    actualAmount: number;
    difference: number;
    differencePercentage: number;
    overpayment: boolean;
  }>;
  yearlyExpected: number;
  yearlyActual: number;
  yearlyDifference: number;
  yearlyDifferencePercentage: number;
  hasOverpayments: boolean;
}

export interface RevenueSummary {
  totalUnits: number;
  totalExpectedRevenue: number;
  totalActualRevenue: number;
  totalDifference: number;
  averageDifferencePercentage: number;
  unitsWithOverpayments: number;
  unitsWithUnderpayments: number;
  bestPerformingUnit: string;
  worstPerformingUnit: string;
}

@Component({
  selector: 'app-actual-revenue-analysis',
  templateUrl: './actual-revenue-analysis.component.html',
  styleUrls: ['./actual-revenue-analysis.component.css']
})
export class ActualRevenueAnalysisComponent implements OnInit, OnChanges {
  @Input() yearlyStats: StatisticRoomYearModel[] = [];
  @Input() recapitulation: StatisticPaymentOfAllPropertyByYear | null = null;
  @Input() selectedYear: number = new Date().getFullYear();
  @Input() isLoading: boolean = false;

  @Output() exportData = new EventEmitter<ExportData>();

  revenueData: ActualRevenueData[] = [];
  revenueSummary: RevenueSummary = {
    totalUnits: 0,
    totalExpectedRevenue: 0,
    totalActualRevenue: 0,
    totalDifference: 0,
    averageDifferencePercentage: 0,
    unitsWithOverpayments: 0,
    unitsWithUnderpayments: 0,
    bestPerformingUnit: '',
    worstPerformingUnit: ''
  };

  selectedMonth: number = new Date().getMonth() + 1;
  selectedFilter: 'all' | 'overpayments' | 'underpayments' | 'exact' = 'all';
  sortBy: 'unit' | 'difference' | 'percentage' = 'difference';
  sortDirection: 'asc' | 'desc' = 'desc';

  ngOnInit(): void {
    this.processRevenueData();
  }

  ngOnChanges(): void {
    this.processRevenueData();
  }

  private processRevenueData(): void {
    this.revenueData = [];

    this.yearlyStats.forEach(roomStat => {
      const unitData = this.buildUnitRevenueData(roomStat);
      if (unitData) {
        this.revenueData.push(unitData);
      }
    });

    this.calculateRevenueSummary();
    this.applySorting();
  }

  private buildUnitRevenueData(roomStat: StatisticRoomYearModel): ActualRevenueData | null {
    if (!roomStat.room) return null;

    const monthlyRent = roomStat.room.price || 0;
    const monthlyPayments = roomStat.paymentValue || [];
    const monthlyDetails: ActualRevenueData['monthlyDetails'] = [];

    let yearlyExpected = 0;
    let yearlyActual = 0;
    let hasOverpayments = false;

    // Traiter les 12 mois
    for (let month = 0; month < 12; month++) {
      const expectedAmount = monthlyRent;
      const actualAmount = monthlyPayments[month] || 0;
      const difference = actualAmount - expectedAmount;
      const differencePercentage = expectedAmount > 0 ? (difference / expectedAmount) * 100 : 0;
      const overpayment = actualAmount > expectedAmount;

      if (overpayment) {
        hasOverpayments = true;
      }

      monthlyDetails.push({
        month: month + 1,
        monthName: this.getMonthName(month),
        expectedAmount,
        actualAmount,
        difference,
        differencePercentage,
        overpayment
      });

      yearlyExpected += expectedAmount;
      yearlyActual += actualAmount;
    }

    const yearlyDifference = yearlyActual - yearlyExpected;
    const yearlyDifferencePercentage = yearlyExpected > 0 ? (yearlyDifference / yearlyExpected) * 100 : 0;

    return {
      unitCode: roomStat.room.code || 'N/A',
      unitType: this.getRoomTypeLabel(roomStat.room.type),
      monthlyRent,
      monthlyDetails,
      yearlyExpected,
      yearlyActual,
      yearlyDifference,
      yearlyDifferencePercentage,
      hasOverpayments
    };
  }

  private calculateRevenueSummary(): void {
    const summary = this.revenueData.reduce((acc, unit) => {
      acc.totalUnits++;
      acc.totalExpectedRevenue += unit.yearlyExpected;
      acc.totalActualRevenue += unit.yearlyActual;
      acc.totalDifference += unit.yearlyDifference;

      if (unit.yearlyDifference > 0) {
        acc.unitsWithOverpayments++;
      } else if (unit.yearlyDifference < 0) {
        acc.unitsWithUnderpayments++;
      }

      return acc;
    }, {
      totalUnits: 0,
      totalExpectedRevenue: 0,
      totalActualRevenue: 0,
      totalDifference: 0,
      unitsWithOverpayments: 0,
      unitsWithUnderpayments: 0,
      averageDifferencePercentage: 0,
      bestPerformingUnit: '',
      worstPerformingUnit: ''
    });

    // Calculer le pourcentage moyen de différence
    const averageDifferencePercentage = summary.totalExpectedRevenue > 0
      ? (summary.totalDifference / summary.totalExpectedRevenue) * 100
      : 0;

    // Trouver les meilleures et pires performances
    const sortedByPerformance = [...this.revenueData].sort((a, b) => b.yearlyDifferencePercentage - a.yearlyDifferencePercentage);

    this.revenueSummary = {
      ...summary,
      averageDifferencePercentage,
      bestPerformingUnit: sortedByPerformance[0]?.unitCode || '',
      worstPerformingUnit: sortedByPerformance[sortedByPerformance.length - 1]?.unitCode || ''
    };
  }

  private applySorting(): void {
    this.revenueData.sort((a, b) => {
      let comparison = 0;

      switch (this.sortBy) {
        case 'unit':
          comparison = a.unitCode.localeCompare(b.unitCode);
          break;
        case 'difference':
          comparison = a.yearlyDifference - b.yearlyDifference;
          break;
        case 'percentage':
          comparison = a.yearlyDifferencePercentage - b.yearlyDifferencePercentage;
          break;
      }

      return this.sortDirection === 'desc' ? -comparison : comparison;
    });
  }

  // Méthodes publiques pour le template
  getFilteredData(): ActualRevenueData[] {
    return this.revenueData.filter(unit => {
      switch (this.selectedFilter) {
        case 'overpayments':
          return unit.yearlyDifference > 0;
        case 'underpayments':
          return unit.yearlyDifference < 0;
        case 'exact':
          return unit.yearlyDifference === 0;
        default:
          return true;
      }
    });
  }

  getMonthlyDataForUnit(unitCode: string): ActualRevenueData['monthlyDetails'] {
    const unit = this.revenueData.find(u => u.unitCode === unitCode);
    return unit?.monthlyDetails || [];
  }

  getDifferenceColor(difference: number): string {
    if (difference > 0) return 'text-green-600';
    if (difference < 0) return 'text-red-600';
    return 'text-gray-600';
  }

  getDifferenceIcon(difference: number): string {
    if (difference > 0) return '↗';
    if (difference < 0) return '↘';
    return '→';
  }

  getMonthName(monthIndex: number): string {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[monthIndex] || '';
  }

  getRoomTypeLabel(type: any): string {
    // Logique pour convertir le type de chambre en label lisible
    if (typeof type === 'string') return type;
    return 'Standard';
  }

  // Méthodes de tri et filtrage
  onSortChange(sortBy: 'unit' | 'difference' | 'percentage'): void {
    if (this.sortBy === sortBy) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = sortBy;
      this.sortDirection = 'desc';
    }
    this.applySorting();
  }

  onFilterChange(): void {
    // Le filtrage est appliqué automatiquement via getFilteredData()
  }

  // Méthodes d'export
  exportToExcel(): void {
    const data = this.prepareExportData();
    this.exportData.emit({
      type: 'excel',
      data: data,
      filename: `analyse-revenus-effectifs-${this.selectedYear}.xlsx`
    });
  }

  exportToCSV(): void {
    const data = this.prepareExportData();
    this.exportData.emit({
      type: 'csv',
      data: data,
      filename: `analyse-revenus-effectifs-${this.selectedYear}.csv`
    });
  }

  private prepareExportData(): any[] {
    return this.getFilteredData().map(unit => ({
      'Unité': unit.unitCode,
      'Type': unit.unitType,
      'Loyer mensuel': unit.monthlyRent,
      'Attendu annuel': unit.yearlyExpected,
      'Reçu annuel': unit.yearlyActual,
      'Différence': unit.yearlyDifference,
      'Différence %': `${unit.yearlyDifferencePercentage.toFixed(2)}%`,
      'Surpaiements': unit.hasOverpayments ? 'Oui' : 'Non'
    }));
  }

  // Méthodes pour le template
  trackByUnitCode(index: number, unit: ActualRevenueData): string {
    return unit.unitCode;
  }

  Math = Math; // Exposer Math pour le template
}
