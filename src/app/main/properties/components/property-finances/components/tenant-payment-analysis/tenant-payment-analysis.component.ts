import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import {
  EnrichedStatisticResponse,
  StatisticPaymentStateType
} from 'src/app/shared/store';
import { Store } from '@ngxs/store';
import { ExportData } from '../../property-finances.component';

export interface TenantFinancialAnalysis {
  tenantId: string;
  tenantName: string;
  roomCode: string;
  monthlyRent: number;
  entryDate: Date;
  monthsElapsed: number;
  // Cumul depuis l'entrée (pour information)
  totalPaid: number;
  expectedPaymentToDate: number;
  // Statut par rapport à aujourd'hui
  status: string;
  monthsBehind: number;
  amountBehind: number;
  advanceAmount: number;
  advanceMonths: number;
  lastPaymentMonth: number;
  paymentConsistency: number;
  monthlyPayments: number[];
  // Projection sur l'année sélectionnée
  coveredMonthsInYear: number;
  monthsDueInYear: number;
  coveredAmountInYear: number;
  coveredUntilDate: Date | null;
  totalMonthsCovered: number;
  expectedFullYear: number;   // loyer × 12 (attendu pour l'année complète)
  rateVsToday: number;        // taux couvert / mois dus à ce jour
  // Dates de paiement
  lastPaymentDate: Date | null;
  nextPaymentDate: Date | null;
  // Taux de couverture de l'année complète
  paymentRate: number;
  // Compatibilité
  totalExpected: number;
  totalReceived: number;
}

@Component({
  selector: 'app-tenant-payment-analysis',
  templateUrl: './tenant-payment-analysis.component.html',
  styleUrls: ['./tenant-payment-analysis.component.scss']
})
export class TenantPaymentAnalysisComponent implements OnInit, OnChanges {
  @Input() enrichedData: EnrichedStatisticResponse[] = [];
  @Input() selectedYear: number = new Date().getFullYear();
  @Input() propertyId: string = '';
  @Input() isLoading: boolean = false;

  @Output() exportData = new EventEmitter<ExportData>();

  tenantAnalyses: TenantFinancialAnalysis[] = [];
  filteredAnalyses: TenantFinancialAnalysis[] = [];
  filteredSummaries: TenantFinancialAnalysis[] = [];

  // Dates de référence pour les comparaisons dans le template
  today: Date = new Date();
  in30Days: Date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  
  // Filtres
  statusFilter: 'all' | 'excellent' | 'good' | 'warning' | 'critical' = 'all';
  searchTerm: string = '';
  selectedMonth: number = -1; // -1 = tous les mois

  // Statistiques globales
  globalStats = {
    totalTenants: 0,
    excellentTenants: 0,
    goodTenants: 0,
    warningTenants: 0,
    criticalTenants: 0,
    averagePaymentRate: 0
  };

  constructor(
    private store: Store
  ) {}

  ngOnInit(): void {
    this.processTenantData();
  }

  ngOnChanges(): void {
    this.processTenantData();
  }

