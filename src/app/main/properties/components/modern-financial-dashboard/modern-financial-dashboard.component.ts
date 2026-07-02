import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { StatisticState, StatisticAction } from 'src/app/shared/store';
import { StatisticPaymentOfAllPropertyByYear } from 'src/app/shared/store/statistic-data/statistic.model';
import { PerformanceAlertsService } from 'src/app/main/statistics/services/performance-alerts.service';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface GlobalFinancialMetrics {
  // Bloc 1 — Performance financière
  totalReceived: number;
  totalExpected: number;
  collectionRate: number;
  shortfall: number;
  averageRevenuePerProperty: number;
  // Bloc 2 — Parc immobilier
  totalProperties: number;
  activeProperties: number;    // au moins 1 unité occupée
  vacantProperties: number;    // aucune unité occupée
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  occupancyRate: number;
  averageRentPerUnit: number;
  potentialUnexploitedRevenue: number;  // unités libres × loyer moyen × 12
  // Bloc 3 — Locataires
  totalTenants: number;
  upToDateTenants: number;
  lateTenants: number;
  advanceTenants: number;
  lateTenantsRate: number;     // % locataires en retard
  totalArrears: number;        // somme des dettes
  totalAdvances: number;       // somme des avances
  // Bloc 4 — Cautions
  totalCautionsReceived: number;
  totalCautionsMissing: number;    // unités occupées sans caution
  totalCautionsToRefund: number;   // contrats terminés, caution à restituer
}

export interface PropertySummary {
  propertyId: string;
  propertyName: string;
  totalReceived: number;       // encaissements réels de l'année (datePayment)
  totalCoveredInYear: number;  // montant couvert dans l'année (projection cumul)
  totalExpected: number;
  collectionRate: number;
  shortfall: number;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number;
  averageRent: number;
  totalTenants: number;
  upToDateTenants: number;
  lateTenants: number;
  advanceTenants: number;
  totalArrears: number;
  totalAdvances: number;
  revenueShare: number;         // % de contribution au revenu total du parc
  monthlyData: MonthlyRevenue[];
  performanceLevel: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface MonthlyRevenue {
  monthIndex: number;
  monthName: string;
  received: number;
  expected: number;
}

export interface MonthlyParkData {
  monthIndex: number;
  monthName: string;
  totalProjected: number;   // projection cumul (mois couverts par les paiements depuis l'entrée)
  totalReceived: number;    // revenus bruts encaissés dans le mois
  totalExpected: number;
  projectionRate: number;   // taux projection / attendu
  collectionRate: number;   // taux encaissé / attendu
}

// ─── Composant ───────────────────────────────────────────────────────────────

@Component({
  selector: 'app-modern-financial-dashboard',
  templateUrl: './modern-financial-dashboard.component.html',
  styleUrls: ['./modern-financial-dashboard.component.scss']
})
export class ModernFinancialDashboardComponent implements OnInit, OnDestroy {

  private destroy$          = new Subject<void>();
  private subscriptionReset$ = new Subject<void>();

  isLoading   = false;
  currentYear = new Date().getFullYear();
  selectedYear = this.currentYear;
  yearOptions: { value: number; label: string }[] = [];

  // Données traitées
  globalMetrics: GlobalFinancialMetrics | null = null;
  propertiesSummary: PropertySummary[] = [];
  monthlyParkData: MonthlyParkData[] = [];

  // Tri & filtre des biens
  sortBy: 'revenue' | 'rate' | 'name' = 'revenue';
  sortedProperties: PropertySummary[] = [];

  Math = Math; // Exposer Math au template

  private readonly MONTHS = [
    'Janvier','Février','Mars','Avril','Mai','Juin',
    'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
  ];

