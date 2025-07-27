import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import {
  StatisticRoomYearModel,
  StatisticLocataireYearModel,
  StatisticAllPaymentLocataireYearModel,
  StatisticPaymentOfAllPropertyByYear,
  StatisticPaymentStateType,
  LocationModel,
  LocationState
} from 'src/app/shared/store';
import { Store } from '@ngxs/store';
import { ExportData } from '../../property-finances.component';
import { TenantPaymentCalculatorService } from 'src/app/shared/services/tenant-payment-calculator.service';

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
export class AdvancedFinancialDashboardComponent implements OnInit, OnChanges {
  @Input() yearlyStats: StatisticRoomYearModel[] = [];
  @Input() tenantStats: StatisticLocataireYearModel[] = [];
  @Input() paymentStats: StatisticAllPaymentLocataireYearModel[] = [];
  @Input() recapitulation: StatisticPaymentOfAllPropertyByYear | null = null;
  @Input() selectedYear: number = new Date().getFullYear();
  @Input() propertyId: string = ''; // Ajout pour récupérer les locations
  @Input() isLoading: boolean = false;

  @Output() exportData = new EventEmitter<ExportData>();

  // Données des locations
  locations: LocationModel[] = [];

  // Métriques principales
  financialMetrics: FinancialMetric[] = [];
  
  // Données des graphiques
  chartData: ChartData = {
    revenueChart: null,
    paymentStatusChart: null,
    monthlyTrendChart: null,
    propertyPerformanceChart: null,
    tenantAnalysisChart: null
  };

