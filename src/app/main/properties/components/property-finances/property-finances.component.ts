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

  // Contrôle du rechargement pour éviter les cycles infinis
  private loadingAttempts: number = 0;
  private maxLoadingAttempts: number = 3;
  private lastLoadTime: number = 0;

  // Configuration des onglets finances
  financeTabs: Array<{
    id: 'dashboard' | 'overview' | 'tenants' | 'deposits' | 'monthly';
    label: string;
    icon: string;
    count?: number;
  }> = [
    {
      id: 'dashboard',
      label: 'Tableau de Bord',
      icon: 'dashboard'
    },
    {
      id: 'overview',
      label: 'Vue d\'ensemble',
      icon: 'analytics'
    },
    {
      id: 'tenants',
      label: 'Locataires',
      icon: 'user'
    },
    {
      id: 'deposits',
      label: 'Cautions',
      icon: 'security'
    },
    {
      id: 'monthly',
      label: 'Revenus',
      icon: 'money'
    }
  ];

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
    private excelExportService: ExcelExportService
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
    // S'assurer que l'année sélectionnée est valide
    this.ensureValidSelectedYear();

    // Remettre à zéro les compteurs
    this.resetLoadingAttempts();



    // Initialiser les observables et charger les données
    this.initializeObservables();
    this.setupDataSubscriptions();

    // Charger les données une seule fois au démarrage
    if (this.propertyId) {
      this.loadFinancialData();
    } else {
      console.warn('⚠️ PropertyId manquant lors de l\'initialisation');
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['propertyId'] && this.propertyId) {
      // S'assurer que l'année est valide lors du changement de propriété
      this.ensureValidSelectedYear();

      // Réinitialiser les observables avec le nouveau propertyId
      this.initializeObservables();
      this.loadFinancialData();

    }

    if (changes['selectedYear'] && this.propertyId) {
      // Recharger les données pour la nouvelle année
      this.initializeObservables();
      this.loadFinancialData();

    }
  }

  private initializeObservables(): void {
    if (!this.propertyId) {
      console.warn('⚠️ PropertyId non défini, impossible d\'initialiser les observables');
      return;
    }

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

    console.log(`🔄 CHARGEMENT FINANCIER - Propriété: ${this.propertyId}, Année: ${this.selectedYear}`);

    // Marquer comme en cours de chargement
    this.isLoading = true;

    try {
      // Déclencher l'action principale de rafraîchissement
      this.store.dispatch(
        new StatisticAction.RefreshStaticLocataireDataByPropertyIdAndYear(this.propertyId, this.selectedYear.toString())
      );

      // Vérifier les données existantes
      this.checkExistingData();
      
      // Timeout de sécurité pour arrêter le loading
      setTimeout(() => {
        if (this.isLoading) {
          console.warn('⚠️ Timeout de chargement atteint, arrêt forcé du loading');
          this.isLoading = false;
        }
      }, 10000); // 10 secondes maximum
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données financières:', error);
      this.isLoading = false;
    }
  }

  private checkExistingData(): void {
    // Vérifier les données existantes dans le store
    const roomStats = this.store.selectSnapshot(StatisticState.selectStateStatisticRoomByPropertyIdAndYear(this.propertyId, this.selectedYear));
    const tenantStats = this.store.selectSnapshot(StatisticState.selectStateStatisticLocataireByPropertyIdAndYear(this.propertyId, this.selectedYear));
    const paymentStats = this.store.selectSnapshot(StatisticState.selectStateStatisticAllPaymentLocataireByPropertyIdAndYear(this.propertyId, this.selectedYear));

    // Si aucune donnée n'est présente, déclencher les actions individuelles
    if (!roomStats || roomStats.length === 0) {
      this.store.dispatch(new StatisticAction.FetchStaticRoomDataByPropertyIdAndYear(this.propertyId, this.selectedYear.toString()));
    }

    if (!tenantStats || tenantStats.length === 0) {
      this.store.dispatch(new StatisticAction.FetchStaticLocataireDataByPropertyIdAndYear(this.propertyId, this.selectedYear.toString()));
    }

    if (!paymentStats || paymentStats.length === 0) {
      this.store.dispatch(new StatisticAction.FetchStaticAllPaymentLocataireDataByPropertyIdAndYear(this.propertyId, this.selectedYear.toString()));
    }

    // Charger la récapitulation pour l'année
    this.store.dispatch(new StatisticAction.FetchStatisticPaymentRecapitulationAccountOfAllPropertyByYear(this.selectedYear.toString()));
  }

  /**
   * Force le chargement de toutes les données nécessaires
   */
  private forceLoadAllData(): void {
    const currentTime = Date.now();

    // Éviter les rechargements trop fréquents (moins de 3 secondes)
    if (currentTime - this.lastLoadTime < 3000) {
      return;
    }

    // Limiter le nombre de tentatives
    if (this.loadingAttempts >= this.maxLoadingAttempts) {
      this.isLoading = false;
      return;
    }

    this.loadingAttempts++;
    this.lastLoadTime = currentTime;

    // Charger toutes les statistiques en parallèle
    const actions = [
      new StatisticAction.FetchStaticRoomDataByPropertyIdAndYear(this.propertyId, this.selectedYear.toString()),
      new StatisticAction.FetchStaticLocataireDataByPropertyIdAndYear(this.propertyId, this.selectedYear.toString()),
      new StatisticAction.FetchStaticAllPaymentLocataireDataByPropertyIdAndYear(this.propertyId, this.selectedYear.toString()),
      new StatisticAction.FetchStatisticPaymentRecapitulationAccountOfAllPropertyByYear(this.selectedYear.toString())
    ];

    this.store.dispatch(actions);

    // Vérifier le chargement après un délai plus long
    setTimeout(() => {
      this.checkDataLoadingStatus();
    }, 5000);
  }

  /**
   * Vérifie le statut de chargement des données
   */
  private checkDataLoadingStatus(): void {




    // Arrêter le loading dans tous les cas après vérification
    this.isLoading = false;

    // Si aucune donnée n'est chargée ET qu'on n'a pas atteint le max de tentatives
    if (!this.hasFinancialData() && this.loadingAttempts < this.maxLoadingAttempts) {

      setTimeout(() => {
        this.forceLoadAllData();
      }, 3000);
    } else if (this.hasFinancialData()) {

      this.resetLoadingAttempts();
    } else {
      console.error('❌ Échec du chargement après toutes les tentatives');
      this.resetLoadingAttempts();
    }
  }



  /**
   * Remet à zéro les compteurs de tentatives de chargement
   */
  resetLoadingAttempts(): void {
    this.loadingAttempts = 0;
    this.lastLoadTime = 0;

  }

  private setupDataSubscriptions(): void {
    console.log('🔍 Configuration des souscriptions aux données');
    
    // Combiner toutes les données financières avec gestion d'erreurs
    combineLatest([
      this.roomStatistics$,
      this.tenantStatistics$,
      this.paymentStatistics$,
      this.recapitulation$
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ([roomStats, tenantStats, paymentStats, recapStats]) => {
        try {
          console.log('📊 Données reçues:', {
            roomStats: roomStats?.length || 0,
            tenantStats: tenantStats?.length || 0,
            paymentStats: paymentStats?.length || 0,
            recapStats: recapStats?.length || 0
          });
          
          this.financialData = {
            yearlyStats: roomStats || [],
            tenantStats: tenantStats || [],
            paymentStats: paymentStats || [],
            recapitulation: this.findRecapForYear(recapStats)
          };

          // Validation des données
          this.validateFinancialData();

          // Arrêter le loading si on a des données valides
          if (this.hasFinancialData()) {
            this.isLoading = false;
            this.resetLoadingAttempts();
            console.log('✅ Données financières chargées et validées');
          } else if (!this.isLoading) {
            // Si pas de loading en cours et pas de données, relancer
            console.log('⚠️ Pas de données détectées, tentative de rechargement');
            setTimeout(() => this.forceLoadAllData(), 2000);
          }
          
        } catch (error) {
          console.error('❌ Erreur lors du traitement des données:', error);
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('❌ Erreur dans la souscription aux données:', error);
        this.isLoading = false;
      }
    });

    // Surveiller les états de chargement avec timeout
    this.loadingStates$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(states => {
      const anyLoading = Object.values(states).some(loading => loading);
      
      if (anyLoading !== this.isLoading) {
        console.log('🔄 État de chargement changé:', anyLoading);
        this.isLoading = anyLoading;
      }
    });
  }

  private validateFinancialData(): void {
    const warnings: string[] = [];
    
    // Vérifier la cohérence des données
    if (this.financialData.yearlyStats.length === 0 && 
        this.financialData.tenantStats.length === 0 && 
        this.financialData.paymentStats.length === 0) {
      warnings.push('Aucune donnée financière disponible');
    }
    
    // Vérifier la cohérence entre les différentes sources
    if (this.financialData.yearlyStats.length > 0 && this.financialData.paymentStats.length === 0) {
      warnings.push('Données de chambres présentes mais pas de statistiques de paiement');
    }
    
    if (warnings.length > 0) {
      console.warn('⚠️ Avertissements de validation:', warnings);
    }
  }

  private loadFinancialDataForYear(year: number): void {
    if (!this.propertyId) return;



    // Charger les statistiques pour l'année sélectionnée
    this.store.dispatch([
      new StatisticAction.FetchStaticRoomDataByPropertyIdAndYear(this.propertyId, year.toString()),
      new StatisticAction.FetchStaticLocataireDataByPropertyIdAndYear(this.propertyId, year.toString()),
      new StatisticAction.FetchStaticAllPaymentLocataireDataByPropertyIdAndYear(this.propertyId, year.toString()),
      new StatisticAction.FetchStatisticPaymentRecapitulationAccountOfAllPropertyByYear(year.toString())
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

  onYearChange(year: number | string): void {
    // Convertir en nombre si c'est une string
    const numericYear = typeof year === 'string' ? parseInt(year, 10) : year;

    if (isNaN(numericYear) || numericYear < 2020 || numericYear > 2030) {
      console.error('❌ Année invalide:', year);
      return;
    }

    console.log(`📅 CHANGEMENT D'ANNÉE: ${this.selectedYear} → ${numericYear}`);

    // Remettre à zéro les compteurs
    this.resetLoadingAttempts();

    // Marquer comme en cours de chargement
    this.isLoading = true;

    // Mettre à jour l'année sélectionnée
    const previousYear = this.selectedYear;
    this.selectedYear = numericYear;

    try {
      // Réinitialiser les observables avec la nouvelle année
      this.initializeObservables();

      // Charger les données pour la nouvelle année
      this.loadFinancialDataForYear(numericYear);
      
      // Timeout de sécurité
      setTimeout(() => {
        if (this.isLoading) {
          console.warn(`⚠️ Timeout pour l'année ${numericYear}, arrêt forcé`);
          this.isLoading = false;
        }
      }, 12000);
      
    } catch (error) {
      console.error('❌ Erreur lors du changement d\'année:', error);
      this.selectedYear = previousYear; // Restaurer l'année précédente
      this.isLoading = false;
    }
  }

  /**
   * Vérifie s'il y a des données financières disponibles avec validation améliorée
   */
  hasFinancialData(): boolean {
    const hasYearlyStats = this.financialData.yearlyStats.length > 0;
    const hasTenantStats = this.financialData.tenantStats.length > 0;
    const hasPaymentStats = this.financialData.paymentStats.length > 0;
    const hasRecapitulation = this.financialData.recapitulation !== null;

    // Logique améliorée : au minimum yearlyStats OU paymentStats
    const hasMinimalData = hasYearlyStats || hasPaymentStats;
    
    // Vérification de la qualité des données
    let dataQuality = 'none';
    if (hasYearlyStats && hasPaymentStats && hasTenantStats) {
      dataQuality = 'complete';
    } else if (hasYearlyStats || hasPaymentStats) {
      dataQuality = 'partial';
    }

    // console.log('🔍 Vérification des données financières:', {
    //   hasYearlyStats,
    //   hasTenantStats,
    //   hasPaymentStats,
    //   hasRecapitulation,
    //   hasMinimalData,
    //   dataQuality,
    //   propertyId: this.propertyId,
    //   selectedYear: this.selectedYear
    // });

    return hasMinimalData;
  }
  
  /**
   * Obtient le score de qualité des données (0-100)
   */
  getDataQualityScore(): number {
    let score = 0;
    
    if (this.financialData.yearlyStats.length > 0) score += 40;
    if (this.financialData.paymentStats.length > 0) score += 30;
    if (this.financialData.tenantStats.length > 0) score += 20;
    if (this.financialData.recapitulation !== null) score += 10;
    
    return score;
  }
  
  /**
   * Obtient le label de qualité des données
   */
  getDataQualityLabel(): string {
    const score = this.getDataQualityScore();
    
    if (score >= 90) return 'Excellente';
    if (score >= 70) return 'Bonne';
    if (score >= 50) return 'Moyenne';
    if (score >= 30) return 'Faible';
    return 'Insuffisante';
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
    if (!this.propertyId) {
      console.warn('⚠️ Impossible de rafraîchir: propertyId manquant');
      return;
    }

    console.log('🔄 RAFRAÎCHISSEMENT FORCÉ des données financières');
    
    // Marquer comme en cours de chargement
    this.isLoading = true;
    
    // Réinitialiser les compteurs
    this.resetLoadingAttempts();
    
    try {
      // Vider le cache et forcer le rechargement
      this.store.dispatch(new StatisticAction.ResetAllState());

      // Recharger toutes les données après un court délai
      setTimeout(() => {
        this.loadFinancialData();
      }, 200);
      
      // Timeout de sécurité
      setTimeout(() => {
        if (this.isLoading) {
          console.warn('⚠️ Timeout de rafraîchissement, arrêt forcé');
          this.isLoading = false;
        }
      }, 15000);
      
    } catch (error) {
      console.error('❌ Erreur lors du rafraîchissement:', error);
      this.isLoading = false;
    }
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
