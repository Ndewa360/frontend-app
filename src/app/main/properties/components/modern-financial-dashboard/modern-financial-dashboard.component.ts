import { Component, OnInit, OnDestroy } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { StatisticState, StatisticAction } from 'src/app/shared/store';
import { MONTH } from 'src/app/shared/store/global/global.model';
import { StatisticPaymentOfAllPropertyByYear } from 'src/app/shared/store/statistic-data/statistic.model';
import { PerformanceAlertsService } from 'src/app/main/statistics/services/performance-alerts.service';

interface FinancialMetric {
  label: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: string;
  color: string;
  isMoney:boolean
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
  financialMetrics: FinancialMetric[] = [];

  // Données des propriétés
  propertiesSummary: PropertyFinancialSummary[] = [];
  
  // Données pour les graphiques
  revenueChartData: any[] = [];
  collectionRateData: any[] = [];
  
  // Options de période
  periodOptions = [
    { value: 'month', label: 'FINANCIAL_DASHBOARD.MONTHLY' },
    { value: 'quarter', label: 'FINANCIAL_DASHBOARD.QUARTERLY' },
    { value: 'year', label: 'FINANCIAL_DASHBOARD.YEARLY' }
  ];

  // Options d'année
  yearOptions: any[] = [];

  constructor(
    private store: Store,
    private translate: TranslateService,
    private performanceAlertsService: PerformanceAlertsService
  ) {
    this.initializeYearOptions();
    this.initializeFinancialMetrics();
  }

  ngOnInit(): void {
    this.loadFinancialData();
    this.updatePeriodOptions();
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

  private initializeFinancialMetrics(): void {
    this.financialMetrics = [
      {
        label: 'FINANCIAL_DASHBOARD.TOTAL_REVENUE',
        value: 0,
        change: 0,
        changeType: 'neutral',
        icon: 'money',
        color: 'success',
        isMoney: true
      },
      {
        label: 'FINANCIAL_DASHBOARD.COLLECTION_RATE',
        value: 0,
        change: 0,
        changeType: 'neutral',
        icon: 'percentage',
        color: 'info',
        isMoney: false
      },
      {
        label: 'FINANCIAL_DASHBOARD.ACTIVE_PROPERTIES',
        value: 0,
        change: 0,
        changeType: 'neutral',
        icon: 'home',
        color: 'primary',
        isMoney: false
      },
      {
        label: 'FINANCIAL_DASHBOARD.TOTAL_DEFICIT',
        value: 0,
        change: 0,
        changeType: 'neutral',
        icon: 'trending-down',
        color: 'warning',
        isMoney: true
      }
    ];
  }

  private updatePeriodOptions(): void {
    this.periodOptions = [
      { value: 'month', label: 'FINANCIAL_DASHBOARD.MONTHLY' },
      { value: 'quarter', label: 'FINANCIAL_DASHBOARD.QUARTERLY' },
      { value: 'year', label: 'FINANCIAL_DASHBOARD.YEARLY' }
    ];
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
    this.propertiesSummary = [];

    data.forEach(yearData => {
      if (yearData.paymentProperty && yearData.paymentProperty.length > 0) {
        yearData.paymentProperty.forEach(propertyPayment => {
          // ✅ Utiliser detailedMetrics du backend si disponible
          const metrics = propertyPayment.detailedMetrics;
          const totalReceived = metrics?.totalRevenue ?? (propertyPayment.amountProperty?.totalAmountReceived || 0);
          const totalExpected = metrics?.totalExpected ?? (propertyPayment.amountProperty?.totalAmountToBeReceveid || 0);
          const collectionRate = metrics?.collectionRate ?? this.calculateCollectionRate(totalReceived, totalExpected);

          this.propertiesSummary.push({
            propertyId: propertyPayment.property._id,
            propertyName: propertyPayment.property.name,
            totalRevenue: totalReceived,
            expectedRevenue: totalExpected,
            collectionRate,
            monthlyData: this.generateMonthlyDataFromProperty(propertyPayment)
          });
        });

        // ✅ Alimenter les alertes depuis les données backend
        this.performanceAlertsService.loadAlertsFromRecapitulation(yearData);
      }
    });

    this.updateMetrics(data);
    this.updateChartData();
  }

  private calculateCollectionRate(received: number, expected: number): number {
    if (expected === 0) return 0;
    return Math.round((received / expected) * 100);
  }

  private generateMonthlyDataFromProperty(propertyPayment: any): MonthlyData[] {
    if (!propertyPayment.amountMonth || propertyPayment.amountMonth.length === 0) return [];

    const monthNames = Object.values(MONTH);
    return propertyPayment.amountMonth.map((monthData: any) => {
      const monthName = monthNames[monthData.month - 1] || `Mois ${monthData.month}`;
      const revenue = monthData.totalAmountReceived || 0;
      // ✅ Pas de charges fictives : profit = revenus reçus (pas de dépenses inventées)
      return {
        month: monthName,
        revenue,
        expenses: 0,
        profit: revenue
      };
    });
  }

  private updateMetrics(data?: StatisticPaymentOfAllPropertyByYear[]): void {
    if (!this.financialMetrics || this.financialMetrics.length < 4) return;

    // ✅ Utiliser globalMetrics du backend si disponible
    const globalMetrics = data?.[0]?.globalMetrics;
    const paymentYear = data?.[0]?.paymentYear;

    const totalRevenue = globalMetrics?.netCashFlow !== undefined
      ? (paymentYear?.totalAmountReceived || 0)
      : this.propertiesSummary.reduce((sum, prop) => sum + prop.totalRevenue, 0);

    const avgCollectionRate = globalMetrics?.averageCollectionRate
      ?? (this.propertiesSummary.length > 0
        ? this.propertiesSummary.reduce((sum, prop) => sum + prop.collectionRate, 0) / this.propertiesSummary.length
        : 0);

    const totalDeficit = paymentYear?.totalAmountRelicat
      ?? Math.max(0, this.propertiesSummary.reduce((sum, p) => sum + p.expectedRevenue, 0) - totalRevenue);

    if (this.financialMetrics[0]) this.financialMetrics[0].value = totalRevenue;
    if (this.financialMetrics[1]) this.financialMetrics[1].value = Math.round(avgCollectionRate * 10) / 10;
    if (this.financialMetrics[2]) this.financialMetrics[2].value = globalMetrics?.totalProperties ?? this.propertiesSummary.length;
    if (this.financialMetrics[3]) this.financialMetrics[3].value = totalDeficit;
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