  private processTenantData(): void {
    this.tenantAnalyses = [];

    if (!this.enrichedData || this.enrichedData.length === 0) {
      this.calculateGlobalStats();
      this.applyFilters();
      return;
    }

    this.tenantAnalyses = this.enrichedData[0].data.tenantsAnalysis.tenants
      .filter(tenant => tenant.locataire !== null)
      .map(tenant => {
        const fa = tenant.financialAnalysis;

        // Loyer réel de la chambre (room.price) — plus fiable que fa.monthlyRent
        // qui peut venir de locationPriceUnit mal renseigné
        const roomPrice = (tenant.room as any)?.price || fa.monthlyRent;

        // --- Projection sur l'année sélectionnée ---
        const coveredMonthsInYear = (fa as any).coveredMonthsInYear ?? 0;
        const monthsDueInYear     = (fa as any).monthsDueInYear     ?? 0;
        const coveredAmountInYear = (fa as any).coveredAmountInYear ?? 0;
        const totalMonthsCovered  = (fa as any).totalMonthsCovered  ?? 0;

        // Montant attendu pour l'année complète basé sur room.price
        const expectedFullYear = roomPrice * 12;

        // Taux de couverture par rapport à l'année complète
        // Ex: 60 000 couverts / 180 000 attendus (12 mois) = 33%
        const paymentRate = expectedFullYear > 0
          ? Math.min((coveredAmountInYear / expectedFullYear) * 100, 100)
          : 0;

        // Taux par rapport aux mois dus à ce jour (pour le statut)
        const rateVsToday = monthsDueInYear > 0
          ? Math.min((coveredMonthsInYear / monthsDueInYear) * 100, 100)
          : 0;

        // --- Statut par rapport à aujourd'hui (date de consultation) ---
        // Basé sur le cumul depuis l'entrée vs attendu jusqu'à aujourd'hui
        // status = 'up_to_date' | 'advance' | 'behind'
        const status = fa.status;

        // --- Dates de paiement ---
        const lastPaymentDate = (fa as any).lastPaymentDate
          ? new Date((fa as any).lastPaymentDate) : null;
        const nextPaymentDate = (fa as any).nextPaymentDate
          ? new Date((fa as any).nextPaymentDate) : null;

        return {
          tenantId:   tenant.locataire?._id || tenant.room?._id || '',
          tenantName: tenant.locataire?.fullName || 'Locataire inconnu',
          roomCode:   tenant.room?.code || 'N/A',
          monthlyRent:   roomPrice,  // room.price (loyer réel)
          entryDate:     new Date(fa.entryDate),
          monthsElapsed: fa.monthsElapsed,
          // Cumul depuis l'entrée (pour information)
          totalPaid:             fa.totalPaid,
          expectedPaymentToDate: fa.expectedPaymentToDate,
          // Statut par rapport à aujourd'hui
          status,
          monthsBehind:  (fa as any).lateMonths    ?? fa.monthsBehind ?? 0,
          amountBehind:  fa.amountBehind,
          advanceAmount: fa.advanceAmount,
          advanceMonths: (fa as any).advanceMonths ?? 0,
          lastPaymentMonth:   fa.lastPaymentMonth,
          paymentConsistency: fa.paymentConsistency,
          monthlyPayments:    fa.monthlyPayments,
          // Projection sur l'année
          coveredMonthsInYear,
          monthsDueInYear,
          coveredAmountInYear,
          coveredUntilDate:    (fa as any).coveredUntilDate
            ? new Date((fa as any).coveredUntilDate) : null,
          totalMonthsCovered,
          expectedFullYear,    // loyer × 12 (attendu pour l'année complète)
          rateVsToday,         // taux par rapport aux mois dus à ce jour
          // Dates de paiement
          lastPaymentDate,
          nextPaymentDate,
          // Taux de couverture de l'année complète
          paymentRate,
          // Compatibilité
          totalExpected: fa.expectedPaymentToDate,
          totalReceived: fa.totalPaid
        };
      });

    this.calculateGlobalStats();
    this.applyFilters();
  }



  private calculateGlobalStats(): void {
    // FIX #F12 : mapping aligné sur les statuts réels du backend
    // Backend envoie : 'up_to_date' | 'advance' | 'behind' | 'unknown'
    const totalTenants = this.tenantAnalyses.length;

    const excellentTenants = this.tenantAnalyses.filter(t =>
      t.status === 'up_to_date' || t.status === 'advance').length;
    const goodTenants = this.tenantAnalyses.filter(t =>
      t.status === 'up_to_date' && this.getPaymentRate(t) >= 95).length;
    const warningTenants = this.tenantAnalyses.filter(t =>
      t.status === 'behind' && this.getPaymentRate(t) >= 50).length;
    const criticalTenants = this.tenantAnalyses.filter(t =>
      t.status === 'behind' && this.getPaymentRate(t) < 50).length;

    const averagePaymentRate = totalTenants > 0
      ? this.tenantAnalyses.reduce((sum, t) => sum + this.getPaymentRate(t), 0) / totalTenants
      : 0;

    this.globalStats = {
      totalTenants,
      excellentTenants,
      goodTenants,
      warningTenants,
      criticalTenants,
      averagePaymentRate: Math.round(averagePaymentRate * 100) / 100
    };
  }
  
  private getPaymentRate(tenant: TenantFinancialAnalysis): number {
    return tenant.paymentRate;
  }

  // === MÉTHODES DE FILTRAGE ===

