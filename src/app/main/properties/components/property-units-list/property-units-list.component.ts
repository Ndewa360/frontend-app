import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { Observable, Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  RoomModel,
  LocataireModel,
  LocataireAction,
  PropertyModel,
  RoomState,
  LocataireState,
  PropertyState,
  RoomType,
  HistoryLocationPaymentState,
  HistoryLocationPaymentAction,
  LocationPaymentModel,
  HistoryLocationPaymentModel
} from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';
import { UnitDetailsViewService } from '../../services/unit-details-view.service';

export interface UnitAction {
  type: 'view' | 'edit' | 'assign_tenant' | 'terminate_lease' | 'manage_media' | 'toggle_status';
  room: RoomModel;
  data?: any;
}

@Component({
  selector: 'app-property-units-list',
  templateUrl: './property-units-list.component.html',
  styleUrls: ['./property-units-list.component.scss']
})
export class PropertyUnitsListComponent implements OnInit, OnDestroy {
  @Input() propertyId: string | null = null;
  @Output() unitAction = new EventEmitter<UnitAction>();
  @Output() addUnit = new EventEmitter<void>();

  // Données du store
  rooms$: Observable<RoomModel[]> | undefined;
  locataires$: Observable<LocataireModel[]> | undefined;
  property$: Observable<PropertyModel> | undefined;
  loading$: Observable<boolean> | undefined;

  // États locaux
  rooms: RoomModel[] = [];
  locataires: LocataireModel[] = [];
  property: PropertyModel | null = null;
  loading: boolean = false;

  // États du composant
  filteredRooms: RoomModel[] = [];
  searchTerm: string = '';
  statusFilter: string = '';
  typeFilter: string = '';
  sortBy: string = 'code';
  sortDirection: 'asc' | 'desc' = 'asc';
  viewMode: 'grid' | 'list' = 'grid';

  // États des modals
  showAssignTenantModal: boolean = false;
  showTerminateLeaseModal: boolean = false;
  showUnitDetailsModal: boolean = false;
  selectedRoom: RoomModel | null = null;
  selectedTenantId: string = '';
  leaseStartDate: string = '';

  // Panneau latéral
  activePanelTab: string = 'details';
  panelTabs = [
    { id: 'details', label: 'Détails' },
    { id: 'tenant', label: 'Locataire' },
    { id: 'payments', label: 'Paiements' },
    { id: 'actions', label: 'Actions' },
    { id: 'contract', label: 'Contrat' },
    { id: 'gallery', label: 'Galerie' }
  ];

  // Données des paiements
  roomPayments: LocationPaymentModel[] = [];
  paymentHistory: HistoryLocationPaymentModel | null = null;
  loadingPayments: boolean = false;

  // Utilitaires pour le template
  Math = Math;
  leaseEndDate: string = '';
  terminationReason: string = '';
  availableTenants: LocataireModel[] = [];

  private destroy$ = new Subject<void>();

  // Options de filtrage
  statusOptions = [
    { value: 'all', label: 'Tous les statuts', count: 0 },
    { value: 'available', label: 'Disponibles', count: 0 },
    { value: 'occupied', label: 'Occupées', count: 0 },
    { value: 'maintenance', label: 'En maintenance', count: 0 }
  ];

  typeOptions: { value: string; label: string; count: number }[] = [];

  sortOptions = [
    { value: 'name', label: 'Nom' },
    { value: 'price', label: 'Prix' },
    { value: 'type', label: 'Type' },
    { value: 'status', label: 'Statut' }
  ];

  constructor(
    private store: Store,
    public viewService: UnitDetailsViewService,
    private router: Router
  ) { }

