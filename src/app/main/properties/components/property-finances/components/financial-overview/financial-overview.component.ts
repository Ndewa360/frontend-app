import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import {
  StatisticRoomYearModel,
  StatisticPaymentOfAllPropertyByYear
} from 'src/app/shared/store';
import { ExportData } from '../../property-finances.component';

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

  metrics: OverviewMetrics = {
    totalRevenue: 0,
    totalExpected: 0,
    collectionRate: 0,
    totalRooms: 0,
    occupiedRooms: 0,
    occupancyRate: 0,
    averageRent: 0,
    totalDeposits: 0
  };

  monthlyData: Array<{
    month: string;
    monthIndex: number;
    expected: number;
    received: number;
    rate: number;
  }> = [];

  ngOnInit(): void {
    this.calculateMetrics();
    this.buildMonthlyData();
  }

  ngOnChanges(): void {
    // Calculer les métriques seulement si nous avons des données
    if (this.yearlyStats && this.yearlyStats.length > 0) {
      this.calculateMetrics();
    } else {
      this.resetMetrics();
    }

    // Construire les données mensuelles (avec vérifications de sécurité intégrées)
    this.buildMonthlyData();
  }

  private calculateMetrics(): void {
    if (!this.yearlyStats.length) {
      this.resetMetrics();
      return;
    }

    // Calculer les métriques à partir des statistiques des chambres
    let totalRevenue = 0;
    let totalExpected = 0;
    let totalRooms = this.yearlyStats.length;
    let occupiedRooms = 0;
    let totalRentSum = 0;
    let totalDeposits = 0;

    this.yearlyStats.forEach(roomStat => {
      const monthlyPayments = roomStat.paymentValue || [];
      const receivedForRoom = monthlyPayments.reduce((sum, payment) => sum + (payment || 0), 0);
      const roomPrice = roomStat.room?.price || 0;
      const expectedForYear = roomPrice * 12;

      // Revenus reçus
      totalRevenue += receivedForRoom;

      // Revenus attendus
      totalExpected += expectedForYear;

      // Chambres occupées (si des paiements ont été reçus)
      if (receivedForRoom > 0) {
        occupiedRooms++;
      }

      // Somme des loyers pour calculer la moyenne
      totalRentSum += roomPrice;

      // Total des cautions (estimation: 2 mois de loyer)
      totalDeposits += roomPrice * 2;
    });

    this.metrics = {
      totalRevenue,
      totalExpected,
      collectionRate: totalExpected > 0 ? (totalRevenue / totalExpected) * 100 : 0,
      totalRooms,
      occupiedRooms,
      occupancyRate: totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0,
      averageRent: totalRooms > 0 ? totalRentSum / totalRooms : 0,
      totalDeposits
    };
  }

  private resetMetrics(): void {
    this.metrics = {
      totalRevenue: 0,
      totalExpected: 0,
      collectionRate: 0,
      totalRooms: 0,
      occupiedRooms: 0,
      occupancyRate: 0,
      averageRent: 0,
      totalDeposits: 0
    };
  }

  private buildMonthlyData(): void {
    this.monthlyData = [];

    // Vérification de sécurité pour éviter les erreurs
    if (!this.recapitulation?.paymentProperty || !Array.isArray(this.recapitulation.paymentProperty)) {
      // Créer des données vides pour les 12 mois
      for (let i = 0; i < 12; i++) {
        this.monthlyData.push({
          month: this.getMonthName(i),
          monthIndex: i,
          expected: 0,
          received: 0,
          rate: 0
        });
      }
      return;
    }

    // Construire les données mensuelles à partir de la structure réelle
    const monthlyAggregated: { [key: number]: { expected: number, received: number } } = {};

    // Initialiser les 12 mois
    for (let i = 0; i < 12; i++) {
      monthlyAggregated[i] = { expected: 0, received: 0 };
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
            }
          }
        });
      }
    });

    // Convertir en format attendu
    Object.keys(monthlyAggregated).forEach(monthKey => {
      const monthIndex = parseInt(monthKey);
      const data = monthlyAggregated[monthIndex];

      this.monthlyData.push({
        month: this.getMonthName(monthIndex),
        monthIndex,
        expected: data.expected,
        received: data.received,
        rate: data.expected > 0 ? (data.received / data.expected) * 100 : 0
      });
    });
  }

  // === MÉTHODES D'EXPORT ===

  onExportOverview(): void {
    const exportData = [
      {
        'Métrique': 'Revenus totaux reçus',
        'Valeur': this.metrics.totalRevenue,
        'Unité': 'FCFA'
      },
      {
        'Métrique': 'Revenus attendus',
        'Valeur': this.metrics.totalExpected,
        'Unité': 'FCFA'
      },
      {
        'Métrique': 'Taux de recouvrement',
        'Valeur': this.metrics.collectionRate,
        'Unité': '%'
      },
      {
        'Métrique': 'Nombre total de chambres',
        'Valeur': this.metrics.totalRooms,
        'Unité': 'unités'
      },
      {
        'Métrique': 'Chambres occupées',
        'Valeur': this.metrics.occupiedRooms,
        'Unité': 'unités'
      },
      {
        'Métrique': 'Taux d\'occupation',
        'Valeur': this.metrics.occupancyRate,
        'Unité': '%'
      },
      {
        'Métrique': 'Loyer moyen',
        'Valeur': this.metrics.averageRent,
        'Unité': 'FCFA'
      },
      {
        'Métrique': 'Total des cautions',
        'Valeur': this.metrics.totalDeposits,
        'Unité': 'FCFA'
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
