import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import {
  EnrichedStatisticResponse
} from 'src/app/shared/store';
import { Store } from '@ngxs/store';
import { TranslateService } from '@ngx-translate/core';
import { TranslationUtilsService } from 'src/app/shared/services/translation-utils.service';
import { ExportData } from '../../property-finances.component';
import { PropertyFinancialManagerService } from 'src/app/main/properties/services/property-financial-manager.service';



export interface PaymentSummary {
  totalTenants: number;
  upToDateTenants: number;
  lateTenants: number;
  partialPaymentTenants: number;
  aheadTenants: number;
  behindTenants: number;
  totalExpectedRevenue: number;
  totalReceivedRevenue: number;
  totalAdvanceAmount: number;
  totalAmountBehind: number;
  globalPaymentRate: number;
  averageConsistency: number;
}

export interface TenantTrackingData {
  tenantId: string;
  tenantName: string;
  roomCode: string;
  monthlyRent: number;
  entryDate: Date;
  monthsElapsed: number;
  totalPaid: number;
  expectedPaymentToDate: number;
  status: string;
  monthsBehind: number;
  amountBehind: number;
  advanceAmount: number;
  paymentConsistency: number;
  paymentRate: number;
  lastPaymentMonth: number;
  // ✅ Dates de paiement
  lastPaymentDate?: Date | null;
  nextPaymentDate?: Date | null;
  // Propriétés pour compatibilité template
  totalExpected: number;
  totalReceived: number;
  monthsOccupied: number;
  contractStatus: string;
  totalPaidAllTime?: number;  // cumul brut depuis l'entrée (toutes années)
}

@Component({
  selector: 'app-tenant-payment-tracking',
  templateUrl: './tenant-payment-tracking.component.html',
  styleUrls: ['./tenant-payment-tracking.component.scss']
})
export class TenantPaymentTrackingComponent implements OnInit, OnChanges {
  @Input() enrichedData: EnrichedStatisticResponse [] = [];
  @Input() selectedYear: number = new Date().getFullYear();
  @Input() isLoading: boolean = false;
  @Input() propertyId: string = '';

  @Output() exportData = new EventEmitter<ExportData>();

  tenantTrackingData: TenantTrackingData[] = [];
  paymentSummary: PaymentSummary = {
    totalTenants: 0,
    upToDateTenants: 0,
    lateTenants: 0,
    partialPaymentTenants: 0,
    aheadTenants: 0,
    behindTenants: 0,
    totalExpectedRevenue: 0,
    totalReceivedRevenue: 0,
    totalAdvanceAmount: 0,
    totalAmountBehind: 0,
    globalPaymentRate: 0,
    averageConsistency: 0
  };

  selectedPeriod: 'all' | 'last_2_months' | 'current_month' = 'all';
  // Statuts normalisés par le backend : 'up_to_date' | 'advance' | 'behind'
  selectedStatus: 'all' | 'up_to_date' | 'advance' | 'behind' = 'all';
  searchTerm: string = '';

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  paginatedTenants: TenantTrackingData[] = [];

  constructor(
    private store: Store,
    private translateService: TranslateService,
    private translationUtils: TranslationUtilsService
  ) { }

  ngOnInit(): void {
    this.processTenantPaymentData();
  }

  ngOnChanges(): void {
    this.processTenantPaymentData();
  }

