import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LocataireModel, RoomModel, LocationModel, LocationState, RoomState, LocationPaymentModel, LocationPaymentState } from 'src/app/shared/store';

interface Tab {
  label: string;
  icon: string;
}

interface TenantPaymentGroup {
  roomName: string;
  roomId: string;
  payments: LocationPaymentModel[];
  total: number;
  dateRange: {
    start: Date;
    end: Date;
  };
}

@Component({
  selector: 'app-tenant-details-panel',
  templateUrl: './tenant-details-panel.component.html',
  styleUrls: ['./tenant-details-panel.component.scss'],
  animations: [
    trigger('slideIn', [
      state('false', style({
        transform: 'translateX(100%)',
        visibility: 'hidden'
      })),
      state('true', style({
        transform: 'translateX(0)',
        visibility: 'visible'
      })),
      transition('false => true', [
        style({ visibility: 'visible' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)')
      ]),
      transition('true => false', [
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)'),
        style({ visibility: 'hidden' })
      ])
    ]),
    trigger('contentFade', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('200ms 100ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class TenantDetailsPanelComponent implements OnInit, OnDestroy, OnChanges {
  @Input() isOpen: boolean = false;
  @Input() tenant: LocataireModel | null = null;
  @Input() propertyId: string = '';
  
  @Output() closePanel = new EventEmitter<void>();
  @Output() editTenant = new EventEmitter<LocataireModel>();
  @Output() assignRoom = new EventEmitter<LocataireModel>();
  @Output() viewContract = new EventEmitter<LocataireModel>();
  @Output() cancelContract = new EventEmitter<LocataireModel>();
  @Output() addPayment = new EventEmitter<LocataireModel>();

  // État des onglets
  activeTabIndex: number = 0;
  isContentVisible: boolean = false;
  
  // Données liées
  currentRoom: RoomModel | null = null;
  currentLocation: LocationModel | null = null;
  tenantPayments: LocationPaymentModel[] = [];

  // Subject pour la gestion des observables
  private destroy$ = new Subject<void>();
  
  // Configuration des onglets
  tabs: Tab[] = [
    {
      label: 'Vue d\'ensemble',
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
    },
    {
      label: 'Chambre occupée',
      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
    },
    {
      label: 'Historique paiements',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
    }
  ];

  constructor(
    private store: Store,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTenantData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tenant'] || changes['isOpen']) {
      this.loadTenantData();
    }

    if (changes['isOpen']) {
      if (this.isOpen) {
        // Empêcher le scroll du body
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
          this.isContentVisible = true;
        }, 100);
      } else {
        // Restaurer le scroll du body
        document.body.style.overflow = 'auto';
        this.isContentVisible = false;
      }
    }
  }

  ngOnDestroy(): void {
    // Restaurer le scroll du body au cas où le composant serait détruit avec le panneau ouvert
    document.body.style.overflow = 'auto';
    // Nettoyer les observables
    this.destroy$.next();
    this.destroy$.complete();
  }

  // === MÉTHODES DE CHARGEMENT DES DONNÉES ===

  private loadTenantData(): void {
    if (!this.tenant || !this.propertyId) return;

    // Charger la chambre actuelle
    this.loadCurrentRoom();
    
    // Charger la location actuelle
    this.loadCurrentLocation();
    
    // Charger l'historique des paiements
    this.loadTenantPayments();
  }

  private loadCurrentRoom(): void {
    if (!this.tenant?.room) {
      this.currentRoom = null;
      return;
    }

    const rooms = this.store.selectSnapshot(RoomState.selectStateRoomByPropertyId(this.propertyId));
    this.currentRoom = rooms?.find((room: RoomModel) => room._id === this.tenant?.room) || null;
  }

  private loadCurrentLocation(): void {
    if (!this.tenant?._id) {
      this.currentLocation = null;
      return;
    }

    const locations = this.store.selectSnapshot(LocationState.selectStateLocationByPropertyId(this.propertyId));
    this.currentLocation = locations?.find((location: LocationModel) =>
      location.locataire === this.tenant?._id && location.isRunning === true
    ) || null;
  }

  private loadTenantPayments(): void {
    if (!this.tenant?._id || !this.propertyId) {
      this.tenantPayments = [];
      return;
    }

    // Utiliser un observable pour s'assurer que les données sont à jour
    this.store.select(LocationPaymentState.selectStateLocationPaymentByPropertyId(this.propertyId))
      .pipe(takeUntil(this.destroy$))
      .subscribe((payments: LocationPaymentModel[]) => {
        console.log('Tous les paiements pour la propriété:', this.propertyId, payments);
        if (payments && this.tenant?._id) {
          this.tenantPayments = payments.filter((payment: LocationPaymentModel) =>
            payment.locataire === this.tenant._id
          );
          console.log('Paiements filtrés pour le locataire:', this.tenant.fullName, 'ID:', this.tenant._id, this.tenantPayments);

          // Vérification des références de paiement
          const uniqueRefs = new Set(this.tenantPayments.map(p => p.billingRef));
          console.log('Références uniques:', uniqueRefs.size, 'sur', this.tenantPayments.length, 'paiements');
          if (uniqueRefs.size !== this.tenantPayments.length) {
            console.warn('⚠️ Attention: Des références de paiement sont dupliquées!');
            console.log('Détail des références:', this.tenantPayments.map(p => ({
              id: p._id,
              ref: p.billingRef,
              date: p.datePayment,
              amount: p.locationPaymentPrice
            })));
          }
        } else {
          this.tenantPayments = [];
          console.log('Aucun paiement trouvé - payments:', !!payments, 'tenant ID:', this.tenant?._id);
        }
      });
  }

  // === MÉTHODES DE NAVIGATION ===

  setActiveTab(index: number): void {
    this.activeTabIndex = index;
  }

  onClosePanel(): void {
    this.closePanel.emit();
  }

  // === MÉTHODES D'INFORMATION DU LOCATAIRE ===

  getTenantName(): string {
    return this.tenant?.fullName || 'Locataire sans nom';
  }

  getTenantEmail(): string {
    return this.tenant?.emailRef || this.tenant?.email || 'Email non renseigné';
  }

  getTenantPhone(): string {
    return this.tenant?.phoneNumberRef || this.tenant?.phoneNumber || 'Téléphone non renseigné';
  }

  getTenantStatus(): 'active' | 'inactive' | 'pending' {
    if (this.tenant?.room && this.currentLocation?.isRunning) {
      return 'active';
    }
    return 'inactive';
  }

  getTenantStatusLabel(): string {
    const status = this.getTenantStatus();
    switch (status) {
      case 'active': return 'Actif';
      case 'inactive': return 'Inactif';
      case 'pending': return 'En attente';
      default: return 'Inconnu';
    }
  }

  // === MÉTHODES D'INFORMATION DE LA CHAMBRE ===

  getCurrentRoomName(): string {
    return this.currentRoom?.code || 'Aucune chambre assignée';
  }

  getCurrentRoomType(): string {
    if (!this.currentRoom) return '';

    switch (this.currentRoom.type) {
      case 'room': return 'Chambre simple';
      case 'studio': return 'Studio';
      case 'simple_apartment': return 'Appartement simple';
      case 'furnished_apartment': return 'Appartement meublé';
      default: return this.currentRoom.type || '';
    }
  }

  hasAssignedRoom(): boolean {
    return !!this.tenant?.room && !!this.currentRoom;
  }

  // === MÉTHODES DE FORMATAGE ===

  formatPrice(price: number | null | undefined): string {
    if (!price) return '0 FCFA';
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(price);
  }

  formatDate(date: Date | string | null | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // === MÉTHODES D'ACTIONS ===

  onEditTenant(): void {
    if (this.tenant) {
      this.editTenant.emit(this.tenant);
    }
  }

  onAssignRoom(): void {
    if (this.tenant) {
      // Naviguer vers l'assistant d'assignation avec le locataire pré-sélectionné
      this.router.navigate(['/app/assign-location'], {
        queryParams: {
          propertyId: this.propertyId,
          locataireId: this.tenant._id,
          assistant: true,
          returnUrl: this.router.url
        }
      });
    }
  }

  onViewContract(): void {
    if (this.tenant) {
      this.viewContract.emit(this.tenant);
    }
  }

  onCancelContract(): void {
    if (this.tenant) {
      this.cancelContract.emit(this.tenant);
    }
  }

  onAddPayment(): void {
    if (this.tenant) {
      this.addPayment.emit(this.tenant);
    }
  }

  // === MÉTHODES DE PAIEMENTS ===

  getTotalPayments(): number {
    return this.tenantPayments.reduce((total, payment) => total + (payment.locationPaymentPrice || 0), 0);
  }

  getPaymentCount(): number {
    return this.tenantPayments.length;
  }

  getAveragePayment(): number {
    if (this.tenantPayments.length === 0) return 0;
    return this.getTotalPayments() / this.tenantPayments.length;
  }

  getLastPaymentDate(): Date | null {
    if (this.tenantPayments.length === 0) return null;
    
    const sortedPayments = [...this.tenantPayments].sort((a, b) => 
      new Date(b.datePayment).getTime() - new Date(a.datePayment).getTime()
    );
    
    return new Date(sortedPayments[0].datePayment);
  }

  getPaymentsByRoom(): TenantPaymentGroup[] {
    const groupedPayments: { [roomId: string]: TenantPaymentGroup } = {};

    this.tenantPayments.forEach(payment => {
      const roomId = payment.room || 'unknown';
      
      if (!groupedPayments[roomId]) {
        const room = this.store.selectSnapshot(RoomState.selectStateRoom(roomId));
        groupedPayments[roomId] = {
          roomId,
          roomName: room?.code || 'Chambre inconnue',
          payments: [],
          total: 0,
          dateRange: {
            start: new Date(payment.datePayment),
            end: new Date(payment.datePayment)
          }
        };
      }

      groupedPayments[roomId].payments.push(payment);
      groupedPayments[roomId].total += payment.locationPaymentPrice || 0;

      // Mettre à jour la plage de dates
      const paymentDate = new Date(payment.datePayment);
      if (paymentDate < groupedPayments[roomId].dateRange.start) {
        groupedPayments[roomId].dateRange.start = paymentDate;
      }
      if (paymentDate > groupedPayments[roomId].dateRange.end) {
        groupedPayments[roomId].dateRange.end = paymentDate;
      }
    });

    // Trier les paiements dans chaque groupe par date décroissante
    Object.values(groupedPayments).forEach(group => {
      group.payments.sort((a, b) => new Date(b.datePayment).getTime() - new Date(a.datePayment).getTime());
    });

    return Object.values(groupedPayments);
  }

  // === MÉTHODES DE TRACKING ===

  trackByRoomId(_: number, group: TenantPaymentGroup): string {
    return group.roomId;
  }

  trackByPaymentId(index: number, payment: LocationPaymentModel): string {
    return payment._id || index.toString();
  }

  // === MÉTHODES UTILITAIRES ===

  getUniquePaymentIdentifier(payment: LocationPaymentModel): string {
    // Créer un identifiant unique basé sur plusieurs propriétés
    const date = new Date(payment.datePayment).getTime();
    const amount = payment.locationPaymentPrice || 0;
    const id = payment._id?.substring(0, 8) || 'unknown';
    return `${id}-${date}-${amount}`;
  }

  getPaymentDisplayRef(payment: LocationPaymentModel): string {
    // Si les billingRef sont identiques, utiliser un identifiant alternatif
    if (payment.billingRef) {
      return payment.billingRef;
    }
    // Fallback: créer une référence basée sur la date et le montant
    const date = new Date(payment.datePayment);
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const amount = payment.locationPaymentPrice || 0;
    return `PAY-${dateStr}-${amount}`;
  }

  isDuplicateRef(payment: LocationPaymentModel): boolean {
    // Vérifier si cette référence apparaît plusieurs fois
    const sameRefCount = this.tenantPayments.filter(p => p.billingRef === payment.billingRef).length;
    return sameRefCount > 1;
  }
}