  ngOnInit(): void {
    if (!this.propertyId) return;

    // Les locataires sont déjà chargés par LoadingPropertyDataResolver
    // Initialiser les observables
    this.rooms$ = this.store.select(RoomState.selectStateRoomByPropertyId(this.propertyId));
    this.locataires$ = this.store.select(LocataireState.selectStateLocataireByPropertyId(this.propertyId)); // Tous les locataires
    this.property$ = this.store.select(PropertyState.selectStateProperty(this.propertyId));
    this.loading$ = this.store.select(RoomState.selectStateLoading);

    // S'abonner aux données
    if (this.rooms$ && this.locataires$ && this.property$ && this.loading$) {
      combineLatest([
        this.rooms$,
        this.locataires$,
        this.property$,
        this.loading$
      ]).pipe(
        takeUntil(this.destroy$)
      ).subscribe(([rooms, locataires, property, loading]) => {
        this.rooms = rooms || [];
        this.locataires = locataires || [];
        this.property = property;
        this.loading = loading;
        this.updateFilters();
      });
    }

    // Charger l'historique des paiements pour la propriété
    this.loadPaymentHistory();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateFilters(): void {
    // Mettre à jour les compteurs de statut
    this.statusOptions.forEach(option => {
      if (option.value === 'all') {
        option.count = this.rooms.length;
      } else if (option.value === 'available') {
        option.count = this.rooms.filter(room => room.isFree === true).length;
      } else if (option.value === 'occupied') {
        option.count = this.rooms.filter(room => room.isFree === false).length;
      } else if (option.value === 'maintenance') {
        option.count = this.rooms.filter(room => room.isFree === null || room.isFree === undefined).length;
      }
    });

    // Mettre à jour les types disponibles
    const types = [...new Set(this.rooms.map(room => room.type))];
    this.typeOptions = [
      { value: 'all', label: 'Tous les types', count: this.rooms.length },
      ...types.map(type => ({
        value: type,
        label: this.getRoomTypeLabel(type),
        count: this.rooms.filter(room => room.type === type).length
      }))
    ];

    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.rooms];

    // Filtre par recherche
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(room =>
        (room.code || '').toLowerCase().includes(term) ||
        (this.getRoomName(room) || '').toLowerCase().includes(term) ||
        (room.type || '').toLowerCase().includes(term) ||
        (this.getTenantName(room) || '').toLowerCase().includes(term)
      );
    }

    // Filtre par statut
    if (this.statusFilter && this.statusFilter !== '') {
      if (this.statusFilter === 'available') {
        filtered = filtered.filter(room => room.isFree === true);
      } else if (this.statusFilter === 'occupied') {
        filtered = filtered.filter(room => room.isFree === false);
      } else if (this.statusFilter === 'maintenance') {
        filtered = filtered.filter(room => room.isFree === null || room.isFree === undefined);
      }
    }