  // Données calculées
  totalRevenue: number = 0;
  totalExpected: number = 0;
  collectionRate: number = 0;
  averageRent: number = 0;
  occupancyRate: number = 0;
  totalProperties: number = 0;

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
    private tenantPaymentCalculator: TenantPaymentCalculatorService
  ) { }

  ngOnInit(): void {
    this.loadLocations();
  }

  ngOnChanges(): void {
    console.log('🔄 AdvancedFinancialDashboard - Données reçues:', {
      yearlyStats: this.yearlyStats?.length || 0,
      tenantStats: this.tenantStats?.length || 0,
      paymentStats: this.paymentStats?.length || 0,
      recapitulation: this.recapitulation,
      selectedYear: this.selectedYear,
      isLoading: this.isLoading
    });

    if (this.yearlyStats?.length > 0) {
      console.log('📊 Premier élément yearlyStats:', this.yearlyStats[0]);
    }

    if (this.paymentStats?.length > 0) {
      console.log('💰 Premier élément paymentStats:', this.paymentStats[0]);
    }

    this.loadLocations();
  }

  private loadLocations(): void {
    // Récupérer les locations depuis le store
    this.locations = this.store.selectSnapshot(LocationState.selectStateLocations) || [];
    this.processFinancialData();
  }

  private processFinancialData(): void {
    this.calculateMetrics();
    this.buildCharts();
  }

  private calculateMetrics(): void {
    console.log('📊 Calcul des métriques avec yearlyStats:', this.yearlyStats);

    if (!this.yearlyStats.length) {
      console.log('⚠️ Aucune donnée yearlyStats disponible');
      this.resetMetrics();
      return;
    }

    // Utiliser le service corrigé pour calculer les métriques
    const metrics = this.tenantPaymentCalculator.calculateFinancialMetrics(
      this.yearlyStats,
      this.locations,
      this.selectedYear
    );

    // Assigner les valeurs calculées
    this.totalRevenue = metrics.totalRevenue;
    this.totalExpected = metrics.totalExpected;
    this.collectionRate = metrics.collectionRate;
    this.averageRent = metrics.averageRent;
    this.occupancyRate = metrics.occupancyRate;
    this.totalProperties = this.getTotalProperties();

    console.log('✅ Métriques calculées:', {
      totalRevenue: this.totalRevenue,
      totalExpected: this.totalExpected,
      collectionRate: this.collectionRate,
      occupancyRate: this.occupancyRate,
      averageRent: this.averageRent,
      occupiedRooms: metrics.occupiedRooms,
      totalRooms: metrics.totalRooms
    });

    // Construire les métriques pour l'affichage
    this.buildFinancialMetrics();
  }

  private buildFinancialMetrics(): void {
    // Calculer les changements réels par rapport aux données disponibles
    const revenueChange = this.calculateRevenueChange();
    const collectionRateChange = this.calculateCollectionRateChange();
    const occupancyRateChange = this.calculateOccupancyRateChange();
    const averageRentChange = this.calculateAverageRentChange();

    this.financialMetrics = [
      {
        label: 'Revenus Totaux',
        value: this.totalRevenue,
        change: revenueChange.value,
        changeType: revenueChange.type,
        icon: 'currency--dollar',
        color: this.successColor,
        description: 'Revenus collectés cette année'
      },
      {
        label: 'Taux de Recouvrement',
        value: this.collectionRate,
        change: collectionRateChange.value,
        changeType: collectionRateChange.type,
        icon: 'chart--pie',
        color: this.primaryColor,
        description: 'Pourcentage des loyers collectés'
      },
      {
        label: 'Taux d\'Occupation',
        value: this.occupancyRate,
        change: occupancyRateChange.value,
        changeType: occupancyRateChange.type,
        icon: 'home',
        color: this.infoColor,
        description: 'Pourcentage d\'unités occupées'
      },
      {
        label: 'Loyer Moyen',
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
      title: {
        text: 'Tendance Mensuelle: Attendu vs Reçu',
        textStyle: {
          color: '#374151',
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['Attendu', 'Reçu'],
        textStyle: {
          color: '#6b7280'
        }
      },
      xAxis: {
        type: 'category',
        data: trendData.months,
        axisLabel: {
          color: '#6b7280'
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: '#6b7280',
          formatter: (value: number) => this.formatCurrency(value)
        }
      },
      series: [
        {
          name: 'Attendu',
          type: 'bar',
          data: trendData.expected,
          itemStyle: {
            color: '#e5e7eb'
          }
        },
        {
          name: 'Reçu',
          type: 'bar',
          data: trendData.received,
          itemStyle: {
            color: this.primaryColor
          }
        }
      ],
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      }
    };
  }

  private buildPropertyPerformanceChart(): any {
    // Graphique de performance par propriété (si applicable)
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
        data: this.yearlyStats.slice(0, 10).map(stat => stat.room?.code || 'N/A'),
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
        data: this.yearlyStats.slice(0, 10).map(stat => {
          const received = (stat.paymentValue || []).reduce((sum, payment) => sum + (payment || 0), 0);
          const expected = (stat.room?.price || 0) * 12;
          return expected > 0 ? (received / expected) * 100 : 0;
        }),
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

  // Méthodes utilitaires pour les données
  private getMonthlyRevenueData(): { months: string[], revenues: number[] } {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const revenues = new Array(12).fill(0);

    console.log('📈 Calcul des revenus mensuels avec', this.yearlyStats.length, 'chambres');

    this.yearlyStats.forEach((roomStat, roomIndex) => {
      const monthlyPayments = roomStat.paymentValue || [];
      console.log(`🏠 Chambre ${roomIndex + 1} (${roomStat.room?.code || 'N/A'}):`, {
        price: roomStat.room?.price,
        paymentValue: monthlyPayments,
        totalPayments: monthlyPayments.reduce((sum, p) => sum + (p || 0), 0)
      });

      monthlyPayments.forEach((payment, index) => {
        if (index < 12) {
          revenues[index] += payment || 0;
        }
      });
    });

    console.log('💰 Revenus mensuels calculés:', revenues);
    console.log('💰 Total annuel:', revenues.reduce((sum, r) => sum + r, 0));

    return { months, revenues };
  }

  private getPaymentStatusData(): any[] {
    const statusCounts = {
      payed: 0,
      unpayed: 0,
      partial: 0,
      waiting: 0,
      noContract: 0
    };

    this.paymentStats.forEach(paymentStat => {
      paymentStat.paymentState.forEach(state => {
        switch (state.state) {
          case StatisticPaymentStateType.PAYED:
            statusCounts.payed++;
            break;
          case StatisticPaymentStateType.UNPAYED:
            statusCounts.unpayed++;
            break;
          case StatisticPaymentStateType.PARTIAL_PAYMENT:
            statusCounts.partial++;
            break;
          case StatisticPaymentStateType.WAITING:
            statusCounts.waiting++;
            break;
          case StatisticPaymentStateType.NO_CONTRACT:
            statusCounts.noContract++;
            break;
        }
      });
    });

    return [
      { value: statusCounts.payed, name: 'Payé', itemStyle: { color: this.successColor } },
      { value: statusCounts.unpayed, name: 'Non payé', itemStyle: { color: this.dangerColor } },
      { value: statusCounts.partial, name: 'Partiel', itemStyle: { color: this.warningColor } },
      { value: statusCounts.waiting, name: 'En attente', itemStyle: { color: this.infoColor } },
      { value: statusCounts.noContract, name: 'Sans contrat', itemStyle: { color: '#6b7280' } }
    ];
  }

  private getMonthlyTrendData(): { months: string[], expected: number[], received: number[] } {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const expected = new Array(12).fill(0);
    const received = new Array(12).fill(0);

    this.yearlyStats.forEach(roomStat => {
      const monthlyRent = roomStat.room?.price || 0;
      const monthlyPayments = roomStat.paymentValue || [];
      
      for (let i = 0; i < 12; i++) {
        expected[i] += monthlyRent;
        received[i] += monthlyPayments[i] || 0;
      }
    });

    return { months, expected, received };
  }

  private getTenantAnalysisData(): any[] {
    const activeTenantsCount = this.paymentStats.filter(stat => 
      stat.paymentState.some(state => state.state === StatisticPaymentStateType.PAYED)
    ).length;
    
    const inactiveTenantsCount = this.paymentStats.length - activeTenantsCount;

    return [
      { value: activeTenantsCount, name: 'Locataires Actifs', itemStyle: { color: this.successColor } },
      { value: inactiveTenantsCount, name: 'Locataires Inactifs', itemStyle: { color: this.dangerColor } }
    ];
  }

  private getTotalProperties(): number {
    const propertyIds = new Set();
    this.yearlyStats.forEach(stat => {
      if (stat.room?.property) {
        propertyIds.add(stat.room.property);
      }
    });
    return propertyIds.size;
  }

  private resetMetrics(): void {
    this.totalRevenue = 0;
    this.totalExpected = 0;
    this.collectionRate = 0;
    this.averageRent = 0;
    this.occupancyRate = 0;
    this.totalProperties = 0;
    this.financialMetrics = [];
  }

  // Méthodes de calcul des changements réels
  private calculateRevenueChange(): { value: number, type: 'increase' | 'decrease' | 'neutral' } {
    // Calculer la différence entre les revenus attendus et reçus
    const expectedVsReceived = this.totalExpected > 0 ?
      ((this.totalRevenue - this.totalExpected) / this.totalExpected) * 100 : 0;

    return {
      value: Math.abs(expectedVsReceived),
      type: expectedVsReceived > 0 ? 'increase' : expectedVsReceived < 0 ? 'decrease' : 'neutral'
    };
  }

  private calculateCollectionRateChange(): { value: number, type: 'increase' | 'decrease' | 'neutral' } {
    // Comparer avec un taux de référence (85% est considéré comme bon)
    const referenceRate = 85;
    const difference = this.collectionRate - referenceRate;

    return {
      value: Math.abs(difference),
      type: difference > 0 ? 'increase' : difference < 0 ? 'decrease' : 'neutral'
    };
  }

  private calculateOccupancyRateChange(): { value: number, type: 'increase' | 'decrease' | 'neutral' } {
    // Comparer avec un taux d'occupation de référence (90% est considéré comme excellent)
    const referenceRate = 90;
    const difference = this.occupancyRate - referenceRate;

    return {
      value: Math.abs(difference),
      type: difference > 0 ? 'increase' : difference < 0 ? 'decrease' : 'neutral'
    };
  }

  private calculateAverageRentChange(): { value: number, type: 'increase' | 'decrease' | 'neutral' } {
    // Calculer la variation par rapport à la médiane des loyers
    if (this.yearlyStats.length === 0) {
      return { value: 0, type: 'neutral' };
    }

    const rents = this.yearlyStats.map(stat => stat.room?.price || 0).filter(price => price > 0);
    if (rents.length === 0) {
      return { value: 0, type: 'neutral' };
    }

    rents.sort((a, b) => a - b);
    const median = rents.length % 2 === 0 ?
      (rents[rents.length / 2 - 1] + rents[rents.length / 2]) / 2 :
      rents[Math.floor(rents.length / 2)];

    const difference = this.averageRent > 0 ? ((this.averageRent - median) / median) * 100 : 0;

    return {
      value: Math.abs(difference),
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
