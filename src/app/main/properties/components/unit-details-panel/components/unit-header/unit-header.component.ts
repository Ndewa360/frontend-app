import { Component, Input, Output, EventEmitter } from '@angular/core';
import { UnitDetailsData, UnitDetailsService } from '../../../../services/unit-details.service';
import { UtilsString } from 'src/app/shared/utils';

@Component({
  selector: 'app-unit-header',
  templateUrl: './unit-header.component.html',
  styleUrls: ['./unit-header.component.scss']
})
export class UnitHeaderComponent {
  @Input() unitData: UnitDetailsData | null = null;
  @Output() close = new EventEmitter<void>();

  constructor(private unitDetailsService: UnitDetailsService) {}

  getRoomName(): string {
    return this.unitData?.room?.code || `Unité ${this.unitData?.room?._id?.substring(0, 8)}`;
  }

  getRoomType(): string {
    if (!this.unitData?.room?.type) return 'Type inconnu';
    return UtilsString.getStringOfRoomType(this.unitData.room.type);
  }

  getRoomStatus(): string {
    if (!this.unitData?.room) return 'Statut inconnu';
    return this.unitDetailsService.getRoomStatusLabel(this.unitData.room);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(price);
  }

  onClose(): void {
    this.close.emit();
  }
}
