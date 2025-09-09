import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import {
  StatisticAllPaymentLocataireYearModel,
  StatisticPaymentOfAllPropertyByYear,
  LocationModel,
  LocationState
} from 'src/app/shared/store';
import { Store } from '@ngxs/store';
import { ExportData } from '../../property-finances.component';
import { PropertyFinancialManagerService } from 'src/app/main/properties/services/property-financial-manager.service';

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
export class MonthlyRevenueAnalysisComponent implements OnInit, OnChanges {
  @Input() paymentStats: StatisticAllPaymentLocataireYearModel[] = [];
  @Input() recapitulation: StatisticPaymentOfAllPropertyByYear | null = null;
  @Input() selectedYear: number = new Date().getFullYear();
  @Input() propertyId: string = '';
  @Input() yearlyStats: any[] = [];
  @Input() isLoading: boolean = false;

  @Output() exportData = new EventEmitter<ExportData>();

  locations: LocationModel[] = [];

  monthlyData: MonthlyRevenueData[] = [];
  selectedMonth: number = new Date().getMonth();

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
    this.loadLocations();
  }

  ngOnChanges(): void {
    this.loadLocations();
  }

  private loadLocations(): void {
    this.locations = this.store.selectSnapshot(LocationState.selectStateLocations) || [];
    this.processMonthlyData();
  }

  private processMonthlyData(): void {
    console.log('📅 REVENUS MENSUELS - Traitement des données pour', this.selectedYear);
    
    if (!this.propertyId || !this.yearlyStats?.length) {
      console.log('⚠️ Données insuffisantes pour le calcul');
      this.createEmptyMonthlyData();
      return;
    }

    try {
      // Utiliser le service centralisé
      const propertyMetrics = this.propertyFinancialManager.calculatePropertyMetrics(
        this.propertyId,
        this.selectedYear,
        this.yearlyStats,
        this.locations,
        this.paymentStats
      );

      // Générer les données mensuelles
      const monthlyFinancialData = this.propertyFinancialManager.generateMonthlyData(
        this.selectedYear,
        propertyMetrics.roomDetails
      );

      // Convertir au format attendu
      this.monthlyData = monthlyFinancialData.map((data, index) => {
        const previousRevenue = index > 0 ? monthlyFinancialData[index - 1].received : 0;
        const growth = previousRevenue > 0 ? ((data.received - previousRevenue) / previousRevenue) * 100 : 0;

        return {
          month: data.month,
          monthName: data.monthName,
          expectedRevenue: Math.round(data.expected * 100) / 100,
          receivedRevenue: Math.round(data.received * 100) / 100,
          totalRevenue: Math.round(data.received * 100) / 100,
          collectionRate: Math.round(data.collectionRate * 100) / 100,
          paymentsCount: this.getPaymentsCountForMonth(data.month),
          activeUnits: this.getActiveUnitsForMonth(data.month),
          growth: Math.round(growth * 100) / 100,
          performancePercentage: Math.round(data.collectionRate),
          unitDetails: this.buildUnitDetails(data.month)
        };
      });

      // Calculer les statistiques annuelles
      this.calculateYearlyStats();
      
      console.log('✅ Données mensuelles traitées avec le service centralisé:', {
        months: this.monthlyData.length,
        totalRevenue: this.monthlyData.reduce((sum, m) => sum + m.receivedRevenue, 0).toLocaleString(),
        averageRate: (this.monthlyData.reduce((sum, m) => sum + m.collectionRate, 0) / 12).toFixed(1) + '%'
      });
      
    } catch (error) {
      console.error('❌ Erreur lors du traitement des données mensuelles:', error);
      this.createEmptyMonthlyData();
    }
  }



  private createEmptyMonthlyData(): void {
    for (let i = 0; i < 12; i++) {
      this.monthlyData.push({
        month: i,
        monthName: this.getMonthName(i),
        expectedRevenue: 0,
        receivedRevenue: 0,
        totalRevenue: 0,
        collectionRate: 0,
        paymentsCount: 0,
        activeUnits: 0,
        growth: 0,
        performancePercentage: 0,
        unitDetails: []
      });
    }
  }



  private buildUnitDetails(monthIndex: number): MonthlyRevenueData['unitDetails'] {
    const unitDetails: MonthlyRevenueData['unitDetails'] = [];

    if (!this.paymentStats || this.paymentStats.length === 0) {
      return unitDetails;
    }

    this.paymentStats.forEach(paymentStat => {
      try {
        if (paymentStat.paymentState && paymentStat.paymentState.length > monthIndex) {
          const monthData = paymentStat.paymentState[monthIndex];
          
          if (monthData) {
            const unitPrice = monthData.price || 0;
            const amountReceived = monthData.unitLocationPaymentPrice || 0;
            const paymentRate = this.calculatePaymentRate(amountReceived, unitPrice);
            
            // Validation des données d'unité
            if (unitPrice >= 0 && amountReceived >= 0) {
              unitDetails.push({
                unitCode: paymentStat.room?.code || 'N/A',
                unitPrice: Math.round(unitPrice * 100) / 100,
                amountReceived: Math.round(amountReceived * 100) / 100,
                tenantName: paymentStat.locataire?.fullName,
                paymentRate: Math.round(paymentRate * 100) / 100
              });
            }
          }
        }
      } catch (error) {
        console.error('❌ Erreur lors de la construction des détails d\'unité:', error);
      }
    });

    // Trier par code d'unité et filtrer les doublons
    const uniqueUnits = unitDetails.filter((unit, index, self) => 
      index === self.findIndex(u => u.unitCode === unit.unitCode)
    );
    
    return uniqueUnits.sort((a, b) => a.unitCode.localeCompare(b.unitCode));
  }

  private getPaymentsCountForMonth(monthIndex: number): number {
    return this.paymentStats.filter(paymentStat =>
      paymentStat.paymentState &&
      paymentStat.paymentState.length > monthIndex &&
      paymentStat.paymentState[monthIndex] &&
      (paymentStat.paymentState[monthIndex].unitLocationPaymentPrice || 0) > 0
    ).length;
  }
  
  private calculatePaymentRate(received: number, expected: number): number {
    if (expected <= 0) return 0;
    if (received < 0) return 0;
    const rate = (received / expected) * 100;
    return Math.min(rate, 200);
  }

  private getActiveUnitsForMonth(monthIndex: number): number {
    return this.paymentStats.filter(paymentStat =>
      paymentStat.paymentState &&
      paymentStat.paymentState.length > monthIndex &&
      paymentStat.paymentState[monthIndex].price > 0
    ).length;
  }

  private calculateYearlyStats(): void {
    console.log('📊 Calcul des statistiques annuelles');
    
    const totalExpected = this.monthlyData.reduce((sum, month) => sum + month.expectedRevenue, 0);
    const totalReceived = this.monthlyData.reduce((sum, month) => sum + month.receivedRevenue, 0);
    
    let bestMonth = { month: 0, rate: 0 };
    let worstMonth = { month: 0, rate: 100 };

    // Analyser seulement les mois avec des données
    const monthsWithData = this.monthlyData.filter(m => m.expectedRevenue > 0);
    
    monthsWithData.forEach((month, index) => {
      if (month.collectionRate > bestMonth.rate) {
        bestMonth = { month: month.month, rate: month.collectionRate };
      }
      if (month.collectionRate < worstMonth.rate) {
        worstMonth = { month: month.month, rate: month.collectionRate };
      }
    });

    // Si aucun mois avec données, réinitialiser
    if (monthsWithData.length === 0) {
      bestMonth = { month: 0, rate: 0 };
      worstMonth = { month: 0, rate: 0 };
    }

    const averageCollectionRate = totalExpected > 0 ? 
      Math.round((totalReceived / totalExpected) * 100 * 100) / 100 : 0;

    this.yearlyStatsCalculated = {
      totalExpected: Math.round(totalExpected * 100) / 100,
      totalReceived: Math.round(totalReceived * 100) / 100,
      averageCollectionRate,
      bestMonth,
      worstMonth
    };
    
    console.log('✅ Statistiques annuelles:', {
      totalExpected: this.yearlyStatsCalculated.totalExpected.toLocaleString(),
      totalReceived: this.yearlyStatsCalculated.totalReceived.toLocaleString(),
      averageRate: `${this.yearlyStatsCalculated.averageCollectionRate.toFixed(1)}%`,
      bestMonth: this.getMonthName(this.yearlyStatsCalculated.bestMonth.month),
      worstMonth: this.getMonthName(this.yearlyStatsCalculated.worstMonth.month)
    });
  }

  // === MÉTHODES D'ACTIONS ===

  onMonthSelect(monthIndex: number): void {
    this.selectedMonth = monthIndex;
  }

  getSelectedMonthData(): MonthlyRevenueData {
    return this.monthlyData[this.selectedMonth] || this.monthlyData[0];
  }

  // === MÉTHODES D'EXPORT ===

  onExportMonthlyAnalysis(): void {
    const exportData = this.monthlyData.map(month => ({
      'Mois': month.monthName,
      'Revenus attendus': month.expectedRevenue,
      'Revenus reçus': month.receivedRevenue,
      'Taux de recouvrement': month.collectionRate,
      'Nombre d\'unités': month.unitDetails.length,
      'Écart': month.expectedRevenue - month.receivedRevenue
    }));

    this.exportData.emit({
      type: 'excel',
      data: exportData,
      filename: `analyse-revenus-mensuels-${this.selectedYear}`
    });
  }

  onExportMonthDetails(): void {
    const selectedMonth = this.getSelectedMonthData();
    const exportData = selectedMonth.unitDetails.map(unit => ({
      'Mois': selectedMonth.monthName,
      'Code unité': unit.unitCode,
      'Loyer': unit.unitPrice,
      'Montant reçu': unit.amountReceived,
      'Locataire': unit.tenantName || 'Aucun',
      'Taux de paiement': unit.paymentRate,
      'Écart': unit.unitPrice - unit.amountReceived
    }));

    this.exportData.emit({
      type: 'excel',
      data: exportData,
      filename: `details-${selectedMonth.monthName.toLowerCase()}-${this.selectedYear}`
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

  trackByMonth(_: number, month: MonthlyRevenueData): number {
    return month.month;
  }

  trackByUnitCode(_: number, unit: MonthlyRevenueData['unitDetails'][0]): string {
    return unit.unitCode;
  }

  // Méthodes pour le template améliorées
  getTotalRevenue(): number {
    return Math.round(this.monthlyData.reduce((total, month) => total + month.totalRevenue, 0) * 100) / 100;
  }

  getAverageMonthlyRevenue(): number {
    const monthsWithRevenue = this.monthlyData.filter(m => m.totalRevenue > 0);
    if (monthsWithRevenue.length === 0) return 0;
    
    const totalRevenue = this.getTotalRevenue();
    return Math.round((totalRevenue / monthsWithRevenue.length) * 100) / 100;
  }

  getBestMonth(): string {
    if (this.monthlyData.length === 0) return 'N/A';

    const monthsWithRevenue = this.monthlyData.filter(m => m.totalRevenue > 0);
    if (monthsWithRevenue.length === 0) return 'N/A';

    const bestMonth = monthsWithRevenue.reduce((best, current) =>
      current.totalRevenue > best.totalRevenue ? current : best
    );

    return bestMonth.monthName;
  }
  
  getWorstMonth(): string {
    const monthsWithRevenue = this.monthlyData.filter(m => m.totalRevenue > 0);
    if (monthsWithRevenue.length === 0) return 'N/A';

    const worstMonth = monthsWithRevenue.reduce((worst, current) =>
      current.collectionRate < worst.collectionRate ? current : worst
    );

    return worstMonth.monthName;
  }
  
  getRevenueGrowthTrend(): 'increasing' | 'decreasing' | 'stable' {
    const monthsWithRevenue = this.monthlyData.filter(m => m.totalRevenue > 0);
    if (monthsWithRevenue.length < 2) return 'stable';
    
    const firstHalf = monthsWithRevenue.slice(0, Math.floor(monthsWithRevenue.length / 2));
    const secondHalf = monthsWithRevenue.slice(Math.floor(monthsWithRevenue.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, m) => sum + m.totalRevenue, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, m) => sum + m.totalRevenue, 0) / secondHalf.length;
    
    const difference = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
    
    if (difference > 5) return 'increasing';
    if (difference < -5) return 'decreasing';
    return 'stable';
  }
  
  getMonthlyConsistencyScore(): number {
    const monthsWithRevenue = this.monthlyData.filter(m => m.totalRevenue > 0);
    if (monthsWithRevenue.length === 0) return 0;
    
    const rates = monthsWithRevenue.map(m => m.collectionRate);
    const average = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
    const variance = rates.reduce((sum, rate) => sum + Math.pow(rate - average, 2), 0) / rates.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Score de consistance (plus la déviation est faible, plus le score est élevé)
    return Math.max(0, Math.min(100, 100 - standardDeviation));
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
      'Mois': month.monthName,
      'Année': this.selectedYear,
      'Revenus totaux': month.totalRevenue,
      'Revenus attendus': month.expectedRevenue,
      'Taux de collecte': month.collectionRate,
      'Nombre de paiements': month.paymentsCount,
      'Unités actives': month.activeUnits,
      'Évolution': month.growth,
      'Performance': month.performancePercentage
    }));
  }
}