  private processTenantPaymentData(): void {
    this.tenantTrackingData = [];

    if (this.enrichedData.length === 0) {
      this.calculatePaymentSummary();
      this.updatePagination();
      return;
    }

    this.tenantTrackingData = this.enrichedData[0].data.tenantsAnalysis.tenants
      .filter(tenant => tenant.locataire !== null)
      .map(tenant => {
        const fa = tenant.financialAnalysis;

        // Loyer réel = room.price (plus fiable que fa.monthlyRent / locationPriceUnit)
        const roomPrice = (tenant.room as any)?.price || fa.monthlyRent;

        // Projection sur l'année sélectionnée
        const coveredMonthsInYear = (fa as any).coveredMonthsInYear ?? 0;
        const monthsDueInYear     = (fa as any).monthsDueInYear     ?? 0;
        const coveredAmountInYear = (fa as any).coveredAmountInYear ?? 0;
        const totalMonthsCovered  = (fa as any).totalMonthsCovered  ?? 0;

        // Attendu à ce jour = mois dus dans l'année × loyer (calculé backend)
        const expectedToDate = (fa as any).expectedPaymentToDate ?? monthsDueInYear * roomPrice;
        const expectedFullYear = expectedToDate;

        // Taux de recouvrement depuis le backend (basé sur la projection)
        const paymentRate = (fa as any).collectionRate ?? (
          expectedToDate > 0 ? Math.min((coveredAmountInYear / expectedToDate) * 100, 100) : 0
        );

        return {
          tenantId:   tenant.locataire?._id || tenant.room?._id || '',
          tenantName: tenant.locataire?.fullName || 'Locataire inconnu',
          roomCode:   tenant.room?.code || 'N/A',
          monthlyRent: roomPrice,
          entryDate:   new Date(fa.entryDate),
          monthsElapsed: fa.monthsElapsed,
          // Projection sur l'année (pas le cumul brut)
          totalPaid:             coveredAmountInYear,   // couvert dans l'année
          expectedPaymentToDate: expectedToDate,        // attendu à ce jour
          status: fa.status,
          monthsBehind:  (fa as any).lateMonths    ?? fa.monthsBehind ?? 0,
          amountBehind:  fa.amountBehind ?? 0,
          advanceAmount: (fa as any).advanceAmount ?? 0,
          paymentConsistency: fa.paymentConsistency,
          paymentRate,
          lastPaymentMonth: fa.lastPaymentMonth,
          lastPaymentDate: (fa as any).lastPaymentDate
            ? new Date((fa as any).lastPaymentDate) : null,
          nextPaymentDate: (fa as any).nextPaymentDate
            ? new Date((fa as any).nextPaymentDate) : null,
          // Compatibilité template
          totalExpected:    expectedToDate,
          totalReceived:    coveredAmountInYear,
          monthsOccupied:   monthsDueInYear,
          contractStatus:   fa.status,
          // Champs supplémentaires pour l'affichage
          coveredAmountInYear,
          expectedFullYear,
          coveredMonthsInYear,
          monthsDueInYear,
          totalMonthsCovered,
          totalPaidAllTime: fa.totalPaid  // cumul brut toutes années — différent de coveredAmountInYear
        };
      });

    this.paymentSummary = {
      totalTenants:          this.enrichedData[0].data.tenantsAnalysis.summary.totalTenants,
      upToDateTenants:       this.enrichedData[0].data.tenantsAnalysis.summary.upToDateTenants,
      lateTenants:           this.enrichedData[0].data.tenantsAnalysis.summary.lateTenants,
      partialPaymentTenants: this.enrichedData[0].data.tenantsAnalysis.summary.partialPaymentTenants,
      aheadTenants:          this.enrichedData[0].data.tenantsAnalysis.summary.aheadTenants,
      behindTenants:         this.enrichedData[0].data.tenantsAnalysis.summary.behind,
      totalExpectedRevenue:  this.enrichedData[0].data.tenantsAnalysis.summary.totalExpectedByTenants,
      totalReceivedRevenue:  this.enrichedData[0].data.tenantsAnalysis.summary.totalPaidByTenants,
      totalAdvanceAmount:    this.enrichedData[0].data.tenantsAnalysis.summary.totalAdvanceAmount,
      totalAmountBehind:     this.enrichedData[0].data.tenantsAnalysis.summary.totalAmountBehind,
      globalPaymentRate:     this.enrichedData[0].data.tenantsAnalysis.summary.globalCollectionRate,
      averageConsistency:    this.enrichedData[0].data.tenantsAnalysis.summary.averagePaymentConsistency
    };

    this.calculatePaymentSummary();
    this.updatePagination();
  }



  private calculatePaymentSummary(): void {
    // Les données sont déjà chargées depuis le backend dans processTenantPaymentData()
    // Aucun recalcul nécessaire
  }

