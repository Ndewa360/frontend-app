import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { MatDialog } from '@angular/material/dialog';
import { AssignLocationModalService } from 'src/app/main/assign-location/services/assign-location-modal.service';
import { ToastrService } from 'ngx-toastr';
// Nouveaux modals modernes
import { ModernTenantModalComponent } from '../modern-tenant-modal/modern-tenant-modal.component';
import { ModernUnitModalComponent } from '../modern-unit-modal/modern-unit-modal.component';
import { ModernPaymentModalComponent } from '../modern-payment-modal/modern-payment-modal.component';
import { ModernDeletePaymentModalComponent } from '../modern-delete-payment-modal/modern-delete-payment-modal.component';
import { ModernContractTerminationModalComponent } from '../modern-contract-termination-modal/modern-contract-termination-modal.component';
import { ModernDeleteUnitModalComponent } from '../modern-delete-unit-modal/modern-delete-unit-modal.component';

// Anciens modals (à garder temporairement pour certaines fonctionnalités)
import { ContractViewerModalComponent } from '../contract-viewer-modal/contract-viewer-modal.component';
import { Observable, Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  RoomModel,
  LocataireModel,
  LocataireAction,
  PropertyModel,
  RoomState,
  RoomAction,
  LocataireState,
  PropertyState,
  RoomType,
  HistoryLocationPaymentState,
  HistoryLocationPaymentAction,
  LocationPaymentModel,
  HistoryLocationPaymentModel,
  LocationModel,
  LocationState
} from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';
import { UnitDetailsViewService } from '../../services/unit-details-view.service';
import { GaleryComponent } from '../../../room/components/galery/galery.component';
import { GeneratePaymentLinkModalComponent } from '../generate-payment-link-modal/generate-payment-link-modal.component';
import { ExportService, ExportColumn } from '../../services/export.service';

export interface UnitAction {
  type: 'view' | 'edit' | 'assign_tenant' | 'terminate_lease' | 'manage_media' | 'toggle_status' | 'edit_galery' | 'edit_tenant';
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
  locations$: Observable<LocationModel[]> | undefined;
  property$: Observable<PropertyModel> | undefined;
  loading$: Observable<boolean> | undefined;

