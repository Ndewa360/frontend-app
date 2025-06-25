import { Component, Input, OnInit } from '@angular/core';

interface HistoryItem {
  id: string;
  date: Date;
  type: 'payment' | 'maintenance' | 'tenant_move_in' | 'tenant_move_out' | 'contract_renewal';
  description: string;
  amount?: number;
  unitId?: string;
  tenantId?: string;
}

@Component({
  selector: 'app-property-history',
  templateUrl: './property-history.component.html',
  styleUrls: ['./property-history.component.scss']
})
export class PropertyHistoryComponent implements OnInit {
  @Input() propertyId: string = '';
  @Input() history: HistoryItem[] = [];
  @Input() loading: boolean = false;

  filteredHistory: HistoryItem[] = [];
  typeFilter: string = '';
  periodFilter: string = 'all';

  constructor() { }

  ngOnInit(): void {
    this.filteredHistory = [...this.history];
    this.sortHistory();
  }

  filterHistory(): void {
    this.filteredHistory = this.history.filter(item => {
      const matchesType = !this.typeFilter || item.type === this.typeFilter;
      const matchesPeriod = this.matchesPeriodFilter(item.date);
      
      return matchesType && matchesPeriod;
    });
    
    this.sortHistory();
  }

  private matchesPeriodFilter(date: Date): boolean {
    if (this.periodFilter === 'all') return true;
    
    const now = new Date();
    const itemDate = new Date(date);
    
    switch (this.periodFilter) {
      case 'last_month':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        return itemDate >= lastMonth;
      case 'last_3_months':
        const last3Months = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        return itemDate >= last3Months;
      case 'last_6_months':
        const last6Months = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        return itemDate >= last6Months;
      case 'last_year':
        const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        return itemDate >= lastYear;
      default:
        return true;
    }
  }

  private sortHistory(): void {
    this.filteredHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  clearFilters(): void {
    this.typeFilter = '';
    this.periodFilter = 'all';
    this.filterHistory();
  }

  trackByHistoryId(index: number, item: HistoryItem): string {
    return item.id;
  }

  // Méthodes de statistiques
  getPaymentCount(): number {
    return this.filteredHistory.filter(item => item.type === 'payment').length;
  }

  getMaintenanceCount(): number {
    return this.filteredHistory.filter(item => item.type === 'maintenance').length;
  }

  getTenantMovementCount(): number {
    return this.filteredHistory.filter(item => 
      item.type === 'tenant_move_in' || item.type === 'tenant_move_out'
    ).length;
  }

  getContractCount(): number {
    return this.filteredHistory.filter(item => item.type === 'contract_renewal').length;
  }

  // Méthodes utilitaires
  getEventTypeLabel(type: string): string {
    const labels = {
      'payment': 'Paiement',
      'maintenance': 'Maintenance',
      'tenant_move_in': 'Emménagement',
      'tenant_move_out': 'Déménagement',
      'contract_renewal': 'Renouvellement'
    };
    return labels[type as keyof typeof labels] || type;
  }

  getEventIcon(type: string): string {
    const icons = {
      'payment': 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
      'maintenance': 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
      'tenant_move_in': 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
      'tenant_move_out': 'M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6',
      'contract_renewal': 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
    };
    return icons[type as keyof typeof icons] || '';
  }

  getUnitName(unitId: string): string {
    // Cette méthode devrait récupérer le nom de l'unité depuis le store ou un service
    // Pour l'instant, on retourne un nom générique
    return `Unité ${unitId.slice(-4)}`;
  }

  getTenantName(tenantId: string): string {
    // Cette méthode devrait récupérer le nom du locataire depuis le store ou un service
    // Pour l'instant, on retourne un nom générique
    return `Locataire ${tenantId.slice(-4)}`;
  }

  // Export
  exportHistory(): void {
    console.log('Exporter l\'historique');
    // Implémentation de l'export
  }
}
