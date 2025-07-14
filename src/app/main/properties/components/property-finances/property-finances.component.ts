import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { Store } from '@ngxs/store';
import { Subject, Observable, combineLatest } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import {
  StatisticState,
  StatisticAction,
  StatisticRoomYearModel,
  StatisticLocataireYearModel,
  StatisticAllPaymentLocataireYearModel,
  StatisticPaymentOfAllPropertyByYear,
  StatisticPaymentStateType
} from 'src/app/shared/store';
import { ExcelExportService } from 'src/app/shared/services/excel-export.service';
import { FinancialCalculationsService } from 'src/app/shared/services/financial-calculations.service';

export interface FinancialAnalysisData {
  yearlyStats: StatisticRoomYearModel[];
  tenantStats: StatisticLocataireYearModel[];
  paymentStats: StatisticAllPaymentLocataireYearModel[];
  recapitulation: StatisticPaymentOfAllPropertyByYear | null;
}

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

  // État local
  selectedYear: number = new Date().getFullYear();
  activeSection: 'dashboard' | 'overview' | 'tenants' | 'deposits' | 'monthly' = 'dashboard';
  isLoading: boolean = false;

  // Données financières
  financialData: FinancialAnalysisData = {
    yearlyStats: [],
    tenantStats: [],
    paymentStats: [],
    recapitulation: null
  };

  // Observables du store
  roomStatistics$: Observable<StatisticRoomYearModel[]>;
  tenantStatistics$: Observable<StatisticLocataireYearModel[]>;
  paymentStatistics$: Observable<StatisticAllPaymentLocataireYearModel[]>;
  recapitulation$: Observable<StatisticPaymentOfAllPropertyByYear[]>;
  loadingStates$: Observable<{
    room: boolean;
    tenant: boolean;
    payment: boolean;
    recap: boolean;
  }>;

  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private excelExportService: ExcelExportService,
    private financialCalculationsService: FinancialCalculationsService
  ) {
    // Les observables seront initialisés dans ngOnInit quand propertyId sera disponible
    this.loadingStates$ = combineLatest([
      this.store.select(StatisticState.selectStateLoadingRoomStatistic),
      this.store.select(StatisticState.selectStateLocataireStatisticLoading),
      this.store.select(StatisticState.selectStateAllLocatairePayementByYearLoading),
      this.store.select(StatisticState.selectStateLoadingStatisticRecaptilationLoading)
    ]).pipe(
      map(([room, tenant, payment, recap]) => ({
        room: Boolean(room),
        tenant: Boolean(tenant),
        payment: Boolean(payment),
        recap: Boolean(recap)
      }))
    );
  }

  ngOnInit(): void {
    this.initializeObservables();
    this.setupDataSubscriptions();

    // Charger les données si elles ne sont pas déjà présentes
    if (this.propertyId) {
      this.loadFinancialData();
    }

    console.log('🎯 PropertyFinances - Initialisation avec propertyId:', this.propertyId);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['propertyId'] && this.propertyId) {
      // Réinitialiser les observables avec le nouveau propertyId
      this.initializeObservables();
      this.loadFinancialData();
      console.log('🔄 PropertyFinances - Changement de propriété, rechargement des données');
    }

    if (changes['selectedYear'] && this.propertyId) {
      // Recharger les données pour la nouvelle année
      this.initializeObservables();
      this.loadFinancialData();
      console.log('🔄 PropertyFinances - Changement d\'année, rechargement des données');
    }
  }

  private initializeObservables(): void {
    if (!this.propertyId) {
      console.warn('⚠️ PropertyId non défini, impossible d\'initialiser les observables');
      return;
    }

    console.log(`🔧 Initialisation des observables pour la propriété: ${this.propertyId}`);

    // Utiliser les sélecteurs qui filtrent par propriété ET par année
    this.roomStatistics$ = this.store.select(StatisticState.selectStateStatisticRoomByPropertyIdAndYear(this.propertyId, this.selectedYear));
    this.tenantStatistics$ = this.store.select(StatisticState.selectStateStatisticLocataireByPropertyIdAndYear(this.propertyId, this.selectedYear));
    this.paymentStatistics$ = this.store.select(StatisticState.selectStateStatisticAllPaymentLocataireByPropertyIdAndYear(this.propertyId, this.selectedYear));
    this.recapitulation$ = this.store.select(StatisticState.selectStateStatisticRecapitulationPaymentBydYear(this.selectedYear));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // === MÉTHODES DE CHARGEMENT DES DONNÉES ===

  private loadFinancialData(): void {
    if (!this.propertyId) {
      console.warn('⚠️ Impossible de charger les données: propertyId manquant');
      return;
    }

    console.log('🚀 Chargement des données financières:', {
      propertyId: this.propertyId,
      year: this.selectedYear
    });

    // Déclencher toutes les actions nécessaires pour charger les données
    this.store.dispatch(
      new StatisticAction.RefreshStaticLocataireDataByPropertyIdAndYear(this.propertyId, this.selectedYear)
    );

    // Vérifier si les données sont déjà présentes dans le store
    this.checkExistingData();
  }

  private checkExistingData(): void {
    // Vérifier les données existantes dans le store
    const roomStats = this.store.selectSnapshot(StatisticState.selectStateStatisticRoomByPropertyIdAndYear(this.propertyId, this.selectedYear));
    const tenantStats = this.store.selectSnapshot(StatisticState.selectStateStatisticLocataireByPropertyIdAndYear(this.propertyId, this.selectedYear));
    const paymentStats = this.store.selectSnapshot(StatisticState.selectStateStatisticAllPaymentLocataireByPropertyIdAndYear(this.propertyId, this.selectedYear));

    console.log('📋 Données existantes dans le store:', {
      roomStats: roomStats?.length || 0,
      tenantStats: tenantStats?.length || 0,
      paymentStats: paymentStats?.length || 0
    });

    // Si aucune donnée n'est présente, déclencher les actions individuelles
    if (!roomStats || roomStats.length === 0) {
      console.log('🔄 Chargement des statistiques de chambres...');
      this.store.dispatch(new StatisticAction.FetchStaticRoomDataByPropertyIdAndYear(this.propertyId, this.selectedYear.toString()));
    }

    if (!tenantStats || tenantStats.length === 0) {
      console.log('🔄 Chargement des statistiques de locataires...');
      this.store.dispatch(new StatisticAction.FetchStaticLocataireDataByPropertyIdAndYear(this.propertyId, this.selectedYear));
    }

    if (!paymentStats || paymentStats.length === 0) {
      console.log('🔄 Chargement des statistiques de paiements...');
      this.store.dispatch(new StatisticAction.FetchStaticAllPaymentLocataireDataByPropertyIdAndYear(this.propertyId, this.selectedYear));
    }

    // Charger la récapitulation pour l'année
    console.log('🔄 Chargement de la récapitulation...');
    this.store.dispatch(new StatisticAction.FetchStatisticPaymentRecapitulationAccountOfAllPropertyByYear(this.selectedYear));
  }

  private setupDataSubscriptions(): void {
    // Combiner toutes les données financières
    combineLatest([
      this.roomStatistics$,
      this.tenantStatistics$,
      this.paymentStatistics$,
      this.recapitulation$
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([roomStats, tenantStats, paymentStats, recapStats]) => {
      this.financialData = {
        yearlyStats: roomStats || [],
        tenantStats: tenantStats || [],
        paymentStats: paymentStats || [],
        recapitulation: this.findRecapForYear(recapStats)
      };

      console.log('📊 Données financières mises à jour:', {
        yearlyStats: this.financialData.yearlyStats.length,
        tenantStats: this.financialData.tenantStats.length,
        paymentStats: this.financialData.paymentStats.length,
        propertyId: this.propertyId,
        year: this.selectedYear
      });

      // Diagnostiquer les données pour identifier les problèmes
      this.diagnoseFinancialData();
    });

    // Surveiller les états de chargement
    this.loadingStates$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(states => {
      this.isLoading = Object.values(states).some(loading => loading);
    });
  }

  private loadFinancialDataForYear(year: number): void {
    if (!this.propertyId) return;

    console.log(`🔄 Chargement des données financières pour l'année ${year}`);

    // Charger les statistiques pour l'année sélectionnée
    this.store.dispatch([
      new StatisticAction.FetchStaticRoomDataByPropertyIdAndYear(this.propertyId, year.toString()),
      new StatisticAction.FetchStaticLocataireDataByPropertyIdAndYear(this.propertyId, year),
      new StatisticAction.FetchStaticAllPaymentLocataireDataByPropertyIdAndYear(this.propertyId, year),
      new StatisticAction.FetchStatisticPaymentRecapitulationAccountOfAllPropertyByYear(year)
    ]);
  }



  private findRecapForYear(recapStats: StatisticPaymentOfAllPropertyByYear[] | null | undefined): StatisticPaymentOfAllPropertyByYear | null {
    if (!recapStats || !Array.isArray(recapStats)) {
      return null;
    }
    return recapStats.find(recap =>
      recap && recap.year && recap.year.toString() === this.selectedYear.toString()
    ) || null;
  }

  // === MÉTHODES D'ACTIONS ===

  onYearChange(year: number): void {
    this.selectedYear = year;
    // Réinitialiser les observables avec la nouvelle année
    this.initializeObservables();
    this.loadFinancialDataForYear(year);
  }

  /**
   * Vérifie s'il y a des données financières disponibles pour l'année sélectionnée
   */
  hasFinancialData(): boolean {
    return this.financialData.yearlyStats.length > 0 ||
           this.financialData.tenantStats.length > 0 ||
           this.financialData.paymentStats.length > 0 ||
           this.financialData.recapitulation !== null;
  }

  /**
   * Vérifie s'il y a au moins quelques données (pour affichage conditionnel)
   */
  hasPartialData(): boolean {
    return this.hasFinancialData();
  }

  /**
   * Vérifie si l'année est complètement vide (aucune donnée du tout)
   */
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

  onSectionChange(section: 'dashboard' | 'overview' | 'tenants' | 'deposits' | 'monthly'): void {
    this.activeSection = section;
  }

  getSectionLabel(section: string): string {
    const labels = {
      'dashboard': 'Tableau de Bord',
      'overview': 'Vue d\'ensemble',
      'tenants': 'Locataires',
      'deposits': 'Cautions',
      'monthly': 'Revenus'
    };
    return labels[section as keyof typeof labels] || section;
  }

  getCurrentSectionIndex(): number {
    const sections = ['dashboard', 'overview', 'tenants', 'deposits', 'monthly'];
    return sections.indexOf(this.activeSection);
  }

  getTotalSections(): number {
    return 5; // Nombre total de sections
  }

  getSectionProgress(): number {
    const currentIndex = this.getCurrentSectionIndex();
    const totalSections = this.getTotalSections();
    return ((currentIndex + 1) / totalSections) * 100;
  }

  onExportData(exportData: ExportData): void {
    console.log('📊 Export des données financières:', exportData);

    if (exportData.type === 'excel') {
      this.exportToExcel(exportData);
    } else if (exportData.type === 'csv') {
      this.exportToCSV(exportData);
    }
  }

  private exportToExcel(exportData: ExportData): void {
    try {
      // Ajouter des métadonnées à l'export
      const enrichedData = this.enrichExportData(exportData.data);

      this.excelExportService.exportToExcel(
        enrichedData,
        exportData.filename,
        {
          sheetName: this.getSheetName(),
          includeMetadata: true,
          metadata: {
            propertyId: this.propertyId,
            year: this.selectedYear,
            exportDate: new Date().toLocaleDateString('fr-FR'),
            section: this.activeSection
          }
        }
      );

      console.log('✅ Export Excel réussi:', exportData.filename);
    } catch (error) {
      console.error('❌ Erreur lors de l\'export Excel:', error);
    }
  }

  private exportToCSV(exportData: ExportData): void {
    try {
      const csvContent = this.convertToCSV(exportData.data);
      this.downloadCSV(csvContent, exportData.filename);
      console.log('✅ Export CSV réussi:', exportData.filename);
    } catch (error) {
      console.error('❌ Erreur lors de l\'export CSV:', error);
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
      dashboard: 'Tableau de bord',
      overview: 'Vue d\'ensemble',
      tenants: 'Locataires',
      deposits: 'Cautions',
      monthly: 'Revenus mensuels'
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
    if (this.propertyId) {
      console.log('🔄 Actualisation forcée des données financières:', {
        propertyId: this.propertyId,
        year: this.selectedYear
      });

      // Vider le cache et forcer le rechargement
      this.store.dispatch(new StatisticAction.ResetAllState());

      // Recharger toutes les données
      setTimeout(() => {
        this.loadFinancialData();
      }, 100);
    }
  }

  /**
   * Diagnostiquer les données financières pour identifier les problèmes
   */
  private diagnoseFinancialData(): void {
    console.log('🔍 Diagnostic des données financières:');

    // Vérifier les données de base
    const hasRoomStats = this.financialData.yearlyStats.length > 0;
    const hasTenantStats = this.financialData.tenantStats.length > 0;
    const hasPaymentStats = this.financialData.paymentStats.length > 0;
    const hasRecapitulation = !!this.financialData.recapitulation;

    console.log('  📋 État des données:', {
      hasRoomStats,
      hasTenantStats,
      hasPaymentStats,
      hasRecapitulation
    });

    // Analyser les données de chambres
    if (hasRoomStats) {
      const roomsWithPrice = this.financialData.yearlyStats.filter(room => room.room?.price > 0);
      const roomsWithPayments = this.financialData.yearlyStats.filter(room =>
        room.paymentValue && room.paymentValue.some(payment => payment > 0)
      );

      console.log('  🏠 Analyse des chambres:', {
        totalRooms: this.financialData.yearlyStats.length,
        roomsWithPrice: roomsWithPrice.length,
        roomsWithPayments: roomsWithPayments.length
      });

      // Détailler quelques chambres
      this.financialData.yearlyStats.slice(0, 3).forEach((room, index) => {
        console.log(`    Chambre ${index + 1}:`, {
          code: room.room?.code,
          price: room.room?.price,
          payments: room.paymentValue,
          totalReceived: room.paymentValue?.reduce((sum, p) => sum + (p || 0), 0) || 0
        });
      });
    }

    // Analyser les paiements
    if (hasPaymentStats) {
      let totalPaid = 0;
      let totalDue = 0;

      this.financialData.paymentStats.forEach(payment => {
        payment.paymentState?.forEach(state => {
          totalDue += state.price || 0;
          if (state.state === 'payed') {
            totalPaid += state.unitLocationPaymentPrice || state.price || 0;
          } else if (state.state === 'partialPayment') {
            totalPaid += state.price || 0;
          }
        });
      });

      console.log('  💰 Analyse des paiements:', {
        totalPayments: this.financialData.paymentStats.length,
        totalPaid,
        totalDue,
        collectionRate: totalDue > 0 ? (totalPaid / totalDue * 100).toFixed(1) + '%' : '0%'
      });
    }

    // Calculer les métriques avec le service
    if (hasRoomStats) {
      const metrics = this.financialCalculationsService.calculateFinancialMetrics(
        this.financialData.yearlyStats,
        this.financialData.recapitulation
      );
      console.log('  📊 Métriques calculées:', metrics);
    }

    // Si aucune donnée n'est trouvée, tester les endpoints directement
    if (!hasRoomStats && !hasTenantStats && !hasPaymentStats) {
      console.log('⚠️ Aucune donnée trouvée, test des endpoints...');
      this.testBackendEndpoints();
    }
  }

  /**
   * Tester directement les endpoints backend pour diagnostiquer les problèmes
   */
  private testBackendEndpoints(): void {
    if (!this.propertyId) return;

    console.log('🧪 Test des endpoints backend...');

    // Test endpoint des statistiques de chambres
    fetch(`/api/statistic-location-payment/statistic-payement-by-room/${this.propertyId}/${this.selectedYear}/`)
      .then(response => response.json())
      .then(data => {
        console.log('📊 Réponse endpoint chambres:', data);
      })
      .catch(error => {
        console.error('❌ Erreur endpoint chambres:', error);
      });

    // Test endpoint des statistiques de locataires
    fetch(`/api/statistic-location-payment/statistic-payement-by-locataire/${this.propertyId}/${this.selectedYear}/`)
      .then(response => response.json())
      .then(data => {
        console.log('👥 Réponse endpoint locataires:', data);
      })
      .catch(error => {
        console.error('❌ Erreur endpoint locataires:', error);
      });

    // Test endpoint des paiements
    fetch(`/api/statistic-location-payment/statistic-payement-all-inyear/${this.propertyId}/${this.selectedYear}/`)
      .then(response => response.json())
      .then(data => {
        console.log('💰 Réponse endpoint paiements:', data);
      })
      .catch(error => {
        console.error('❌ Erreur endpoint paiements:', error);
      });
  }

  // === MÉTHODES UTILITAIRES ===

  getAvailableYears(): number[] {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
      years.push(i);
    }
    return years;
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

  /**
   * Méthode de debug pour vérifier l'état du store
   */
  debugStoreState(): void {
    console.log('🔍 État actuel du store:');

    // Vérifier l'état complet du store
    const fullState = this.store.selectSnapshot(StatisticState);
    console.log('  📋 État complet:', fullState);

    // Vérifier les données spécifiques
    const roomStats = this.store.selectSnapshot(StatisticState.selectStateStatisticRoomByPropertyIdAndYear(this.propertyId, this.selectedYear));
    const tenantStats = this.store.selectSnapshot(StatisticState.selectStateStatisticLocataireByPropertyIdAndYear(this.propertyId, this.selectedYear));
    const paymentStats = this.store.selectSnapshot(StatisticState.selectStateStatisticAllPaymentLocataireByPropertyIdAndYear(this.propertyId, this.selectedYear));

    console.log('  🏠 Statistiques chambres:', roomStats);
    console.log('  👥 Statistiques locataires:', tenantStats);
    console.log('  💰 Statistiques paiements:', paymentStats);

    // Vérifier les états de chargement
    const loadingStates = {
      room: this.store.selectSnapshot(StatisticState.selectStateLoadingRoomStatistic),
      tenant: this.store.selectSnapshot(StatisticState.selectStateLocataireStatisticLoading),
      payment: this.store.selectSnapshot(StatisticState.selectStateAllLocatairePayementByYearLoading),
      recap: this.store.selectSnapshot(StatisticState.selectStateLoadingStatisticRecaptilationLoading)
    };

    console.log('  ⏳ États de chargement:', loadingStates);
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