  applyFilters(): void {
    // FIX #F13 : mapping aligné sur les statuts réels du backend
    // Backend : 'up_to_date' | 'advance' | 'behind' | 'unknown'
    this.filteredAnalyses = this.tenantAnalyses.filter(tenant => {
      const paymentRate = this.getPaymentRate(tenant);
      const mappedStatus = this.getMappedStatus(tenant);

      if (this.statusFilter !== 'all' && mappedStatus !== this.statusFilter) {
        return false;
      }

      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        if (!tenant.tenantName.toLowerCase().includes(searchLower) &&
            !tenant.roomCode.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
    this.filteredSummaries = this.filteredAnalyses;
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  // === MÉTHODES D'EXPORT ===

  onExportTenantAnalysis(): void {
    const exportData = this.filteredAnalyses.map(tenant => ({
      'Locataire': tenant.tenantName,
      'Chambre': tenant.roomCode,
      'Loyer mensuel': tenant.monthlyRent,
      'Mois écoulés': tenant.monthsElapsed,
      'Total payé': tenant.totalPaid,
      'Attendu à ce jour': tenant.expectedPaymentToDate,
      'Taux de paiement': `${this.getPaymentRate(tenant).toFixed(1)}%`,
      'Statut': this.getStatusLabel(tenant.status),
      'Mois de retard': tenant.monthsBehind,
      'Montant en retard': tenant.amountBehind,
      'Montant d\'avance': tenant.advanceAmount,
      'Consistance paiement': `${tenant.paymentConsistency.toFixed(1)}%`,
      'Date d\'entrée': tenant.entryDate.toLocaleDateString('fr-FR'),
      'Année': this.selectedYear
    }));

    this.exportData.emit({
      type: 'excel',
      data: exportData,
      filename: `analyse-locataires-${this.selectedYear}`
    });
  }

  // === MÉTHODES UTILITAIRES ===

  formatPrice(price: number | null | undefined): string {
    if (price === null || price === undefined || isNaN(price as number)) return '0 FCFA';
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
      case StatisticPaymentStateType.PARTIAL_PAYMENT: return 'Partiel';
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

  trackByTenantId(_: number, tenant: TenantFinancialAnalysis): string {
    return tenant.tenantId;
  }
  
  // Labels et couleurs pour tous les statuts possibles
  getStatusLabel(status: string): string {
    switch (status) {
      case 'up_to_date':     return 'TENANT_PAYMENT_TRACKING.STATUS_LABELS.UP_TO_DATE';
      case 'advance':        return 'TENANT_PAYMENT_TRACKING.STATUS_LABELS.AHEAD';
      case 'behind':         return 'TENANT_PAYMENT_TRACKING.STATUS_LABELS.LATE';
      case 'late':           return 'TENANT_PAYMENT_TRACKING.STATUS_LABELS.LATE';
      case 'critical':       return 'TENANT_PAYMENT_TRACKING.STATUS_LABELS.LATE';
      case 'no_payment':     return 'TENANT_PAYMENT_TRACKING.STATUS_LABELS.LATE';
      case 'ahead':          return 'TENANT_PAYMENT_TRACKING.STATUS_LABELS.AHEAD';
      case 'no_contract':    return 'TENANT_PAYMENT_TRACKING.STATUS_LABELS.NO_CONTRACT';
      case 'ended_contract': return 'TENANT_PAYMENT_TRACKING.STATUS_LABELS.ENDED_CONTRACT';
      // 'unknown' et tout autre statut → à jour par défaut (locataire en avance)
      default:               return 'TENANT_PAYMENT_TRACKING.STATUS_LABELS.UP_TO_DATE';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'up_to_date':     return 'bg-green-100 text-green-800';
      case 'advance':        return 'bg-blue-100 text-blue-800';
      case 'behind':         return 'bg-red-100 text-red-800';
      case 'late':           return 'bg-red-100 text-red-800';
      case 'critical':       return 'bg-red-100 text-red-800';
      case 'no_payment':     return 'bg-red-100 text-red-800';
      case 'ahead':          return 'bg-blue-100 text-blue-800';
      case 'no_contract':    return 'bg-gray-100 text-gray-800';
      case 'ended_contract': return 'bg-purple-100 text-purple-800';
      // 'unknown' → vert (locataire en avance, couvert au-delà des mois dus)
      default:               return 'bg-green-100 text-green-800';
    }
  }
  
  getCalculationStatusColor = this.getStatusColor;
  getCalculationStatusLabel = this.getStatusLabel;
  
  // FIX #F12/#F13 : mapping aligné sur les statuts réels du backend
  // Backend : 'up_to_date' | 'advance' | 'behind' | 'unknown'
  getMappedStatus(tenant: TenantFinancialAnalysis): 'excellent' | 'good' | 'warning' | 'critical' {
    const paymentRate = this.getPaymentRate(tenant);
    if (tenant.status === 'advance') return 'excellent';          // En avance → excellent
    if (tenant.status === 'up_to_date') return 'excellent';       // À jour → excellent
    if (tenant.status === 'behind' && paymentRate >= 50) return 'warning';  // Retard modéré
    if (tenant.status === 'behind' && paymentRate < 50) return 'critical';  // Retard critique
    return 'good'; // 'unknown' ou cas non couverts
  }
  

}
