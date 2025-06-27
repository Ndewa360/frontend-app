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

  constructor(private store: Store) {
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
    // Les données sont déjà chargées par le resolver, pas besoin de les recharger
    console.log('🎯 PropertyFinances - Initialisation avec données du resolver');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['propertyId'] && this.propertyId) {
      // Réinitialiser les observables avec le nouveau propertyId
      this.initializeObservables();
      console.log('🔄 PropertyFinances - Changement de propriété, observables réinitialisés');
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
    // TODO: Implémenter l'export des données
    console.log('Export des données:', exportData);
  }

  refreshData(): void {
    if (this.propertyId) {
      this.store.dispatch(
        new StatisticAction.RefreshStaticLocataireDataByPropertyIdAndYear(this.propertyId, this.selectedYear)
      );
    }
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
