import { Component, Input, OnInit, OnDestroy } from '@angular/core';

interface Unit {
  id: string;
  name: string;
  type: string;
  surface: number;
  price: number;
  status: 'occupied' | 'available' | 'maintenance';
  tenant?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

@Component({
  selector: 'app-property-units',
  templateUrl: './property-units.component.html',
  styleUrls: ['./property-units.component.scss']
})
export class PropertyUnitsComponent implements OnInit, OnDestroy {
  @Input() propertyId: string = '';
  @Input() units: Unit[] = [];

  filteredUnits: Unit[] = [];
  searchTerm: string = '';
  statusFilter: string = '';
  typeFilter: string = '';
  activeUnitMenu: string | null = null;

  constructor() { }

  ngOnInit(): void {
    this.filteredUnits = [...this.units];
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
      this.activeUnitMenu = null;
    }
  }

  filterUnits(): void {
    this.filteredUnits = this.units.filter(unit => {
      const matchesSearch = !this.searchTerm || 
        unit.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        unit.type.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (unit.tenant?.name.toLowerCase().includes(this.searchTerm.toLowerCase()));

      const matchesStatus = !this.statusFilter || unit.status === this.statusFilter;
      const matchesType = !this.typeFilter || unit.type.toLowerCase().includes(this.typeFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesType;
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.typeFilter = '';
    this.filterUnits();
  }

  trackByUnitId(index: number, unit: Unit): string {
    return unit.id;
  }

  // Méthodes de statistiques
  getTotalUnits(): number {
    return this.units.length;
  }

  getOccupiedUnits(): number {
    return this.units.filter(unit => unit.status === 'occupied').length;
  }

  getAvailableUnits(): number {
    return this.units.filter(unit => unit.status === 'available').length;
  }

  getMaintenanceUnits(): number {
    return this.units.filter(unit => unit.status === 'maintenance').length;
  }

  // Méthodes utilitaires
  getStatusLabel(status: string): string {
    const labels = {
      'occupied': 'Occupé',
      'available': 'Disponible',
      'maintenance': 'Maintenance'
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

  // Actions sur les unités
  addUnit(): void {
    console.log('Ajouter une nouvelle unité');
    // Implémentation de l'ajout d'unité
  }

  viewUnit(unit: Unit): void {
    console.log('Voir unité:', unit);
    // Navigation vers les détails de l'unité
  }

  editUnit(unit: Unit): void {
    console.log('Modifier unité:', unit);
    // Navigation vers l'édition de l'unité
  }

  duplicateUnit(unit: Unit): void {
    console.log('Dupliquer unité:', unit);
    // Implémentation de la duplication
    this.activeUnitMenu = null;
  }

  deleteUnit(unit: Unit): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'unité "${unit.name}" ?`)) {
      console.log('Supprimer unité:', unit);
      // Implémentation de la suppression
    }
    this.activeUnitMenu = null;
  }

  // Actions sur les locataires
  viewTenant(tenant: any): void {
    console.log('Voir locataire:', tenant);
    // Navigation vers le profil du locataire
  }

  addTenantToUnit(unit: Unit): void {
    console.log('Ajouter locataire à l\'unité:', unit);
    // Navigation vers l'ajout de locataire
  }

  // Actions de maintenance
  scheduleMaintenanceUnit(unit: Unit): void {
    console.log('Programmer maintenance pour:', unit);
    // Implémentation de la programmation de maintenance
    this.activeUnitMenu = null;
  }

  // Rapports
  generateUnitReport(unit: Unit): void {
    console.log('Générer rapport pour:', unit);
    // Implémentation de la génération de rapport
    this.activeUnitMenu = null;
  }

  // Menu contextuel
  toggleUnitMenu(unitId: string): void {
    this.activeUnitMenu = this.activeUnitMenu === unitId ? null : unitId;
  }

  // Export
  exportUnits(): void {
    console.log('Exporter les unités');
    // Implémentation de l'export
  }
}
