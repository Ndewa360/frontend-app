import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-mobile-property-stats',
  templateUrl: './mobile-property-stats.component.html',
  styleUrls: ['./mobile-property-stats.component.scss']
})
export class MobilePropertyStatsComponent {
  @Input() property: any;

  getAvailableRooms(): number {
    return Math.floor((this.property?.numberOfRooms || 0) * 0.6);
  }

  getOccupiedRooms(): number {
    return Math.floor((this.property?.numberOfRooms || 0) * 0.3);
  }

  getMaintenanceRooms(): number {
    return Math.floor((this.property?.numberOfRooms || 0) * 0.1);
  }

  getMonthlyRevenue(): number {
    return this.getOccupiedRooms() * 50000; // 50k FCFA par chambre
  }

  getOccupancyRate(): number {
    const total = this.property?.numberOfRooms || 0;
    if (total === 0) return 0;
    return Math.round((this.getOccupiedRooms() / total) * 100);
  }

  getOverallStatus(): string {
    const rate = this.getOccupancyRate();
    if (rate >= 80) return 'Excellent';
    if (rate >= 60) return 'Bon';
    if (rate >= 40) return 'Moyen';
    return 'Faible';
  }

  getOverallStatusColor(): string {
    const rate = this.getOccupancyRate();
    if (rate >= 80) return 'success';
    if (rate >= 60) return 'primary';
    if (rate >= 40) return 'warning';
    return 'danger';
  }

  formatRevenue(amount: number): string {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getRecentActivities(): any[] {
    // Simulation d'activités récentes
    return [
      {
        icon: 'person-add',
        color: 'success',
        text: 'Nouveau locataire en chambre 12',
        date: new Date(Date.now() - 2 * 60 * 60 * 1000) // Il y a 2h
      },
      {
        icon: 'cash',
        color: 'primary',
        text: 'Paiement reçu - Chambre 8',
        date: new Date(Date.now() - 5 * 60 * 60 * 1000) // Il y a 5h
      },
      {
        icon: 'construct',
        color: 'warning',
        text: 'Maintenance programmée - Chambre 3',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000) // Il y a 1 jour
      }
    ];
  }
}
