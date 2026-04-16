import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import {
  StatisticAction,
  StatisticPaymentStateType
} from 'src/app/shared/store';
import { StatisticState } from 'src/app/shared/store/statistic-data/statistic.state';
import { ExcelExportService } from 'src/app/shared/services/excel-export.service';
import { PerformanceAlertsService } from 'src/app/main/statistics/services/performance-alerts.service';


export interface ExportData {
  type: 'excel' | 'csv';
  data: any[];
  filename: string;
}

@Component({
  selector: 'app-property-finances',
  templateUrl: './property-finances.component.html',
  styleUrls: ['./property-finances.component.scss']
})
export class PropertyFinancesComponent implements OnInit, OnDestroy, OnChanges {
  @Input() propertyId: string = '';
  @Input() finances: any = null; // Garde pour compatibilité

  selectedYear: number = new Date().getFullYear();
  // 4 onglets clairs et distincts
  activeSection: 'situation' | 'tenants' | 'deposits' | 'monthly' = 'situation';
  isLoading: boolean = false;

  financeTabs: Array<{
    id: 'situation' | 'tenants' | 'deposits' | 'monthly';
    label: string;
    icon: string;
  }> = [];

  backendData: any = null;

  private subscriptionReset$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private excelExportService: ExcelExportService,
    private translate: TranslateService,
    private performanceAlertsService: PerformanceAlertsService
  ) {
    this.initializeFinanceTabs();
  }

  private initializeFinanceTabs(): void {
    this.financeTabs = [
      { id: 'situation', label: 'Situation financière', icon: 'analytics' },
      { id: 'tenants',   label: 'Locataires',           icon: 'user'      },
      { id: 'deposits',  label: 'Cautions',             icon: 'security'  },
      { id: 'monthly',   label: 'Revenus encaissés',    icon: 'money'     }
    ];
  }

  ngOnInit(): void {
    this.ensureValidSelectedYear();
    if (this.propertyId) {
      this.setupDataSubscriptions();
      this.loadFinancialData();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['propertyId'] || changes['selectedYear']) {
      if (this.propertyId) {
        // FIX #F7 : annuler la subscription précédente avant d'en créer une nouvelle
        this.subscriptionReset$.next();
        this.setupDataSubscriptions();
        this.loadFinancialData();
      }
    }
  }



  ngOnDestroy(): void {
    this.subscriptionReset$.next();
    this.subscriptionReset$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadFinancialData(): void {
    if (!this.propertyId) return;
    this.isLoading = true;
    this.store.dispatch(new StatisticAction.FetchStaticByPropertyIdAndYear(this.propertyId, this.selectedYear.toString()));
  }


  private setupDataSubscriptions(): void {
    // FIX #F7 : takeUntil sur subscriptionReset$ pour annuler à chaque changement
    // et sur destroy$ pour annuler à la destruction du composant
    this.store.select(
      StatisticState.selectStateStatisticPropertyIdAndYear(this.propertyId, this.selectedYear)
    ).pipe(
      takeUntil(this.subscriptionReset$),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (backendData) => {
        this.backendData = backendData;
        if (backendData && backendData.length > 0) {
          this.isLoading = false;
          this.performanceAlertsService.loadAlertsFromEnrichedData(
            backendData[0],
            `Propriété ${this.propertyId}`
          );
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des données:', error);
        this.isLoading = false;
      }
    });
  }

  // === MÉTHODES D'ACTIONS ===

  onYearChange(year: number | string): void {
    const numericYear = typeof year === 'string' ? parseInt(year, 10) : year;

    if (isNaN(numericYear) || numericYear < 2020 || numericYear > 2030) {
      return;
    }

    // Définir isLoading immédiatement avant de changer l'année
    this.isLoading = true;
    this.selectedYear = numericYear;
    this.loadFinancialData();
  }

  hasFinancialData(): boolean {
    const hasData = this.backendData && this.backendData.length > 0;
    return hasData;
  }
  
  getDataQualityScore(): number {
    return this.hasFinancialData() ? 100 : 0;
  }
  
  getDataQualityLabel(): string {
    return this.hasFinancialData() ? 'Excellente' : 'Insuffisante';
  }

  hasPartialData(): boolean {
    return this.hasFinancialData();
  }

  isYearCompletelyEmpty(): boolean {
    return !this.hasFinancialData() && !this.isLoading;
  }

  /**
   * Retourne l'année actuelle
   */
  getCurrentYear(): number {
    return new Date().getFullYear();
  }

  /**
   * Navigue vers l'année actuelle
   */
  goToCurrentYear(): void {
    this.onYearChange(this.getCurrentYear());
  }

  onSectionChange(section: 'situation' | 'tenants' | 'deposits' | 'monthly'): void {
    this.activeSection = section;
  }

  getSectionLabel(section: string): string {
    const labels = {
      'situation': 'Situation financière',
      'tenants':   'Locataires',
      'deposits':  'Cautions',
      'monthly':   'Revenus encaissés'
    };
    return labels[section as keyof typeof labels] || section;
  }

  getCurrentSectionIndex(): number {
    const sections = ['situation', 'tenants', 'deposits', 'monthly'];
    return sections.indexOf(this.activeSection);
  }

  getTotalSections(): number { return 4; }

  getSectionProgress(): number {
    const currentIndex = this.getCurrentSectionIndex();
    const totalSections = this.getTotalSections();
    return ((currentIndex + 1) / totalSections) * 100;
  }

  onExportData(exportData: ExportData): void {

    if (exportData.type === 'excel') {
      this.exportToExcel(exportData);
    } else if (exportData.type === 'csv') {
      this.exportToCSV(exportData);
    }
  }

  private exportToExcel(exportData: ExportData): void {
    try {
      const enrichedData = this.enrichExportData(exportData.data);
      this.excelExportService.exportToExcel(enrichedData, exportData.filename, {
        sheetName: this.getSheetName(),
        includeMetadata: true,
        metadata: { propertyId: this.propertyId, year: this.selectedYear, exportDate: new Date().toLocaleDateString('fr-FR'), section: this.activeSection }
      });
    } catch (error) {
      console.error('❌ Erreur export Excel:', error);
    }
  }

  private exportToCSV(exportData: ExportData): void {
    try {
      const csvContent = this.convertToCSV(exportData.data);
      this.downloadCSV(csvContent, exportData.filename);
    } catch (error) {
      console.error('❌ Erreur export CSV:', error);
    }
  }

  private enrichExportData(data: any[]): any[] {
    return data.map(row => ({
      ...row,
      'Date d\'export': new Date().toLocaleDateString('fr-FR'),
      'Propriété ID': this.propertyId,
      'Année': this.selectedYear
    }));
  }

  private getSheetName(): string {
    const sectionNames = {
      situation: 'Situation financière',
      tenants:   'Locataires',
      deposits:  'Cautions',
      monthly:   'Revenus encaissés'
    };
    return sectionNames[this.activeSection] || 'Données financières';
  }

  private convertToCSV(data: any[]): string {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',')
            ? `"${value}"`
            : value;
        }).join(',')
      )
    ];

    return csvRows.join('\n');
  }

  private downloadCSV(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  refreshData(): void {
    if (!this.propertyId) return;
    this.isLoading = true;
    this.loadFinancialData();
  }

  // Méthode diagnoseFinancialData supprimée (dupliquée)

  // === MÉTHODES UTILITAIRES ===

  getAvailableYears(): number[] {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
      years.push(i);
    }
    return years;
  }

  /**
   * S'assure que l'année sélectionnée est valide et dans la liste des années disponibles
   */
  private ensureValidSelectedYear(): void {
    const availableYears = this.getAvailableYears();
    const currentYear = new Date().getFullYear();

    // Si selectedYear n'est pas défini ou n'est pas dans la liste, utiliser l'année courante
    if (!this.selectedYear || !availableYears.includes(this.selectedYear)) {
      this.selectedYear = currentYear;
    }
  }





  /**
   * TrackBy function pour les tabs
   */
  trackByTabId(_index: number, tab: any): string {
    return tab.id;
  }

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

  getPaymentStateLabel(state: StatisticPaymentStateType): string {
    switch (state) {
      case StatisticPaymentStateType.PAYED: return 'Payé';
      case StatisticPaymentStateType.UNPAYED: return 'Non payé';
      case StatisticPaymentStateType.PARTIAL_PAYMENT: return 'Paiement partiel';
      case StatisticPaymentStateType.WAITING: return 'En attente';
      case StatisticPaymentStateType.ENDED_CONTRACT: return 'Contrat terminé';
      case StatisticPaymentStateType.NO_CONTRACT: return 'Pas de contrat';
      default: return 'Inconnu';
    }
  }

  getPaymentStateColor(state: StatisticPaymentStateType): string {
    switch (state) {
      case StatisticPaymentStateType.PAYED: return 'bg-green-100 text-green-800';
      case StatisticPaymentStateType.UNPAYED: return 'bg-red-100 text-red-800';
      case StatisticPaymentStateType.PARTIAL_PAYMENT: return 'bg-yellow-100 text-yellow-800';
      case StatisticPaymentStateType.WAITING: return 'bg-blue-100 text-blue-800';
      case StatisticPaymentStateType.ENDED_CONTRACT: return 'bg-gray-100 text-gray-800';
      case StatisticPaymentStateType.NO_CONTRACT: return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
