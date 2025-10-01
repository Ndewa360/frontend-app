import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { Store } from '@ngxs/store';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ExportData } from '../../property-finances.component';
import { PropertyFinancialManagerService, MonthlyFinancialData } from 'src/app/main/properties/services/property-financial-manager.service';

export interface MonthlyRevenueData {
  month: number;
  monthName: string;
  expectedRevenue: number;
  receivedRevenue: number;
  totalRevenue: number; // Alias pour receivedRevenue
  collectionRate: number;
  paymentsCount: number;
  activeUnits: number;
  growth: number; // Croissance par rapport au mois précédent
  performancePercentage: number; // Performance en pourcentage
  unitDetails: Array<{
    unitCode: string;
    unitPrice: number;
    amountReceived: number;
    tenantName?: string;
    paymentRate: number;
  }>;
}

@Component({
  selector: 'app-monthly-revenue-analysis',
  templateUrl: './monthly-revenue-analysis.component.html',
  styleUrls: ['./monthly-revenue-analysis.component.scss']
})
export class MonthlyRevenueAnalysisComponent implements OnInit, OnChanges, OnDestroy {
  @Input() selectedYear: number = new Date().getFullYear();
  @Input() propertyId: string = '';
  @Input() isLoading: boolean = false;

  @Output() exportData = new EventEmitter<ExportData>();

  monthlyData: MonthlyFinancialData[] = [];
  selectedMonth: number = new Date().getMonth();
  private destroy$ = new Subject<void>();

  // Statistiques globales
  yearlyStatsCalculated = {
    totalExpected: 0,
    totalReceived: 0,
    averageCollectionRate: 0,
    bestMonth: { month: 0, rate: 0 },
    worstMonth: { month: 0, rate: 0 }
  };

  constructor(
    private store: Store,
    private propertyFinancialManager: PropertyFinancialManagerService
  ) {}

