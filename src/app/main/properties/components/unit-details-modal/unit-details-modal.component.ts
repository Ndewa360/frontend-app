import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  RoomModel,
  LocataireModel,
  LocataireState,
  RoomType
} from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';
import { AssignLocationModalService } from 'src/app/main/assign-location/services/assign-location-modal.service';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { UpdateRoomComponent } from 'src/app/main/room/components/update-room/update-room.component';

export interface UnitDetailsAction {
  type: 'edit' | 'assign_tenant' | 'terminate_lease' | 'media_updated' | 'add_payment' | 'view_contract' | 'data_updated';
  room: RoomModel;
  data?: any;
}

@Component({
  selector: 'app-unit-details-modal',
  templateUrl: './unit-details-modal.component.html',
  styleUrls: ['./unit-details-modal.component.scss']
})
export class UnitDetailsModalComponent implements OnInit, OnDestroy {
  @Input() room: RoomModel | null = null;
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() action = new EventEmitter<UnitDetailsAction>();

  tenant: LocataireModel | null = null;
  activeTab: string = 'details';
  
  tabs = [
    { id: 'details', label: 'Détails de l\'unité' },
    { id: 'tenant', label: 'Locataire' },
    { id: 'history', label: 'Historique des paiements' },
    { id: 'gallery', label: 'Galerie' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private router: Router,
    private assignLocationModalService: AssignLocationModalService,
    private toastr: ToastrService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadTenantData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTenantData(): void {
    if (!this.room?.locataire) {
      this.tenant = null;
      return;
    }

    // Charger les données du locataire depuis le store
    this.store.select(LocataireState.selectStateLocataire(this.room.locataire))
      .pipe(takeUntil(this.destroy$))
      .subscribe(tenant => {
        this.tenant = tenant;
      });
  }

  closeModal(): void {
    this.close.emit();
  }

  getRoomName(): string {
    return this.room?.code || `Unité ${this.room?._id?.substring(0, 8)}`;
  }

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

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(price);
  }

  onEditRoom(): void {
    if (this.room) {
      const dialogRef = this.dialog.open(UpdateRoomComponent, {
        width: '100%',
        maxWidth: '900px',
        disableClose: true,
        data: {
          room: this.room
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          // Recharger les données de la chambre après modification
          this.loadTenantData();
          this.toastr.success('Unité modifiée avec succès', 'Succès');
          // Émettre un événement pour informer le parent de recharger les données
          this.action.emit({
            type: 'data_updated',
            room: this.room
          });
        }
      });
    }
  }

  onAssignTenant(): void {
    if (this.room) {
      // Ouvrir le modal d'assignation avec la chambre pré-sélectionnée
      this.assignLocationModalService.openAssignLocationModal({
        propertyId: this.room.property,
        roomId: this.room._id,
        assistant: true,
        returnUrl: this.router.url
      }).subscribe(result => {
        if (result && result.success) {
          // Recharger les données de la chambre après succès
          this.loadTenantData();
          this.toastr.success('Assignation réalisée avec succès', 'Succès');
          // Émettre un événement pour informer le parent de recharger les données
          this.action.emit({
            type: 'data_updated',
            room: this.room
          });
        }
      });
    }
  }

  onTerminateLease(): void {
    if (this.room) {
      this.action.emit({
        type: 'terminate_lease',
        room: this.room
      });
    }
  }

  onMediaUpdated(mediaData: any): void {
    if (this.room) {
      this.action.emit({
        type: 'media_updated',
        room: this.room,
        data: mediaData
      });
    }
  }

  onAddPayment(): void {
    if (this.room) {
      this.action.emit({
        type: 'add_payment',
        room: this.room
      });
    }
  }

  onViewContract(): void {
    if (this.room) {
      this.action.emit({
        type: 'view_contract',
        room: this.room
      });
    }
  }

  onTenantAction(action: any): void {
    // Relayer les actions du composant locataire
    this.action.emit(action);
  }

  onPaymentAction(action: any): void {
    // Relayer les actions du composant paiements
    this.action.emit(action);
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
}
