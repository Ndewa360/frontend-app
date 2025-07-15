import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-mobile-unit-details',
  templateUrl: './mobile-unit-details.component.html',
  styleUrls: ['./mobile-unit-details.component.scss']
})
export class MobileUnitDetailsComponent {
  @Input() unit: any;

  getLocation(): string {
    const parts = [];
    if (this.unit?.property?.address) {
      parts.push(this.unit.property.address);
    }
    if (this.unit?.property?.geolocationCity?.name) {
      parts.push(this.unit.property.geolocationCity.name);
    }
    return parts.join(', ') || 'Localisation non spécifiée';
  }

  formatPrice(price: number): string {
    if (!price) return 'Prix sur demande';
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  getRoomType(): string {
    return this.unit?.type || 'Chambre';
  }

  getStatusColor(): string {
    const status = this.unit?.status?.toLowerCase();
    switch (status) {
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

  getStatusLabel(): string {
    const status = this.unit?.status?.toLowerCase();
    switch (status) {
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
}