  ngOnInit(): void {
    this.loadFinancialData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['propertyId'] || changes['selectedYear']) {
      this.loadFinancialData();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadFinancialData(): void {
    if (!this.propertyId) {
      this.monthlyData = [];
      return;
    }

    this.propertyFinancialManager.loadPropertyFinancialData(this.propertyId, this.selectedYear)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (backendData) => {
          if (backendData && backendData.length > 0) {
            this.monthlyData = this.propertyFinancialManager.extractMonthlyData(backendData[0]);
            this.calculateYearlyStats();
          } else {
            this.monthlyData = [];
          }
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des données mensuelles:', error);
          this.monthlyData = [];
        }
      });
  }

  private calculateYearlyStats(): void {
    if (!this.monthlyData || this.monthlyData.length === 0) {
      this.yearlyStatsCalculated = {
        totalExpected: 0,
        totalReceived: 0,
        averageCollectionRate: 0,
        bestMonth: { month: 0, rate: 0 },
        worstMonth: { month: 0, rate: 0 }
      };
      return;
    }

    const totalExpected = this.monthlyData.reduce((sum, month) => sum + month.expected, 0);
    const totalReceived = this.monthlyData.reduce((sum, month) => sum + month.received, 0);
    
    let bestMonth = { month: 0, rate: 0 };
    let worstMonth = { month: 0, rate: 100 };

    this.monthlyData.forEach((month) => {
      if (month.rate > bestMonth.rate) {
        bestMonth = { month: month.monthIndex, rate: month.rate };
      }
      if (month.rate < worstMonth.rate) {
        worstMonth = { month: month.monthIndex, rate: month.rate };
      }
    });

    this.yearlyStatsCalculated = {
      totalExpected: Math.round(totalExpected * 100) / 100,
      totalReceived: Math.round(totalReceived * 100) / 100,
      averageCollectionRate: totalExpected > 0 ? Math.round((totalReceived / totalExpected) * 100 * 100) / 100 : 0,
      bestMonth,
      worstMonth
    };
  }

  // === MÉTHODES D'ACTIONS ===

  onMonthSelect(monthIndex: number): void {
    this.selectedMonth = monthIndex;
  }

  getSelectedMonthData(): MonthlyFinancialData {
    return this.monthlyData[this.selectedMonth] || this.monthlyData[0];
  }

  // === MÉTHODES D'EXPORT ===

  onExportMonthlyAnalysis(): void {
    const exportData = this.monthlyData.map(month => ({
      'Mois': month.month,
      'Revenus attendus': month.expected,
      'Revenus reçus': month.received,
      'Taux de recouvrement': month.rate,
      'Écart': month.expected - month.received
    }));

    this.exportData.emit({
      type: 'excel',
      data: exportData,
      filename: `analyse-revenus-mensuels-${this.selectedYear}`
    });
  }

  onExportMonthDetails(): void {
    const selectedMonth = this.getSelectedMonthData();
    if (!selectedMonth) return;

    const exportData = [{
      'Mois': selectedMonth.month,
      'Revenus attendus': selectedMonth.expected,
      'Revenus reçus': selectedMonth.received,
      'Taux': selectedMonth.rate,
      'Profit': selectedMonth.profit
    }];

    this.exportData.emit({
      type: 'excel',
      data: exportData,
      filename: `details-${selectedMonth.month.toLowerCase()}-${this.selectedYear}`
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

  formatPercentage(value: number | null | undefined): string {
    if (value === null || value === undefined || isNaN(value)) return '0.0%';
    return `${value.toFixed(1)}%`;
  }

  getMonthName(monthIndex: number): string {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[monthIndex] || 'Mois inconnu';
  }

  getMonthShortName(monthIndex: number): string {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    return months[monthIndex] || 'N/A';
  }

  getCollectionRateColor(rate: number): string {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  }

  getCollectionRateBackground(rate: number): string {
    if (rate >= 90) return 'bg-green-100';
    if (rate >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  }

  trackByMonth(_: number, month: MonthlyFinancialData): number {
    return month.monthIndex;
  }

  getTotalRevenue(): number {
    return Math.round(this.monthlyData.reduce((total, month) => total + month.received, 0) * 100) / 100;
  }

  getAverageMonthlyRevenue(): number {
    const monthsWithRevenue = this.monthlyData.filter(m => m.received > 0);
    if (monthsWithRevenue.length === 0) return 0;
    
    const totalRevenue = this.getTotalRevenue();
    return Math.round((totalRevenue / monthsWithRevenue.length) * 100) / 100;
  }

  getBestMonth(): string {
    if (this.monthlyData.length === 0) return 'N/A';

    const bestMonth = this.monthlyData.reduce((best, current) =>
      current.received > best.received ? current : best
    );

    return bestMonth.month;
  }
  
  getWorstMonth(): string {
    const monthsWithRevenue = this.monthlyData.filter(m => m.received > 0);
    if (monthsWithRevenue.length === 0) return 'N/A';

    const worstMonth = monthsWithRevenue.reduce((worst, current) =>
      current.rate < worst.rate ? current : worst
    );

    return worstMonth.month;
  }

  // Méthodes d'export
  exportToExcel(): void {
    const data = this.prepareExportData();
    this.exportData.emit({
      type: 'excel',
      data: data,
      filename: `analyse-revenus-mensuels-${this.selectedYear}.xlsx`
    });
  }

  exportToCSV(): void {
    const data = this.prepareExportData();
    this.exportData.emit({
      type: 'csv',
      data: data,
      filename: `analyse-revenus-mensuels-${this.selectedYear}.csv`
    });
  }

  private prepareExportData(): any[] {
    return this.monthlyData.map(month => ({
      'Mois': month.month,
      'Année': this.selectedYear,
      'Revenus totaux': month.received,
      'Revenus attendus': month.expected,
      'Taux de collecte': month.rate,
      'Profit': month.profit
    }));
  }
}
