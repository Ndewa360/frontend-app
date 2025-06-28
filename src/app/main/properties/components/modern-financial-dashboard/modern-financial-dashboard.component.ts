import { Component, OnInit, OnDestroy } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { StatisticState, StatisticAction } from 'src/app/shared/store';
import { MONTH } from 'src/app/shared/store/global/global.model';
import { StatisticPaymentOfAllPropertyByYear } from 'src/app/shared/store/statistic-data/statistic.model';

interface FinancialMetric {
  label: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: string;
  color: string;
}

interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface PropertyFinancialSummary {
  propertyId: string;
  propertyName: string;
  totalRevenue: number;
  expectedRevenue: number;
  collectionRate: number;
  monthlyData: MonthlyData[];
}

@Component({
  selector: 'app-modern-financial-dashboard',
  templateUrl: './modern-financial-dashboard.component.html',
  styleUrls: ['./modern-financial-dashboard.component.scss']
})
export class ModernFinancialDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @Select(StatisticState.selectPaymentRecapitulationStatisticLoading) 
  loading$!: Observable<boolean>;

  // Données
  currentYear = new Date().getFullYear();
  selectedYear = this.currentYear;
  selectedPeriod: 'month' | 'quarter' | 'year' = 'month';
  
  // Métriques principales
  financialMetrics: FinancialMetric[] = [
    {
      label: 'Revenus Totaux',
      value: 2450000,
      change: 12.5,
      changeType: 'increase',
      icon: 'currency--dollar',
      color: 'success'
    },
    {
      label: 'Taux de Recouvrement',
      value: 87.3,
      change: -2.1,
      changeType: 'decrease',
      icon: 'chart--pie',
      color: 'warning'
    },
    {
      label: 'Propriétés Actives',
      value: 24,
      change: 0,
      changeType: 'neutral',
      icon: 'home',
      color: 'info'
    },
    {
      label: 'Bénéfice Net',
      value: 1890000,
      change: 8.7,
      changeType: 'increase',
      icon: 'trending--up',
      color: 'primary'
    }
  ];

  // Données des propriétés
  propertiesSummary: PropertyFinancialSummary[] = [];
  
  // Données pour les graphiques
  revenueChartData: any[] = [];
  collectionRateData: any[] = [];
  
  // Options de période
  periodOptions = [
    { value: 'month', label: 'Mensuel' },
    { value: 'quarter', label: 'Trimestriel' },
    { value: 'year', label: 'Annuel' }
  ];

  // Options d'année
  yearOptions: any[] = [];

  constructor(private store: Store) {
    this.initializeYearOptions();
    this.generateMockData();
  }

  ngOnInit(): void {
    this.loadFinancialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeYearOptions(): void {
    this.yearOptions = Array.from({length: 5}, (_, i) => ({
      value: this.currentYear - i,
      label: (this.currentYear - i).toString()
    }));
  }

  private loadFinancialData(): void {
    // Charger les données depuis le store
    this.store.select(StatisticState.selectStateStatisticRecapitulationPaymentBydYear(this.selectedYear))
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: StatisticPaymentOfAllPropertyByYear[]) => {
        if (data && data.length > 0) {
          this.processFinancialData(data);
        }
      });

    // Dispatcher l'action pour charger les données
    this.store.dispatch(new StatisticAction.FetchStatisticPaymentRecapitulationAccountOfAllPropertyByYear(this.selectedYear));
  }

  private processFinancialData(data: StatisticPaymentOfAllPropertyByYear[]): void {
    // Traiter les données pour les métriques et graphiques
    this.propertiesSummary = [];

    data.forEach(yearData => {
      if (yearData.paymentProperty && yearData.paymentProperty.length > 0) {
        yearData.paymentProperty.forEach(propertyPayment => {
          const totalReceived = propertyPayment.amountProperty?.totalAmountReceived || 0;
          const totalExpected = propertyPayment.amountProperty?.totalAmountToBeReceveid || 0;

          this.propertiesSummary.push({
            propertyId: propertyPayment.property._id,
            propertyName: propertyPayment.property.name,
            totalRevenue: totalReceived,
            expectedRevenue: totalExpected,
            collectionRate: this.calculateCollectionRate(totalReceived, totalExpected),
            monthlyData: this.generateMonthlyDataFromProperty(propertyPayment)
          });
        });
      }
    });

    this.updateMetrics();
    this.updateChartData();
  }

  private calculateCollectionRate(received: number, expected: number): number {
    if (expected === 0) return 0;
    return Math.round((received / expected) * 100);
  }

  private generateMonthlyDataFromProperty(propertyPayment: any): MonthlyData[] {
    // Générer des données mensuelles à partir des données réelles
    const monthlyData: MonthlyData[] = [];

    if (propertyPayment.amountMonth && propertyPayment.amountMonth.length > 0) {
      propertyPayment.amountMonth.forEach((monthData: any) => {
        const monthNames = Object.values(MONTH);
        const monthName = monthNames[monthData.month - 1] || `Mois ${monthData.month}`;

        // Calculer les dépenses basées sur un pourcentage du revenu (plus réaliste)
        const revenue = monthData.totalAmountReceived || 0;
        const estimatedExpenses = revenue * 0.15; // 15% du revenu en dépenses estimées

        monthlyData.push({
          month: monthName,
          revenue: revenue,
          expenses: estimatedExpenses,
          profit: revenue - estimatedExpenses
        });
      });
    } else {
      // Retourner un tableau vide si pas de données réelles
      console.warn('⚠️ Aucune donnée de paiement disponible pour cette propriété');
      return [];
    }

    return monthlyData;
  }

  private updateMetrics(): void {
    if (this.propertiesSummary.length === 0) {
      // Utiliser les données simulées si pas de données réelles
      return;
    }

    const totalRevenue = this.propertiesSummary.reduce((sum, prop) => sum + prop.totalRevenue, 0);
    const totalExpected = this.propertiesSummary.reduce((sum, prop) => sum + prop.expectedRevenue, 0);
    const avgCollectionRate = this.propertiesSummary.length > 0
      ? this.propertiesSummary.reduce((sum, prop) => sum + prop.collectionRate, 0) / this.propertiesSummary.length
      : 0;

    this.financialMetrics[0].value = totalRevenue;
    this.financialMetrics[1].value = Math.round(avgCollectionRate * 10) / 10; // Arrondir à 1 décimale
    this.financialMetrics[2].value = this.propertiesSummary.length;
    this.financialMetrics[3].value = Math.round(totalRevenue * 0.77); // Estimation du bénéfice net
  }

  private updateChartData(): void {
    // Mettre à jour les données des graphiques
    this.revenueChartData = this.propertiesSummary.map(prop => ({
      name: prop.propertyName,
      value: prop.totalRevenue
    }));

    this.collectionRateData = this.propertiesSummary.map(prop => ({
      name: prop.propertyName,
      value: prop.collectionRate
    }));
  }

  private generateMockData(): void {
    // ⚠️ MÉTHODE DÉPRÉCIÉE - Ne plus utiliser de données simulées
    console.warn('⚠️ generateMockData() est déprécié. Utilisez les vraies données du store.');
    this.propertiesSummary = [];
  }

  private generateMockMonthlyData(): MonthlyData[] {
    return Object.values(MONTH).map((month, index) => {
      const revenue = Math.random() * 150000 + 50000;
      const expenses = Math.random() * 30000 + 10000;
      return {
        month,
        revenue,
        expenses,
        profit: revenue - expenses
      };
    });
  }

  // Méthodes d'événements
  onYearChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedYear = +target.value;
    this.loadFinancialData();
  }

  onPeriodChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedPeriod = target.value as 'month' | 'quarter' | 'year';
    this.updateChartData();
  }

  onPropertyClick(property: PropertyFinancialSummary): void {
    // Navigation vers les détails de la propriété
    console.log('Voir détails de la propriété:', property.propertyName);
  }

  exportData(): void {
    // Exporter les données
    console.log('Export des données financières');
  }

  getMetricIcon(metric: FinancialMetric): string {
    return metric.icon;
  }

  getMetricColorClass(metric: FinancialMetric): string {
    const colorMap: { [key: string]: string } = {
      'success': 'text-carbon-green-70 bg-carbon-green-10',
      'warning': 'text-carbon-yellow-70 bg-carbon-yellow-10',
      'info': 'text-carbon-blue-70 bg-carbon-blue-10',
      'primary': 'text-carbon-primary-70 bg-carbon-primary-10'
    };
    return colorMap[metric.color] || 'text-carbon-gray-70 bg-carbon-gray-10';
  }

  getChangeIcon(changeType: string): string {
    switch (changeType) {
      case 'increase': return 'trending--up';
      case 'decrease': return 'trending--down';
      default: return 'trending--flat';
    }
  }

  getChangeColorClass(changeType: string): string {
    switch (changeType) {
      case 'increase': return 'text-carbon-green-70';
      case 'decrease': return 'text-carbon-red-70';
      default: return 'text-carbon-gray-70';
    }
  }

  getProgressWidth(value: number): number {
    if (!this.revenueChartData || this.revenueChartData.length === 0) {
      return 0;
    }

    const maxValue = Math.max(...this.revenueChartData.map(item => item.value));
    if (maxValue === 0) {
      return 0;
    }

    return Math.round((value / maxValue) * 100);
  }
}
