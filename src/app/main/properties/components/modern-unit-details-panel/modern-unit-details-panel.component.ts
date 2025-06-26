import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { trigger, state, style, transition, animate } from '@angular/animations';
import {
  RoomModel,
  LocataireModel,
  LocataireState,
  LocataireAction,
  RoomType
} from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';

export interface ModernUnitAction {
  type: 'edit' | 'assign_tenant' | 'terminate_lease' | 'add_payment' | 'view_contract' | 'view_image' | 'manage_media';
  room: RoomModel;
  data?: any;
}

@Component({
  selector: 'app-modern-unit-details-panel',
  templateUrl: './modern-unit-details-panel.component.html',
  styleUrls: ['./modern-unit-details-panel.component.scss'],
  animations: [
    trigger('slideIn', [
      state('true', style({ transform: 'translateX(0)', opacity: 1 })),
      state('false', style({ transform: 'translateX(100%)', opacity: 0 })),
      transition('false => true', animate('400ms cubic-bezier(0.25, 0.8, 0.25, 1)')),
      transition('true => false', animate('300ms cubic-bezier(0.25, 0.8, 0.25, 1)'))
    ])
  ]
})
export class ModernUnitDetailsPanelComponent implements OnInit, OnDestroy {
  @Input() room: RoomModel | null = null;
  @Input() propertyId: string = '';
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() action = new EventEmitter<ModernUnitAction>();

  tenant: LocataireModel | null = null;
  activeTab: string = 'details';

  tabs = [
    { id: 'details', label: 'Détails', icon: 'info' },
    { id: 'tenant', label: 'Locataire', icon: 'user' },
    { id: 'gallery', label: 'Galerie', icon: 'image' }
  ];

  private destroy$ = new Subject<void>();

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.loadTenantData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.isOpen) {
      this.closePanel();
    }
  }

  private loadTenantData(): void {
    if (!this.room) return;

    // Les locataires sont déjà chargés par LoadingPropertyDataResolver
    this.store.select(LocataireState.selectStateLocataires)
      .pipe(takeUntil(this.destroy$))
      .subscribe(locataires => {
        if (this.room?.locataire) {
          this.tenant = locataires.find(l => l._id === this.room.locataire) || null;
        } else {
          this.tenant = null;
        }
      });
  }

  closePanel(): void {
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
    if (this.room.isFree === false && this.room.locataire) return 'occupied';
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

  getTenantName(): string {
    return this.tenant?.fullName || this.tenant?.name || 'Locataire inconnu';
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

  getTabIcon(iconType: string): string {
    const icons = {
      info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      image: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
    };
    return icons[iconType] || icons.info;
  }

  onEditRoom(): void {
    if (this.room) {
      this.action.emit({ type: 'edit', room: this.room });
    }
  }

  onAssignTenant(): void {
    if (this.room) {
      this.action.emit({ type: 'assign_tenant', room: this.room });
    }
  }

  onTerminateLease(): void {
    if (this.room) {
      this.action.emit({ type: 'terminate_lease', room: this.room });
    }
  }

  onManageMedia(): void {
    if (this.room) {
      this.action.emit({ type: 'manage_media', room: this.room });
    }
  }

  openImageViewer(imageUrl: string): void {
    if (this.room) {
      this.action.emit({
        type: 'view_image',
        room: this.room,
        data: { imageUrl }
      });
    }
  }

  contactTenant(): void {
    if (this.tenant?.email) {
      window.open(`mailto:${this.tenant.email}`, '_blank');
    } else if (this.tenant?.phoneNumber) {
      window.open(`tel:${this.tenant.phoneNumber}`, '_blank');
    }
  }
}