  constructor(
    private store: Store,
    private performanceAlertsService: PerformanceAlertsService
  ) {
    this.yearOptions = Array.from({ length: 5 }, (_, i) => ({
      value: this.currentYear - i,
      label: (this.currentYear - i).toString()
    }));
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.subscriptionReset$.next();
    this.subscriptionReset$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Chargement ────────────────────────────────────────────────────────────

  private loadData(): void {
    this.subscriptionReset$.next();
    this.isLoading = true;

    this.store.select(
      StatisticState.selectStateStatisticRecapitulationPaymentBydYear(this.selectedYear)
    ).pipe(
      takeUntil(this.subscriptionReset$),
      takeUntil(this.destroy$)
    ).subscribe((data: StatisticPaymentOfAllPropertyByYear[]) => {
      if (data && data.length > 0) {
        this.isLoading = false;
        this.process(data);
      }
    });

    this.store.dispatch(
      new StatisticAction.FetchStatisticPaymentRecapitulationAccountOfAllPropertyByYear(this.selectedYear)
    ).subscribe(() => {
      const cached = this.store.selectSnapshot(
        StatisticState.selectStateStatisticRecapitulationPaymentBydYear(this.selectedYear)
      );
      if (cached && cached.length > 0) {
        this.isLoading = false;
        this.process(cached);
      }
    });
  }

  // ─── Traitement des données ─────────────────────────────────────────────────

  private process(data: StatisticPaymentOfAllPropertyByYear[]): void {
    const yearData = data[0];
    if (!yearData) return;

    this.buildPropertiesSummary(yearData);
    this.buildGlobalMetrics(yearData);
    this.buildMonthlyParkData(yearData);
    this.applySortProperties();
    this.performanceAlertsService.loadAlertsFromRecapitulation(yearData);
  }

  private buildPropertiesSummary(yearData: StatisticPaymentOfAllPropertyByYear): void {
    // totalCoveredInYear (projection) sert de base pour revenueShare — cohérent avec collectionRate
    const totalCoveredPark = (yearData.paymentProperty || []).reduce((s, pp) =>
      s + (pp.detailedMetrics?.totalCoveredInYear ?? pp.amountProperty?.totalAmountReceived ?? 0), 0
    );

    this.propertiesSummary = (yearData.paymentProperty || []).map(pp => {
      const metrics = pp.detailedMetrics;

      // Encaissements réels de l'année (datePayment dans l'année)
      const totalReceived      = pp.amountProperty?.totalAmountReceived ?? 0;
      // Montant couvert dans l'année par la projection du cumul (base du collectionRate)
      const totalCoveredInYear = metrics?.totalCoveredInYear ?? totalReceived;
      const expected           = metrics?.totalExpected ?? pp.amountProperty?.totalAmountToBeReceveid ?? 0;
      // collectionRate = totalCoveredInYear / totalExpected (projection, cohérent avec le backend)
      const collectionRate     = expected > 0
        ? Math.round(Math.min((totalCoveredInYear / expected) * 100, 100) * 10) / 10
        : (metrics?.collectionRate ?? 0);

      const totalUnits    = metrics?.totalRooms    ?? 0;
      const occupiedUnits = metrics?.occupiedRooms ?? 0;
      // occupancyRate : toujours pondéré (occupiedUnits / totalUnits) pour cohérence avec le global
      const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 1000) / 10 : 0;
      const averageRent   = metrics?.averageRent ?? 0;

      const tenantsSummary  = pp.tenantsAnalysis?.summary;
      const totalTenants    = tenantsSummary?.totalTenants    ?? occupiedUnits;
      const lateTenants     = tenantsSummary?.lateTenants     ?? 0;
      const advanceTenants  = tenantsSummary?.aheadTenants    ?? 0;
      const upToDateTenants = tenantsSummary?.upToDateTenants ?? Math.max(0, totalTenants - lateTenants - advanceTenants);
      // Dettes et avances : source unique = tenantsAnalysis (depuis calculatePaymentStatus, cumul depuis entrée)
      const totalArrears  = tenantsSummary?.totalAmountBehind  ?? 0;
      const totalAdvances = tenantsSummary?.totalAdvanceAmount ?? 0;

      const monthlyData: MonthlyRevenue[] = (pp.amountMonth || []).map((m: any) => ({
        monthIndex: m.month - 1,
        monthName:  this.MONTHS[m.month - 1] || `Mois ${m.month}`,
        received:   m.totalAmountReceived    || 0,
        expected:   m.totalAmountToBeReceveid || 0
      }));

      return {
        propertyId:    pp.property._id,
        propertyName:  pp.property.name,
        totalReceived,
        totalCoveredInYear,
        totalExpected: expected,
        collectionRate,
        // shortfall = max(0, expected - totalCoveredInYear) — même base que collectionRate (projection)
        shortfall:     Math.max(0, expected - totalCoveredInYear),
        totalUnits,
        occupiedUnits,
        occupancyRate,
        averageRent,
        totalTenants,
        lateTenants,
        advanceTenants,
        upToDateTenants,
        totalArrears,
        totalAdvances,
        revenueShare:  totalCoveredPark > 0
          ? Math.round((totalCoveredInYear / totalCoveredPark) * 100) : 0,
        monthlyData,
        // performanceLevel depuis le backend directement si disponible
        performanceLevel: (metrics as any)?.performanceLevel ?? this.getPerformanceLevel(collectionRate)
      };
    });
  }

