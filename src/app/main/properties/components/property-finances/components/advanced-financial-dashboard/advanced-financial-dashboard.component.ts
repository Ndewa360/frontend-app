import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { Store } from '@ngxs/store';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ExportData } from '../../property-finances.component';
import { PropertyFinancialManagerService, PropertyFinancialMetrics, MonthlyFinancialData } from 'src/app/main/properties/services/property-financial-manager.service';

interface FinancialMetric {
  label: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: string;
  color: string;
  description: string;
}

interface ChartData {
  revenueChart: any;
  paymentStatusChart: any;
  monthlyTrendChart: any;
  propertyPerformanceChart: any;
  tenantAnalysisChart: any;
}

@Component({
  selector: 'app-advanced-financial-dashboard',
  templateUrl: './advanced-financial-dashboard.component.html',
  styleUrls: ['./advanced-financial-dashboard.component.scss']
})
export class AdvancedFinancialDashboardComponent implements OnInit, OnChanges, OnDestroy {
  @Input() selectedYear: number = new Date().getFullYear();
  @Input() propertyId: string = '';
  @Input() isLoading: boolean = false;

  @Output() exportData = new EventEmitter<ExportData>();

  financialMetrics: FinancialMetric[] = [];
  propertyMetrics: PropertyFinancialMetrics | null = null;
  monthlyData: MonthlyFinancialData[] = [];
  tenantPerformances: any[] = [];
  private destroy$ = new Subject<void>();
  
  // Données des graphiques
  chartData: ChartData = {
    revenueChart: null,
    paymentStatusChart: null,
    monthlyTrendChart: null,
    propertyPerformanceChart: null,
    tenantAnalysisChart: null
  };

  // Données calculées — état réel
  totalRevenue: number = 0;
  totalExpected: number = 0;
  collectionRate: number = 0;
  totalPaidAllTime: number = 0;
  expectedSinceEntry: number = 0;
  realCollectionRate: number = 0;
  totalDebts: number = 0;
  totalAdvances: number = 0;
  averageRent: number = 0;
  occupancyRate: number = 0;
  occupiedRooms: number = 0;
  totalRooms: number = 0;
  totalProperties: number = 0;
  // Nouvelles métriques de projection
  coveredMonthsInYear: number = 0;
  monthsDueInYear: number = 0;
  coveredAmountInYear: number = 0;
  // Statuts des locataires
  totalTenantsCount: number = 0;
  lateTenantsCount: number = 0;
  upToDateTenantsCount: number = 0;
  advanceTenantsCount: number = 0;

  // Changements calculés
  revenueChange: { value: number, type: 'increase' | 'decrease' | 'neutral' } = { value: 0, type: 'neutral' };
  collectionRateChange: { value: number, type: 'increase' | 'decrease' | 'neutral' } = { value: 0, type: 'neutral' };
  occupancyRateChange: { value: number, type: 'increase' | 'decrease' | 'neutral' } = { value: 0, type: 'neutral' };
  averageRentChange: { value: number, type: 'increase' | 'decrease' | 'neutral' } = { value: 0, type: 'neutral' };

  // Couleurs du thème
  primaryColor = 'rgb(204, 140, 10)';
  secondaryColor = 'rgba(204, 140, 10, 0.2)';
  successColor = '#10b981';
  warningColor = '#f59e0b';
  dangerColor = '#ef4444';
  infoColor = '#3b82f6';

  // Exposer Math pour le template
  Math = Math;

  constructor(
    private store: Store,
    private financialManager: PropertyFinancialManagerService
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
      this.resetMetrics();
      return;
    }

