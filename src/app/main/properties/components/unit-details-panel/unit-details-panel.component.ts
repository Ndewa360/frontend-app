import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { trigger, state, style, transition, animate } from '@angular/animations';
import {
  RoomModel,
  LocataireModel,
  LocataireState,
  RoomType
} from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';
import { UnitDetailsService, UnitDetailsData } from '../../services/unit-details.service';
import { PaymentAction } from './components/unit-payments-tab/unit-payments-tab.component';

export interface UnitPanelAction {
  type: 'edit' | 'assign_tenant' | 'terminate_lease' | 'add_payment' | 'view_contract' | 'view_image';
  room: RoomModel;
  data?: any;
}

@Component({
  selector: 'app-unit-details-panel',
  templateUrl: './unit-details-panel.component.html',
  styleUrls: ['./unit-details-panel.component.scss'],
  animations: [
    trigger('slideIn', [
      state('true', style({ transform: 'translateX(0)' })),
      state('false', style({ transform: 'translateX(100%)' })),
      transition('false => true', animate('300ms ease-in-out')),
      transition('true => false', animate('300ms ease-in-out'))
    ])
  ]
})
export class UnitDetailsPanelComponent implements OnInit, OnDestroy {
  @Input() room: RoomModel | null = null;
  @Input() propertyId: string = '';
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() action = new EventEmitter<UnitPanelAction>();

  unitData: UnitDetailsData | null = null;
  activeTab: string = 'details';
  showAddPaymentModal: boolean = false;

  tabs = [
    { id: 'details', label: 'Détails' },
    { id: 'tenant', label: 'Locataire' },
    { id: 'payments', label: 'Paiements' },
    { id: 'contract', label: 'Contrat' },
    { id: 'gallery', label: 'Galerie' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private unitDetailsService: UnitDetailsService
  ) {}

  ngOnInit(): void {
    this.loadUnitData();
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

  private loadUnitData(): void {
    if (!this.room || !this.propertyId) return;

    this.unitDetailsService.loadUnitDetails(this.room, this.propertyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(unitData => {
        this.unitData = unitData;
      });

    // S'abonner aux changements
    this.unitDetailsService.currentUnit$
      .pipe(takeUntil(this.destroy$))
      .subscribe(unitData => {
        this.unitData = unitData;
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

  // Actions
  onEditRoom(): void {
    if (this.room) {
      this.action.emit({
        type: 'edit',
        room: this.room
      });
    }
  }

  onAssignTenant(): void {
    if (this.room) {
      this.action.emit({
        type: 'assign_tenant',
        room: this.room
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

  openImageViewer(imageUrl: string): void {
    if (this.room) {
      this.action.emit({
        type: 'view_image',
        room: this.room,
        data: { imageUrl }
      });
    }
  }

  // Nouvelle méthode pour gérer les actions de paiement
  onPaymentAction(paymentAction: PaymentAction): void {
    switch (paymentAction.type) {
      case 'add':
        this.showAddPaymentModal = true;
        break;
      case 'view':
        console.log('Voir les détails du paiement:', paymentAction.data);
        // TODO: Implémenter la visualisation des détails du paiement
        break;
      case 'edit':
        console.log('Modifier le paiement:', paymentAction.data);
        // TODO: Implémenter la modification du paiement
        break;
      case 'delete':
        this.confirmDeletePayment(paymentAction.data);
        break;
      case 'export':
        console.log('Export CSV effectué');
        break;
    }
  }

  private confirmDeletePayment(payment: any): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ce paiement de ${payment.price} ?`)) {
      console.log('Supprimer le paiement:', payment);
      // TODO: Implémenter la suppression du paiement
      // this.store.dispatch(new LocationPaymentAction.DeleteLocationPayment(payment.transaction._id));
    }
  }

  onPaymentAdded(payment: any): void {
    console.log('Paiement ajouté:', payment);
    // Recharger les données de l'unité
    if (this.room && this.propertyId) {
      this.loadUnitData();
    }
  }

  closeAddPaymentModal(): void {
    this.showAddPaymentModal = false;
  }
}