  private buildGlobalMetrics(yearData: StatisticPaymentOfAllPropertyByYear): void {
    const gm = yearData.globalMetrics;
    const py = yearData.paymentYear;

    // totalReceived = encaissements réels (datePayment dans l'année)
    const totalReceived  = py?.totalAmountReceived     || 0;
    const totalExpected  = py?.totalAmountToBeReceveid || 0;

    // collectionRate global = totalCoveredInYear / totalExpected (même base que par bien = projection)
    // On recalcule depuis propertiesSummary pour garantir la cohérence avec les taux par bien
    const totalCoveredGlobal = this.propertiesSummary.reduce((s, p) => s + p.totalCoveredInYear, 0);
    const collectionRate = totalExpected > 0
      ? Math.round(Math.min((totalCoveredGlobal / totalExpected) * 100, 100) * 10) / 10
      : (gm?.globalCollectionRate ?? 0);

    // occupancyRate global : toujours pondéré (totalOccupied / totalUnits) — jamais moyenne arithmétique
    const totalUnits    = gm?.totalRooms         ?? this.propertiesSummary.reduce((s, p) => s + p.totalUnits, 0);
    const occupiedUnits = gm?.totalOccupiedRooms ?? this.propertiesSummary.reduce((s, p) => s + p.occupiedUnits, 0);
    const vacantUnits   = totalUnits - occupiedUnits;
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 1000) / 10 : 0;
    const averageRent   = occupiedUnits > 0
      ? Math.round(this.propertiesSummary.reduce((s, p) => s + p.averageRent * p.occupiedUnits, 0) / occupiedUnits)
      : 0;
    const potentialUnexploitedRevenue = vacantUnits * averageRent * 12;

    const activeProperties = this.propertiesSummary.filter(p => p.occupiedUnits > 0).length;
    const vacantProperties = this.propertiesSummary.filter(p => p.occupiedUnits === 0).length;

    const totalTenants    = this.propertiesSummary.reduce((s, p) => s + p.totalTenants, 0);
    const lateTenants     = this.propertiesSummary.reduce((s, p) => s + p.lateTenants, 0);
    const advanceTenants  = this.propertiesSummary.reduce((s, p) => s + p.advanceTenants, 0);
    const upToDateTenants = this.propertiesSummary.reduce((s, p) => s + (p.upToDateTenants ?? 0), 0);
    const lateTenantsRate = totalTenants > 0 ? Math.round((lateTenants / totalTenants) * 100) : 0;
    // Dettes et avances : somme depuis propertiesSummary (source unique = tenantsAnalysis par bien)
    const totalArrears  = this.propertiesSummary.reduce((s, p) => s + p.totalArrears, 0);
    const totalAdvances = this.propertiesSummary.reduce((s, p) => s + p.totalAdvances, 0);

    const cautionsReceived = (yearData.paymentProperty || []).reduce((s, pp) =>
      s + (pp.cautionsAnalysis?.summary?.totalCautionsReceived || 0), 0
    );
    const cautionsMissing = (yearData.paymentProperty || []).reduce((s, pp) =>
      s + (pp.cautionsAnalysis?.summary?.roomsWithCautionUnpaid || 0), 0
    );
    // Cautions à rembourser : contrats terminés (endedAt < now) avec caution versée
    const now = new Date();
    const cautionsToRefund = (yearData.paymentProperty || []).reduce((s, pp) =>
      s + (pp.cautionsAnalysis?.roomsCautions || []).reduce((rs, rc) => {
        const endedAt = rc.location?.endedAt ? new Date(rc.location.endedAt) : null;
        return (endedAt && endedAt < now && rc.totalCautionPaid > 0)
          ? rs + rc.totalCautionPaid : rs;
      }, 0), 0
    );

    this.globalMetrics = {
      totalReceived,
      totalExpected,
      collectionRate,
      // shortfall depuis paymentYear.totalAmountRelicat (maintenant = max(0, expected - received) backend)
      // shortfall global = max(0, totalExpected - totalCoveredGlobal) — même base que collectionRate (projection)
      shortfall:                  Math.max(0, totalExpected - totalCoveredGlobal),
      averageRevenuePerProperty:  this.propertiesSummary.length > 0
        ? Math.round(totalReceived / this.propertiesSummary.length) : 0,
      totalProperties:    gm?.totalProperties ?? this.propertiesSummary.length,
      activeProperties,
      vacantProperties,
      totalUnits,
      occupiedUnits,
      vacantUnits,
      occupancyRate,
      averageRentPerUnit: averageRent,
      potentialUnexploitedRevenue,
      totalTenants,
      upToDateTenants,
      lateTenants,
      advanceTenants,
      lateTenantsRate,
      totalArrears:          Math.round(totalArrears),
      totalAdvances:         Math.round(totalAdvances),
      totalCautionsReceived: Math.round(cautionsReceived),
      totalCautionsMissing:  cautionsMissing,
      totalCautionsToRefund: Math.round(cautionsToRefund)
    };
  }

