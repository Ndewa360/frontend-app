import { Component, Input, OnInit, OnDestroy } from '@angular/core';

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  unitId: string;
  unitName: string;
  rentAmount: number;
  leaseStart: Date;
  leaseEnd: Date;
  status: 'active' | 'pending' | 'expired';
}

@Component({
  selector: 'app-property-tenants',
  templateUrl: './property-tenants.component.html',
  styleUrls: ['./property-tenants.component.scss']
})
export class PropertyTenantsComponent implements OnInit, OnDestroy {
  @Input() propertyId: string = '';
  @Input() tenants: Tenant[] = [];
  @Input() units: any[] = [];
  @Input() loading: boolean = false;

  filteredTenants: Tenant[] = [];
  searchTerm: string = '';
  statusFilter: string = '';
  sortBy: string = 'name';
  activeTenantMenu: string | null = null;

  constructor() { }

  ngOnInit(): void {
    this.filteredTenants = [...this.tenants];
    this.sortTenants();
    this.setupClickOutsideListener();
  }

  ngOnDestroy(): void {
    this.removeClickOutsideListener();
  }

  private setupClickOutsideListener(): void {
    document.addEventListener('click', this.onDocumentClick.bind(this));
  }

  private removeClickOutsideListener(): void {
    document.removeEventListener('click', this.onDocumentClick.bind(this));
  }

  private onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.activeTenantMenu = null;
    }
  }

  filterTenants(): void {
    this.filteredTenants = this.tenants.filter(tenant => {
      const matchesSearch = !this.searchTerm || 
        tenant.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        tenant.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        tenant.unitName.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesStatus = !this.statusFilter || tenant.status === this.statusFilter;

      return matchesSearch && matchesStatus;
    });
    
    this.sortTenants();
  }

  sortTenants(): void {
    this.filteredTenants.sort((a, b) => {
      switch (this.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'unit':
          return a.unitName.localeCompare(b.unitName);
        case 'rent':
          return b.rentAmount - a.rentAmount;
        case 'lease_end':
          return new Date(a.leaseEnd).getTime() - new Date(b.leaseEnd).getTime();
        default:
          return 0;
      }
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.filterTenants();
  }

  trackByTenantId(index: number, tenant: Tenant): string {
    return tenant.id;
  }

  // Méthodes de statistiques
  getTotalTenants(): number {
    return this.tenants.length;
  }

  getActiveTenants(): number {
    return this.tenants.filter(tenant => tenant.status === 'active').length;
  }

  getExpiringLeases(): number {
    const now = new Date();
    const threeMonthsFromNow = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000));
    
    return this.tenants.filter(tenant => {
      const leaseEnd = new Date(tenant.leaseEnd);
      return leaseEnd <= threeMonthsFromNow && leaseEnd > now;
    }).length;
  }

  getTotalRent(): number {
    return this.tenants
      .filter(tenant => tenant.status === 'active')
      .reduce((sum, tenant) => sum + tenant.rentAmount, 0);
  }

  // Méthodes utilitaires
  getStatusLabel(status: string): string {
    const labels = {
      'active': 'Actif',
      'pending': 'En attente',
      'expired': 'Expiré'
    };
    return labels[status as keyof typeof labels] || status;
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  isLeaseExpiringSoon(tenant: Tenant): boolean {
    const now = new Date();
    const threeMonthsFromNow = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000));
    const leaseEnd = new Date(tenant.leaseEnd);
    
    return leaseEnd <= threeMonthsFromNow && leaseEnd > now;
  }

  getRemainingLeaseDays(tenant: Tenant): number {
    const now = new Date();
    const leaseEnd = new Date(tenant.leaseEnd);
    const diffTime = leaseEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }

  // Actions sur les locataires
  addTenant(): void {
    console.log('Ajouter un nouveau locataire');
    // Implémentation de l'ajout de locataire
  }

  viewTenant(tenant: Tenant): void {
    console.log('Voir locataire:', tenant);
    // Navigation vers le profil du locataire
  }

  editTenant(tenant: Tenant): void {
    console.log('Modifier locataire:', tenant);
    // Navigation vers l'édition du locataire
  }

  recordPayment(tenant: Tenant): void {
    console.log('Enregistrer paiement pour:', tenant);
    // Navigation vers l'enregistrement de paiement
  }

  renewLease(tenant: Tenant): void {
    console.log('Renouveler bail pour:', tenant);
    // Implémentation du renouvellement de bail
    this.activeTenantMenu = null;
  }

  terminateLease(tenant: Tenant): void {
    if (confirm(`Êtes-vous sûr de vouloir résilier le bail de "${tenant.name}" ?`)) {
      console.log('Résilier bail pour:', tenant);
      // Implémentation de la résiliation de bail
    }
    this.activeTenantMenu = null;
  }

  sendNotification(tenant: Tenant): void {
    console.log('Envoyer notification à:', tenant);
    // Implémentation de l'envoi de notification
    this.activeTenantMenu = null;
  }

  generateTenantReport(tenant: Tenant): void {
    console.log('Générer rapport pour:', tenant);
    // Implémentation de la génération de rapport
    this.activeTenantMenu = null;
  }

  // Menu contextuel
  toggleTenantMenu(tenantId: string): void {
    this.activeTenantMenu = this.activeTenantMenu === tenantId ? null : tenantId;
  }

  // Export
  exportTenants(): void {
    console.log('Exporter les locataires');
    // Implémentation de l'export
  }
}