  private updatePagination(): void {
    const filteredTenants = this.getFilteredTenants();
    this.totalPages = Math.ceil(filteredTenants.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  // Méthodes publiques pour le template
  getFilteredTenants(): TenantTrackingData[] {
    return this.tenantTrackingData.filter(tenant => {
      // Filtre par statut
      if (this.selectedStatus !== 'all' && tenant.status !== this.selectedStatus) {
        return false;
      }

      // Filtre par période (basé sur la date du dernier paiement)
      if (this.selectedPeriod !== 'all') {
        const now = new Date();
        if (this.selectedPeriod === 'current_month') {
          const hasPaymentThisMonth = tenant.lastPaymentDate &&
            new Date(tenant.lastPaymentDate).getMonth() === now.getMonth() &&
            new Date(tenant.lastPaymentDate).getFullYear() === now.getFullYear();
          if (!hasPaymentThisMonth) return false;
        } else if (this.selectedPeriod === 'last_2_months') {
          const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
          const hasRecentPayment = tenant.lastPaymentDate &&
            new Date(tenant.lastPaymentDate) >= twoMonthsAgo;
          if (!hasRecentPayment) return false;
        }
      }

      // Filtre par terme de recherche
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        return tenant.tenantName.toLowerCase().includes(searchLower) ||
               tenant.roomCode.toLowerCase().includes(searchLower);
      }

      return true;
    });
  }

  getPaginatedTenants(): TenantTrackingData[] {
    const filtered = this.getFilteredTenants();
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return filtered.slice(startIndex, startIndex + this.itemsPerPage);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'up_to_date':     'TENANT_PAYMENT_TRACKING.STATUS_LABELS.UP_TO_DATE',
      'advance':        'TENANT_PAYMENT_TRACKING.STATUS_LABELS.AHEAD',
      'ahead':          'TENANT_PAYMENT_TRACKING.STATUS_LABELS.AHEAD',
      'behind':         'TENANT_PAYMENT_TRACKING.STATUS_LABELS.LATE',
      'late':           'TENANT_PAYMENT_TRACKING.STATUS_LABELS.LATE',
      'critical':       'TENANT_PAYMENT_TRACKING.STATUS_LABELS.LATE',
      'no_payment':     'TENANT_PAYMENT_TRACKING.STATUS_LABELS.LATE',
      'partial':        'TENANT_PAYMENT_TRACKING.STATUS_LABELS.PARTIAL',
      'no_contract':    'TENANT_PAYMENT_TRACKING.STATUS_LABELS.NO_CONTRACT',
      'ended_contract': 'TENANT_PAYMENT_TRACKING.STATUS_LABELS.ENDED_CONTRACT'
    };
    // 'unknown' et tout autre statut → à jour (locataire en avance)
    return labels[status] || 'TENANT_PAYMENT_TRACKING.STATUS_LABELS.UP_TO_DATE';
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'up_to_date':     'text-green-600 bg-green-100',
      'advance':        'text-blue-600 bg-blue-100',
      'ahead':          'text-blue-600 bg-blue-100',
      'behind':         'text-red-600 bg-red-100',
      'late':           'text-red-600 bg-red-100',
      'critical':       'text-red-600 bg-red-100',
      'no_payment':     'text-red-600 bg-red-100',
      'partial':        'text-yellow-600 bg-yellow-100',
      'no_contract':    'text-gray-600 bg-gray-100',
      'ended_contract': 'text-purple-600 bg-purple-100'
    };
    // 'unknown' → vert (locataire en avance)
    return colors[status] || 'text-green-600 bg-green-100';
  }
  
  getStatusPriority(status: string): number {
    // Statuts normalisés API : 'behind' > 'up_to_date' > 'advance'
    const priorities: Record<string, number> = { 'behind': 2, 'up_to_date': 1, 'advance': 0 };
    return priorities[status] ?? 0;
  }
  
  getPaymentHealthScore(tenant: TenantTrackingData): number {
    // Score de santé du paiement (0-100)
    if (tenant.status === 'ahead') return 100;
    if (tenant.status === 'up_to_date') return 90;
    if (tenant.status === 'partial') return Math.max(50, tenant.paymentRate);
    if (tenant.status === 'late') return Math.max(20, tenant.paymentRate * 0.8);
    return 0;
  }


  exportToExcel(): void {
    const data = this.prepareExportData();
    this.exportData.emit({
      type: 'excel',
      data: data,
      filename: `suivi-paiements-locataires-${this.selectedYear}`
    });
  }
  
  exportSummaryToExcel(): void {
    const summaryData = [{
      'Total locataires': this.paymentSummary.totalTenants,
      'Locataires à jour': this.paymentSummary.upToDateTenants,
      'Locataires en retard': this.paymentSummary.lateTenants,
      'Paiements partiels': this.paymentSummary.partialPaymentTenants,
      'Locataires en avance': this.paymentSummary.aheadTenants,
      'Revenus attendus': this.paymentSummary.totalExpectedRevenue,
      'Revenus reçus': this.paymentSummary.totalReceivedRevenue,
      'Total avances': this.paymentSummary.totalAdvanceAmount,
      'Total retards': this.paymentSummary.totalAmountBehind,
      'Taux global': `${this.paymentSummary.globalPaymentRate.toFixed(1)}%`,
      'Consistance moyenne': `${this.paymentSummary.averageConsistency.toFixed(1)}%`,
      'Année': this.selectedYear
    }];
    
    this.exportData.emit({
      type: 'excel',
      data: summaryData,
      filename: `resume-paiements-${this.selectedYear}`
    });
  }

  exportToCSV(): void {
    const data = this.prepareExportData();
    this.exportData.emit({
      type: 'csv',
      data: data,
      filename: `suivi-paiements-locataires-${this.selectedYear}.csv`
    });
  }

  private prepareExportData(): any[] {
    return this.getFilteredTenants().map(tenant => ({
      'Locataire': tenant.tenantName,
      'Unité': tenant.roomCode,
      'Loyer mensuel': tenant.monthlyRent,
      'Mois occupés': tenant.monthsOccupied,
      'Total attendu': tenant.totalExpected,
      'Total reçu': tenant.totalReceived,
      'Montant en retard': tenant.amountBehind,
      'Taux de paiement': `${tenant.paymentRate.toFixed(1)}%`,
      'Statut': this.getStatusLabel(tenant.status),
      'Statut contrat': tenant.contractStatus,
      'Mois de retard': tenant.monthsBehind,
      'Montant d\'avance': tenant.advanceAmount,
      'Score santé': this.getPaymentHealthScore(tenant),
      'Date d\'entrée': tenant.entryDate.toLocaleDateString('fr-FR'),
      'Dernier paiement': tenant.lastPaymentMonth >= 0 ? this.translationUtils.getMonthName(tenant.lastPaymentMonth + 1) : this.translateService.instant('TENANT_PAYMENT_TRACKING.TABLE.NONE'),
      'Année': this.selectedYear
    }));
  }

  getStringMonth(month: number): string {
    return this.translationUtils.getMonthName(month + 1);
  }

  // Méthodes de navigation
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  applyFilters(): void {
    this.updatePagination();
  }

  // Méthodes pour le template
  trackByTenantId(_index: number, tenant: TenantTrackingData): string {
    return tenant.tenantId;
  }
  
  sortTenantsByPriority(): void {
    this.tenantTrackingData.sort((a, b) => {
      const priorityA = this.getStatusPriority(a.status);
      const priorityB = this.getStatusPriority(b.status);
      
      if (priorityA !== priorityB) {
        return priorityB - priorityA; // Tri décroissant (plus urgent en premier)
      }
      
      // Si même priorité, trier par taux de paiement croissant
      return a.paymentRate - b.paymentRate;
    });
    
    this.applyFilters();
  }
  
  getUrgentTenants(): TenantTrackingData[] {
    return this.tenantTrackingData.filter(tenant =>
      tenant.status === 'behind' && tenant.paymentRate < 50
    );
  }

  selectTenant(tenant: TenantTrackingData): void {
    // Logique pour sélectionner un locataire (ouvrir un modal de détails par exemple)
    console.log('Tenant selected:', tenant);
  }

  Math = Math; // Exposer Math pour le template
  today = new Date(); // ✅ Pour comparer les dates dans le template
  
  // Méthodes d'analyse avancée
  getAveragePaymentRate(): number {
    if (this.tenantTrackingData.length === 0) return 0;
    const totalRate = this.tenantTrackingData.reduce((sum, tenant) => sum + tenant.paymentRate, 0);
    return Math.round((totalRate / this.tenantTrackingData.length) * 100) / 100;
  }
  
  getBestPayingTenant(): TenantTrackingData | null {
    if (this.tenantTrackingData.length === 0) return null;
    return this.tenantTrackingData.reduce((best, current) => 
      current.paymentRate > best.paymentRate ? current : best
    );
  }
  
  getWorstPayingTenant(): TenantTrackingData | null {
    if (this.tenantTrackingData.length === 0) return null;
    return this.tenantTrackingData.reduce((worst, current) => 
      current.paymentRate < worst.paymentRate ? current : worst
    );
  }
}
