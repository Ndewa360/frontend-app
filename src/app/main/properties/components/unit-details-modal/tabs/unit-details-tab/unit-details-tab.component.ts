import { Component, Input } from '@angular/core';
import { RoomModel, LocataireModel } from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';

@Component({
  selector: 'app-unit-details-tab',
  templateUrl: './unit-details-tab.component.html',
  styleUrls: ['./unit-details-tab.component.scss']
})
export class UnitDetailsTabComponent {
  @Input() room: RoomModel | null = null;
  @Input() tenant: LocataireModel | null = null;

  getRoomTypeLabel(): string {
    if (!this.room?.type) return 'Type inconnu';
    return UtilsString.getStringOfRoomType(this.room.type);
  }

  getRoomStatus(): 'occupied' | 'available' | 'maintenance' {
    if (!this.room) return 'maintenance';
    if (this.room.isFree === true) return 'available';
    if (this.room.isFree === false) return 'occupied';
    return 'maintenance';
  }

  getRoomStatusLabel(): string {
    const status = this.getRoomStatus();
    switch (status) {
      case 'available': return 'Disponible';
      case 'occupied': return 'Occupée';
      case 'maintenance': return 'En maintenance';
      default: return 'Statut inconnu';
    }
  }

  formatPrice(price: number): string {
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
}
