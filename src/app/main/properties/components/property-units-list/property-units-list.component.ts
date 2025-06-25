import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Unit } from '../../services/property-data.service';

export interface UnitAction {
  type: 'view' | 'edit' | 'assign_tenant' | 'terminate_lease' | 'manage_media' | 'toggle_status';
  unit: Unit;
  data?: any;
}

@Component({
  selector: 'app-property-units-list',
  templateUrl: './property-units-list.component.html',
  styleUrls: ['./property-units-list.component.scss']
})
export class PropertyUnitsListComponent implements OnInit, OnChanges {
  @Input() units: Unit[] = [];
  @Input() loading: boolean = false;
  @Input() propertyId: string | null = null;

  @Output() unitAction = new EventEmitter<UnitAction>();
  @Output() addUnit = new EventEmitter<void>();

  // États du composant
  filteredUnits: Unit[] = [];
  searchTerm: string = '';
  statusFilter: string = 'all';
  typeFilter: string = 'all';
  sortBy: string = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';
  viewMode: 'grid' | 'list' = 'grid';

  // Options de filtrage
  statusOptions = [
    { value: 'all', label: 'Tous les statuts', count: 0 },
    { value: 'available', label: 'Disponibles', count: 0 },
    { value: 'occupied', label: 'Occupées', count: 0 },
    { value: 'maintenance', label: 'En maintenance', count: 0 }
  ];

  typeOptions: { value: string; label: string; count: number }[] = [];

  sortOptions = [
    { value: 'name', label: 'Nom' },
    { value: 'price', label: 'Prix' },
    { value: 'type', label: 'Type' },
    { value: 'status', label: 'Statut' }
  ];

  constructor() { }

  ngOnInit(): void {
    this.initializeFilters();
    this.applyFilters();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['units']) {
      this.initializeFilters();
      this.applyFilters();
    }
  }

  private initializeFilters(): void {
    // Mettre à jour les compteurs de statut
    this.statusOptions.forEach(option => {
      if (option.value === 'all') {
        option.count = this.units.length;
      } else {
        option.count = this.units.filter(unit => unit.status === option.value).length;
      }
    });

    // Mettre à jour les types disponibles
    const types = [...new Set(this.units.map(unit => unit.type))];
    this.typeOptions = [
      { value: 'all', label: 'Tous les types', count: this.units.length },
      ...types.map(type => ({
        value: type,
        label: type,
        count: this.units.filter(unit => unit.type === type).length
      }))
    ];
  }

  applyFilters(): void {
    let filtered = [...this.units];

    // Filtre par recherche
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(unit =>
        unit.name.toLowerCase().includes(term) ||
        unit.code.toLowerCase().includes(term) ||
        unit.type.toLowerCase().includes(term) ||
        unit.tenant?.name.toLowerCase().includes(term)
      );
    }

    // Filtre par statut
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(unit => unit.status === this.statusFilter);
    }

    // Filtre par type
    if (this.typeFilter !== 'all') {
      filtered = filtered.filter(unit => unit.type === this.typeFilter);
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue: any = a[this.sortBy as keyof Unit];
      let bValue: any = b[this.sortBy as keyof Unit];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredUnits = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  onTypeFilterChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  toggleSortDirection(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.applyFilters();
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  // Actions sur les unités
  onViewUnit(unit: Unit): void {
    this.unitAction.emit({ type: 'view', unit });
  }

  onEditUnit(unit: Unit): void {
    this.unitAction.emit({ type: 'edit', unit });
  }

  onAssignTenant(unit: Unit): void {
    this.unitAction.emit({ type: 'assign_tenant', unit });
  }

  onTerminateLease(unit: Unit): void {
    this.unitAction.emit({ type: 'terminate_lease', unit });
  }

  onManageMedia(unit: Unit): void {
    this.unitAction.emit({ type: 'manage_media', unit });
  }

  onToggleStatus(unit: Unit): void {
    this.unitAction.emit({ type: 'toggle_status', unit });
  }

  onAddUnit(): void {
    this.addUnit.emit();
  }

  // Méthodes utilitaires
  getUnitStatusClass(status: string): string {
    switch (status) {
      case 'occupied':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'available':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  getUnitStatusLabel(status: string): string {
    switch (status) {
      case 'occupied':
        return 'Occupée';
      case 'available':
        return 'Libre';
      case 'maintenance':
        return 'Maintenance';
      default:
        return 'Inconnu';
    }
  }

  getUnitStatusIcon(status: string): string {
    switch (status) {
      case 'occupied':
        return 'user';
      case 'available':
        return 'home';
      case 'maintenance':
        return 'tools';
      default:
        return 'help';
    }
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(price);
  }

  getDefaultImage(): string {
    return 'assets/images/default-property.jpg';
  }

  trackByUnitId(_index: number, unit: Unit): string {
    return unit.id;
  }

  // Méthodes pour les actions rapides
  canAssignTenant(unit: Unit): boolean {
    return unit.status === 'available' && unit.isActiveForSouscription;
  }

  canTerminateLease(unit: Unit): boolean {
    return unit.status === 'occupied' && !!unit.tenant;
  }

  getQuickActions(unit: Unit): Array<{
    label: string;
    icon: string;
    action: () => void;
    disabled?: boolean;
    color?: string;
  }> {
    const actions = [
      {
        label: 'Voir détails',
        icon: 'view',
        action: () => this.onViewUnit(unit)
      },
      {
        label: 'Modifier',
        icon: 'edit',
        action: () => this.onEditUnit(unit)
      },
      {
        label: 'Gérer médias',
        icon: 'image',
        action: () => this.onManageMedia(unit)
      }
    ];

    if (this.canAssignTenant(unit)) {
      actions.push({
        label: 'Assigner locataire',
        icon: 'userAdd',
        action: () => this.onAssignTenant(unit)
      });
    }

    if (this.canTerminateLease(unit)) {
      actions.push({
        label: 'Résilier contrat',
        icon: 'userRemove',
        action: () => this.onTerminateLease(unit)
      });
    }

    return actions;
  }

  // Méthodes pour les statistiques rapides
  getOccupancyRate(): number {
    if (this.units.length === 0) return 0;
    const occupied = this.units.filter(unit => unit.status === 'occupied').length;
    return Math.round((occupied / this.units.length) * 100);
  }

  getTotalRevenue(): number {
    return this.units
      .filter(unit => unit.status === 'occupied')
      .reduce((sum, unit) => sum + unit.price, 0);
  }

  getAverageRent(): number {
    if (this.units.length === 0) return 0;
    const totalRent = this.units.reduce((sum, unit) => sum + unit.price, 0);
    return totalRent / this.units.length;
  }
}
