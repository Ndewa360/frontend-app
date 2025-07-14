import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import {
  StatisticRoomYearModel,
  StatisticPaymentOfAllPropertyByYear
} from 'src/app/shared/store';
import { ExportData } from '../../property-finances.component';
import { FinancialCalculationsService, FinancialMetrics, MonthlyFinancialData } from 'src/app/shared/services/financial-calculations.service';

export interface OverviewMetrics {
  totalRevenue: number;
  totalExpected: number;
  collectionRate: number;
  totalRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  averageRent: number;
  totalDeposits: number;
}

@Component({
  selector: 'app-financial-overview',
  templateUrl: './financial-overview.component.html',
  styleUrls: ['./financial-overview.component.scss']
})
export class FinancialOverviewComponent implements OnInit {
  @Input() yearlyStats: StatisticRoomYearModel[] = [];
  @Input() recapitulation: StatisticPaymentOfAllPropertyByYear | null = null;
  @Input() selectedYear: number = new Date().getFullYear();
  @Input() isLoading: boolean = false;

  @Output() exportData = new EventEmitter<ExportData>();

  metrics: FinancialMetrics = {
    totalRevenue: 0,
    totalExpected: 0,
    collectionRate: 0,
    totalRooms: 0,
    occupiedRooms: 0,
    occupancyRate: 0,
    averageRent: 0,
    totalDeposits: 0,
    netProfit: 0,
    profitMargin: 0
  };

  monthlyData: MonthlyFinancialData[] = [];

  constructor(private financialCalculationsService: FinancialCalculationsService) {}

  ngOnInit(): void {
    this.updateFinancialData();
  }

  ngOnChanges(): void {
    this.updateFinancialData();
  }

  private updateFinancialData(): void {
    // Utiliser le service centralisé pour les calculs
    this.metrics = this.financialCalculationsService.calculateFinancialMetrics(
      this.yearlyStats,
      this.recapitulation
    );

    this.monthlyData = this.financialCalculationsService.buildMonthlyData(
      this.yearlyStats,
      this.recapitulation
    );

    console.log('📊 FinancialOverview - Données mises à jour:', {
      metrics: this.metrics,
      monthlyDataLength: this.monthlyData.length
    });
  }

  // Méthodes supprimées - maintenant gérées par FinancialCalculationsService

  // === MÉTHODES D'EXPORT ===

  onExportOverview(): void {
    const exportData = [
      {
        'Métrique': 'Revenus totaux reçus',
        'Valeur': this.financialCalculationsService.formatCurrency(this.metrics.totalRevenue),
        'Valeur numérique': this.metrics.totalRevenue
      },
      {
        'Métrique': 'Revenus attendus',
        'Valeur': this.financialCalculationsService.formatCurrency(this.metrics.totalExpected),
        'Valeur numérique': this.metrics.totalExpected
      },
      {
        'Métrique': 'Taux de recouvrement',
        'Valeur': this.financialCalculationsService.formatPercentage(this.metrics.collectionRate),
        'Valeur numérique': this.metrics.collectionRate
      },
      {
        'Métrique': 'Nombre total de chambres',
        'Valeur': this.metrics.totalRooms,
        'Valeur numérique': this.metrics.totalRooms
      },
      {
        'Métrique': 'Chambres occupées',
        'Valeur': this.metrics.occupiedRooms,
        'Valeur numérique': this.metrics.occupiedRooms
      },
      {
        'Métrique': 'Taux d\'occupation',
        'Valeur': this.financialCalculationsService.formatPercentage(this.metrics.occupancyRate),
        'Valeur numérique': this.metrics.occupancyRate
      },
      {
        'Métrique': 'Loyer moyen',
        'Valeur': this.financialCalculationsService.formatCurrency(this.metrics.averageRent),
        'Valeur numérique': this.metrics.averageRent
      },
      {
        'Métrique': 'Total des cautions',
        'Valeur': this.financialCalculationsService.formatCurrency(this.metrics.totalDeposits),
        'Valeur numérique': this.metrics.totalDeposits
      },
      {
        'Métrique': 'Profit net estimé',
        'Valeur': this.financialCalculationsService.formatCurrency(this.metrics.netProfit),
        'Valeur numérique': this.metrics.netProfit
      },
      {
        'Métrique': 'Marge bénéficiaire',
        'Valeur': this.financialCalculationsService.formatPercentage(this.metrics.profitMargin),
        'Valeur numérique': this.metrics.profitMargin
      }
    ];

    this.exportData.emit({
      type: 'excel',
      data: exportData,
      filename: `vue-ensemble-financiere-${this.selectedYear}`
    });
  }

  onExportMonthlyData(): void {
    const exportData = this.monthlyData.map(month => ({
      'Mois': month.month,
      'Revenus attendus': month.expected,
      'Revenus reçus': month.received,
      'Taux de recouvrement': month.rate
    }));

    this.exportData.emit({
      type: 'excel',
      data: exportData,
      filename: `donnees-mensuelles-${this.selectedYear}`
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

  getMetricIcon(metric: string): string {
    switch (metric) {
      case 'revenue': return 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1';
      case 'collection': return 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z';
      case 'occupancy': return 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4';
      case 'average': return 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6';
      default: return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  getMetricColor(metric: string): string {
    switch (metric) {
      case 'revenue': return 'bg-green-100 text-green-800';
      case 'collection': return 'bg-blue-100 text-blue-800';
      case 'occupancy': return 'bg-purple-100 text-purple-800';
      case 'average': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
