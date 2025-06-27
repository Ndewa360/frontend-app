import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import {
  StatisticAllPaymentLocataireYearModel,
  StatisticPaymentOfAllPropertyByYear
} from 'src/app/shared/store';
import { ExportData } from '../../property-finances.component';

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
  @Input() isLoading: boolean = false;

  @Output() exportData = new EventEmitter<ExportData>();

  monthlyData: MonthlyRevenueData[] = [];
  selectedMonth: number = new Date().getMonth();

  // Statistiques globales
  yearlyStats = {
    totalExpected: 0,
    totalReceived: 0,
    averageCollectionRate: 0,
    bestMonth: { month: 0, rate: 0 },
    worstMonth: { month: 0, rate: 0 }
  };

  ngOnInit(): void {
    this.processMonthlyData();
  }

  ngOnChanges(): void {
    this.processMonthlyData();
  }

  private processMonthlyData(): void {
    this.monthlyData = [];

    // Utiliser les données de récapitulation si disponibles avec vérifications de sécurité
    if (this.recapitulation?.paymentProperty && Array.isArray(this.recapitulation.paymentProperty)) {
      // Construire les données mensuelles à partir de la structure réelle
      const monthlyAggregated: { [key: number]: { expected: number, received: number, count: number } } = {};

      // Initialiser les 12 mois
      for (let i = 0; i < 12; i++) {
        monthlyAggregated[i] = { expected: 0, received: 0, count: 0 };
      }

      // Agréger les données de toutes les propriétés avec vérifications de sécurité
      this.recapitulation.paymentProperty.forEach(propertyData => {
        if (propertyData?.amountMonth && Array.isArray(propertyData.amountMonth)) {
          propertyData.amountMonth.forEach(monthData => {
            if (monthData && typeof monthData.month === 'number') {
              const monthIndex = (monthData.month - 1) % 12; // Convertir 1-12 en 0-11
              if (monthIndex >= 0 && monthIndex < 12) {
                monthlyAggregated[monthIndex].expected += monthData.totalAmountToBeReceveid || 0;
                monthlyAggregated[monthIndex].received += monthData.totalAmountReceived || 0;
                monthlyAggregated[monthIndex].count += 1;
              }
            }
          });
        }
      });

      // Convertir en format attendu avec calcul de croissance
      let previousRevenue = 0;
      this.monthlyData = Object.keys(monthlyAggregated).map(monthKey => {
        const monthIndex = parseInt(monthKey);
        const data = monthlyAggregated[monthIndex];
        const collectionRate = this.calculateCollectionRate(data.received, data.expected);
        const growth = previousRevenue > 0 ? ((data.received - previousRevenue) / previousRevenue) * 100 : 0;
        previousRevenue = data.received;

        return {
          month: monthIndex,
          monthName: this.getMonthName(monthIndex),
          expectedRevenue: data.expected,
          receivedRevenue: data.received,
          totalRevenue: data.received,
          collectionRate,
          paymentsCount: data.count,
          activeUnits: this.getActiveUnitsForMonth(monthIndex),
          growth: Math.round(growth * 100) / 100,
          performancePercentage: Math.round(collectionRate),
          unitDetails: this.buildUnitDetails(monthIndex)
        };
      });
    } else {
      // Créer des données vides pour les 12 mois
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

    this.calculateYearlyStats();
  }

  private buildUnitDetails(monthIndex: number): MonthlyRevenueData['unitDetails'] {
    const unitDetails: MonthlyRevenueData['unitDetails'] = [];

    this.paymentStats.forEach(paymentStat => {
      if (paymentStat.paymentState && paymentStat.paymentState.length > monthIndex) {
        const monthData = paymentStat.paymentState[monthIndex];

        unitDetails.push({
          unitCode: paymentStat.room?.code || 'N/A',
          unitPrice: monthData.price || 0,
          amountReceived: monthData.unitLocationPaymentPrice || 0,
          tenantName: paymentStat.locataire?.fullName,
          paymentRate: this.calculateCollectionRate(
            monthData.unitLocationPaymentPrice || 0,
            monthData.price || 0
          )
        });
      }
    });

    return unitDetails.sort((a, b) => a.unitCode.localeCompare(b.unitCode));
  }

  private calculateCollectionRate(received: number, expected: number): number {
    return expected > 0 ? (received / expected) * 100 : 0;
  }

  private getActiveUnitsForMonth(monthIndex: number): number {
    return this.paymentStats.filter(paymentStat =>
      paymentStat.paymentState &&
      paymentStat.paymentState.length > monthIndex &&
      paymentStat.paymentState[monthIndex].price > 0
    ).length;
  }

  private calculateYearlyStats(): void {
    const totalExpected = this.monthlyData.reduce((sum, month) => sum + month.expectedRevenue, 0);
    const totalReceived = this.monthlyData.reduce((sum, month) => sum + month.receivedRevenue, 0);
    
    let bestMonth = { month: 0, rate: 0 };
    let worstMonth = { month: 0, rate: 100 };

    this.monthlyData.forEach((month, index) => {
      if (month.collectionRate > bestMonth.rate) {
        bestMonth = { month: index, rate: month.collectionRate };
      }
      if (month.collectionRate < worstMonth.rate && month.expectedRevenue > 0) {
        worstMonth = { month: index, rate: month.collectionRate };
      }
    });

    this.yearlyStats = {
      totalExpected,
      totalReceived,
      averageCollectionRate: totalExpected > 0 ? (totalReceived / totalExpected) * 100 : 0,
      bestMonth,
      worstMonth
    };
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

  // Méthodes pour le template
  getTotalRevenue(): number {
    return this.monthlyData.reduce((total, month) => total + month.totalRevenue, 0);
  }

  getAverageMonthlyRevenue(): number {
    const totalRevenue = this.getTotalRevenue();
    return this.monthlyData.length > 0 ? totalRevenue / this.monthlyData.length : 0;
  }

  getBestMonth(): string {
    if (this.monthlyData.length === 0) return 'N/A';

    const bestMonth = this.monthlyData.reduce((best, current) =>
      current.totalRevenue > best.totalRevenue ? current : best
    );

    return bestMonth.monthName;
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
