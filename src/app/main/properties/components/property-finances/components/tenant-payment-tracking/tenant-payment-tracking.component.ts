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
  selectedStatus: 'all' | 'up_to_date' | 'partial' | 'late' | 'ahead' | 'behind' = 'all';
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
    console.log('👥 SUIVI LOCATAIRES - Traitement des nouvelles données enrichies');
    
    this.tenantTrackingData = [];
    
    if (this.enrichedData.length==0) {
      console.warn('⚠️ Aucune donnée de locataires disponible');
      this.calculatePaymentSummary();
      this.updatePagination();
      return;
    }

    this.tenantTrackingData = this.enrichedData[0].data.tenantsAnalysis.tenants.map(tenant => {
      const paymentRate = tenant.financialAnalysis.expectedPaymentToDate > 0 
        ? (tenant.financialAnalysis.totalPaid / tenant.financialAnalysis.expectedPaymentToDate) * 100 
        : 0;
        
      return {
        tenantId: tenant.locataire?._id || tenant.room?._id || '',
        tenantName: tenant.locataire?.fullName || 'Locataire inconnu',
        roomCode: tenant.room?.code || 'N/A',
        monthlyRent: tenant.financialAnalysis.monthlyRent,
        entryDate: new Date(tenant.financialAnalysis.entryDate),
        monthsElapsed: tenant.financialAnalysis.monthsElapsed,
        totalPaid: tenant.financialAnalysis.totalPaid,
        expectedPaymentToDate: tenant.financialAnalysis.expectedPaymentToDate,
        status: tenant.financialAnalysis.status,
        monthsBehind: tenant.financialAnalysis.monthsBehind,
        amountBehind: tenant.financialAnalysis.amountBehind,
        advanceAmount: tenant.financialAnalysis.advanceAmount,
        paymentConsistency: tenant.financialAnalysis.paymentConsistency,
        paymentRate,
        lastPaymentMonth: tenant.financialAnalysis.lastPaymentMonth,
        // ✅ Dates de paiement depuis le backend
        lastPaymentDate: tenant.financialAnalysis.lastPaymentDate
          ? new Date(tenant.financialAnalysis.lastPaymentDate) : null,
        nextPaymentDate: tenant.financialAnalysis.nextPaymentDate
          ? new Date(tenant.financialAnalysis.nextPaymentDate) : null,
        // Propriétés pour compatibilité
        totalExpected: tenant.financialAnalysis.expectedPaymentToDate,
        totalReceived: tenant.financialAnalysis.totalPaid,
        monthsOccupied: tenant.financialAnalysis.monthsElapsed,
        contractStatus: tenant.financialAnalysis.status
      };
    });

    this.paymentSummary = {
      totalTenants: this.enrichedData[0].data.tenantsAnalysis.summary.totalTenants,
      upToDateTenants: this.enrichedData[0].data.tenantsAnalysis.summary.upToDateTenants,
      lateTenants: this.enrichedData[0].data.tenantsAnalysis.summary.lateTenants,
      partialPaymentTenants: this.enrichedData[0].data.tenantsAnalysis.summary.partialPaymentTenants,
      aheadTenants: this.enrichedData[0].data.tenantsAnalysis.summary.aheadTenants,
      behindTenants: this.enrichedData[0].data.tenantsAnalysis.summary.behind,
      totalExpectedRevenue: 0,
      totalReceivedRevenue: 0,
      totalAdvanceAmount: this.enrichedData[0].data.tenantsAnalysis.summary.totalAdvanceAmount,
      totalAmountBehind: this.enrichedData[0].data.tenantsAnalysis.summary.totalAmountBehind,
      globalPaymentRate: this.enrichedData[0].data.tenantsAnalysis.summary.globalCollectionRate,
      averageConsistency: this.enrichedData[0].data.tenantsAnalysis.summary.averagePaymentConsistency
    }

    console.log(`✅ ${this.tenantTrackingData.length} locataires traités`);
    this.calculatePaymentSummary();
    this.updatePagination();
  }



  private calculatePaymentSummary(): void {
    console.log('📊 Calcul du résumé des paiements pour', this.tenantTrackingData.length, 'locataires');
   

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
    const labels = {
      'up_to_date': 'TENANT_PAYMENT_TRACKING.STATUS_LABELS.UP_TO_DATE',
      'ahead': 'TENANT_PAYMENT_TRACKING.STATUS_LABELS.AHEAD',
      'partial': 'TENANT_PAYMENT_TRACKING.STATUS_LABELS.PARTIAL',
      'late': 'TENANT_PAYMENT_TRACKING.STATUS_LABELS.LATE',
      'no_contract': 'TENANT_PAYMENT_TRACKING.STATUS_LABELS.NO_CONTRACT',
      'ended_contract': 'TENANT_PAYMENT_TRACKING.STATUS_LABELS.ENDED_CONTRACT'
    };
    return labels[status] || 'TENANT_PAYMENT_TRACKING.STATUS_LABELS.UNKNOWN';
  }
  
  getStatusPriority(status: string): number {
    // Priorité pour le tri (plus élevé = plus urgent)
    const priorities = {
      'late': 5,
      'partial': 4,
      'ended_contract': 3,
      'no_contract': 2,
      'up_to_date': 1,
      'ahead': 0
    };
    return priorities[status] || 0;
  }
  
  getPaymentHealthScore(tenant: TenantTrackingData): number {
    // Score de santé du paiement (0-100)
    if (tenant.status === 'ahead') return 100;
    if (tenant.status === 'up_to_date') return 90;
    if (tenant.status === 'partial') return Math.max(50, tenant.paymentRate);
    if (tenant.status === 'late') return Math.max(20, tenant.paymentRate * 0.8);
    return 0;
  }

  getStatusColor(status: string): string {
    const colors = {
      'up_to_date': 'text-green-600 bg-green-100',
      'ahead': 'text-blue-600 bg-blue-100',
      'partial': 'text-yellow-600 bg-yellow-100',
      'late': 'text-red-600 bg-red-100',
      'no_contract': 'text-gray-600 bg-gray-100',
      'ended_contract': 'text-purple-600 bg-purple-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  }

  // Méthodes d'export améliorées
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
      tenant.status === 'late' || 
      (tenant.status === 'partial' && tenant.paymentRate < 50)
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