    this.financialManager.loadPropertyFinancialData(this.propertyId, this.selectedYear)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (backendData) => {
          if (backendData && backendData.length > 0) {
            this.propertyMetrics = this.financialManager.extractPropertyMetrics(backendData[0]);
            this.monthlyData = this.financialManager.extractMonthlyData(backendData[0]);
            this.tenantPerformances = this.financialManager.extractTenantPerformances(backendData[0]);
            this.processFinancialData();
          } else {
            this.resetMetrics();
          }
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des données financières:', error);
          this.resetMetrics();
        }
      });
  }

  private processFinancialData(): void {
    if (!this.propertyMetrics) {
      this.resetMetrics();
      return;
    }

    this.calculateMetrics();
    this.buildCharts();
  }

  private calculateMetrics(): void {
    if (!this.propertyMetrics) { this.resetMetrics(); return; }

    this.totalRevenue        = this.propertyMetrics.totalRevenue;
    this.totalExpected       = this.propertyMetrics.totalExpected;
    this.collectionRate      = this.propertyMetrics.collectionRate;
    // totalCoveredInYear = montant couvert dans l'année par la projection du cumul
    this.totalPaidAllTime    = this.propertyMetrics.totalCoveredInYear;
    this.expectedSinceEntry  = this.propertyMetrics.expectedSinceEntry;
    // realCollectionRate = taux encaissements réels / attendu (depuis aggregatedMetrics)
    this.realCollectionRate  = Math.min(this.propertyMetrics.realCollectionRate, 100);
    this.totalDebts          = this.propertyMetrics.totalDebts;
    this.totalAdvances       = this.propertyMetrics.totalAdvances;
    this.averageRent         = this.propertyMetrics.averageRent;
    this.occupancyRate       = this.propertyMetrics.occupancyRate;
    this.occupiedRooms       = this.propertyMetrics.occupiedRooms;
    this.totalRooms          = this.propertyMetrics.totalRooms;
    this.totalProperties     = 1;

    // Métriques de projection : ratio global pondéré par les montants
    const totalCoveredAmt  = this.propertyMetrics.totalCoveredInYear;
    const totalExpectedAmt = this.propertyMetrics.totalExpected;

    // Mois couverts équivalents = (couvert / attendu) * mois dus
    this.coveredMonthsInYear = totalExpectedAmt > 0
      ? Math.round((totalCoveredAmt / totalExpectedAmt) * this.propertyMetrics.monthsDueInYear * 10) / 10
      : 0;
    this.monthsDueInYear     = this.propertyMetrics.monthsDueInYear ?? this.propertyMetrics.totalRooms * 12;
    this.coveredAmountInYear = totalCoveredAmt;

    // Statuts des locataires depuis tenantPerformances (paymentStatus = statut interne du moteur)
    this.totalTenantsCount   = this.tenantPerformances.length;
    this.lateTenantsCount    = this.tenantPerformances.filter(t =>
      t.paymentStatus === 'late' || t.paymentStatus === 'critical' || t.paymentStatus === 'no_payment'
    ).length;
    this.upToDateTenantsCount = this.tenantPerformances.filter(t => t.paymentStatus === 'up_to_date').length;
    this.advanceTenantsCount  = this.tenantPerformances.filter(t => t.paymentStatus === 'advance').length;

    this.revenueChange        = this.calculateRevenueChange();
    this.collectionRateChange = this.calculateCollectionRateChange();
    this.occupancyRateChange  = this.calculateOccupancyRateChange();
    this.averageRentChange    = this.calculateAverageRentChange();
    this.buildFinancialMetrics();
  }

  private buildFinancialMetrics(): void {
    const revenueChange       = this.calculateRevenueChange();
    const collectionRateChange = this.calculateCollectionRateChange();
    const occupancyRateChange  = this.calculateOccupancyRateChange();
    const averageRentChange    = this.calculateAverageRentChange();

    this.financialMetrics = [
      {
        label: 'Couvert en ' + this.selectedYear,
        value: this.totalPaidAllTime,
        change: revenueChange.value,
        changeType: revenueChange.type,
        icon: 'currency--dollar',
        color: this.successColor,
        description: 'Mois de ' + this.selectedYear + ' couverts par le cumul des paiements'
      },
      {
        label: 'Taux de couverture ' + this.selectedYear,
        value: this.realCollectionRate,
        change: collectionRateChange.value,
        changeType: collectionRateChange.type,
        icon: 'chart--pie',
        color: this.primaryColor,
        description: 'Mois couverts / mois dus dans l\'année'
      },
      {
        label: 'ADVANCED_FINANCIAL_DASHBOARD.METRICS.OCCUPANCY_RATE',
        value: this.occupancyRate,
        change: occupancyRateChange.value,
        changeType: occupancyRateChange.type,
        icon: 'home',
        color: this.infoColor,
        description: 'Pourcentage d\'unités occupées'
      },
      {
        label: 'ADVANCED_FINANCIAL_DASHBOARD.METRICS.AVERAGE_RENT',
        value: this.averageRent,
        change: averageRentChange.value,
        changeType: averageRentChange.type,
        icon: 'money',
        color: this.warningColor,
        description: 'Loyer moyen par unité'
      }
    ];
  }

  private buildCharts(): void {
    this.chartData.revenueChart = this.buildRevenueChart();
    this.chartData.paymentStatusChart = this.buildPaymentStatusChart();
    this.chartData.monthlyTrendChart = this.buildMonthlyTrendChart();
    this.chartData.propertyPerformanceChart = this.buildPropertyPerformanceChart();
    this.chartData.tenantAnalysisChart = this.buildTenantAnalysisChart();
  }

  private buildRevenueChart(): any {
    const monthlyData = this.getMonthlyRevenueData();

    return {
      title: {
        text: `Évolution des Revenus ${this.selectedYear}`,
        textStyle: {
          color: 'rgb(204, 140, 10)',
          fontSize: 18,
          fontWeight: '600'
        },
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: this.primaryColor,
        borderWidth: 1,
        textStyle: {
          color: '#374151'
        },
        formatter: (params: any) => {
          const data = params[0];
          return `<div style="padding: 8px;">
                    <div style="font-weight: 600; margin-bottom: 4px;">${data.name}</div>
                    <div style="color: ${this.primaryColor};">
                      <span style="display: inline-block; width: 10px; height: 10px; background: ${this.primaryColor}; border-radius: 50%; margin-right: 8px;"></span>
                      Revenus: ${this.formatCurrency(data.value)}
                    </div>
                  </div>`;
        }
      },
      xAxis: {
        type: 'category',
        data: monthlyData.months,
        axisLabel: {
          color: '#6b7280',
          fontSize: 12
        },
        axisLine: {
          lineStyle: {
            color: '#e5e7eb'
          }
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: '#6b7280',
          fontSize: 12,
          formatter: (value: number) => this.formatCurrency(value)
        },
        splitLine: {
          lineStyle: {
            color: '#f3f4f6',
            type: 'dashed'
          }
        }
      },
      series: [{
        name: 'Revenus',
        type: 'line',
        data: monthlyData.revenues,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          color: this.primaryColor,
          width: 4,
          shadowColor: this.primaryColor,
          shadowBlur: 10,
          shadowOffsetY: 3
        },
        itemStyle: {
          color: this.primaryColor,
          borderColor: '#fff',
          borderWidth: 2
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(204, 140, 10, 0.4)' },
              { offset: 1, color: 'rgba(204, 140, 10, 0.1)' }
            ]
          }
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 20,
            shadowColor: this.primaryColor
          }
        }
      }],
      grid: {
        left: '5%',
        right: '5%',
        bottom: '10%',
        top: '15%',
        containLabel: true
      },
      animation: true,
      animationDuration: 1000,
      animationEasing: 'cubicOut'
    };
  }

  private buildPaymentStatusChart(): any {
    const statusData = this.getPaymentStatusData();

    return {
      title: {
        text: 'Répartition des Statuts de Paiement',
        textStyle: {
          color: '#374151',
          fontSize: 18,
          fontWeight: '600'
        },
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderWidth: 1,
        textStyle: {
          color: '#374151'
        },
        formatter: (params: any) => {
          return `<div style="padding: 8px;">
                    <div style="font-weight: 600; margin-bottom: 4px;">${params.name}</div>
                    <div style="color: ${params.color};">
                      <span style="display: inline-block; width: 10px; height: 10px; background: ${params.color}; border-radius: 50%; margin-right: 8px;"></span>
                      ${params.value} paiements (${params.percent}%)
                    </div>
                  </div>`;
        }
      },
      legend: {
        orient: 'vertical',
        left: '5%',
        top: 'middle',
        textStyle: {
          color: '#6b7280',
          fontSize: 12
        },
        itemGap: 15,
        formatter: (name: string) => {
          const item = statusData.find((d: any) => d.name === name);
          return `${name} (${item ? item.value : 0})`;
        }
      },
      series: [{
        name: 'Statuts',
        type: 'pie',
        radius: ['45%', '75%'],
        center: ['65%', '50%'],
        data: statusData,
        label: {
          show: true,
          position: 'outside',
          formatter: '{d}%',
          fontSize: 12,
          fontWeight: '600'
        },
        labelLine: {
          show: true,
          length: 15,
          length2: 10
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 15,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          },
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        animationType: 'scale',
        animationEasing: 'elasticOut',
        animationDelay: (idx: number) => idx * 100
      }]
    };
  }

  private buildMonthlyTrendChart(): any {
    const trendData = this.getMonthlyTrendData();
    return {
      title: { text: `Couvert vs Attendu — ${this.selectedYear}`, textStyle: { color: '#374151', fontSize: 15, fontWeight: 'bold' } },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any[]) => {
          let html = `<strong>${params[0].name}</strong><br/>`;
          params.forEach(p => {
            html += `<span style="color:${p.color}">●</span> ${p.seriesName} : <strong>${(p.value||0).toLocaleString('fr-FR')} FCFA</strong><br/>`;
          });
          return html;
        }
      },
      legend: { data: ['Attendu', 'Couvert (projection)', 'Encaissé'], textStyle: { color: '#6b7280' } },
      xAxis: { type: 'category', data: trendData.months, axisLabel: { color: '#6b7280' } },
      yAxis: { type: 'value', axisLabel: { color: '#6b7280', formatter: (v: number) => this.formatCurrency(v) } },
      series: [
        { name: 'Attendu',              type: 'bar', data: trendData.expected,  itemStyle: { color: '#e5e7eb' } },
        { name: 'Couvert (projection)', type: 'bar', data: trendData.projected, itemStyle: { color: this.successColor } },
        { name: 'Encaissé',            type: 'line', data: trendData.received, lineStyle: { color: this.primaryColor, width: 2, type: 'dashed' }, itemStyle: { color: this.primaryColor } }
      ],
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true }
    };
  }

  private buildPropertyPerformanceChart(): any {
    // Graphique de performance par propriété basé sur les données des locataires
    if (!this.propertyMetrics || !this.propertyMetrics.roomDetails || this.propertyMetrics.roomDetails.length === 0) {
      return {
        title: {
          text: 'Performance par Unité',
          textStyle: {
            color: '#374151',
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        xAxis: { type: 'category', data: [] },
        yAxis: { type: 'value' },
        series: [{ name: 'Taux de Collection', type: 'bar', data: [] }]
      };
    }

    const roomData = this.propertyMetrics.roomDetails.slice(0, 10);
    
    return {
      title: {
        text: 'Performance par Unité',
        textStyle: {
          color: '#374151',
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: roomData.map(room => room.roomCode || 'N/A'),
        axisLabel: {
          color: '#6b7280',
          rotate: 45
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: '#6b7280',
          formatter: '{value}%'
        }
      },
      series: [{
        name: 'Taux de Collection',
        type: 'bar',
        data: roomData.map(room => room.collectionRate || 0),
        itemStyle: {
          color: this.primaryColor
        }
      }],
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true
      }
    };
  }

  private buildTenantAnalysisChart(): any {
    const tenantData = this.getTenantAnalysisData();
    
    return {
      title: {
        text: 'Analyse des Locataires',
        textStyle: {
          color: '#374151',
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'item'
      },
      series: [{
        name: 'Locataires',
        type: 'pie',
        radius: '70%',
        data: tenantData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };
  }

  // Méthodes utilitaires pour les données avec validation
  private getMonthlyRevenueData(): { months: string[], revenues: number[] } {
    if (!this.monthlyData || this.monthlyData.length === 0) {
      return { months: [], revenues: [] };
    }

    const chartData = this.financialManager.generateRevenueChartData(this.monthlyData);
    return {
      months: chartData.months,
      revenues: chartData.revenues
    };
  }

  private getPaymentStatusData(): any[] {
    if (!this.propertyMetrics) {
      return [];
    }

    const statusData = this.financialManager.generatePaymentStatusData(this.propertyMetrics.roomDetails);
    return statusData.map(item => ({
      value: item.value,
      name: item.name,
      itemStyle: { 
        color: item.color,
        borderColor: '#fff',
        borderWidth: 2
      }
    }));
  }

  private getMonthlyTrendData(): { months: string[], expected: number[], received: number[], projected: number[] } {
    if (!this.monthlyData || this.monthlyData.length === 0) {
      return { months: [], expected: [], received: [], projected: [] };
    }
    const chartData = this.financialManager.generateRevenueChartData(this.monthlyData);
    return {
      months:    chartData.months,
      expected:  chartData.expected,
      // received = encaissements réels (item.realReceived via extractMonthlyData)
      received:  chartData.revenues,
      // projected = projection cumul (item.distributed via extractMonthlyData)
      projected: this.monthlyData.map(m => m.projected ?? 0)
    };
  }

  private getTenantAnalysisData(): any[] {
    if (!this.tenantPerformances || this.tenantPerformances.length === 0) {
      return [];
    }

    const activeTenantsCount = this.tenantPerformances.filter(tenant => tenant.paymentRate > 50).length;
    const inactiveTenantsCount = this.tenantPerformances.length - activeTenantsCount;

    return [
      { value: activeTenantsCount, name: 'Locataires Actifs', itemStyle: { color: this.successColor } },
      { value: inactiveTenantsCount, name: 'Locataires Inactifs', itemStyle: { color: this.dangerColor } }
    ];
  }



  private resetMetrics(): void {
    this.totalRevenue = 0; this.totalExpected = 0; this.collectionRate = 0;
    this.totalPaidAllTime = 0; this.expectedSinceEntry = 0; this.realCollectionRate = 0;
    this.totalDebts = 0; this.totalAdvances = 0;
    this.averageRent = 0; this.occupancyRate = 0; this.totalProperties = 0;
    this.coveredMonthsInYear = 0; this.monthsDueInYear = 0; this.coveredAmountInYear = 0;
    this.totalTenantsCount = 0; this.lateTenantsCount = 0;
    this.upToDateTenantsCount = 0; this.advanceTenantsCount = 0;
    this.financialMetrics = [];
  }

  private calculateRevenueChange(): { value: number, type: 'increase' | 'decrease' | 'neutral' } {
    // Différence entre revenus reçus et attendus
    const expectedVsReceived = this.totalExpected > 0
      ? ((this.totalRevenue - this.totalExpected) / this.totalExpected) * 100
      : 0;
    return {
      value: Math.abs(Math.round(expectedVsReceived * 10) / 10),
      type: expectedVsReceived > 0 ? 'increase' : expectedVsReceived < 0 ? 'decrease' : 'neutral'
    };
  }

  private calculateCollectionRateChange(): { value: number, type: 'increase' | 'decrease' | 'neutral' } {
    // Différence par rapport au taux de recouvrement attendu (100%)
    const difference = this.collectionRate - 100;
    return {
      value: Math.abs(Math.round(difference * 10) / 10),
      type: this.collectionRate >= 100 ? 'increase' : 'decrease'
    };
  }

  private calculateOccupancyRateChange(): { value: number, type: 'increase' | 'decrease' | 'neutral' } {
    // Différence par rapport au taux d'occupation attendu (100%)
    const difference = this.occupancyRate - 100;
    return {
      value: Math.abs(Math.round(difference * 10) / 10),
      type: this.occupancyRate >= 100 ? 'increase' : 'decrease'
    };
  }

  private calculateAverageRentChange(): { value: number, type: 'increase' | 'decrease' | 'neutral' } {
    if (!this.propertyMetrics || this.propertyMetrics.roomDetails.length === 0) {
      return { value: 0, type: 'neutral' };
    }
    const rents = this.propertyMetrics.roomDetails.map(room => room.monthlyRent).filter(price => price > 0);
    if (rents.length === 0) return { value: 0, type: 'neutral' };

    rents.sort((a, b) => a - b);
    const median = rents.length % 2 === 0
      ? (rents[rents.length / 2 - 1] + rents[rents.length / 2]) / 2
      : rents[Math.floor(rents.length / 2)];

    const difference = median > 0 ? ((this.averageRent - median) / median) * 100 : 0;
    return {
      value: Math.abs(Math.round(difference * 10) / 10),
      type: difference > 0 ? 'increase' : difference < 0 ? 'decrease' : 'neutral'
    };
  }

  // Méthodes utilitaires
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(value);
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  // Méthodes d'export
  exportToExcel(): void {
    const data = this.prepareExportData();
    this.exportData.emit({
      type: 'excel',
      data: data,
      filename: `analyse-financiere-avancee-${this.selectedYear}.xlsx`
    });
  }

  exportToCSV(): void {
    const data = this.prepareExportData();
    this.exportData.emit({
      type: 'csv',
      data: data,
      filename: `analyse-financiere-avancee-${this.selectedYear}.csv`
    });
  }

  private prepareExportData(): any[] {
    return this.financialMetrics.map(metric => ({
      'Métrique': metric.label,
      'Valeur': metric.value,
      'Changement': `${metric.change}%`,
      'Description': metric.description
    }));
  }
}