  private buildMonthlyParkData(yearData: StatisticPaymentOfAllPropertyByYear): void {
    const monthly = Array.from({ length: 12 }, (_, i) => ({
      monthIndex:     i,
      monthName:      this.MONTHS[i],
      totalProjected: 0,  // projection cumul (règle d'anniversaire, champ distributed)
      totalReceived:  0,  // encaissements réels (datePayment dans le mois, champ realReceived)
      totalExpected:  0,
      projectionRate: 0,
      collectionRate: 0
    }));

    (yearData.paymentProperty || []).forEach(pp => {
      const monthlyAnalysis = pp.revenueDistribution?.monthlyAnalysis || [];
      monthlyAnalysis.forEach((ma: any) => {
        const idx = (ma.month || 0) - 1;
        if (idx >= 0 && idx < 12) {
          // Projection : mois couverts par le cumul (règle d'anniversaire)
          monthly[idx].totalProjected += ma.distributed  || 0;
          // Encaissements réels : datePayment dans le mois
          monthly[idx].totalReceived  += ma.realReceived || 0;
          monthly[idx].totalExpected  += ma.expected     || 0;
        }
      });
    });

    this.monthlyParkData = monthly.map(m => ({
      ...m,
      totalProjected: Math.round(m.totalProjected),
      totalReceived:  Math.round(m.totalReceived),
      totalExpected:  Math.round(m.totalExpected),
      projectionRate: m.totalExpected > 0
        ? Math.round((m.totalProjected / m.totalExpected) * 100) : 0,
      collectionRate: m.totalExpected > 0
        ? Math.round((m.totalReceived  / m.totalExpected) * 100) : 0
    }));
  }

  // ─── Tri des biens ─────────────────────────────────────────────────────────

  applySortProperties(): void {
    const sorted = [...this.propertiesSummary];
    switch (this.sortBy) {
      // Tri par totalCoveredInYear (projection) — cohérent avec collectionRate et revenueShare
      case 'revenue': sorted.sort((a, b) => b.totalCoveredInYear - a.totalCoveredInYear); break;
      case 'rate':    sorted.sort((a, b) => b.collectionRate - a.collectionRate); break;
      case 'name':    sorted.sort((a, b) => a.propertyName.localeCompare(b.propertyName)); break;
    }
    this.sortedProperties = sorted;
  }

  onSortChange(sort: 'revenue' | 'rate' | 'name'): void {
    this.sortBy = sort;
    this.applySortProperties();
  }

  // ─── Événements ────────────────────────────────────────────────────────────

  onYearChange(event: Event): void {
    this.selectedYear = +(event.target as HTMLSelectElement).value;
    this.loadData();
  }

  // ─── Utilitaires template ──────────────────────────────────────────────────

  getPerformanceLevel(rate: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (rate >= 90) return 'excellent';
    if (rate >= 70) return 'good';
    if (rate >= 50) return 'fair';
    return 'poor';
  }

  getPerformanceLabel(level: string): string {
    const map = { excellent: 'Excellent', good: 'Bon', fair: 'Moyen', poor: 'Faible' };
    return map[level] || level;
  }

  getPerformanceClass(level: string): string {
    const map = {
      excellent: 'badge-excellent',
      good:      'badge-good',
      fair:      'badge-fair',
      poor:      'badge-poor'
    };
    return map[level] || 'badge-fair';
  }

  getRateClass(rate: number): string {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  }

  getBarColor(rate: number): string {
    if (rate >= 90) return '#10b981';
    if (rate >= 70) return '#f59e0b';
    return '#ef4444';
  }

  getMaxMonthly(): number {
    if (!this.monthlyParkData.length) return 1;
    return Math.max(
      ...this.monthlyParkData.map(m => Math.max(m.totalProjected, m.totalReceived, m.totalExpected))
    ) || 1;
  }

  // Conserver pour compatibilité template
  getMaxMonthlyReceived(): number { return this.getMaxMonthly(); }

  getBestMonth(): MonthlyParkData | null {
    if (!this.monthlyParkData.length) return null;
    // Meilleur mois = celui avec le plus d'encaissements réels
    return this.monthlyParkData.reduce((best, m) =>
      m.totalReceived > best.totalReceived ? m : best
    );
  }

  getWorstMonth(): MonthlyParkData | null {
    const withExpected = this.monthlyParkData.filter(m => m.totalExpected > 0);
    if (!withExpected.length) return null;
    // Pire mois = plus faible taux d'encaissement réel (cohérent avec getBestMonth)
    return withExpected.reduce((worst, m) =>
      m.collectionRate < worst.collectionRate ? m : worst
    );
  }

  formatPrice(value: number): string {
    if (!value && value !== 0) return '0 FCFA';
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency', currency: 'XAF', minimumFractionDigits: 0
    }).format(value);
  }

  formatPercent(value: number): string {
    return `${(value || 0).toFixed(1)}%`;
  }

  trackByPropertyId(_: number, p: PropertySummary): string {
    return p.propertyId;
  }

  trackByMonth(_: number, m: MonthlyParkData): number {
    return m.monthIndex;
  }
}