    // Filtre par type
    if (this.typeFilter && this.typeFilter !== '') {
      filtered = filtered.filter(room => room.type === this.typeFilter);
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortBy) {
        case 'code':
          aValue = a.code || '';
          bValue = b.code || '';
          break;
        case 'price':
          aValue = a.price || 0;
          bValue = b.price || 0;
          break;
        case 'type':
          aValue = a.type || '';
          bValue = b.type || '';
          break;
        default:
          aValue = a.code || '';
          bValue = b.code || '';
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredRooms = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  onTypeFilterChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  toggleSortDirection(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.applyFilters();
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  // Méthodes utilitaires pour RoomModel
  getRoomName(room: RoomModel): string {
    return room.code || `Unité ${room._id?.substring(0, 8)}`;
  }

  getRoomTypeLabel(type: RoomType): string {
    return UtilsString.getStringOfRoomType(type);
  }

  getRoomStatus(room: RoomModel): 'occupied' | 'available' | 'maintenance' {
    if (room.isFree === true) return 'available';
    if (room.isFree === false) return 'occupied';
    return 'maintenance';
  }

  getRoomStatusLabel(room: RoomModel): string {
    const status = this.getRoomStatus(room);
    switch (status) {
      case 'occupied': return 'Occupée';
      case 'available': return 'Disponible';
      case 'maintenance': return 'Maintenance';
      default: return 'Inconnu';
    }
  }

  getTenantName(room: RoomModel): string {
    if (!room.locataire) return '';

    // Chercher le locataire par son ID dans le store (déjà chargé par le resolver)
    const locataire = this.locataires.find(l => l._id === room.locataire);
    if (locataire) {
      return locataire.fullName || locataire.name || 'Locataire';
    }
    
    // Si le locataire n'est pas trouvé, c'est probablement une erreur de données
    return 'Locataire introuvable';
  }

  getTenantStartDate(room: RoomModel): string {
    if (!room.locataire) return '';

    // Chercher le locataire par son ID dans le store
    const locataire = this.locataires.find(l => l._id === room.locataire);
    if (locataire && locataire.createdAt) {
      return new Date(locataire.createdAt).toLocaleDateString('fr-FR');
    }
    return 'Date inconnue';
  }

  getRoomImage(room: RoomModel): string {
    // Vérifier si room.medias existe et contient des éléments
    if (room.medias && Array.isArray(room.medias) && room.medias.length > 0) {
      // Retourner la première image du tableau medias
      return room.medias[0];
    }

    // Fallback sur room.image si medias est vide
    if (room.image) {
      return room.image;
    }

    // Image par défaut
    return this.getDefaultImage();
  }

  getRoomSurface(_room: RoomModel): string | null {
    // La surface n'est pas dans RoomModel, on peut simuler ou l'ajouter plus tard
    return null;
  }

  getRoomBathrooms(room: RoomModel): number | null {
    return room.specifity?.numberOfBathroom || null;
  }

  hasKitchen(room: RoomModel): boolean {
    return room.specifity?.hasKitchen || false;
  }

  hasInternalShower(room: RoomModel): boolean {
    return room.specifity?.isInternalShower || false;
  }

  // Actions sur les unités
  onViewUnit(room: RoomModel): void {
    console.log('Voir les détails de l\'unité:', room);
    this.viewService.openUnitDetails(room);

    // Charger les paiements pour cette unité
    this.updateRoomPayments();
  }

  onEditUnit(room: RoomModel): void {
    this.unitAction.emit({ type: 'edit', room });
  }

  onManageMedia(room: RoomModel): void {
    this.unitAction.emit({ type: 'manage_media', room });
  }

  onToggleStatus(room: RoomModel): void {
    this.unitAction.emit({ type: 'toggle_status', room });
  }

  onAddUnit(): void {
    this.addUnit.emit();
  }

  // Méthodes pour les statistiques basées sur RoomModel
  getOccupiedUnitsCount(): number {
    return this.rooms.filter(room => room.isFree === false).length;
  }

  getAvailableUnitsCount(): number {
    return this.rooms.filter(room => room.isFree === true).length;
  }

  getVacantSince(_room: RoomModel): string {
    // Simulation - à remplacer par les vraies données
    return '15/12/2023';
  }

  // Méthodes pour les modals
  onAssignTenant(room: RoomModel): void {
    // Naviguer vers l'assistant d'assignation avec la chambre pré-sélectionnée
    this.router.navigate(['/app/assign-location'], {
      queryParams: {
        propertyId: this.propertyId,
        roomId: room._id,
        assistant: true,
        returnUrl: this.router.url
      }
    });
  }

  onTerminateLease(room: RoomModel): void {
    this.selectedRoom = room;
    this.leaseEndDate = '';
    this.terminationReason = '';
    this.showTerminateLeaseModal = true;
  }

  closeAssignTenantModal(): void {
    this.showAssignTenantModal = false;
    this.selectedRoom = null;
    this.selectedTenantId = '';
    this.leaseStartDate = '';
  }

  closeTerminateLeaseModal(): void {
    this.showTerminateLeaseModal = false;
    this.selectedRoom = null;
    this.leaseEndDate = '';
    this.terminationReason = '';
  }

  closeUnitDetailsModal(): void {
    this.showUnitDetailsModal = false;
    this.selectedRoom = null;
  }

  onUnitDetailsAction(action: { type: string; room: RoomModel; data?: any }): void {
    console.log('Action depuis le modal de détails:', action);
    // Gérer les actions depuis le modal de détails
    switch (action.type) {
      case 'edit':
        this.onEditUnit(action.room);
        break;
      case 'assign_tenant':
        this.onAssignTenant(action.room);
        break;
      case 'terminate_lease':
        this.onTerminateLease(action.room);
        break;
      case 'media_updated':
        // Rafraîchir les données si nécessaire
        break;
    }
  }

  onUnitPanelAction(action: { type: string; room: RoomModel; data?: any }): void {
    console.log('Action depuis le panneau de détails:', action);
    // Gérer les actions depuis le panneau de détails
    switch (action.type) {
      case 'edit':
        this.onEditUnit(action.room);
        break;
      case 'assign_tenant':
        this.onAssignTenant(action.room);
        break;
      case 'terminate_lease':
        this.onTerminateLease(action.room);
        break;
      case 'add_payment':
        console.log('Ajouter un paiement pour:', action.room);
        // TODO: Implémenter l'ajout de paiement
        break;
      case 'view_contract':
        console.log('Voir le contrat pour:', action.room);
        // TODO: Implémenter la visualisation du contrat
        break;
      case 'view_image':
        console.log('Voir l\'image:', action.data?.imageUrl);
        // TODO: Implémenter le visualiseur d'image
        break;
    }
  }

  // Méthodes pour le panneau simplifié
  getSelectedRoomName(): string {
    const room = this.viewService.getSelectedRoom();
    return room?.code || `Unité ${room?._id?.substring(0, 8)}`;
  }

  getSelectedRoomType(): string {
    const room = this.viewService.getSelectedRoom();
    if (!room?.type) return 'Type inconnu';
    return UtilsString.getStringOfRoomType(room.type);
  }

  getSelectedRoomStatus(): string {
    const room = this.viewService.getSelectedRoom();
    if (!room) return 'Statut inconnu';
    if (room.isFree === true) return 'Disponible';
    if (room.isFree === false) return 'Occupée';
    return 'En maintenance';
  }

  getSelectedTenant(): LocataireModel | null {
    const room = this.viewService.getSelectedRoom();
    if (!room?.locataire) return null;

    // Chercher le locataire dans la liste des locataires chargés
    return this.locataires.find(locataire => locataire._id === room.locataire) || null;
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Nouvelles méthodes pour les fonctionnalités
  openAssignTenantModal(): void {
    const room = this.viewService.getSelectedRoom();
    if (room) {
      this.selectedRoom = room;
      this.showAssignTenantModal = true;
      // Fermer le panneau pour afficher le modal
      this.viewService.closeUnitDetails();
    }
  }

  showTerminateLeaseConfirmation(): void {
    const room = this.viewService.getSelectedRoom();
    if (room) {
      this.selectedRoom = room;
      this.showTerminateLeaseModal = true;
      // Fermer le panneau pour afficher le modal
      this.viewService.closeUnitDetails();
    }
  }

  showContractModal(): void {
    console.log('Afficher le contrat pour:', this.viewService.getSelectedRoom());
    // TODO: Implémenter l'affichage du contrat
  }



  contactTenant(): void {
    const tenant = this.getSelectedTenant();
    if (tenant?.email) {
      window.open(`mailto:${tenant.email}`, '_blank');
    } else if (tenant?.phoneNumber) {
      window.open(`tel:${tenant.phoneNumber}`, '_blank');
    } else {
      console.log('Aucun moyen de contact disponible pour ce locataire');
    }
  }

  // Méthodes pour la gestion des paiements
  loadPaymentHistory(): void {
    if (!this.propertyId) {
      console.log('Aucun propertyId disponible');
      return;
    }

    console.log('Chargement de l\'historique des paiements pour la propriété:', this.propertyId);
    this.loadingPayments = true;
    this.store.dispatch(new HistoryLocationPaymentAction.FetchHistoryLocationPaymentsByPropertyId(this.propertyId));

    // S'abonner aux paiements
    this.store.select(HistoryLocationPaymentState.selectStateHistoryLocationPayments)
      .pipe(takeUntil(this.destroy$))
      .subscribe((payments) => {
        console.log('Paiements reçus dans loadPaymentHistory:', payments);
        this.loadingPayments = false;
        // Filtrer les paiements pour la chambre sélectionnée si une chambre est déjà sélectionnée
        if (this.viewService.getSelectedRoom()) {
          this.updateRoomPayments();
        }
      });
  }

  updateRoomPayments(): void {
    const selectedRoom = this.viewService.getSelectedRoom();
    if (!selectedRoom) {
      console.log('Aucune chambre sélectionnée');
      return;
    }

    console.log('Mise à jour des paiements pour la chambre:', selectedRoom._id);

    // Récupérer l'historique des paiements pour cette chambre
    this.store.select(HistoryLocationPaymentState.selectStateHistoryLocationPayments)
      .pipe(takeUntil(this.destroy$))
      .subscribe(allPaymentHistory => {
        console.log('Historique des paiements reçu:', allPaymentHistory);

        if (!allPaymentHistory || allPaymentHistory.length === 0) {
          console.log('Aucun historique de paiement trouvé');
          this.paymentHistory = null;
          this.roomPayments = [];
          return;
        }

        // Trouver l'historique pour cette chambre
        this.paymentHistory = allPaymentHistory.find(history =>
          history.room._id === selectedRoom._id
        ) || null;

        console.log('Historique trouvé pour cette chambre:', this.paymentHistory);

        // Extraire les paiements individuels
        this.roomPayments = this.paymentHistory?.transactions || [];

        console.log('Paiements extraits:', this.roomPayments);
      });
  }

  getRoomPayments(): LocationPaymentModel[] {
    return this.roomPayments.sort((a, b) =>
      new Date(b.datePayment).getTime() - new Date(a.datePayment).getTime()
    );
  }

  getTotalPayments(): number {
    return this.roomPayments.reduce((total, payment) => total + (payment.locationPaymentPrice || 0), 0);
  }

  getPaymentCount(): number {
    return this.roomPayments.length;
  }

  getPaymentStatusClass(payment: LocationPaymentModel): string {
    const paymentDate = new Date(payment.datePayment);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - paymentDate.getTime()) / (1000 * 3600 * 24));

    if (daysDiff <= 5) return 'bg-green-100 border-green-200';
    if (daysDiff <= 30) return 'bg-blue-100 border-blue-200';
    return 'bg-yellow-100 border-yellow-200';
  }

  getPaymentStatusIcon(payment: LocationPaymentModel): string {
    const paymentDate = new Date(payment.datePayment);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - paymentDate.getTime()) / (1000 * 3600 * 24));

