import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import {
  StatisticLocataireYearModel,
  StatisticAllPaymentLocataireYearModel,
  LocationModel,
  LocationState
} from 'src/app/shared/store';
import { Store } from '@ngxs/store';
import { ExportData } from '../../property-finances.component';
import { TenantPaymentCalculatorService, TenantPaymentCalculation } from 'src/app/shared/services/tenant-payment-calculator.service';



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
  @Input() propertyId: string = ''; // Ajout pour récupérer les locations

  @Output() exportData = new EventEmitter<ExportData>();

  tenantPaymentStatuses: TenantPaymentCalculation[] = [];
  locations: LocationModel[] = [];
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
  paginatedTenants: TenantPaymentCalculation[] = [];

  constructor(
    private store: Store,
    private tenantPaymentCalculator: TenantPaymentCalculatorService
  ) { }

  ngOnInit(): void {
    this.loadLocations();
    this.processTenantPaymentData();
  }

  ngOnChanges(): void {
    this.loadLocations();
  }

  private loadLocations(): void {
    // Récupérer les locations depuis le store
    this.locations = this.store.selectSnapshot(LocationState.selectStateLocations) || [];
    this.processTenantPaymentData();
  }

  private processTenantPaymentData(): void {
    this.tenantPaymentStatuses = [];

    // Combiner les données des locataires et des paiements avec les locations
    this.paymentStats.forEach(paymentStat => {
      if (!paymentStat.locataire) return;

      // Trouver la location correspondante
      const location = this.locations.find(loc =>
        loc.locataire === paymentStat.locataire._id &&
        loc.room === paymentStat.room._id &&
        loc.isRunning === true
      );

      if (location) {
        const tenantStatus = this.tenantPaymentCalculator.calculateTenantPaymentStatus(
          paymentStat,
          location,
          this.selectedYear
        );

        if (tenantStatus) {
          this.tenantPaymentStatuses.push(tenantStatus);
        }
      } else {
        // Fallback pour les locataires sans location active
        console.warn('Aucune location trouvée pour le locataire:', paymentStat.locataire.fullName);
      }
    });

    this.calculatePaymentSummary();
    this.updatePagination();
  }





  private calculatePaymentSummary(): void {
    const summary = this.tenantPaymentStatuses.reduce((acc, tenant) => {
      acc.totalTenants++;
      acc.totalExpectedRevenue += tenant.totalExpected;
      acc.totalReceivedRevenue += tenant.totalReceived;
      acc.totalPendingRevenue += tenant.totalPending;

      switch (tenant.status) {
        case 'up_to_date':
        case 'ahead':
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
  getFilteredTenants(): TenantPaymentCalculation[] {
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

  getPaginatedTenants(): TenantPaymentCalculation[] {
    const filtered = this.getFilteredTenants();
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return filtered.slice(startIndex, startIndex + this.itemsPerPage);
  }

  getStatusLabel(status: TenantPaymentCalculation['status']): string {
    const labels = {
      'up_to_date': 'À jour',
      'ahead': 'En avance',
      'partial': 'Paiement partiel',
      'late': 'En retard',
      'no_contract': 'Pas de contrat',
      'ended_contract': 'Contrat terminé'
    };
    return labels[status] || status;
  }

  getStatusColor(status: TenantPaymentCalculation['status']): string {
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
  trackByTenantId(_index: number, tenant: TenantPaymentCalculation): string {
    return tenant.tenantId;
  }

  selectTenant(tenant: TenantPaymentCalculation): void {
    // Logique pour sélectionner un locataire (ouvrir un modal de détails par exemple)
    console.log('Tenant selected:', tenant);
  }

  Math = Math; // Exposer Math pour le template
}
