import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { StatisticRoomYearModel } from 'src/app/shared/store';
import { ExportData } from '../../property-finances.component';

export interface DepositSummary {
  roomId: string;
  roomCode: string;
  roomType: string;
  roomPrice: number;
  expectedDeposit: number;
  receivedDeposit: number;
  depositRate: number;
  tenantName?: string;
  status: 'complete' | 'partial' | 'missing' | 'no_tenant';
}

@Component({
  selector: 'app-deposits-summary',
  templateUrl: './deposits-summary.component.html',
  styleUrls: ['./deposits-summary.component.scss']
})
export class DepositsSummaryComponent implements OnInit, OnChanges {
  @Input() yearlyStats: StatisticRoomYearModel[] = [];
  @Input() selectedYear: number = new Date().getFullYear();
  @Input() isLoading: boolean = false;

  @Output() exportData = new EventEmitter<ExportData>();

  depositSummaries: DepositSummary[] = [];
  filteredSummaries: DepositSummary[] = [];

  // Filtres
  statusFilter: 'all' | 'complete' | 'partial' | 'missing' | 'no_tenant' = 'all';
  searchTerm: string = '';

  // Statistiques globales
  globalStats = {
    totalRooms: 0,
    totalExpectedDeposits: 0,
    totalReceivedDeposits: 0,
    completeDeposits: 0,
    partialDeposits: 0,
    missingDeposits: 0,
    noTenantRooms: 0,
    averageDepositRate: 0
  };

  ngOnInit(): void {
    this.processDepositData();
  }

  ngOnChanges(): void {
    this.processDepositData();
  }

  private processDepositData(): void {
    this.depositSummaries = this.yearlyStats.map(roomStat => {
      const roomPrice = roomStat.room?.price || 0;
      const expectedDeposit = this.calculateExpectedDeposit(roomPrice);
      // Estimation des cautions reçues (2 mois de loyer par défaut)
      const receivedDeposit = roomPrice * 2; // Estimation
      const depositRate = expectedDeposit > 0 ? (receivedDeposit / expectedDeposit) * 100 : 0;

      return {
        roomId: roomStat.room?._id || '',
        roomCode: roomStat.room?.code || 'N/A',
        roomType: this.getRoomTypeLabel(roomStat.room?.type),
        roomPrice,
        expectedDeposit,
        receivedDeposit,
        depositRate,
        tenantName: this.getCurrentTenantName(roomStat),
        status: this.determineDepositStatus(depositRate, this.getCurrentTenantName(roomStat))
      };
    });

    this.calculateGlobalStats();
    this.applyFilters();
  }

  private calculateExpectedDeposit(roomPrice: number): number {
    // Généralement, la caution = 2 mois de loyer
    return roomPrice * 2;
  }

  private getCurrentTenantName(roomStat: any): string | undefined {
    // Logique pour récupérer le nom du locataire actuel
    // Cela dépendra de la structure des données disponibles
    return undefined; // À implémenter selon les données disponibles
  }

  private determineDepositStatus(depositRate: number, tenantName?: string): DepositSummary['status'] {
    if (!tenantName) return 'no_tenant';
    if (depositRate >= 100) return 'complete';
    if (depositRate > 0) return 'partial';
    return 'missing';
  }

  private calculateGlobalStats(): void {
    this.globalStats = {
      totalRooms: this.depositSummaries.length,
      totalExpectedDeposits: this.depositSummaries.reduce((sum, d) => sum + d.expectedDeposit, 0),
      totalReceivedDeposits: this.depositSummaries.reduce((sum, d) => sum + d.receivedDeposit, 0),
      completeDeposits: this.depositSummaries.filter(d => d.status === 'complete').length,
      partialDeposits: this.depositSummaries.filter(d => d.status === 'partial').length,
      missingDeposits: this.depositSummaries.filter(d => d.status === 'missing').length,
      noTenantRooms: this.depositSummaries.filter(d => d.status === 'no_tenant').length,
      averageDepositRate: this.depositSummaries.length > 0 
        ? this.depositSummaries.reduce((sum, d) => sum + d.depositRate, 0) / this.depositSummaries.length 
        : 0
    };
  }

  // === MÉTHODES DE FILTRAGE ===

  applyFilters(): void {
    this.filteredSummaries = this.depositSummaries.filter(deposit => {
      // Filtre par statut
      if (this.statusFilter !== 'all' && deposit.status !== this.statusFilter) {
        return false;
      }

      // Filtre par recherche
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        if (!deposit.roomCode.toLowerCase().includes(searchLower) && 
            !deposit.tenantName?.toLowerCase().includes(searchLower)) {
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

  onExportDepositSummary(): void {
    const exportData = this.filteredSummaries.map(deposit => ({
      'Code chambre': deposit.roomCode,
      'Type': deposit.roomType,
      'Loyer mensuel': deposit.roomPrice,
      'Caution attendue': deposit.expectedDeposit,
      'Caution reçue': deposit.receivedDeposit,
      'Taux de caution': deposit.depositRate,
      'Locataire': deposit.tenantName || 'Aucun',
      'Statut': this.getStatusLabel(deposit.status)
    }));

    this.exportData.emit({
      type: 'excel',
      data: exportData,
      filename: `recapitulatif-cautions-${this.selectedYear}`
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

  getRoomTypeLabel(type: string): string {
    switch (type) {
      case 'room': return 'Chambre';
      case 'studio': return 'Studio';
      case 'simple_apartment': return 'Appartement';
      case 'furnished_apartment': return 'App. Meublé';
      default: return 'Inconnu';
    }
  }

  getStatusLabel(status: DepositSummary['status']): string {
    switch (status) {
      case 'complete': return 'Complète';
      case 'partial': return 'Partielle';
      case 'missing': return 'Manquante';
      case 'no_tenant': return 'Pas de locataire';
      default: return 'Inconnu';
    }
  }

  getStatusColor(status: DepositSummary['status']): string {
    switch (status) {
      case 'complete': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'missing': return 'bg-red-100 text-red-800';
      case 'no_tenant': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusIcon(status: DepositSummary['status']): string {
    switch (status) {
      case 'complete': return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'partial': return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z';
      case 'missing': return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'no_tenant': return 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z';
      default: return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  trackByRoomId(_: number, deposit: DepositSummary): string {
    return deposit.roomId;
  }

  // Propriété Math pour les templates
  Math = Math;
}