    if (daysDiff <= 5) return 'text-green-600';
    if (daysDiff <= 30) return 'text-blue-600';
    return 'text-yellow-600';
  }

  formatPaymentDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatPaymentMonth(date: Date | string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric'
    });
  }

  trackByPaymentId(index: number, payment: any): string {
    return payment.transaction?._id || payment._id || index.toString();
  }

  // Méthodes pour formater les données comme dans details-payment-locataire
  getFormattedPayments(): any[] {
    if (!this.paymentHistory) return [];

    // Transformer les données comme dans le composant existant
    const formattedData = this.paymentHistory.transactions.map((transaction) => ({
      chambre: this.getRoomString(this.paymentHistory.room),
      date_paiement: this.formatPaymentDateLong(transaction.datePayment),
      price: this.formatPrice(transaction.locationPaymentPrice || 0),
      date: new Date(transaction.datePayment),
      history: this.paymentHistory,
      transaction: transaction
    }));

    // Trier par date décroissante comme dans le composant existant
    return formattedData.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  getRoomString(room: RoomModel): string {
    let str = "";
    switch (room.type) {
      case 'room':
        str = `Chambre #${room.code}`;
        break;
      case 'studio':
        str = `Studio #${room.code}`;
        break;
      case 'simple_apartment':
        str = `Appartement #${room.code}`;
        break;
      case 'furnished_apartment':
        str = `Appartement Meublé #${room.code}`;
        break;
      default:
        str = `Unité #${room.code}`;
        break;
    }
    return str;
  }

  formatPaymentDateLong(date: Date | string): string {
    // Utiliser moment comme dans le composant existant
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatPaymentTime(date: Date | string): string {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Actions pour les paiements
  viewPaymentDetails(payment: any): void {
    console.log('Voir les détails du paiement:', payment);
    // TODO: Implémenter la visualisation des détails
  }

  editPayment(payment: any): void {
    console.log('Modifier le paiement:', payment);
    // TODO: Implémenter la modification du paiement
  }

  // Export CSV comme dans le composant existant
  exportPaymentsToCSV(): void {
    const payments = this.getFormattedPayments();
    if (payments.length === 0) return;

    const csvHeaders = ['#', 'Unité', 'Date de paiement', 'Montant', 'Type', 'Référence', 'Motif'];
    const csvData = payments.map((payment, index) => [
      index + 1,
      payment.chambre,
      payment.date_paiement,
      payment.price,
      payment.transaction.paymentLocationType || 'LOCATION',
      payment.transaction.billingRef || '',
      payment.transaction.reason || ''
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Historique_paiements_${this.getSelectedRoomName()}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Méthode pour forcer le rechargement des paiements (debug)
  forceReloadPayments(): void {
    console.log('Force reload des paiements...');
    if (this.propertyId) {
      this.store.dispatch(new HistoryLocationPaymentAction.FetchHistoryLocationPaymentsByPropertyId(this.propertyId));
      setTimeout(() => {
        this.updateRoomPayments();
      }, 1000);
    }
  }

  confirmAssignTenant(): void {
    if (this.selectedRoom && this.selectedTenantId && this.leaseStartDate) {
      this.unitAction.emit({
        type: 'assign_tenant',
        room: this.selectedRoom,
        data: {
          tenantId: this.selectedTenantId,
          startDate: this.leaseStartDate
        }
      });
      this.closeAssignTenantModal();
    }
  }

  confirmTerminateLease(): void {
    if (this.selectedRoom && this.leaseEndDate) {
      this.unitAction.emit({
        type: 'terminate_lease',
        room: this.selectedRoom,
        data: {
          endDate: this.leaseEndDate,
          reason: this.terminationReason
        }
      });
      this.closeTerminateLeaseModal();
    }
  }

  loadAvailableTenants(): void {
    // Charger les locataires disponibles depuis le store
    // Un locataire est disponible s'il n'a pas de room assignée (room === null ou undefined)
    this.availableTenants = this.locataires.filter(locataire =>
      !locataire.room || locataire.room === null
    );
  }

  // Méthodes utilitaires
  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(price);
  }

  getDefaultImage(): string {
    // Image par défaut pour les unités sans image
    return 'assets/img/utils/house.png';
  }

  trackByRoomId(_index: number, room: RoomModel): string {
    return room._id;
  }

  // Méthodes pour les statistiques rapides basées sur RoomModel
  getOccupancyRate(): number {
    if (this.rooms.length === 0) return 0;
    const occupied = this.rooms.filter(room => room.isFree === false).length;
    return Math.round((occupied / this.rooms.length) * 100);
  }

  getTotalRevenue(): number {
    return this.rooms
      .filter(room => room.isFree === false)
      .reduce((sum, room) => sum + (room.price || 0), 0);
  }

  getAverageRent(): number {
    if (this.rooms.length === 0) return 0;
    const totalRent = this.rooms.reduce((sum, room) => sum + (room.price || 0), 0);
    return totalRent / this.rooms.length;
  }

  // Méthode pour créer les données d'unité pour le nouveau composant
  getCurrentUnitData(): any {
    const selectedRoom = this.viewService.getSelectedRoom();
    if (!selectedRoom) return null;

    const tenant = this.getSelectedTenant();

    return {
      room: selectedRoom,
      tenant: tenant,
      payments: this.roomPayments,
      paymentHistory: this.paymentHistory,
      location: null // TODO: Récupérer la location si elle existe
    };
  }

  // Variable pour contrôler l'affichage du modal
  showPaymentModal: boolean = false;

  // Gestion des actions de paiement du nouveau composant
  onPaymentAction(action: any): void {
    switch (action.type) {
      case 'add':
        // Vérifier si la chambre est libre avant d'autoriser l'ajout
        const selectedRoom = this.viewService.getSelectedRoom();
        if (!selectedRoom || selectedRoom.isFree === true) {
          alert('Impossible d\'ajouter un paiement : cette unité est libre et n\'a pas de locataire assigné.');
          return;
        }
        this.showAddPaymentModal();
        break;
      case 'view':
        console.log('Voir les détails du paiement:', action.data);
        break;
      case 'edit':
        console.log('Modifier le paiement:', action.data);
        break;
      case 'delete':
        console.log('Supprimer le paiement:', action.data);
        break;
      case 'export':
        console.log('Export CSV effectué');
        break;
    }
  }

  // Méthode pour afficher le modal d'ajout de paiement
  showAddPaymentModal(): void {
    const selectedRoom = this.viewService.getSelectedRoom();

    // Vérifier si la chambre est libre
    if (!selectedRoom || selectedRoom.isFree === true) {
      alert('Impossible d\'ajouter un paiement : cette unité est libre et n\'a pas de locataire assigné.');
      return;
    }

    // Vérifier si un locataire est assigné
    const tenant = this.getSelectedTenant();
    if (!tenant) {
      alert('Impossible d\'ajouter un paiement : aucun locataire n\'est assigné à cette unité.');
      return;
    }

    this.showPaymentModal = true;
  }

  // Méthode pour fermer le modal
  closePaymentModal(): void {
    this.showPaymentModal = false;
  }

  // Méthode appelée quand un paiement est ajouté
  onPaymentAdded(payment: any): void {
    console.log('Paiement ajouté:', payment);
    this.closePaymentModal();

    // Recharger les données de paiement
    if (this.propertyId) {
      this.store.dispatch(new HistoryLocationPaymentAction.FetchHistoryLocationPaymentsByPropertyId(this.propertyId));
      setTimeout(() => {
        this.updateRoomPayments();
      }, 1000);
    }
  }

  // Méthode pour gérer les actions du nouveau panneau moderne
  onModernUnitAction(action: any): void {
    console.log('Action depuis le panneau moderne:', action);
    switch (action.type) {
      case 'edit':
        this.onEditUnit(action.room);
        break;
      case 'assign_tenant':
        this.onAssignTenant(action.room);
        break;
      case 'terminate_lease':
        this.onTerminateLease(action.room);
        break;
      case 'add_payment':
        console.log('Ajouter un paiement pour:', action.room);
        break;
      case 'view_contract':
        console.log('Voir le contrat pour:', action.room);
        break;
      case 'manage_media':
        this.onManageMedia(action.room);
        break;
      case 'view_image':
        console.log('Voir l\'image:', action.data?.imageUrl);
        break;
    }
  }
}
