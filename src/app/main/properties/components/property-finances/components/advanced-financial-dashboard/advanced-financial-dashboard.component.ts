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

import { PropertyFinancialManagerService, PropertyFinancialMetrics } from 'src/app/shared/services/property-financial-manager.service';

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

  // Métriques complètes du nouveau service
  propertyMetrics: PropertyFinancialMetrics | null = null;
  
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
  occupiedRooms: number = 0;
  totalRooms: number = 0;
  totalProperties: number = 0;

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
    console.log('🔥 DASHBOARD - Locations chargées:', {
      locationsCount: this.locations.length,
      propertyId: this.propertyId,
      yearlyStatsCount: this.yearlyStats.length,
      activeLocations: this.locations.filter(l => l.isRunning).length,
      locationsForProperty: this.locations.filter(l => l.property === this.propertyId).length
    });
    this.processFinancialData();
  }

  private processFinancialData(): void {
    this.calculateMetrics();
    this.buildCharts();

    // Forcer l'arrêt du loading après le traitement des données
    setTimeout(() => {
      if (this.yearlyStats.length > 0) {
        console.log('✅ Dashboard: Données traitées, arrêt du loading');
        // Note: isLoading est un @Input, on ne peut pas le modifier directement
        // Le composant parent doit gérer cet état
      }
    }, 100);
  }

  private calculateMetrics(): void {
    console.log('📊 TABLEAU DE BORD - Calcul des métriques avec yearlyStats:', this.yearlyStats.length);

    if (!this.yearlyStats.length) {
      console.log('⚠️ Aucune donnée yearlyStats disponible');
      this.resetMetrics();
      return;
    }

    try {
      // DIAGNOSTIC COMPLET
      console.log('🔍 DIAGNOSTIC COMPLET - DASHBOARD:', {
        propertyId: this.propertyId,
        selectedYear: this.selectedYear,
        yearlyStats: this.yearlyStats.map(stat => ({
          roomId: stat.room?._id,
          roomCode: stat.room?.code,
          roomPrice: stat.room?.price,
          roomProperty: stat.room?.property,
          paymentValue: stat.paymentValue?.reduce((sum, p) => sum + (p || 0), 0)
        })),
        locations: this.locations.map(loc => ({
          id: loc._id,
          room: loc.room,
          property: loc.property,
          isRunning: loc.isRunning,
          startedAt: loc.startedAt
        })),
        locationsForThisProperty: this.locations.filter(l => l.property === this.propertyId).length,
        roomsForThisProperty: this.yearlyStats.filter(s => s.room?.property === this.propertyId).length
      });
      
      // Utiliser le service financier centralisé avec validation
      const propertyMetrics = this.financialManager.calculatePropertyMetrics(
        this.propertyId,
        this.selectedYear,
        this.yearlyStats,
        this.locations,
        this.paymentStats
      );

      // Valider les calculs
      const validation = this.financialManager.validateFinancialCalculations(propertyMetrics);
      
      if (!validation.isValid) {
        console.warn('⚠️ Incohérences détectées:', validation.warnings);
        // Appliquer les corrections si nécessaire
        Object.assign(propertyMetrics, validation.corrections);
      }

      // Assigner les valeurs calculées avec logs de debug
      this.totalRevenue = Math.round(propertyMetrics.totalRevenue * 100) / 100;
      this.totalExpected = Math.round(propertyMetrics.totalExpected * 100) / 100;
      this.collectionRate = Math.round(propertyMetrics.collectionRate * 100) / 100;
      this.averageRent = Math.round(propertyMetrics.averageRent * 100) / 100;
      this.occupancyRate = Math.round(propertyMetrics.occupancyRate * 100) / 100;
      this.occupiedRooms = propertyMetrics.occupiedRooms;
      this.totalRooms = propertyMetrics.totalRooms;
      this.totalProperties = this.getTotalProperties();
      
      console.log('🔥 DASHBOARD - Valeurs assignées:', {
        totalRevenue: this.totalRevenue,
        totalExpected: this.totalExpected,
        collectionRate: this.collectionRate + '%',
        occupancyRate: this.occupancyRate + '%',
        occupiedRooms: this.occupiedRooms,
        totalRooms: this.totalRooms,
        propertyId: this.propertyId,
        yearlyStatsLength: this.yearlyStats.length,
        locationsLength: this.locations.length
      });
      
      // TEST SIMPLE : Vérifier le calcul d'occupation manuellement
      const activeLocationsForProperty = this.locations.filter(loc => 
        loc.property === this.propertyId && loc.isRunning === true
      );
      const roomsForProperty = this.yearlyStats.filter(stat => 
        stat.room?.property === this.propertyId
      );
      const manualOccupancyRate = roomsForProperty.length > 0 ? 
        (activeLocationsForProperty.length / roomsForProperty.length) * 100 : 0;
      
      console.log('🧪 TEST MANUEL - Taux d\'occupation:', {
        activeLocations: activeLocationsForProperty.length,
        totalRooms: roomsForProperty.length,
        manualRate: manualOccupancyRate.toFixed(1) + '%',
        serviceRate: this.occupancyRate.toFixed(1) + '%',
        match: Math.abs(manualOccupancyRate - this.occupancyRate) < 0.1
      });

      // Calculer les changements avec le nouveau service
      const changes = this.financialManager.calculateMetricChanges(propertyMetrics);
      this.revenueChange = changes.revenueChange;
      this.collectionRateChange = changes.collectionRateChange;
      this.occupancyRateChange = changes.occupancyRateChange;
      this.averageRentChange = changes.averageRentChange;

      // Stocker les métriques complètes pour les graphiques
      this.propertyMetrics = propertyMetrics;

      console.log('✅ Métriques calculées avec succès:', {
        totalRevenue: this.totalRevenue.toLocaleString(),
        collectionRate: `${this.collectionRate.toFixed(1)}%`,
        occupancyRate: `${this.occupancyRate.toFixed(1)}%`,
        warnings: validation.warnings.length
      });

      // Construire les métriques pour l'affichage
      this.buildFinancialMetrics();
      
    } catch (error) {
      console.error('❌ Erreur lors du calcul des métriques:', error);
      this.resetMetrics();
    }
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

  // Méthodes utilitaires pour les données avec validation
  private getMonthlyRevenueData(): { months: string[], revenues: number[] } {
    if (!this.propertyMetrics) {
      console.warn('⚠️ Pas de métriques disponibles pour les revenus mensuels');
      return { months: [], revenues: [] };
    }

    try {
      // Générer les données mensuelles avec le service centralisé
      const monthlyData = this.financialManager.generateMonthlyData(
        this.selectedYear,
        this.propertyMetrics.roomDetails
      );

      const chartData = this.financialManager.generateRevenueChartData(monthlyData);

      // Validation des données
      const totalAnnual = chartData.revenues.reduce((sum, r) => sum + r, 0);
      const expectedTotal = this.totalRevenue;
      
      if (Math.abs(totalAnnual - expectedTotal) > expectedTotal * 0.1) {
        console.warn('⚠️ Écart détecté entre total mensuel et annuel:', {
          mensuel: totalAnnual.toLocaleString(),
          annuel: expectedTotal.toLocaleString()
        });
      }

      console.log('📈 Revenus mensuels générés:', {
        months: chartData.months.length,
        totalAnnual: totalAnnual.toLocaleString(),
        averageMonthly: (totalAnnual / 12).toLocaleString()
      });

      return {
        months: chartData.months,
        revenues: chartData.revenues
      };
      
    } catch (error) {
      console.error('❌ Erreur lors de la génération des revenus mensuels:', error);
      return { months: [], revenues: [] };
    }
  }

  private getPaymentStatusData(): any[] {
    if (!this.propertyMetrics) {
      return [];
    }

    try {
      // Générer les données de statut avec validation
      const statusData = this.financialManager.generatePaymentStatusData(
        this.propertyMetrics.roomDetails
      );

      // Validation : vérifier que le total correspond au nombre de chambres
      const totalRooms = statusData.reduce((sum, item) => sum + item.value, 0);
      if (totalRooms !== this.totalRooms) {
        console.warn('⚠️ Incohérence dans les statuts de paiement:', {
          totalStatuts: totalRooms,
          totalChambres: this.totalRooms
        });
      }

      console.log('📊 Statuts de paiement:', statusData.map(s => `${s.name}: ${s.value}`));

      // Convertir au format ECharts avec couleurs améliorées
      return statusData.map(item => ({
        value: item.value,
        name: item.name,
        itemStyle: { 
          color: item.color,
          borderColor: '#fff',
          borderWidth: 2
        }
      }));
      
    } catch (error) {
      console.error('❌ Erreur lors de la génération des statuts:', error);
      return [];
    }
  }

  private getMonthlyTrendData(): { months: string[], expected: number[], received: number[] } {
    if (!this.propertyMetrics) {
      return { months: [], expected: [], received: [] };
    }

    try {
      // Générer les données de tendance mensuelle
      const monthlyData = this.financialManager.generateMonthlyData(
        this.selectedYear,
        this.propertyMetrics.roomDetails
      );

      const chartData = this.financialManager.generateRevenueChartData(monthlyData);

      // Validation des données de tendance
      const totalExpected = chartData.expected.reduce((sum, e) => sum + e, 0);
      const totalReceived = chartData.revenues.reduce((sum, r) => sum + r, 0);
      
      console.log('📊 Tendance mensuelle générée:', {
        months: chartData.months.length,
        totalExpected: totalExpected.toLocaleString(),
        totalReceived: totalReceived.toLocaleString(),
        globalRate: totalExpected > 0 ? `${((totalReceived / totalExpected) * 100).toFixed(1)}%` : '0%'
      });

      return {
        months: chartData.months,
        expected: chartData.expected,
        received: chartData.revenues
      };
      
    } catch (error) {
      console.error('❌ Erreur lors de la génération de la tendance:', error);
      return { months: [], expected: [], received: [] };
    }
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
