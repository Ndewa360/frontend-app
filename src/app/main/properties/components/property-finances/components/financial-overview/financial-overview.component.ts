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

    // Le parent (PropertyFinancesComponent) dispatche déjà FetchStaticByPropertyIdAndYear.
    // On s'abonne uniquement au store sans re-dispatcher pour éviter le double appel API.
    this.propertyFinancialManager.loadPropertyFinancialData(this.propertyId, this.selectedYear)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (backendData) => {
          if (backendData && backendData.length > 0) {
            this.propertyMetrics = this.propertyFinancialManager.extractPropertyMetrics(backendData[0]);
            this.monthlyData = this.propertyFinancialManager.extractMonthlyData(backendData[0]);
          } else {
            this.resetMetrics();
          }
        },
        error: (error) => {
          console.error('Erreur chargement données financières:', error);
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
    
    const collectionWeight = 0.5;
    const occupancyWeight = 0.5;
    
    const collectionScore = Math.min(this.propertyMetrics.collectionRate, 100);
    const occupancyScore = Math.min(this.propertyMetrics.occupancyRate, 100);
    
    return Math.round(
      (collectionScore * collectionWeight) +
      (occupancyScore * occupancyWeight)
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
    
    const exportData = [
      { 'Métrique': 'Revenus totaux reçus', 'Valeur': this.formatPrice(this.propertyMetrics.totalRevenue), 'Valeur numérique': this.propertyMetrics.totalRevenue },
      { 'Métrique': 'Revenus attendus', 'Valeur': this.formatPrice(this.propertyMetrics.totalExpected), 'Valeur numérique': this.propertyMetrics.totalExpected },
      { 'Métrique': 'Taux de recouvrement', 'Valeur': this.formatPercentage(this.propertyMetrics.collectionRate), 'Valeur numérique': this.propertyMetrics.collectionRate },
      { 'Métrique': 'Nombre total de chambres', 'Valeur': this.propertyMetrics.totalRooms, 'Valeur numérique': this.propertyMetrics.totalRooms },
      { 'Métrique': 'Chambres occupées', 'Valeur': this.propertyMetrics.occupiedRooms, 'Valeur numérique': this.propertyMetrics.occupiedRooms },
      { 'Métrique': 'Taux d\'occupation', 'Valeur': this.formatPercentage(this.propertyMetrics.occupancyRate), 'Valeur numérique': this.propertyMetrics.occupancyRate },
      { 'Métrique': 'Loyer moyen', 'Valeur': this.formatPrice(this.propertyMetrics.averageRent), 'Valeur numérique': this.propertyMetrics.averageRent },
      { 'Métrique': 'Total avances', 'Valeur': this.formatPrice(this.propertyMetrics.totalAdvances), 'Valeur numérique': this.propertyMetrics.totalAdvances },
      { 'Métrique': 'Total dettes', 'Valeur': this.formatPrice(this.propertyMetrics.totalDebts), 'Valeur numérique': this.propertyMetrics.totalDebts }
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
    if (price === null || price === undefined || isNaN(price as number)) return '0 FCFA';
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(price);
  }
  
  // Getters pour le template
  get totalRevenue(): number { return this.propertyMetrics?.totalRevenue ?? 0; }
  get totalExpected(): number { return this.propertyMetrics?.totalExpected ?? 0; }
  get collectionRate(): number { return this.propertyMetrics?.collectionRate ?? 0; }
  get totalRooms(): number { return this.propertyMetrics?.totalRooms ?? 0; }
  get occupiedRooms(): number { return this.propertyMetrics?.occupiedRooms ?? 0; }
  get occupancyRate(): number { return this.propertyMetrics?.occupancyRate ?? 0; }
  get averageRent(): number { return this.propertyMetrics?.averageRent ?? 0; }
  // ✅ Cautions réelles depuis cautionsAnalysis.summary.totalCautionsReceived
  get totalDeposits(): number { return this.propertyMetrics?.totalDeposits ?? 0; }
  // ✅ Manque à gagner = attendu - reçu (toujours >= 0)
  get shortfall(): number { return Math.max(0, this.totalExpected - this.totalRevenue); }

  get metrics() {
    return {
      totalRevenue: this.totalRevenue,
      totalExpected: this.totalExpected,
      collectionRate: this.collectionRate,
      totalRooms: this.totalRooms,
      occupiedRooms: this.occupiedRooms,
      occupancyRate: this.occupancyRate,
      averageRent: this.averageRent,
      // ✅ Cautions réelles depuis cautionsAnalysis
      totalDeposits: this.totalDeposits,
      totalAdvances: this.propertyMetrics?.totalAdvances ?? 0,
      totalDebts: this.propertyMetrics?.totalDebts ?? 0,
      // ✅ Manque à gagner calculé correctement
      shortfall: this.shortfall
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