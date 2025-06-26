import { Component, Input, OnInit, OnDestroy, OnChanges } from '@angular/core';
import { LocataireModel, RoomModel, LocationModel, LocationState } from 'src/app/shared/store';
import { LocationPaymentAction } from 'src/app/shared/store/payment-location';
import { Store } from '@ngxs/store';

@Component({
  selector: 'app-property-tenants',
  templateUrl: './property-tenants.component.html',
  styleUrls: ['./property-tenants.component.scss']
})
export class PropertyTenantsComponent implements OnInit, OnDestroy, OnChanges {
  @Input() propertyId: string = '';
  @Input() tenants: LocataireModel[] = [];
  @Input() units: RoomModel[] = [];
  @Input() loading: boolean = false;

  filteredTenants: LocataireModel[] = [];
  searchTerm: string = '';
  statusFilter: string = '';
  sortBy: string = 'name';
  activeTenantMenu: string | null = null;

  // Données de location pour récupérer les vraies dates d'entrée
  locations: LocationModel[] = [];

  // Locataire sélectionné pour le panneau de détails
  selectedTenant: LocataireModel | null = null;

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.filteredTenants = [...this.tenants];
    this.loadLocations();
    this.filterTenants();

    // Charger les données de paiement pour cette propriété
    if (this.propertyId) {
      this.store.dispatch(new LocationPaymentAction.FetchLocationPaymentsByPropertyId(this.propertyId));
    }
  }

  ngOnChanges(): void {
    this.filteredTenants = [...this.tenants];
    this.loadLocations();
    this.filterTenants();

    // Charger les données de paiement si propertyId change
    if (this.propertyId) {
      this.store.dispatch(new LocationPaymentAction.FetchLocationPaymentsByPropertyId(this.propertyId));
    }
  }

  private loadLocations(): void {
    if (this.propertyId) {
      // Charger les locations pour cette propriété
      this.locations = this.store.selectSnapshot(LocationState.selectStateLocationByPropertyId(this.propertyId)) || [];
    }
  }

  ngOnDestroy(): void {
    // Cleanup si nécessaire
  }

  // === MÉTHODES DE FILTRAGE ET RECHERCHE ===

  filterTenants(): void {
    let filtered = [...this.tenants];

    // Filtre par recherche
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(tenant =>
        (tenant.fullName || '').toLowerCase().includes(term) ||
        (tenant.email || '').toLowerCase().includes(term) ||
        (tenant.phoneNumber || '').toLowerCase().includes(term)
      );
    }

    // Filtre par statut
    if (this.statusFilter) {
      filtered = filtered.filter(tenant => this.getTenantStatus(tenant) === this.statusFilter);
    }

    this.filteredTenants = filtered;
    this.sortTenants();
  }

  sortTenants(): void {
    this.filteredTenants.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortBy) {
        case 'name':
          aValue = a.fullName || '';
          bValue = b.fullName || '';
          break;
        case 'unit':
          aValue = this.getTenantUnit(a) || '';
          bValue = this.getTenantUnit(b) || '';
          break;
        case 'rent':
          aValue = this.getTenantRent(a) || 0;
          bValue = this.getTenantRent(b) || 0;
          break;
        case 'lease_end':
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
        default:
          aValue = a.fullName || '';
          bValue = b.fullName || '';
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return -1;
      if (aValue > bValue) return 1;
      return 0;
    });
  }

  // === MÉTHODES DE STATISTIQUES ===

  getTotalTenants(): number {
    return this.tenants.length;
  }

  getActiveTenants(): number {
    // Un locataire est actif s'il a une unité assignée (room)
    return this.tenants.filter(tenant => tenant.room && tenant.room.trim() !== '').length;
  }

  getTotalRevenue(): number {
    // Calculer le revenu total basé sur les unités occupées
    return this.units
      .filter(unit => !unit.isFree)
      .reduce((sum, unit) => sum + (unit.price || 0), 0);
  }

  getOccupancyRate(): number {
    if (this.units.length === 0) return 0;
    const occupiedUnits = this.units.filter(unit => !unit.isFree).length;
    return Math.round((occupiedUnits / this.units.length) * 100);
  }

  // === MÉTHODES UTILITAIRES POUR LES LOCATAIRES ===

  trackByTenantId(_: number, tenant: LocataireModel): string {
    return tenant._id || '';
  }

  getTenantInitials(tenant: LocataireModel): string {
    const name = tenant.fullName || 'Locataire';
    return name.split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  getTenantAvatarColor(tenant: LocataireModel): string {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
    ];

    const hash = (tenant._id || tenant.fullName || '').split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);

    return colors[Math.abs(hash) % colors.length];
  }

  getTenantStatus(tenant: LocataireModel): 'active' | 'inactive' | 'pending' {
    // Logique pour déterminer le statut
    if (tenant.room) {
      return 'active';
    }
    return 'inactive';
  }

  getTenantStatusLabel(tenant: LocataireModel): string {
    const status = this.getTenantStatus(tenant);
    switch (status) {
      case 'active': return 'Actif';
      case 'inactive': return 'Inactif';
      case 'pending': return 'En attente';
      default: return 'Inconnu';
    }
  }

  getTenantUnit(tenant: LocataireModel): string | null {
    if (!tenant.room) return null;
    const room = this.units.find(r => r._id === tenant.room);
    return room ? (room.code || `Unité ${room._id?.substring(0, 8)}`) : null;
  }

  getTenantRent(tenant: LocataireModel): number | null {
    if (!tenant.room) return null;
    const room = this.units.find(r => r._id === tenant.room);
    return room ? room.price : null;
  }

  getTenantLeaseStart(tenant: LocataireModel): Date | null {
    return tenant.createdAt ? new Date(tenant.createdAt) : null;
  }

  // Nouvelle méthode pour récupérer la vraie date d'entrée depuis LocationModel
  getTenantLeaseStartDate(tenant: LocataireModel): Date | null {
    if (!tenant.room) return null;

    // Chercher la location active pour ce locataire et cette unité
    const location = this.locations.find(loc =>
      loc.locataire === tenant._id &&
      loc.room === tenant.room &&
      loc.isRunning === true
    );

    if (location && location.startedAt) {
      return new Date(location.startedAt);
    }

    // Fallback sur la date de création du locataire
    return tenant.createdAt ? new Date(tenant.createdAt) : null;
  }

  // Méthode pour récupérer l'email réel du locataire
  getTenantEmail(tenant: LocataireModel): string {
    // Utiliser emailRef en priorité, puis email, puis une valeur par défaut
    return tenant.emailRef || tenant.email || 'Email non renseigné';
  }

  // Méthode pour récupérer le téléphone réel du locataire
  getTenantPhone(tenant: LocataireModel): string {
    // Utiliser phoneNumberRef en priorité, puis phoneNumber, puis une valeur par défaut
    return tenant.phoneNumberRef || tenant.phoneNumber || 'Téléphone non renseigné';
  }

  // === MÉTHODES DE FORMATAGE ===

  formatPrice(price: number | null): string {
    if (!price) return '0 FCFA';
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(price);
  }



  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // === MÉTHODES D'ACTIONS ===

  addTenant(): void {
    console.log('Ajouter un nouveau locataire');
    // Implémentation de l'ajout de locataire
  }

  onTenantClick(tenant: LocataireModel): void {
    this.selectedTenant = tenant;
  }

  onViewTenantDetails(tenant: LocataireModel, event: Event): void {
    event.stopPropagation();
    this.selectedTenant = tenant;
  }

  onEditTenant(tenant: LocataireModel, event: Event): void {
    event.stopPropagation();
    console.log('Modifier:', tenant);
    // Logique pour modifier le locataire
  }

  onAddPayment(tenant: LocataireModel, event: Event): void {
    event.stopPropagation();
    console.log('Ajouter paiement:', tenant);
    // Logique pour ajouter un paiement
  }

  onAssignUnit(tenant: LocataireModel, event: Event): void {
    event.stopPropagation();
    console.log('Assigner unité:', tenant);
    // Logique pour assigner une unité
  }

  // === MÉTHODES DE GESTION DU PANNEAU DE DÉTAILS ===

  onCloseTenantDetails(): void {
    this.selectedTenant = null;
  }

  onEditTenantFromPanel(tenant: LocataireModel): void {
    console.log('Modifier locataire depuis panneau:', tenant);
    // Fermer le panneau et ouvrir le modal d'édition
    this.selectedTenant = null;
    // TODO: Ouvrir modal d'édition
  }

  onAssignRoomFromPanel(tenant: LocataireModel): void {
    console.log('Assigner chambre depuis panneau:', tenant);
    // Fermer le panneau et ouvrir le modal d'assignation
    this.selectedTenant = null;
    // TODO: Ouvrir modal d'assignation de chambre
  }

  onViewContractFromPanel(tenant: LocataireModel): void {
    console.log('Voir contrat depuis panneau:', tenant);
    // TODO: Ouvrir modal de visualisation du contrat
  }

  onCancelContractFromPanel(tenant: LocataireModel): void {
    if (confirm(`Êtes-vous sûr de vouloir résilier le contrat de "${tenant.fullName}" ?`)) {
      console.log('Résilier contrat depuis panneau:', tenant);
      // TODO: Logique de résiliation du contrat
      this.selectedTenant = null;
    }
  }

  onAddPaymentFromPanel(tenant: LocataireModel): void {
    console.log('Ajouter paiement depuis panneau:', tenant);
    // Fermer le panneau et ouvrir le modal de paiement
    this.selectedTenant = null;
    // TODO: Ouvrir modal d'ajout de paiement
  }
}
