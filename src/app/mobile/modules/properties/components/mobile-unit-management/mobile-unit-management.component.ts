import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-mobile-unit-management',
  templateUrl: './mobile-unit-management.component.html',
  styleUrls: ['./mobile-unit-management.component.scss']
})
export class MobileUnitManagementComponent {
  @Input() property: any;

  getUnits(): any[] {
    // Simulation d'unités - à remplacer par les vraies données
    return [
      { id: 1, name: 'Chambre 1', type: 'Chambre', price: 45000, status: 'AVAILABLE' },
      { id: 2, name: 'Chambre 2', type: 'Chambre', price: 45000, status: 'OCCUPIED' },
      { id: 3, name: 'Studio A', type: 'Studio', price: 65000, status: 'MAINTENANCE' },
    ];
  }

  getTotalUnits(): number {
    return this.getUnits().length;
  }

  getAvailableUnits(): number {
    return this.getUnits().filter(unit => unit.status === 'AVAILABLE').length;
  }

  getOccupiedUnits(): number {
    return this.getUnits().filter(unit => unit.status === 'OCCUPIED').length;
  }

  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'available':
        return 'success';
      case 'occupied':
        return 'primary';
      case 'maintenance':
        return 'warning';
      default:
        return 'medium';
    }
  }

  getStatusLabel(status: string): string {
    switch (status?.toLowerCase()) {
      case 'available':
        return 'Disponible';
      case 'occupied':
        return 'Occupé';
      case 'maintenance':
        return 'Maintenance';
      default:
        return 'Inconnu';
    }
  }

  formatPrice(price: number): string {
    if (!price) return 'Prix non défini';
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  addUnit(): void {
    console.log('Ajouter une unité');
  }

  editUnit(unit: any): void {
    console.log('Modifier unité:', unit);
  }

  deleteUnit(unit: any): void {
    console.log('Supprimer unité:', unit);
  }

  trackByUnitId(index: number, unit: any): string {
    return unit.id?.toString() || index.toString();
  }
}
