import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { 
  StatisticLocataireYearModel,
  StatisticAllPaymentLocataireYearModel,
  StatisticPaymentStateType
} from 'src/app/shared/store';
import { ExportData } from '../../property-finances.component';

export interface TenantPaymentStatus {
  tenantId: string;
  tenantName: string;
  roomCode: string;
  monthlyRent: number;
  totalExpected: number;
  totalReceived: number;
  totalPending: number;
  paymentRate: number;
  status: 'up_to_date' | 'partial' | 'late' | 'no_contract' | 'ended_contract';
  monthlyDetails: Array<{
    month: number;
    monthName: string;
    expected: number;
    received: number;
    status: StatisticPaymentStateType;
    daysLate?: number;
  }>;
  lastPaymentDate?: Date;
  contractStatus: 'active' | 'ended' | 'none';
}

export interface PaymentSummary {
  totalTenants: number;
  upToDateTenants: number;
  lateTenants: number;
  partialPaymentTenants: number;
  endedContractTenants: number;
  noContractTenants: number;
  totalExpectedRevenue: number;
  totalReceivedRevenue: number;
  totalPendingRevenue: number;
  globalPaymentRate: number;
}

@Component({
  selector: 'app-tenant-payment-tracking',
  templateUrl: './tenant-payment-tracking.component.html',
  styleUrls: ['./tenant-payment-tracking.component.scss']
})
export class TenantPaymentTrackingComponent implements OnInit, OnChanges {
  @Input() tenantStats: StatisticLocataireYearModel[] = [];
  @Input() paymentStats: StatisticAllPaymentLocataireYearModel[] = [];
  @Input() selectedYear: number = new Date().getFullYear();
  @Input() isLoading: boolean = false;

  @Output() exportData = new EventEmitter<ExportData>();

  tenantPaymentStatuses: TenantPaymentStatus[] = [];
  paymentSummary: PaymentSummary = {
    totalTenants: 0,
    upToDateTenants: 0,
    lateTenants: 0,
    partialPaymentTenants: 0,
    endedContractTenants: 0,
    noContractTenants: 0,
    totalExpectedRevenue: 0,
    totalReceivedRevenue: 0,
    totalPendingRevenue: 0,
    globalPaymentRate: 0
  };

  selectedPeriod: 'all' | 'last_2_months' | 'current_month' = 'all';
  selectedStatus: 'all' | 'up_to_date' | 'partial' | 'late' | 'no_contract' | 'ended_contract' = 'all';
  searchTerm: string = '';

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  ngOnInit(): void {
    this.processTenantPaymentData();
  }

  ngOnChanges(): void {
    this.processTenantPaymentData();
  }

  private processTenantPaymentData(): void {
    this.tenantPaymentStatuses = [];

    // Combiner les données des locataires et des paiements
    this.paymentStats.forEach(paymentStat => {
      const tenantStatus = this.buildTenantPaymentStatus(paymentStat);
      if (tenantStatus) {
        this.tenantPaymentStatuses.push(tenantStatus);
      }
    });

    this.calculatePaymentSummary();
    this.updatePagination();
  }

  private buildTenantPaymentStatus(paymentStat: StatisticAllPaymentLocataireYearModel): TenantPaymentStatus | null {
    if (!paymentStat.locataire || !paymentStat.room) return null;

    const monthlyRent = paymentStat.room.price || 0;
    const monthlyDetails: TenantPaymentStatus['monthlyDetails'] = [];
    let totalExpected = 0;
    let totalReceived = 0;
    let lastPaymentDate: Date | undefined;

    // Traiter les 12 mois
    for (let month = 0; month < 12; month++) {
      const paymentData = paymentStat.paymentState.find(p => p.month === month + 1);
      const expected = paymentData?.price || monthlyRent;
      const received = paymentData?.unitLocationPaymentPrice || 0;
      const status = paymentData?.state || StatisticPaymentStateType.NO_CONTRACT;

      totalExpected += expected;
      totalReceived += received;

      monthlyDetails.push({
        month: month + 1,
        monthName: this.getMonthName(month),
        expected,
        received,
        status,
        daysLate: this.calculateDaysLate(month, status)
      });

      // Mettre à jour la dernière date de paiement
      if (received > 0) {
        const paymentDate = new Date(this.selectedYear, month, 15); // Estimation
        if (!lastPaymentDate || paymentDate > lastPaymentDate) {
          lastPaymentDate = paymentDate;
        }
      }
    }

    const paymentRate = totalExpected > 0 ? (totalReceived / totalExpected) * 100 : 0;
    const status = this.determineOverallStatus(monthlyDetails, paymentRate);
    const contractStatus = this.determineContractStatus(monthlyDetails);

    return {
      tenantId: paymentStat.locataire._id || '',
      tenantName: paymentStat.locataire.fullName || 'Locataire inconnu',
      roomCode: paymentStat.room.code || 'N/A',
      monthlyRent,
      totalExpected,
      totalReceived,
      totalPending: totalExpected - totalReceived,
      paymentRate,
      status,
      monthlyDetails,
      lastPaymentDate,
      contractStatus
    };
  }

