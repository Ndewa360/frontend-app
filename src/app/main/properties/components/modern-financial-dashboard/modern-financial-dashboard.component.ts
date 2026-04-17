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
  totalReceived: number;
  totalExpected: number;
  collectionRate: number;
  shortfall: number;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number;
  averageRent: number;
  totalTenants: number;
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
    // Pour la section "Performance par bien", on utilise la PROJECTION
    // (mois couverts par le cumul des paiements depuis l'entrée)
    // et non les revenus bruts encaissés dans l'année.
    // Source : detailedMetrics.totalCoveredInYear + detailedMetrics.collectionRate
    const totalCoveredPark = (yearData.paymentProperty || []).reduce((s, pp) => {
      const metrics = pp.detailedMetrics;
      return s + ((metrics as any)?.totalCoveredInYear ?? metrics?.totalRevenue ?? 0);
    }, 0);

    this.propertiesSummary = (yearData.paymentProperty || []).map(pp => {
      const metrics = pp.detailedMetrics;

      // Projection : montant couvert dans l'année (pas les encaissements bruts)
      const covered  = (metrics as any)?.totalCoveredInYear ?? metrics?.totalRevenue ?? 0;
      const expected = metrics?.totalExpected ?? pp.amountProperty?.totalAmountToBeReceveid ?? 0;
      // Taux basé sur la projection
      const collectionRate = metrics?.collectionRate
        ?? (expected > 0 ? Math.round((covered / expected) * 100) : 0);

      const totalUnits    = metrics?.totalRooms    ?? 0;
      const occupiedUnits = metrics?.occupiedRooms ?? 0;
      const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
      const averageRent   = metrics?.averageRent ?? 0;

      // Dettes et avances basées sur la projection
      const totalArrears  = metrics?.totalDebts    ?? 0;
      const totalAdvances = metrics?.totalAdvances ?? 0;

      // Locataires
      const tenantsSummary = (pp as any).tenantsAnalysis?.summary;
      const totalTenants   = tenantsSummary?.totalTenants  ?? occupiedUnits;
      const lateTenants    = tenantsSummary?.lateTenants   ?? 0;
      const advanceTenants = tenantsSummary?.aheadTenants  ?? 0;

      const monthlyData: MonthlyRevenue[] = (pp.amountMonth || []).map((m: any) => ({
        monthIndex: m.month - 1,
        monthName:  this.MONTHS[m.month - 1] || `Mois ${m.month}`,
        received:   m.totalAmountReceived || 0,
        expected:   m.totalAmountToBeReceveid || 0
      }));

      return {
        propertyId:    pp.property._id,
        propertyName:  pp.property.name,
        totalReceived: covered,          // projection (pas encaissements bruts)
        totalExpected: expected,
        collectionRate,
        shortfall:     Math.max(0, expected - covered),
        totalUnits,
        occupiedUnits,
        occupancyRate,
        averageRent,
        totalTenants,
        lateTenants,
        advanceTenants,
        totalArrears,
        totalAdvances,
        revenueShare:  totalCoveredPark > 0 ? Math.round((covered / totalCoveredPark) * 100) : 0,
        monthlyData,
        performanceLevel: this.getPerformanceLevel(collectionRate)
      };
    });
  }

  private buildGlobalMetrics(yearData: StatisticPaymentOfAllPropertyByYear): void {
    const gm = yearData.globalMetrics;
    const py = yearData.paymentYear;

    const totalReceived = py?.totalAmountReceived  || 0;
    const totalExpected = py?.totalAmountToBeReceveid || 0;
    const collectionRate = totalExpected > 0
      ? Math.round((totalReceived / totalExpected) * 100 * 10) / 10 : 0;

    // Agrégations depuis propertiesSummary (source of truth = amountProperty brut)
    const totalUnits    = this.propertiesSummary.reduce((s, p) => s + p.totalUnits, 0);
    const occupiedUnits = this.propertiesSummary.reduce((s, p) => s + p.occupiedUnits, 0);
    const vacantUnits   = totalUnits - occupiedUnits;
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100 * 10) / 10 : 0;
    const averageRent   = occupiedUnits > 0
      ? Math.round(this.propertiesSummary.reduce((s, p) => s + p.averageRent * p.occupiedUnits, 0) / occupiedUnits)
      : 0;
    const potentialUnexploitedRevenue = vacantUnits * averageRent * 12;

    const activeProperties = this.propertiesSummary.filter(p => p.occupiedUnits > 0).length;
    const vacantProperties = this.propertiesSummary.filter(p => p.occupiedUnits === 0).length;

    const totalTenants   = this.propertiesSummary.reduce((s, p) => s + p.totalTenants, 0);
    const lateTenants    = this.propertiesSummary.reduce((s, p) => s + p.lateTenants, 0);
    const advanceTenants = this.propertiesSummary.reduce((s, p) => s + p.advanceTenants, 0);
    const upToDateTenants = totalTenants - lateTenants - advanceTenants;
    const lateTenantsRate = totalTenants > 0 ? Math.round((lateTenants / totalTenants) * 100) : 0;
    const totalArrears   = this.propertiesSummary.reduce((s, p) => s + p.totalArrears, 0);
    const totalAdvances  = this.propertiesSummary.reduce((s, p) => s + p.totalAdvances, 0);

    // Cautions agrégées depuis cautionsAnalysis si disponible
    const cautionsReceived = (yearData.paymentProperty || []).reduce((s, pp) => {
      const c = (pp as any).cautionsAnalysis?.summary;
      return s + (c?.totalCautionsReceived || 0);
    }, 0);
    const cautionsMissing = (yearData.paymentProperty || []).reduce((s, pp) => {
      const c = (pp as any).cautionsAnalysis?.summary;
      return s + (c?.roomsWithCautionUnpaid || 0);
    }, 0);

    this.globalMetrics = {
      totalReceived,
      totalExpected,
      collectionRate,
      shortfall:                  Math.max(0, totalExpected - totalReceived),
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
      upToDateTenants:    Math.max(0, upToDateTenants),
      lateTenants,
      advanceTenants,
      lateTenantsRate,
      totalArrears:       Math.round(totalArrears),
      totalAdvances:      Math.round(totalAdvances),
      totalCautionsReceived: Math.round(cautionsReceived),
      totalCautionsMissing:  cautionsMissing,
      totalCautionsToRefund: 0  // calculé si disponible dans future version
    };
  }

  private buildMonthlyParkData(yearData: StatisticPaymentOfAllPropertyByYear): void {
    const monthly = Array.from({ length: 12 }, (_, i) => ({
      monthIndex:     i,
      monthName:      this.MONTHS[i],
      totalProjected: 0,  // projection cumul (distributed depuis revenueDistribution)
      totalReceived:  0,  // revenus bruts encaissés (paymentValue)
      totalExpected:  0,
      projectionRate: 0,
      collectionRate: 0
    }));

    (yearData.paymentProperty || []).forEach(pp => {
      // Projection : depuis revenueDistribution.monthlyAnalysis.distributed
      const monthlyAnalysis = (pp as any).revenueDistribution?.monthlyAnalysis || [];
      monthlyAnalysis.forEach((ma: any) => {
        const idx = (ma.month || 0) - 1;
        if (idx >= 0 && idx < 12) {
          monthly[idx].totalProjected += ma.distributed || 0;
          monthly[idx].totalExpected  += ma.expected    || 0;
        }
      });

      // Revenus bruts : depuis amountMonth.totalAmountReceived
      (pp.amountMonth || []).forEach((m: any) => {
        const idx = m.month - 1;
        if (idx >= 0 && idx < 12) {
          monthly[idx].totalReceived += m.totalAmountReceived || 0;
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
      case 'revenue': sorted.sort((a, b) => b.totalReceived - a.totalReceived); break;
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
      ...this.monthlyParkData.map(m => Math.max(m.totalProjected, m.totalReceived))
    ) || 1;
  }

  // Conserver pour compatibilité template
  getMaxMonthlyReceived(): number { return this.getMaxMonthly(); }

  getBestMonth(): MonthlyParkData | null {
    if (!this.monthlyParkData.length) return null;
    return this.monthlyParkData.reduce((best, m) =>
      m.totalProjected > best.totalProjected ? m : best
    );
  }

  getWorstMonth(): MonthlyParkData | null {
    const withExpected = this.monthlyParkData.filter(m => m.totalExpected > 0);
    if (!withExpected.length) return null;
    return withExpected.reduce((worst, m) =>
      m.projectionRate < worst.projectionRate ? m : worst
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
