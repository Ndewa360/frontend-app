import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RoomModel, LocataireModel, LocationModel } from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';
import { ModernPaymentModalComponent } from '../../../modern-payment-modal/modern-payment-modal.component';

@Component({
  selector: 'app-add-payment-modal',
  templateUrl: './add-payment-modal.component.html',
  styleUrls: ['./add-payment-modal.component.scss']
})
export class AddPaymentModalComponent implements OnInit {
  @Input() isOpen: boolean = false;
  @Input() room: RoomModel | null = null;
  @Input() tenant: LocataireModel | null = null;
  @Input() location: LocationModel | null = null;
  @Input() propertyId: string = '';
  @Output() close = new EventEmitter<void>();
  @Output() paymentAdded = new EventEmitter<any>();

  // Location temporaire pour le composant AddPayment
  tempLocation: LocationModel | null = null;

  constructor(private dialog: MatDialog) { }

  ngOnInit(): void {
    this.createTempLocationIfNeeded();
  }

  private createTempLocationIfNeeded(): void {
    // Si pas de location existante, créer une location temporaire
    if (!this.location && this.room && this.tenant) {
      this.tempLocation = {
        _id: `temp_${Date.now()}`,
        room: this.room._id || '',
        locataire: this.tenant._id || '',
        property: this.propertyId,
        startDate: new Date(),
        endDate: null,
        monthlyRent: this.room.price || 0,
        deposit: 0,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      } as LocationModel;
    }
  }

  getRoomInfo(): string {
    if (!this.room) return '';

    const roomType = this.room.type ? UtilsString.getStringOfRoomType(this.room.type) : 'Unité';
    const roomCode = this.room.code || this.room._id?.substring(0, 8);
    const tenantName = this.tenant?.fullName || this.tenant?.name || 'Aucun locataire';

    return `${roomType} #${roomCode} - ${tenantName}`;
  }

  getLocationForPayment(): LocationModel | null {
    return this.location || this.tempLocation;
  }

  closeModal(): void {
    this.close.emit();
  }

  onPaymentAdded(payment: any): void {
    this.paymentAdded.emit(payment);
    this.closeModal();
  }

  openModernPaymentModal(): void {
    const location = this.getLocationForPayment();

    if (!location) {
      console.error('Aucune location disponible pour le paiement');
      return;
    }

    const dialogRef = this.dialog.open(ModernPaymentModalComponent, {
      width: '100%',
      maxWidth: '800px',
      disableClose: true,
      data: {
        mode: 'create',
        room: this.room,
        tenant: this.tenant,
        location: location
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.onPaymentAdded(result);
      }
    });
  }
}