  // États locaux
  rooms: RoomModel[] = [];
  locataires: LocataireModel[] = [];
  locations: LocationModel[] = [];
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
    private router: Router,
    private dialog: MatDialog,
    private assignLocationModalService: AssignLocationModalService,
    private toastr: ToastrService,
    private exportService: ExportService
  ) { }

  ngOnInit(): void {
    if (!this.propertyId) return;

    // Les locataires sont déjà chargés par LoadingPropertyDataResolver
    // Initialiser les observables
    this.rooms$ = this.store.select(RoomState.selectStateRoomByPropertyId(this.propertyId));
    this.locataires$ = this.store.select(LocataireState.selectStateLocataireByPropertyId(this.propertyId)); // Tous les locataires
    this.locations$ = this.store.select(LocationState.selectStateLocations);
    this.property$ = this.store.select(PropertyState.selectStateProperty(this.propertyId));
    this.loading$ = this.store.select(RoomState.selectStateLoading);

    // S'abonner aux données
    if (this.rooms$ && this.locataires$ && this.locations$ && this.property$ && this.loading$) {
      combineLatest([
        this.rooms$,
        this.locataires$,
        this.locations$,
        this.property$,
        this.loading$
      ]).pipe(
        takeUntil(this.destroy$)
      ).subscribe(([rooms, locataires, locations, property, loading]) => {
        this.rooms = rooms || [];
        this.locataires = locataires || [];
        this.locations = locations || [];
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
    console.log('🔧 onEditUnit appelé', { room, propertyId: this.propertyId, dialog: this.dialog });

    if (!this.dialog) {
      console.error('❌ Service MatDialog non disponible !');
      return;
    }

    if (!room) {
      console.error('❌ Aucune unité fournie pour l\'édition');
      return;
    }

    console.log('📝 Ouverture du modal ModernUnitModalComponent en mode édition...');

    try {
      const dialogRef = this.dialog.open(ModernUnitModalComponent, {
        width: '100%',
        maxWidth: '900px',
        disableClose: true,
        data: {
          mode: 'edit',
          property: this.property || { _id: this.propertyId },
          unit: room
        }
      });

      console.log('✅ Modal d\'édition ouvert, dialogRef:', dialogRef);

      dialogRef.afterClosed().subscribe(result => {
        console.log('🔄 Modal d\'édition fermé avec résultat:', result);
        if (result) {
          // Recharger les données après modification
          this.reloadData();
          this.toastr.success('Unité modifiée avec succès', 'Succès');
        }
      });
    } catch (error) {
      console.error('❌ Erreur lors de l\'ouverture du modal d\'édition:', error);
    }

    // Émettre l'événement pour compatibilité
    this.unitAction.emit({ type: 'edit', room });
  }

  onManageMedia(room: RoomModel): void {
    this.unitAction.emit({ type: 'manage_media', room });
  }

  onToggleStatus(room: RoomModel): void {
    this.unitAction.emit({ type: 'toggle_status', room });
  }



  onEditGaleryUnit(room: RoomModel): void {
    const dialogRef = this.dialog.open(GaleryComponent, {
      width: '900px',
      maxWidth: '95vw',
      height: '90vh',
      maxHeight: '90vh',
      panelClass: 'gallery-modal-dialog',
      disableClose: true,
      data: { room }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.mediaUpdated) {
        console.log('🔄 Médias mis à jour, rechargement des données de l\'unité');
        // Recharger les données de l'unité pour synchroniser les médias
        this.refreshUnitData(room._id);
      }
    });
  }

  private refreshUnitData(roomId: string): void {
    // Recharger les données de l'unité depuis le store
    this.store.dispatch(new RoomAction.FetchRoom(roomId));
  }

  // Méthodes pour les modals de paiement
  openAddPaymentModal(room: RoomModel): void {
    console.log('🚀 Ouverture du modal AddPayment pour la room:', room);

    // Vérifier si la chambre est libre
    if (!room || room.isFree === true) {
      alert('Impossible d\'ajouter un paiement : cette unité est libre et n\'a pas de locataire assigné.');
      return;
    }

    // Récupérer les données du locataire et de la location
    const tenant = this.getTenantForRoom(room);
    const location = this.getLocationForRoom(room);

    console.log('📊 Données pour le modal:', { room, tenant, location });

    // Ouvrir le nouveau modal moderne de paiement
    const dialogRef = this.dialog.open(ModernPaymentModalComponent, {
      width: '100%',
      maxWidth: '700px',
      disableClose: true,
      data: {
        mode: 'create',
        room: room,
        tenant: tenant,
        location: location
      }
    });

    console.log('✅ Modal ouvert, dialogRef:', dialogRef);

    dialogRef.afterClosed().subscribe(result => {
      console.log('🔄 Modal fermé avec résultat:', result);
      if (result) {
        console.log('💰 Paiement ajouté avec succès');
        // Recharger les données de l'unité
        this.refreshUnitData(room._id);
      }
    });
  }

  openDeletePaymentModal(paymentData: any): void {
    if (!paymentData?.transaction || !paymentData?.history) {
      console.error('Données de paiement manquantes pour la suppression');
      return;
    }

    const dialogRef = this.dialog.open(ModernDeletePaymentModalComponent, {
      width: '100%',
      maxWidth: '600px',
      disableClose: true,
      data: {
        transaction: paymentData.transaction,
        history: paymentData.history
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('🗑️ Paiement supprimé avec succès');
        // Recharger les données de l'unité
        if (paymentData.transaction?.roomId) {
          this.refreshUnitData(paymentData.transaction.roomId);
        }
      }
    });
  }

  openGeneratePaymentLinkModal(room: RoomModel, data: any): void {
    console.log('🔗 Ouverture du modal GeneratePaymentLink pour la room:', room, 'data:', data);

    const dialogRef = this.dialog.open(GeneratePaymentLinkModalComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'generate-payment-link-modal-dialog',
      disableClose: true,
      data: {
        room: room,
        tenant: data?.tenant,
        location: data?.location
      }
    });

    console.log('✅ Modal GeneratePaymentLink ouvert, dialogRef:', dialogRef);

    dialogRef.afterClosed().subscribe(result => {
      console.log('🔄 Modal GeneratePaymentLink fermé avec résultat:', result);
      if (result) {
        console.log('🔗 Lien de paiement généré avec succès');
        // Optionnel: Recharger les données si nécessaire
      }
    });
  }

  private getTenantForRoom(room: RoomModel): LocataireModel | null {
    // Essayer de récupérer depuis le service de vue
    const selectedTenant = this.getSelectedTenant();
    if (selectedTenant && this.viewService.getSelectedRoom()?._id === room._id) {
      return selectedTenant;
    }

    // Rechercher dans les locataires du store par ID
    if (!room || room.isFree || !room.locataire) {
      return null;
    }

    const tenants = this.store.selectSnapshot(LocataireState.selectStateLocataireByPropertyId(this.propertyId));

    if (tenants && tenants.length > 0) {
      const tenant = tenants.find(t => t._id === room.locataire);
      if (tenant) {
        console.log('✅ Locataire trouvé pour la chambre:', room.code, tenant.fullName);
        return tenant;
      }
    }

    console.log('⚠️ Aucun locataire trouvé pour la chambre:', room.code);
    return null;
  }

  private getLocationForRoom(room: RoomModel): LocationModel | null {
    if (!room || room.isFree) {
      return null;
    }

    // Rechercher dans les locations du store
    const locations = this.store.selectSnapshot(LocationState.selectStateLocationByPropertyId(this.propertyId));

    if (locations && locations.length > 0) {
      // Chercher une location active pour cette chambre
      const location = locations.find(loc =>
        loc.room === room._id &&
        loc.isRunning !== false
      );

      if (location) {
        console.log('✅ Location trouvée pour la chambre:', room.code, location._id);
        return location;
      }
    }

    // Si pas de location trouvée dans le store, créer une location temporaire
    console.log('⚠️ Aucune location trouvée dans le store pour la chambre:', room.code);

    const tenant = this.getTenantForRoom(room);
    if (tenant) {
      return {
        _id: null, // Pas d'ID - sera géré par le backend
        room: room._id,
        locataire: tenant._id,
        property: this.propertyId,
        startDate: new Date(),
        endDate: null,
        monthlyRent: room.price || 0,
        deposit: 0,
        status: 'active',
        isRunning: true,
        createdAt: new Date(),
        updatedAt: new Date()
      } as LocationModel;
    }

    return null;
  }

  // Méthodes pour les statistiques basées sur RoomModel
  getOccupiedUnitsCount(): number {
    return this.rooms.filter(room => room.isFree === false).length;
  }

  getAvailableUnitsCount(): number {
    return this.rooms.filter(room => room.isFree === true).length;
  }

  getVacantSince(room: RoomModel): string {
    if (!room) return 'Date inconnue';

    // Vérifier si l'unité est actuellement occupée
    if (!room.isFree) {
      // Unité occupée - chercher la location active
      const activeLocation = this.locations.find(loc =>
        loc.room === room._id && loc.isRunning === true
      );

      if (activeLocation && activeLocation.startedAt) {
        return new Date(activeLocation.startedAt).toLocaleDateString('fr-FR');
      }

      // Fallback : chercher le locataire et sa date de création
      const tenant = this.locataires.find(loc => loc.room === room._id);
      if (tenant && tenant.createdAt) {
        return new Date(tenant.createdAt).toLocaleDateString('fr-FR');
      }

      return 'Date inconnue';
    }

    // Unité libre - récupérer toutes les locations pour cette unité
    const roomLocations = this.locations.filter(loc => loc.room === room._id);

    if (roomLocations.length === 0) {
      // Jamais occupé - utiliser la date de création de l'unité
      if (room.createdAt) {
        return new Date(room.createdAt).toLocaleDateString('fr-FR');
      }
      return 'Date inconnue';
    }

    // Trouver la dernière location terminée (endedAt défini)
    const terminatedLocations = roomLocations
      .filter(loc => loc.endedAt && !loc.isRunning)
      .sort((a, b) => new Date(b.endedAt!).getTime() - new Date(a.endedAt!).getTime());

    if (terminatedLocations.length > 0) {
      // Utiliser la date de fin de la dernière location terminée
      const lastEndDate = terminatedLocations[0].endedAt;
      if (lastEndDate) {
        return new Date(lastEndDate).toLocaleDateString('fr-FR');
      }
    }

    // Si pas de location terminée mais des locations existent,
    // utiliser la date de création de l'unité
    if (room.createdAt) {
      return new Date(room.createdAt).toLocaleDateString('fr-FR');
    }

    return 'Date inconnue';
  }

  /**
   * Obtenir le libellé selon le statut de l'unité
   */
  getOccupancyLabel(room: RoomModel): string {
    if (!room) return 'Depuis';
    return room.isFree ? 'Libre depuis' : 'Occupé depuis';
  }

  // Méthodes pour les modals
  onAssignTenant(room: RoomModel): void {
    // Ouvrir le modal d'assignation avec la chambre pré-sélectionnée
    this.assignLocationModalService.openAssignLocationModal({
      propertyId: this.propertyId,
      roomId: room._id,
      assistant: true,
      returnUrl: this.router.url
    }).subscribe(result => {
      console.log('🔄 Résultat du modal d\'assignation:', result);

      if (result && result.success) {
        console.log('✅ Assignation réussie depuis unité');
        // Recharger les données après succès
        this.reloadData();
        this.toastr.success('Assignation réalisée avec succès', 'Succès');
      } else if (result && result.success === false) {
        // Erreur réelle d'assignation
        console.error('❌ Assignation échouée:', result);
        this.toastr.error('Erreur lors de l\'assignation', 'Erreur');
      } else {
        // Annulation par l'utilisateur (result === null)
        console.log('🚫 Assignation annulée par l\'utilisateur');
        // Pas de message pour une annulation normale
      }
    });
  }
  // Méthodes pour les modals
  onEditenant(tenant: LocataireModel): void {
    // Trouver la propriété et la chambre du locataire
    const property = this.property;
    if (!property) {
      this.toastr.error('Propriété non trouvée', 'Erreur');
      return;
    }

    // Ouvrir le nouveau modal moderne de modification de locataire
    this.dialog.open(ModernTenantModalComponent, {
      width: '100%',
      maxWidth: '800px',
      disableClose: true,
      data: {
        mode: 'edit',
        property: property,
        tenant: tenant
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        // Recharger les données après modification
        this.reloadData();
        this.toastr.success('Locataire modifié avec succès', 'Succès');
      }
    });
  }

  onTerminateLease(room: RoomModel): void {
    console.log('🔧 PropertyUnitsList: onTerminateLease appelé pour:', room);

    if (!this.dialog) {
      console.error('❌ Service MatDialog non disponible !');
      return;
    }

    // Récupérer la location active pour cette chambre depuis le store
    const locations = this.store.selectSnapshot(LocationState.selectStateLocations) as LocationModel[];
    const location = locations?.find((loc: LocationModel) => loc.room === room._id && loc.isRunning);

    if (!location) {
      console.error('❌ Aucune location active trouvée pour cette unité');
      this.toastr.error('Aucune location active trouvée pour cette unité', 'Erreur');
      return;
    }

    console.log('📝 Ouverture du modal ModernContractTerminationModalComponent...');

    // Récupérer le locataire pour cette location
    const tenant = this.getTenantForRoom(room);

    try {
      const dialogRef = this.dialog.open(ModernContractTerminationModalComponent, {
        width: '100%',
        maxWidth: '900px',
        disableClose: true,
        data: {
          location: location,
          tenant: tenant,
          room: room
        }
      });

      console.log('✅ Modal ModernContractTermination ouvert, dialogRef:', dialogRef);

      dialogRef.afterClosed().subscribe(result => {
        console.log('🔄 Modal ModernContractTermination fermé avec résultat:', result);
        if (result) {
          console.log('✅ Contrat résilié avec succès');
          // Recharger les données
          this.reloadData();
          this.toastr.success('Contrat résilié avec succès', 'Succès');
        }
      });
    } catch (error) {
      console.error('❌ Erreur lors de l\'ouverture du modal ModernContractTermination:', error);
    }
  }

  /**
   * Ouvre le modal de visualisation du contrat
   */
  onViewContract(room: RoomModel): void {
    console.log('🔍 PropertyUnitsList: onViewContract appelé pour:', room);

    if (!this.dialog) {
      console.error('❌ Service MatDialog non disponible !');
      return;
    }

    // Récupérer la location active pour cette chambre depuis le store
    const locations = this.store.selectSnapshot(LocationState.selectStateLocations) as LocationModel[];
    const location = locations?.find((loc: LocationModel) => loc.room === room._id && loc.isRunning);

    if (!location) {
      console.error('❌ Aucune location active trouvée pour cette unité');
      this.toastr.error('Aucune location active trouvée pour cette unité', 'Erreur');
      return;
    }

    // Récupérer le locataire
    const tenants = this.store.selectSnapshot(LocataireState.selectStateLocataires) as LocataireModel[];
    const tenant = tenants?.find((t: LocataireModel) => t._id === location.locataire);

    console.log('📄 Ouverture du modal ContractViewerModal...');

    try {
      const dialogRef = this.dialog.open(ContractViewerModalComponent, {
        width: '90vw',
        height: '90vh',
        maxWidth: '1400px',
        maxHeight: '900px',
        disableClose: false,
        panelClass: 'contract-viewer-dialog',
        data: {
          room: room,
          location: location,
          tenant: tenant
        }
      });

      console.log('✅ Modal ContractViewer ouvert, dialogRef:', dialogRef);

      dialogRef.afterClosed().subscribe(result => {
        console.log('🔄 Modal ContractViewer fermé');
      });
    } catch (error) {
      console.error('❌ Erreur lors de l\'ouverture du modal ContractViewer:', error);
      this.toastr.error('Erreur lors de l\'ouverture du contrat', 'Erreur');
    }
  }

  closeAssignTenantModal(): void {
    this.showAssignTenantModal = false;
    this.selectedRoom = null;
    this.selectedTenantId = '';
    this.leaseStartDate = '';
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
    console.log('🎯 PropertyUnitsList: Action reçue depuis le panneau de détails:', action);
    // Gérer les actions depuis le panneau de détails
    switch (action.type) {
      case 'edit':
        this.onEditUnit(action.room);
        break;
      case 'assign_tenant':
        this.onAssignTenant(action.room);
        break;
      case 'edit_tenant':
        this.onEditenant(action.data.tenant);
        break;
      case 'terminate_lease':
        this.onTerminateLease(action.room);
        break;
      case 'view_contract':
        this.onViewContract(action.room);
        break;
      case 'view_image':
        console.log('Voir l\'image:', action.data?.imageUrl);
        // TODO: Implémenter le visualiseur d'image
        break;
      case 'edit_gallery':
        console.log('🎨 PropertyUnitsList: Cas edit_gallery détecté, ouverture du modal');
        this.onEditGaleryUnit(action.room);
        break;
      case 'add_payment':
        this.openAddPaymentModal(action.room);
        break;
      case 'delete_payment':
        this.openDeletePaymentModal(action.data);
        break;
      case 'generate_payment_link':
        console.log('🔗 PropertyUnitsList: Cas generate_payment_link détecté, ouverture du modal');
        this.openGeneratePaymentLinkModal(action.room, action.data);
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
    console.log('🔧 editPayment appelé:', payment);
    console.log('🔧 Dialog service:', this.dialog);

    if (!payment?.transaction || !payment?.history) {
      console.error('❌ Données de paiement manquantes pour la modification');
      return;
    }

    console.log('📝 Ouverture du modal ModernPaymentModalComponent...');

    // Récupérer les données nécessaires
    const room = this.rooms.find(r => r._id === payment.transaction.room);
    const tenant = payment.history?.locataire;
    const location = this.getLocationForRoom(room);

    const dialogRef = this.dialog.open(ModernPaymentModalComponent, {
      width: '100%',
      maxWidth: '700px',
      disableClose: true,
      data: {
        mode: 'edit',
        room: room,
        tenant: tenant,
        location: location,
        transaction: payment.transaction
      }
    });

    console.log('✅ Modal UpdatePayment ouvert, dialogRef:', dialogRef);

    dialogRef.afterClosed().subscribe(result => {
      console.log('🔄 Modal UpdatePayment fermé avec résultat:', result);
      if (result) {
        console.log('💰 Paiement modifié avec succès');
        // Recharger les données de l'unité
        if (payment.transaction?.roomId) {
          this.refreshUnitData(payment.transaction.roomId);
        }
      }
    });
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
        this.editPayment(action.data);
        break;
      case 'delete':
        this.openDeletePaymentModal(action.data);
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

  /**
   * Recharger les données après une assignation réussie
   */
  private reloadData(): void {
    if (this.propertyId) {
      // Recharger les chambres
      this.store.dispatch(new RoomAction.FetchRoomsByPropertyID(this.propertyId));

      // Recharger les locataires
      this.store.dispatch(new LocataireAction.FetchLocatairesByPropertyId(this.propertyId));

      // Recharger les paiements
      this.store.dispatch(new HistoryLocationPaymentAction.FetchHistoryLocationPaymentsByPropertyId(this.propertyId));

      // Mettre à jour les données après un délai
      setTimeout(() => {
        this.updateRoomPayments();
      }, 1000);
    }
  }

  /**
   * Ouvrir le modal d'ajout d'une nouvelle unité
   */
  onAddUnit(): void {
    console.log('🔧 onAddUnit appelé', { propertyId: this.propertyId, dialog: this.dialog });

    if (!this.dialog) {
      console.error('❌ Service MatDialog non disponible !');
      return;
    }

    if (this.propertyId) {
      console.log('📝 Ouverture du modal ModernUnitModalComponent...');

      try {
        const dialogRef = this.dialog.open(ModernUnitModalComponent, {
          width: '100%',
          maxWidth: '900px',
          disableClose: true,
          data: {
            mode: 'create',
            property: this.property || { _id: this.propertyId }
          }
        });

        console.log('✅ Modal ouvert, dialogRef:', dialogRef);
        console.log('✅ DialogRef id:', dialogRef.id);
        console.log('✅ DialogRef componentInstance:', dialogRef.componentInstance);

        dialogRef.afterClosed().subscribe(result => {
          console.log('🔄 Modal fermé avec résultat:', result);
          if (result) {
            // Recharger les données après création
            this.reloadData();
            this.toastr.success('Unité créée avec succès', 'Succès');
          }
        });
      } catch (error) {
        console.error('❌ Erreur lors de l\'ouverture du modal:', error);
      }
    } else {
      console.error('❌ PropertyId manquant pour ajouter une unité');
    }
  }

  // === MÉTHODES D'EXPORT ===

  /**
   * Exporter la liste des unités en CSV
   */
  exportUnitsToCSV(): void {
    const columns: ExportColumn[] = [
      { key: 'code', label: 'Code' },
      { key: 'type', label: 'Type', formatter: (value) => this.getRoomTypeLabel(value) },
      { key: 'price', label: 'Prix', formatter: ExportService.formatters.currency },
      { key: 'status', label: 'Statut', formatter: (value) => this.getRoomStatusLabel({ locataire: value === 'occupied' ? ['test'] : [] } as any) },
      { key: 'description', label: 'Description' },
      { key: 'specifity.numberOfBathroom', label: 'Salles de bain' },
      { key: 'specifity.numberOfShower', label: 'Douches' },
      { key: 'specifity.hasKitchen', label: 'Cuisine', formatter: ExportService.formatters.boolean },
      { key: 'isActiveForSouscription', label: 'Actif pour location', formatter: ExportService.formatters.boolean },
      { key: 'isShowToPublic', label: 'Visible au public', formatter: ExportService.formatters.boolean },
      { key: 'createdAt', label: 'Date de création', formatter: ExportService.formatters.date }
    ];

    this.exportService.exportToCSV({
      filename: 'Unites',
      propertyName: this.property?.name || `Propriete_${this.propertyId}`,
      columns,
      data: this.filteredRooms
    });
  }

  /**
   * Exporter la liste des unités en Excel
   */
  exportUnitsToExcel(): void {
    const columns: ExportColumn[] = [
      { key: 'code', label: 'Code' },
      { key: 'type', label: 'Type', formatter: (value) => this.getRoomTypeLabel(value) },
      { key: 'price', label: 'Prix', formatter: ExportService.formatters.currency },
      { key: 'status', label: 'Statut', formatter: (value) => this.getRoomStatusLabel({ locataire: value === 'occupied' ? ['test'] : [] } as any) },
      { key: 'description', label: 'Description' },
      { key: 'specifity.numberOfBathroom', label: 'Salles de bain' },
      { key: 'specifity.numberOfShower', label: 'Douches' },
      { key: 'specifity.hasKitchen', label: 'Cuisine', formatter: ExportService.formatters.boolean },
      { key: 'isActiveForSouscription', label: 'Actif pour location', formatter: ExportService.formatters.boolean },
      { key: 'isShowToPublic', label: 'Visible au public', formatter: ExportService.formatters.boolean },
      { key: 'createdAt', label: 'Date de création', formatter: ExportService.formatters.date }
    ];

    this.exportService.exportToExcel({
      filename: 'Unites',
      propertyName: this.property?.name || `Propriete_${this.propertyId}`,
      columns,
      data: this.filteredRooms
    });
  }

  /**
   * Supprimer une unité
   */
  onDeleteUnit(unit: RoomModel): void {
    console.log('🗑️ PropertyUnitsList: onDeleteUnit appelé pour:', unit);
    console.log('🔍 Unit isFree:', unit.isFree);
    console.log('🔍 Event triggered successfully!');

    if (!this.dialog) {
      console.error('❌ Service MatDialog non disponible !');
      return;
    }

    // Vérifier que l'unité n'est pas occupée
    if (!unit.isFree) {
      this.toastr.warning('Impossible de supprimer une unité occupée. Résiliez d\'abord le contrat du locataire.', 'Attention');
      return;
    }

    console.log('🗑️ Ouverture du modal de suppression d\'unité...');

    const dialogRef = this.dialog.open(ModernDeleteUnitModalComponent, {
      width: '100%',
      maxWidth: '600px',
      disableClose: true,
      data: {
        unit: unit,
        propertyName: this.property?.name
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('✅ Unité supprimée, rechargement des données...');
        // Les données sont automatiquement mises à jour par le state
        // Pas besoin de recharger manuellement
      }
    });
  }

}
