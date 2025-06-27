import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import {
  StatisticLocataireYearModel,
  StatisticPaymentStateType
} from 'src/app/shared/store';
import { ExportData } from '../../property-finances.component';

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
  @Input() selectedYear: number = new Date().getFullYear();
  @Input() isLoading: boolean = false;

  @Output() exportData = new EventEmitter<ExportData>();

  tenantSummaries: TenantPaymentSummary[] = [];
  filteredSummaries: TenantPaymentSummary[] = [];
  
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

  ngOnInit(): void {
    this.processTenantData();
  }

  ngOnChanges(): void {
    this.processTenantData();
  }

  private processTenantData(): void {
    this.tenantSummaries = this.tenantStats.map(tenantStat => {
      const monthlyPayments = this.buildMonthlyPayments(tenantStat);
      const totalExpected = monthlyPayments.reduce((sum, month) => sum + month.expectedAmount, 0);
      const totalReceived = monthlyPayments.reduce((sum, month) => sum + month.receivedAmount, 0);
      const overallRate = totalExpected > 0 ? (totalReceived / totalExpected) * 100 : 0;

      return {
        tenantId: tenantStat.locataire?._id || '',
        tenantName: tenantStat.locataire?.fullName || 'Locataire inconnu',
        roomCode: 'N/A', // Cette information n'est pas directement disponible dans StatisticLocataireYearModel
        monthlyPayments,
        totalExpected,
        totalReceived,
        overallRate,
        status: this.determineStatus(overallRate, monthlyPayments)
      };
    });

    this.calculateGlobalStats();
    this.applyFilters();
  }

  private buildMonthlyPayments(tenantStat: StatisticLocataireYearModel): TenantPaymentSummary['monthlyPayments'] {
    const monthlyPayments: TenantPaymentSummary['monthlyPayments'] = [];

    for (let month = 0; month < 12; month++) {
      // Utiliser paymentValue qui est un tableau des paiements mensuels
      const receivedAmount = tenantStat.paymentValue?.[month] || 0;
      // Estimation du montant attendu (on pourrait l'obtenir d'une autre source)
      const expectedAmount = 50000; // Estimation par défaut, à ajuster selon les données disponibles
      const paymentRate = expectedAmount > 0 ? (receivedAmount / expectedAmount) * 100 : 0;

      // Déterminer le statut basé sur le montant reçu
      let state = StatisticPaymentStateType.NO_CONTRACT;
      if (receivedAmount > 0) {
        if (receivedAmount >= expectedAmount) {
          state = StatisticPaymentStateType.PAYED;
        } else {
          state = StatisticPaymentStateType.PARTIAL_PAYMENT;
        }
      } else {
        state = StatisticPaymentStateType.UNPAYED;
      }

      monthlyPayments.push({
        month,
        monthName: this.getMonthName(month),
        state,
        expectedAmount,
        receivedAmount,
        paymentRate
      });
    }

    return monthlyPayments;
  }

  private determineStatus(overallRate: number, monthlyPayments: TenantPaymentSummary['monthlyPayments']): TenantPaymentSummary['status'] {
    // Compter les mois avec des problèmes
    const problematicMonths = monthlyPayments.filter(month => 
      month.state === StatisticPaymentStateType.UNPAYED || 
      month.state === StatisticPaymentStateType.PARTIAL_PAYMENT
    ).length;

    if (overallRate >= 95 && problematicMonths === 0) return 'excellent';
    if (overallRate >= 80 && problematicMonths <= 1) return 'good';
    if (overallRate >= 60 || problematicMonths <= 3) return 'warning';
    return 'critical';
  }

  private calculateGlobalStats(): void {
    this.globalStats = {
      totalTenants: this.tenantSummaries.length,
      excellentTenants: this.tenantSummaries.filter(t => t.status === 'excellent').length,
      goodTenants: this.tenantSummaries.filter(t => t.status === 'good').length,
      warningTenants: this.tenantSummaries.filter(t => t.status === 'warning').length,
      criticalTenants: this.tenantSummaries.filter(t => t.status === 'critical').length,
      averagePaymentRate: this.tenantSummaries.length > 0 
        ? this.tenantSummaries.reduce((sum, t) => sum + t.overallRate, 0) / this.tenantSummaries.length 
        : 0
    };
  }

  // === MÉTHODES DE FILTRAGE ===

  applyFilters(): void {
    this.filteredSummaries = this.tenantSummaries.filter(tenant => {
      // Filtre par statut
      if (this.statusFilter !== 'all' && tenant.status !== this.statusFilter) {
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
      'Taux de paiement': tenant.overallRate,
      'Statut': this.getStatusLabel(tenant.status),
      ...this.getMonthlyExportData(tenant)
    }));

    this.exportData.emit({
      type: 'excel',
      data: exportData,
      filename: `analyse-locataires-${this.selectedYear}`
    });
  }

  private getMonthlyExportData(tenant: TenantPaymentSummary): any {
    const monthlyData: any = {};
    tenant.monthlyPayments.forEach(month => {
      monthlyData[`${month.monthName} - État`] = this.getPaymentStateLabel(month.state);
      monthlyData[`${month.monthName} - Attendu`] = month.expectedAmount;
      monthlyData[`${month.monthName} - Reçu`] = month.receivedAmount;
      monthlyData[`${month.monthName} - Taux`] = month.paymentRate;
    });
    return monthlyData;
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

  getStatusLabel(status: TenantPaymentSummary['status']): string {
    switch (status) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Bon';
      case 'warning': return 'Attention';
      case 'critical': return 'Critique';
      default: return 'Inconnu';
    }
  }

  getStatusColor(status: TenantPaymentSummary['status']): string {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  trackByTenantId(_: number, tenant: TenantPaymentSummary): string {
    return tenant.tenantId;
  }
}
