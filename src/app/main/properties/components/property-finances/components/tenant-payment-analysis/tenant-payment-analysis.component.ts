import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import {
  StatisticLocataireYearModel,
  StatisticAllPaymentLocataireYearModel,
  StatisticPaymentStateType,
  LocationModel,
  LocationState
} from 'src/app/shared/store';
import { Store } from '@ngxs/store';
import { ExportData } from '../../property-finances.component';
import { TenantPaymentCalculatorService, TenantPaymentCalculation } from 'src/app/shared/services/tenant-payment-calculator.service';

export interface TenantPaymentSummary {
  tenantId: string;
  tenantName: string;
  roomCode: string;
  monthlyPayments: Array<{
    month: number;
    monthName: string;
    state: StatisticPaymentStateType;
    expectedAmount: number;
    receivedAmount: number;
    paymentRate: number;
  }>;
  totalExpected: number;
  totalReceived: number;
  overallRate: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

@Component({
  selector: 'app-tenant-payment-analysis',
  templateUrl: './tenant-payment-analysis.component.html',
  styleUrls: ['./tenant-payment-analysis.component.scss']
})
export class TenantPaymentAnalysisComponent implements OnInit, OnChanges {
  @Input() tenantStats: StatisticLocataireYearModel[] = [];
  @Input() paymentStats: StatisticAllPaymentLocataireYearModel[] = [];
  @Input() selectedYear: number = new Date().getFullYear();
  @Input() propertyId: string = '';
  @Input() isLoading: boolean = false;

  @Output() exportData = new EventEmitter<ExportData>();

  locations: LocationModel[] = [];

  tenantPaymentCalculations: TenantPaymentCalculation[] = [];
  filteredSummaries: TenantPaymentCalculation[] = [];
  
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
    private store: Store,
    private tenantPaymentCalculator: TenantPaymentCalculatorService
  ) {}

  ngOnInit(): void {
    this.loadLocations();
  }

  ngOnChanges(): void {
    this.loadLocations();
  }

  private loadLocations(): void {
    this.locations = this.store.selectSnapshot(LocationState.selectStateLocations) || [];
    this.processTenantData();
  }

  private processTenantData(): void {
    console.log('👥 ANALYSE LOCATAIRES - Traitement des données de paiement');
    
    this.tenantPaymentCalculations = [];
    let processedCount = 0;
    let errorCount = 0;

    this.paymentStats.forEach((paymentStat, index) => {
      try {
        if (!paymentStat.locataire) {
          console.warn(`⚠️ Locataire manquant pour l'entrée ${index + 1}`);
          return;
        }

        // Trouver la location correspondante
        const location = this.locations.find(loc =>
          loc.locataire === paymentStat.locataire._id &&
          loc.room === paymentStat.room._id &&
          loc.isRunning === true
        );

        if (location && location.startedAt) {
          const tenantCalculation = this.tenantPaymentCalculator.calculateTenantPaymentStatus(
            paymentStat,
            location,
            this.selectedYear
          );

          if (tenantCalculation) {
            this.tenantPaymentCalculations.push(tenantCalculation);
            processedCount++;
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

    this.calculateGlobalStats();
    this.applyFilters();
  }



  private calculateGlobalStats(): void {
    const totalTenants = this.tenantPaymentCalculations.length;
    
    // Mapper les statuts du service vers les statuts de ce composant
    const excellentTenants = this.tenantPaymentCalculations.filter(t => 
      t.status === 'up_to_date' || t.status === 'ahead').length;
    const goodTenants = this.tenantPaymentCalculations.filter(t => 
      t.status === 'partial' && t.paymentRate >= 80).length;
    const warningTenants = this.tenantPaymentCalculations.filter(t => 
      t.status === 'partial' && t.paymentRate < 80).length;
    const criticalTenants = this.tenantPaymentCalculations.filter(t => 
      t.status === 'late' || t.status === 'no_contract').length;
    
    const averagePaymentRate = totalTenants > 0 
      ? this.tenantPaymentCalculations.reduce((sum, t) => sum + t.paymentRate, 0) / totalTenants 
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

  // === MÉTHODES DE FILTRAGE ===

  applyFilters(): void {
    this.filteredSummaries = this.tenantPaymentCalculations.filter(tenant => {
      // Mapper le statut pour le filtre
      let mappedStatus = 'good';
      if (tenant.status === 'up_to_date' || tenant.status === 'ahead') mappedStatus = 'excellent';
      else if (tenant.status === 'partial' && tenant.paymentRate >= 80) mappedStatus = 'good';
      else if (tenant.status === 'partial' && tenant.paymentRate < 80) mappedStatus = 'warning';
      else if (tenant.status === 'late' || tenant.status === 'no_contract') mappedStatus = 'critical';
      
      // Filtre par statut
      if (this.statusFilter !== 'all' && mappedStatus !== this.statusFilter) {
        return false;
      }

      // Filtre par recherche
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        if (!tenant.tenantName.toLowerCase().includes(searchLower) && 
            !tenant.roomCode.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  // === MÉTHODES D'EXPORT ===

  onExportTenantAnalysis(): void {
    const exportData = this.filteredSummaries.map(tenant => ({
      'Locataire': tenant.tenantName,
      'Chambre': tenant.roomCode,
      'Revenus attendus': tenant.totalExpected,
      'Revenus reçus': tenant.totalReceived,
      'Taux de paiement': `${tenant.paymentRate.toFixed(1)}%`,
      'Statut': this.getCalculationStatusLabel(tenant.status),
      'Mois occupés': tenant.monthsOccupied,
      'Loyer mensuel': tenant.monthlyRent,
      'Statut contrat': tenant.contractStatus,
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

  trackByTenantId(_: number, tenant: TenantPaymentCalculation): string {
    return tenant.tenantId;
  }
  
  getCalculationStatusLabel(status: TenantPaymentCalculation['status']): string {
    switch (status) {
      case 'up_to_date': return 'À jour';
      case 'ahead': return 'En avance';
      case 'partial': return 'Paiement partiel';
      case 'late': return 'En retard';
      case 'no_contract': return 'Pas de contrat';
      case 'ended_contract': return 'Contrat terminé';
      default: return 'Inconnu';
    }
  }

  getCalculationStatusColor(status: TenantPaymentCalculation['status']): string {
    switch (status) {
      case 'up_to_date': return 'bg-green-100 text-green-800';
      case 'ahead': return 'bg-blue-100 text-blue-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'late': return 'bg-red-100 text-red-800';
      case 'no_contract': return 'bg-gray-100 text-gray-800';
      case 'ended_contract': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
  
  // Méthodes de mapping pour les statuts
  getMappedStatus(tenant: TenantPaymentCalculation): 'excellent' | 'good' | 'warning' | 'critical' {
    if (tenant.status === 'up_to_date' || tenant.status === 'ahead') return 'excellent';
    if (tenant.status === 'partial' && tenant.paymentRate >= 80) return 'good';
    if (tenant.status === 'partial' && tenant.paymentRate < 80) return 'warning';
    if (tenant.status === 'late' || tenant.status === 'no_contract') return 'critical';
    return 'good';
  }
  

}
