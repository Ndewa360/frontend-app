import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { Store } from '@ngxs/store';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ExportData } from '../../property-finances.component';
import { PropertyFinancialManagerService, PropertyFinancialMetrics, MonthlyFinancialData } from 'src/app/main/properties/services/property-financial-manager.service';

@Component({
  selector: 'app-financial-overview',
  templateUrl: './financial-overview.component.html',
  styleUrls: ['./financial-overview.component.scss']
})
export class FinancialOverviewComponent implements OnInit, OnChanges, OnDestroy {
  @Input() selectedYear: number = new Date().getFullYear();
  @Input() propertyId: string = '';
  @Input() isLoading: boolean = false;

  @Output() exportData = new EventEmitter<ExportData>();

  propertyMetrics: PropertyFinancialMetrics | null = null;
  monthlyData: MonthlyFinancialData[] = [];
  private destroy$ = new Subject<void>();

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
      this.resetMetrics();
      return;
    }

    console.log(`📊 Chargement des données financières centralisées - Propriété: ${this.propertyId}, Année: ${this.selectedYear}`);

    this.propertyFinancialManager.loadPropertyFinancialData(this.propertyId, this.selectedYear)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (backendData) => {
          console.warn("Backend Data ",backendData)
          if (backendData && backendData.length > 0) {
            this.propertyMetrics = this.propertyFinancialManager.extractPropertyMetrics(backendData[0]);
            this.monthlyData = this.propertyFinancialManager.extractMonthlyData(backendData[0]);            
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

  private resetMetrics(): void {
    this.propertyMetrics = null;
    this.monthlyData = [];
  }

  getFinancialHealthScore(): number {
    if (!this.propertyMetrics) return 0;
    
    const collectionWeight = 0.4;
    const occupancyWeight = 0.3;
    const profitWeight = 0.3;
    
    const collectionScore = Math.min(this.propertyMetrics.collectionRate, 100);
    const occupancyScore = Math.min(this.propertyMetrics.occupancyRate, 100);
    const operatingCosts = this.propertyMetrics.totalRevenue * 0.30;
    const netProfit = this.propertyMetrics.totalRevenue - operatingCosts;
    const profitMargin = this.propertyMetrics.totalRevenue > 0 ? (netProfit / this.propertyMetrics.totalRevenue) * 100 : 0;
    const profitScore = profitMargin > 0 ? Math.min(profitMargin * 2, 100) : 0;
    
    return Math.round(
      (collectionScore * collectionWeight) +
      (occupancyScore * occupancyWeight) +
      (profitScore * profitWeight)
    );
  }
  
  getHealthScoreLabel(score: number): string {
    if (score >= 80) return 'Excellente';
    if (score >= 60) return 'Bonne';
    if (score >= 40) return 'Moyenne';
    return 'Faible';
  }
  
  getHealthScoreColor(score: number): string {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  }

  onExportOverview(): void {
    if (!this.propertyMetrics) return;
    
    const operatingCosts = this.propertyMetrics.totalRevenue * 0.30;
    const netProfit = this.propertyMetrics.totalRevenue - operatingCosts;
    const profitMargin = this.propertyMetrics.totalRevenue > 0 ? (netProfit / this.propertyMetrics.totalRevenue) * 100 : 0;
    const totalDeposits = this.propertyMetrics.roomDetails.reduce((total, room) => 
      total + (room.monthlyRent * 2), 0);
    
    const exportData = [
      {
        'Métrique': 'Revenus totaux reçus',
        'Valeur': this.formatPrice(this.propertyMetrics.totalRevenue),
        'Valeur numérique': this.propertyMetrics.totalRevenue
      },
      {
        'Métrique': 'Revenus attendus',
        'Valeur': this.formatPrice(this.propertyMetrics.totalExpected),
        'Valeur numérique': this.propertyMetrics.totalExpected
      },
      {
        'Métrique': 'Taux de recouvrement',
        'Valeur': this.formatPercentage(this.propertyMetrics.collectionRate),
        'Valeur numérique': this.propertyMetrics.collectionRate
      },
      {
        'Métrique': 'Nombre total de chambres',
        'Valeur': this.propertyMetrics.totalRooms,
        'Valeur numérique': this.propertyMetrics.totalRooms
      },
      {
        'Métrique': 'Chambres occupées',
        'Valeur': this.propertyMetrics.occupiedRooms,
        'Valeur numérique': this.propertyMetrics.occupiedRooms
      },
      {
        'Métrique': 'Taux d\'occupation',
        'Valeur': this.formatPercentage(this.propertyMetrics.occupancyRate),
        'Valeur numérique': this.propertyMetrics.occupancyRate
      },
      {
        'Métrique': 'Loyer moyen',
        'Valeur': this.formatPrice(this.propertyMetrics.averageRent),
        'Valeur numérique': this.propertyMetrics.averageRent
      },
      {
        'Métrique': 'Total des cautions',
        'Valeur': this.formatPrice(totalDeposits),
        'Valeur numérique': totalDeposits
      },
      {
        'Métrique': 'Profit net estimé',
        'Valeur': this.formatPrice(netProfit),
        'Valeur numérique': netProfit
      },
      {
        'Métrique': 'Marge bénéficiaire',
        'Valeur': this.formatPercentage(profitMargin),
        'Valeur numérique': profitMargin
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

  formatPrice(price: number | null | undefined): string {
    if (!price) return '0 FCFA';
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(price);
  }
  
  // Getters pour le template
  get totalRevenue(): number { return this.propertyMetrics?.totalRevenue || 0; }
  get totalExpected(): number { return this.propertyMetrics?.totalExpected || 0; }
  get collectionRate(): number { return this.propertyMetrics?.collectionRate || 0; }
  get totalRooms(): number { return this.propertyMetrics?.totalRooms || 0; }
  get occupiedRooms(): number { return this.propertyMetrics?.occupiedRooms || 0; }
  get occupancyRate(): number { return this.propertyMetrics?.occupancyRate || 0; }
  get averageRent(): number { return this.propertyMetrics?.averageRent || 0; }
  get totalDeposits(): number { 
    return this.propertyMetrics?.roomDetails.reduce((total, room) => 
      total + (room.monthlyRent * 2), 0) || 0;
  }
  get netProfit(): number { 
    const operatingCosts = this.totalRevenue * 0.30;
    return this.totalRevenue - operatingCosts;
  }
  get profitMargin(): number { 
    return this.totalRevenue > 0 ? (this.netProfit / this.totalRevenue) * 100 : 0;
  }
  
  // Propriété metrics pour compatibilité avec le template
  get metrics() {
    if (!this.propertyMetrics) {
      return {
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
    
    const totalDeposits = this.propertyMetrics.roomDetails.reduce((total, room) => 
      total + (room.monthlyRent * 2), 0);
    
    return {
      totalRevenue: this.propertyMetrics.totalRevenue,
      totalExpected: this.propertyMetrics.totalExpected,
      collectionRate: this.propertyMetrics.collectionRate,
      totalRooms: this.propertyMetrics.totalRooms,
      occupiedRooms: this.propertyMetrics.occupiedRooms,
      occupancyRate: this.propertyMetrics.occupancyRate,
      averageRent: this.propertyMetrics.averageRent,
      totalDeposits
    };
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