  private determineOverallStatus(monthlyDetails: TenantPaymentStatus['monthlyDetails'], paymentRate: number): TenantPaymentStatus['status'] {
    const hasEndedContract = monthlyDetails.some(m => m.status === StatisticPaymentStateType.ENDED_CONTRACT);
    const hasNoContract = monthlyDetails.every(m => m.status === StatisticPaymentStateType.NO_CONTRACT);
    const hasUnpaidMonths = monthlyDetails.some(m => m.status === StatisticPaymentStateType.UNPAYED);
    const hasPartialPayments = monthlyDetails.some(m => m.status === StatisticPaymentStateType.PARTIAL_PAYMENT);

    if (hasEndedContract) return 'ended_contract';
    if (hasNoContract) return 'no_contract';
    if (hasUnpaidMonths) return 'late';
    if (hasPartialPayments) return 'partial';
    if (paymentRate >= 95) return 'up_to_date';
    
    return 'partial';
  }

  private determineContractStatus(monthlyDetails: TenantPaymentStatus['monthlyDetails']): 'active' | 'ended' | 'none' {
    const hasEndedContract = monthlyDetails.some(m => m.status === StatisticPaymentStateType.ENDED_CONTRACT);
    const hasNoContract = monthlyDetails.every(m => m.status === StatisticPaymentStateType.NO_CONTRACT);

    if (hasEndedContract) return 'ended';
    if (hasNoContract) return 'none';
    return 'active';
  }

  private calculateDaysLate(month: number, status: StatisticPaymentStateType): number | undefined {
    if (status === StatisticPaymentStateType.UNPAYED) {
      const currentDate = new Date();
      const dueDate = new Date(this.selectedYear, month, 5); // Supposons que le loyer est dû le 5 de chaque mois
      
      if (currentDate > dueDate) {
        return Math.floor((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      }
    }
    return undefined;
  }

  private calculatePaymentSummary(): void {
    const summary = this.tenantPaymentStatuses.reduce((acc, tenant) => {
      acc.totalTenants++;
      acc.totalExpectedRevenue += tenant.totalExpected;
      acc.totalReceivedRevenue += tenant.totalReceived;
      acc.totalPendingRevenue += tenant.totalPending;

      switch (tenant.status) {
        case 'up_to_date':
          acc.upToDateTenants++;
          break;
        case 'partial':
          acc.partialPaymentTenants++;
          break;
        case 'late':
          acc.lateTenants++;
          break;
        case 'no_contract':
          acc.noContractTenants++;
          break;
        case 'ended_contract':
          acc.endedContractTenants++;
          break;
      }

      return acc;
    }, {
      totalTenants: 0,
      upToDateTenants: 0,
      lateTenants: 0,
      partialPaymentTenants: 0,
      endedContractTenants: 0,
      noContractTenants: 0,
      totalExpectedRevenue: 0,
      totalReceivedRevenue: 0,
      totalPendingRevenue: 0,
      globalPaymentRate: 0
    });

    summary.globalPaymentRate = summary.totalExpectedRevenue > 0 
      ? (summary.totalReceivedRevenue / summary.totalExpectedRevenue) * 100 
      : 0;

    this.paymentSummary = summary;
  }

  private updatePagination(): void {
    const filteredTenants = this.getFilteredTenants();
    this.totalPages = Math.ceil(filteredTenants.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  // Méthodes publiques pour le template
  getFilteredTenants(): TenantPaymentStatus[] {
    return this.tenantPaymentStatuses.filter(tenant => {
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

  getPaginatedTenants(): TenantPaymentStatus[] {
    const filtered = this.getFilteredTenants();
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return filtered.slice(startIndex, startIndex + this.itemsPerPage);
  }

  getStatusLabel(status: TenantPaymentStatus['status']): string {
    const labels = {
      'up_to_date': 'À jour',
      'partial': 'Paiement partiel',
      'late': 'En retard',
      'no_contract': 'Pas de contrat',
      'ended_contract': 'Contrat terminé'
    };
    return labels[status] || status;
  }

  getStatusColor(status: TenantPaymentStatus['status']): string {
    const colors = {
      'up_to_date': 'text-green-600 bg-green-100',
      'partial': 'text-yellow-600 bg-yellow-100',
      'late': 'text-red-600 bg-red-100',
      'no_contract': 'text-gray-600 bg-gray-100',
      'ended_contract': 'text-blue-600 bg-blue-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  }

  getMonthName(monthIndex: number): string {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[monthIndex] || '';
  }

  // Méthodes d'export
  exportToExcel(): void {
    const data = this.prepareExportData();
    this.exportData.emit({
      type: 'excel',
      data: data,
      filename: `suivi-paiements-locataires-${this.selectedYear}.xlsx`
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
      'Total attendu': tenant.totalExpected,
      'Total reçu': tenant.totalReceived,
      'Total en attente': tenant.totalPending,
      'Taux de paiement': `${tenant.paymentRate.toFixed(1)}%`,
      'Statut': this.getStatusLabel(tenant.status),
      'Statut contrat': tenant.contractStatus,
      'Dernier paiement': tenant.lastPaymentDate?.toLocaleDateString('fr-FR') || 'Aucun'
    }));
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

  // Méthodes pour le template
  trackByTenantId(index: number, tenant: TenantPaymentStatus): string {
    return tenant.tenantId;
  }

  selectTenant(tenant: TenantPaymentStatus): void {
    // Logique pour sélectionner un locataire (ouvrir un modal de détails par exemple)
    console.log('Tenant selected:', tenant);
  }

  Math = Math; // Exposer Math pour le template
}
