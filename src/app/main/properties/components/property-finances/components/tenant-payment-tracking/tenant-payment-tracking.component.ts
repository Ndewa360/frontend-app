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
    console.log('👥 SUIVI LOCATAIRES - Traitement des données de paiement');
    
    this.tenantPaymentStatuses = [];
    let processedCount = 0;
    let errorCount = 0;

    // Combiner les données avec validation
    this.paymentStats.forEach((paymentStat, index) => {
      try {
        if (!paymentStat.locataire) {
          console.warn(`⚠️ Locataire manquant pour l'entrée ${index + 1}`);
          return;
        }

        // Trouver la location correspondante avec validation
        const location = this.locations.find(loc =>
          loc.locataire === paymentStat.locataire._id &&
          loc.room === paymentStat.room._id &&
          loc.isRunning === true
        );

        if (location && location.startedAt) {
          const tenantStatus = this.tenantPaymentCalculator.calculateTenantPaymentStatus(
            paymentStat,
            location,
            this.selectedYear
          );

          if (tenantStatus) {
            // Validation des données calculées
            if (this.validateTenantStatus(tenantStatus)) {
              this.tenantPaymentStatuses.push(tenantStatus);
              processedCount++;
            } else {
              console.warn('⚠️ Données invalides pour:', tenantStatus.tenantName);
              errorCount++;
            }
          }
        } else {
          console.warn('⚠️ Location invalide pour:', paymentStat.locataire.fullName);
          errorCount++;
        }
        
      } catch (error) {
        console.error('❌ Erreur lors du traitement du locataire:', error);
        errorCount++;
      }
    });

    console.log(`✅ Traitement terminé: ${processedCount} locataires traités, ${errorCount} erreurs`);

    this.calculatePaymentSummary();
    this.updatePagination();
  }

  private validateTenantStatus(status: TenantPaymentCalculation): boolean {
    // Validation des données calculées
    if (status.totalExpected < 0 || status.totalReceived < 0) {
      return false;
    }
    
    if (status.paymentRate < 0 || status.paymentRate > 200) {
      console.warn(`⚠️ Taux de paiement anormal: ${status.paymentRate}% pour ${status.tenantName}`);
      // Corriger le taux si possible
      status.paymentRate = Math.max(0, Math.min(status.paymentRate, 200));
    }
    
    return true;
  }





  private calculatePaymentSummary(): void {
    console.log('📊 Calcul du résumé des paiements pour', this.tenantPaymentStatuses.length, 'locataires');
    
    const summary = this.tenantPaymentStatuses.reduce((acc, tenant) => {
      acc.totalTenants++;
      acc.totalExpectedRevenue += tenant.totalExpected || 0;
      acc.totalReceivedRevenue += tenant.totalReceived || 0;
      acc.totalPendingRevenue += tenant.totalPending || 0;

      // Classification améliorée des statuts
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
        default:
          console.warn('⚠️ Statut inconnu:', tenant.status, 'pour', tenant.tenantName);
          acc.noContractTenants++;
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

    // Calcul du taux global avec validation
    summary.globalPaymentRate = summary.totalExpectedRevenue > 0 
      ? Math.round((summary.totalReceivedRevenue / summary.totalExpectedRevenue) * 100 * 100) / 100
      : 0;

    // Validation du résumé
    if (summary.globalPaymentRate > 200) {
      console.warn('⚠️ Taux global anormalement élevé:', summary.globalPaymentRate + '%');
    }

    this.paymentSummary = summary;
    
    console.log('✅ Résumé calculé:', {
      totalTenants: summary.totalTenants,
      globalRate: `${summary.globalPaymentRate.toFixed(1)}%`,
      upToDate: summary.upToDateTenants,
      late: summary.lateTenants,
      partial: summary.partialPaymentTenants
    });
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
    return labels[status] || 'Statut inconnu';
  }
  
  getStatusPriority(status: TenantPaymentCalculation['status']): number {
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
  
  getPaymentHealthScore(tenant: TenantPaymentCalculation): number {
    // Score de santé du paiement (0-100)
    if (tenant.status === 'ahead') return 100;
    if (tenant.status === 'up_to_date') return 90;
    if (tenant.status === 'partial') return Math.max(50, tenant.paymentRate);
    if (tenant.status === 'late') return Math.max(20, tenant.paymentRate * 0.8);
    return 0;
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
      'Contrats terminés': this.paymentSummary.endedContractTenants,
      'Revenus attendus': this.paymentSummary.totalExpectedRevenue,
      'Revenus reçus': this.paymentSummary.totalReceivedRevenue,
      'Revenus en attente': this.paymentSummary.totalPendingRevenue,
      'Taux global': `${this.paymentSummary.globalPaymentRate.toFixed(1)}%`,
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
      'Total en attente': tenant.totalPending,
      'Taux de paiement': `${tenant.paymentRate.toFixed(1)}%`,
      'Statut': this.getStatusLabel(tenant.status),
      'Statut contrat': tenant.contractStatus,
      'Jours de retard': tenant.daysLate || 0,
      'Mois d\'avance': tenant.monthsAhead || 0,
      'Score santé': this.getPaymentHealthScore(tenant),
      'Date d\'entrée': tenant.entryDate.toLocaleDateString('fr-FR'),
      'Dernier paiement': tenant.lastPaymentDate?.toLocaleDateString('fr-FR') || 'Aucun',
      'Année': this.selectedYear
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

  applyFilters(): void {
    this.updatePagination();
  }

  // Méthodes pour le template
  trackByTenantId(_index: number, tenant: TenantPaymentCalculation): string {
    return tenant.tenantId;
  }
  
  sortTenantsByPriority(): void {
    this.tenantPaymentStatuses.sort((a, b) => {
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
  
  getUrgentTenants(): TenantPaymentCalculation[] {
    return this.tenantPaymentStatuses.filter(tenant => 
      tenant.status === 'late' || 
      (tenant.status === 'partial' && tenant.paymentRate < 50)
    );
  }

  selectTenant(tenant: TenantPaymentCalculation): void {
    // Logique pour sélectionner un locataire (ouvrir un modal de détails par exemple)
    console.log('Tenant selected:', tenant);
  }

  Math = Math; // Exposer Math pour le template
  
  // Méthodes d'analyse avancée
  getAveragePaymentRate(): number {
    if (this.tenantPaymentStatuses.length === 0) return 0;
    const totalRate = this.tenantPaymentStatuses.reduce((sum, tenant) => sum + tenant.paymentRate, 0);
    return Math.round((totalRate / this.tenantPaymentStatuses.length) * 100) / 100;
  }
  
  getBestPayingTenant(): TenantPaymentCalculation | null {
    if (this.tenantPaymentStatuses.length === 0) return null;
    return this.tenantPaymentStatuses.reduce((best, current) => 
      current.paymentRate > best.paymentRate ? current : best
    );
  }
  
  getWorstPayingTenant(): TenantPaymentCalculation | null {
    if (this.tenantPaymentStatuses.length === 0) return null;
    return this.tenantPaymentStatuses.reduce((worst, current) => 
      current.paymentRate < worst.paymentRate ? current : worst
    );
  }
}
