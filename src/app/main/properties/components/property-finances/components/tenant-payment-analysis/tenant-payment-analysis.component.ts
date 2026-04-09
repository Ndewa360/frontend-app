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
  totalPaid: number;
  expectedPaymentToDate: number;
  status: string;
  monthsBehind: number;
  amountBehind: number;
  advanceAmount: number;
  lastPaymentMonth: number;
  paymentConsistency: number;
  monthlyPayments: number[];
  // Propriétés calculées pour compatibilité template
  paymentRate: number;
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
  filteredSummaries: TenantFinancialAnalysis[] = []; // Alias pour compatibilité template
  
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
    console.log('👥 ANALYSE LOCATAIRES - Traitement des nouvelles données enrichies');
    
    this.tenantAnalyses = [];
    console.log("Data enriched ",this.enrichedData)
    if (this.enrichedData.length==0) {
      console.warn('⚠️ Aucune donnée de locataires disponible');
      this.calculateGlobalStats();
      this.applyFilters();
      return;
    }

    this.tenantAnalyses = this.enrichedData[0].data.tenantsAnalysis.tenants
      .filter(tenant => tenant.locataire !== null) // ✅ Ignorer les chambres sans locataire identifié
      .map(tenant => {
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
          lastPaymentMonth: tenant.financialAnalysis.lastPaymentMonth,
          paymentConsistency: tenant.financialAnalysis.paymentConsistency,
          monthlyPayments: tenant.financialAnalysis.monthlyPayments,
          paymentRate,
          totalExpected: tenant.financialAnalysis.expectedPaymentToDate,
          totalReceived: tenant.financialAnalysis.totalPaid
        };
      });

    console.log(`✅ ${this.tenantAnalyses.length} analyses de locataires traitées`);
    this.calculateGlobalStats();
    this.applyFilters();
  }



  private calculateGlobalStats(): void {
    const totalTenants = this.tenantAnalyses.length;
    
    const excellentTenants = this.tenantAnalyses.filter(t => 
      t.status === 'up_to_date' || t.status === 'ahead').length;
    const goodTenants = this.tenantAnalyses.filter(t => 
      t.status === 'partial' && this.getPaymentRate(t) >= 80).length;
    const warningTenants = this.tenantAnalyses.filter(t => 
      t.status === 'partial' && this.getPaymentRate(t) < 80).length;
    const criticalTenants = this.tenantAnalyses.filter(t => 
      t.status === 'late' || t.status === 'behind').length;
    
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
    this.filteredAnalyses = this.tenantAnalyses.filter(tenant => {

      const paymentRate = this.getPaymentRate(tenant);
      let mappedStatus = 'good';
      
      if (tenant.status === 'up_to_date' || tenant.status === 'ahead') mappedStatus = 'excellent';
      else if (tenant.status === 'partial' && paymentRate >= 80) mappedStatus = 'good';
      else if (tenant.status === 'partial' && paymentRate < 80) mappedStatus = 'warning';
      else if (tenant.status === 'late' || tenant.status === 'behind') mappedStatus = 'critical';
      
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
    // ✅ filteredSummaries est un alias de filteredAnalyses pour le template
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
  
  getStatusLabel(status: string): string {
    switch (status) {
      case 'up_to_date': return 'TENANT_PAYMENT_TRACKING.STATUS_LABELS.UP_TO_DATE';
      case 'ahead': return 'TENANT_PAYMENT_TRACKING.STATUS_LABELS.AHEAD';
      case 'partial': return 'TENANT_PAYMENT_TRACKING.STATUS_LABELS.PARTIAL';
      case 'late': return 'TENANT_PAYMENT_TRACKING.STATUS_LABELS.LATE';
      case 'behind': return 'TENANT_PAYMENT_TRACKING.STATUS_LABELS.LATE';
      case 'no_contract': return 'TENANT_PAYMENT_TRACKING.STATUS_LABELS.NO_CONTRACT';
      case 'ended_contract': return 'TENANT_PAYMENT_TRACKING.STATUS_LABELS.ENDED_CONTRACT';
      default: return 'TENANT_PAYMENT_TRACKING.STATUS_LABELS.UNKNOWN';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'up_to_date': return 'bg-green-100 text-green-800';
      case 'ahead': return 'bg-blue-100 text-blue-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'late': 
      case 'behind': return 'bg-red-100 text-red-800';
      case 'no_contract': return 'bg-gray-100 text-gray-800';
      case 'ended_contract': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
  
  getCalculationStatusColor = this.getStatusColor;
  getCalculationStatusLabel = this.getStatusLabel;
  
  // Méthodes de mapping pour les statuts
  getMappedStatus(tenant: TenantFinancialAnalysis): 'excellent' | 'good' | 'warning' | 'critical' {
    const paymentRate = this.getPaymentRate(tenant);
    if (tenant.status === 'up_to_date' || tenant.status === 'ahead') return 'excellent';
    if (tenant.status === 'partial' && paymentRate >= 80) return 'good';
    if (tenant.status === 'partial' && paymentRate < 80) return 'warning';
    if (tenant.status === 'late' || tenant.status === 'behind') return 'critical';
    return 'good';
  }
  

}
