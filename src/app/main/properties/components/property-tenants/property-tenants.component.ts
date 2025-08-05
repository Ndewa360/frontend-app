import { Component, Input, OnInit, OnDestroy, OnChanges } from '@angular/core';
import { LocataireModel, RoomModel, LocationModel, LocationState, LocataireState, HistoryLocationPaymentState, PropertyState, PropertyModel } from 'src/app/shared/store';
import { LocationPaymentAction } from 'src/app/shared/store/payment-location';
import { HistoryLocationPaymentAction } from 'src/app/shared/store/history-payment-location';
import { Store } from '@ngxs/store';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { AssignLocationModalService } from 'src/app/main/assign-location/services/assign-location-modal.service';
// Nouveaux modals modernes
import { ModernTenantModalComponent } from '../modern-tenant-modal/modern-tenant-modal.component';
import { ModernPaymentModalComponent } from '../modern-payment-modal/modern-payment-modal.component';
import { ModernDeletePaymentModalComponent } from '../modern-delete-payment-modal/modern-delete-payment-modal.component';
import { ModernContractTerminationModalComponent } from '../modern-contract-termination-modal/modern-contract-termination-modal.component';
import { ModernDeleteTenantModalComponent } from '../modern-delete-tenant-modal/modern-delete-tenant-modal.component';

// Anciens modals (à garder temporairement)
import { ContractViewerModalComponent } from '../contract-viewer-modal/contract-viewer-modal.component';

// Services
import { TenantAvatarService } from 'src/app/shared/services/tenant-avatar.service';
import { ExportService, ExportColumn } from '../../services/export.service';



@Component({
  selector: 'app-property-tenants',
  templateUrl: './property-tenants.component.html',
  styleUrls: ['./property-tenants.component.scss']
})
export class PropertyTenantsComponent implements OnInit, OnDestroy, OnChanges {
  @Input() propertyId: string = '';
  @Input() tenants: LocataireModel[] = [];
  @Input() units: RoomModel[] = [];
  @Input() loading: boolean = false;

  filteredTenants: LocataireModel[] = [];
  searchTerm: string = '';
  statusFilter: string = '';
  sortBy: string = 'name';
  activeTenantMenu: string | null = null;
  property: PropertyModel | null = null;

  // Données de location pour récupérer les vraies dates d'entrée
  locations: LocationModel[] = [];

  // Locataire sélectionné pour le panneau de détails
  selectedTenant: LocataireModel | null = null;

  constructor(
    private store: Store,
    private dialog: MatDialog,
    private toastr: ToastrService,
    private tenantAvatarService: TenantAvatarService,
    private exportService: ExportService,
    private assignLocationModalService: AssignLocationModalService
  ) {}

  ngOnInit(): void {
    this.filteredTenants = [...this.tenants];
    this.loadLocations();
    this.loadPropertyData();
    this.filterTenants();

    // Charger les données de paiement pour cette propriété
    if (this.propertyId) {
      this.store.dispatch(new LocationPaymentAction.FetchLocationPaymentsByPropertyId(this.propertyId));
    }
  }

  /**
   * Charger les données de la propriété
   */
  private loadPropertyData(): void {
    if (this.propertyId) {
      this.property = this.store.selectSnapshot(PropertyState.selectStateProperty(this.propertyId));
    }
  }

  ngOnChanges(): void {
    this.filteredTenants = [...this.tenants];
    this.loadLocations();
    this.filterTenants();

    // Charger les données de paiement si propertyId change
    if (this.propertyId) {
      this.store.dispatch(new LocationPaymentAction.FetchLocationPaymentsByPropertyId(this.propertyId));
    }
  }

  private loadLocations(): void {
    if (this.propertyId) {
      // Charger les locations pour cette propriété
      this.locations = this.store.selectSnapshot(LocationState.selectStateLocationByPropertyId(this.propertyId)) || [];
    }
  }

  ngOnDestroy(): void {
    // Cleanup si nécessaire
  }

  // === MÉTHODES DE FILTRAGE ET RECHERCHE ===

  filterTenants(): void {
    let filtered = [...this.tenants];

    // Filtre par recherche
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(tenant =>
        (tenant.fullName || '').toLowerCase().includes(term) ||
        (tenant.email || '').toLowerCase().includes(term) ||
        (tenant.phoneNumber || '').toLowerCase().includes(term)
      );
    }

    // Filtre par statut
    if (this.statusFilter) {
      filtered = filtered.filter(tenant => this.getTenantStatus(tenant) === this.statusFilter);
    }

    this.filteredTenants = filtered;
    this.sortTenants();
  }

  sortTenants(): void {
    this.filteredTenants.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortBy) {
        case 'name':
          aValue = a.fullName || '';
          bValue = b.fullName || '';
          break;
        case 'unit':
          aValue = this.getTenantUnit(a) || '';
          bValue = this.getTenantUnit(b) || '';
          break;
        case 'rent':
          aValue = this.getTenantRent(a) || 0;
          bValue = this.getTenantRent(b) || 0;
          break;
        case 'lease_end':
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
        default:
          aValue = a.fullName || '';
          bValue = b.fullName || '';
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return -1;
      if (aValue > bValue) return 1;
      return 0;
    });
  }

  // === MÉTHODES DE STATISTIQUES ===

  getTotalTenants(): number {
    return this.tenants.length;
  }

  getActiveTenants(): number {
    // Un locataire est actif s'il a une unité assignée (room)
    return this.tenants.filter(tenant => tenant.room && tenant.room.trim() !== '').length;
  }

  getTotalRevenue(): number {
    // Calculer le revenu total basé sur les unités occupées
    return this.units
      .filter(unit => !unit.isFree)
      .reduce((sum, unit) => sum + (unit.price || 0), 0);
  }

  getOccupancyRate(): number {
    if (this.units.length === 0) return 0;
    const occupiedUnits = this.units.filter(unit => !unit.isFree).length;
    return Math.round((occupiedUnits / this.units.length) * 100);
  }

  // === MÉTHODES UTILITAIRES POUR LES LOCATAIRES ===

  trackByTenantId(_: number, tenant: LocataireModel): string {
    return tenant._id || '';
  }

  getTenantInitials(tenant: LocataireModel): string {
    return this.tenantAvatarService.getTenantInitials(tenant);
  }

  getTenantAvatarColor(tenant: LocataireModel): string {
    return this.tenantAvatarService.getTenantAvatarColor(tenant);
  }

  getTenantStatus(tenant: LocataireModel): 'active' | 'inactive' | 'pending' {
    // Logique pour déterminer le statut
    if (tenant.room) {
      return 'active';
    }
    return 'inactive';
  }

  getTenantStatusLabel(tenant: LocataireModel): string {
    const status = this.getTenantStatus(tenant);
    switch (status) {
      case 'active': return 'Actif';
      case 'inactive': return 'Inactif';
      case 'pending': return 'En attente';
      default: return 'Inconnu';
    }
  }

  getTenantUnit(tenant: LocataireModel): string | null {
    if (!tenant.room) return null;
    const room = this.units.find(r => r._id === tenant.room);
    return room ? (room.code || `Unité ${room._id?.substring(0, 8)}`) : null;
  }

  getTenantRent(tenant: LocataireModel): number | null {
    if (!tenant.room) return null;
    const room = this.units.find(r => r._id === tenant.room);
    return room ? room.price : null;
  }

  getTenantLeaseStart(tenant: LocataireModel): Date | null {
    return tenant.createdAt ? new Date(tenant.createdAt) : null;
  }

  // Nouvelle méthode pour récupérer la vraie date d'entrée depuis LocationModel
  getTenantLeaseStartDate(tenant: LocataireModel): Date | null {
    if (!tenant.room) return null;

    // Chercher la location active pour ce locataire et cette unité
    const location = this.locations.find(loc =>
      loc.locataire === tenant._id &&
      loc.room === tenant.room &&
      loc.isRunning === true
    );

    if (location && location.startedAt) {
      return new Date(location.startedAt);
    }

    // Fallback sur la date de création du locataire
    return tenant.createdAt ? new Date(tenant.createdAt) : null;
  }

  // Méthode pour récupérer l'email réel du locataire
  getTenantEmail(tenant: LocataireModel): string {
    // Utiliser emailRef en priorité, puis email, puis une valeur par défaut
    return tenant.emailRef || tenant.email || 'Email non renseigné';
  }

  // Méthode pour récupérer le téléphone réel du locataire
  getTenantPhone(tenant: LocataireModel): string {
    // Utiliser phoneNumberRef en priorité, puis phoneNumber, puis une valeur par défaut
    return tenant.phoneNumberRef || tenant.phoneNumber || 'Téléphone non renseigné';
  }

  // === MÉTHODES DE FORMATAGE ===

  formatPrice(price: number | null): string {
    if (!price) return '0 FCFA';
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

  // === MÉTHODES D'ACTIONS ===

  addTenant(): void {
    console.log('🏠 PropertyTenants: addTenant appelé');

    if (!this.dialog) {
      console.error('❌ Service MatDialog non disponible !');
      return;
    }

    // Récupérer les données de la propriété depuis le store
    const property = this.store.selectSnapshot(PropertyState.selectStateProperty(this.propertyId));

    if (!property) {
      console.error('❌ Propriété non trouvée');
      this.toastr.error('Propriété non trouvée', 'Erreur');
      return;
    }

    console.log('📝 Ouverture du modal ModernTenantModalComponent...');

    try {
      const dialogRef = this.dialog.open(ModernTenantModalComponent, {
        width: '100%',
        maxWidth: '800px',
        disableClose: true,
        data: {
          mode: 'create',
          property: property
        }
      });

      console.log('✅ Modal ModernTenant ouvert, dialogRef:', dialogRef);

      dialogRef.afterClosed().subscribe(result => {
        console.log('🔄 Modal ModernTenant fermé avec résultat:', result);
        if (result) {
          console.log('✅ Locataire ajouté avec succès');
          this.toastr.success('Locataire ajouté avec succès', 'Succès');
          // Les données seront automatiquement mises à jour via les observables
        }
      });
    } catch (error) {
      console.error('❌ Erreur lors de l\'ouverture du modal ModernTenant:', error);
      this.toastr.error('Erreur lors de l\'ouverture du modal', 'Erreur');
    }
  }

  onTenantClick(tenant: LocataireModel): void {
    this.selectedTenant = tenant;
  }

  onViewTenantDetails(tenant: LocataireModel, event: Event): void {
    event.stopPropagation();
    this.selectedTenant = tenant;
  }

  onEditTenant(tenant: LocataireModel, event: Event): void {
    event.stopPropagation();
    console.log('✏️ PropertyTenants: onEditTenant appelé pour:', tenant);

    if (!this.dialog) {
      console.error('❌ Service MatDialog non disponible !');
      return;
    }

    console.log('📝 Ouverture du modal ModernTenantModalComponent...');

    // Récupérer la propriété via l'ID
    const property = { _id: this.propertyId };

    try {
      const dialogRef = this.dialog.open(ModernTenantModalComponent, {
        width: '100%',
        maxWidth: '800px',
        disableClose: true,
        data: {
          mode: 'edit',
          property: property,
          tenant: tenant
        }
      });

      console.log('✅ Modal UpdateLocataire ouvert, dialogRef:', dialogRef);

      dialogRef.afterClosed().subscribe(result => {
        console.log('🔄 Modal UpdateLocataire fermé avec résultat:', result);
        if (result) {
          console.log('✅ Locataire modifié avec succès');
          this.toastr.success('Locataire modifié avec succès', 'Succès');
          // Les données seront automatiquement mises à jour via les observables
        }
      });
    } catch (error) {
      console.error('❌ Erreur lors de l\'ouverture du modal UpdateLocataire:', error);
      this.toastr.error('Erreur lors de l\'ouverture du modal', 'Erreur');
    }
  }

  onAddPayment(tenant: LocataireModel, event: Event): void {
    event.stopPropagation();
    console.log('💰 PropertyTenants: onAddPayment appelé pour:', tenant);

    if (!this.dialog) {
      console.error('❌ Service MatDialog non disponible !');
      return;
    }

    // Charger les données nécessaires
    this.loadPaymentDataForTenant(tenant)
      .then(({ location, room }) => {
        console.log('📝 Ouverture du modal ModernPaymentModalComponent...');

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

        console.log('✅ Modal AddPayment ouvert, dialogRef:', dialogRef);

        dialogRef.afterClosed().subscribe(result => {
          console.log('🔄 Modal AddPayment fermé avec résultat:', result);
          if (result) {
            console.log('✅ Paiement ajouté avec succès');
            this.toastr.success('Paiement ajouté avec succès', 'Succès');
          }
        });
      })
      .catch(error => {
        console.error('❌ Erreur:', error);
        this.toastr.error(error, 'Erreur');
      });
  }

  onAssignUnit(tenant: LocataireModel, event: Event): void {
    event.stopPropagation();
    console.log('🏠 PropertyTenants: onAssignUnit appelé pour:', tenant);

    if (!this.assignLocationModalService) {
      console.error('❌ Service AssignLocationModalService non disponible !');
      return;
    }

    // Ouvrir le modal d'assignation avec le locataire pré-sélectionné
    this.assignLocationModalService.openAssignLocationModal({
      propertyId: this.propertyId,
      locataireId: tenant._id,  // ← Correction: locataireId au lieu de tenantId
      assistant: true
    }).subscribe(result => {
      console.log('🔄 Résultat du modal d\'assignation:', result);

      if (result && result.success) {
        console.log('✅ Assignation réussie, rechargement des données...');
        // Les données seront automatiquement mises à jour par le state
        this.toastr.success('Locataire assigné avec succès', 'Succès');
      } else if (result && result.success === false) {
        // Erreur réelle d'assignation
        console.error('❌ Assignation échouée:', result);
        this.toastr.error('Erreur lors de l\'assignation du locataire', 'Erreur');
      } else {
        // Annulation par l'utilisateur (result === null)
        console.log('🚫 Assignation annulée par l\'utilisateur');
        // Pas de message pour une annulation normale
      }
    });
  }

  // === MÉTHODES DE GESTION DU PANNEAU DE DÉTAILS ===

  onCloseTenantDetails(): void {
    this.selectedTenant = null;
  }

  onEditTenantFromPanel(tenant: LocataireModel): void {
    console.log('✏️ PropertyTenants: onEditTenantFromPanel appelé pour:', tenant);

    if (!this.dialog) {
      console.error('❌ Service MatDialog non disponible !');
      return;
    }

    console.log('📝 Ouverture du modal ModernTenantModalComponent...');

    // Récupérer la propriété via l'ID
    const property = { _id: this.propertyId };

    try {
      const dialogRef = this.dialog.open(ModernTenantModalComponent, {
        width: '100%',
        maxWidth: '800px',
        disableClose: true,
        data: {
          mode: 'edit',
          property: property,
          tenant: tenant
        }
      });

      console.log('✅ Modal UpdateLocataire ouvert, dialogRef:', dialogRef);

      dialogRef.afterClosed().subscribe(result => {
        console.log('🔄 Modal UpdateLocataire fermé avec résultat:', result);
        if (result) {
          console.log('✅ Locataire modifié avec succès');
          this.toastr.success('Locataire modifié avec succès', 'Succès');
        }
        this.selectedTenant = null;
      });
    } catch (error) {
      console.error('❌ Erreur lors de l\'ouverture du modal UpdateLocataire:', error);
      this.toastr.error('Erreur lors de l\'ouverture du modal', 'Erreur');
      this.selectedTenant = null;
    }
  }

  onAssignRoomFromPanel(tenant: LocataireModel): void {
    console.log('Assigner chambre depuis panneau:', tenant);
    // Fermer le panneau et ouvrir le modal d'assignation
    this.selectedTenant = null;
    // TODO: Ouvrir modal d'assignation de chambre
  }

  onViewContractFromPanel(tenant: LocataireModel): void {
    console.log('📄 PropertyTenants: onViewContractFromPanel appelé pour:', tenant);

    if (!this.dialog) {
      console.error('❌ Service MatDialog non disponible !');
      return;
    }

    // Récupérer l'unité du locataire
    const room = this.units.find(r => r._id === tenant.room);
    if (!room) {
      console.error('❌ Unité non trouvée pour ce locataire');
      this.toastr.error('Unité non trouvée pour ce locataire', 'Erreur');
      return;
    }

    // Récupérer la location active
    const location = this.locations.find(loc =>
      loc.locataire === tenant._id &&
      loc.room === tenant.room &&
      loc.isRunning === true
    );

    if (!location) {
      console.error('❌ Aucune location active trouvée pour ce locataire');
      this.toastr.error('Aucune location active trouvée pour ce locataire', 'Erreur');
      return;
    }

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

      dialogRef.afterClosed().subscribe(() => {
        console.log('🔄 Modal ContractViewer fermé');
      });
    } catch (error) {
      console.error('❌ Erreur lors de l\'ouverture du modal ContractViewer:', error);
      this.toastr.error('Erreur lors de l\'ouverture du contrat', 'Erreur');
    }
  }

  onCancelContractFromPanel(tenant: LocataireModel): void {
    console.log('🚫 PropertyTenants: onCancelContractFromPanel appelé pour:', tenant);

    if (!this.dialog) {
      console.error('❌ Service MatDialog non disponible !');
      return;
    }

    // Récupérer la location active pour ce locataire
    const location = this.locations.find(loc =>
      loc.locataire === tenant._id &&
      loc.room === tenant.room &&
      loc.isRunning === true
    );

    if (!location) {
      console.error('❌ Aucune location active trouvée pour ce locataire');
      this.toastr.error('Aucune location active trouvée pour ce locataire', 'Erreur');
      return;
    }

    console.log('🚫 Ouverture du modal ModernContractTerminationModalComponent...');

    // Récupérer la chambre pour ce locataire via la location
    const room = location.room ? { _id: location.room } : null;

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
          this.toastr.success('Contrat résilié avec succès', 'Succès');
          this.selectedTenant = null;
          // Les données seront automatiquement mises à jour via les observables
        }
      });
    } catch (error) {
      console.error('❌ Erreur lors de l\'ouverture du modal ModernContractTermination:', error);
      this.toastr.error('Erreur lors de la résiliation du contrat', 'Erreur');
    }
  }

  /**
   * Charge les données de paiement nécessaires pour un locataire
   */
  private loadPaymentDataForTenant(tenant: LocataireModel): Promise<{location: LocationModel, room: RoomModel}> {
    return new Promise((resolve, reject) => {
      // Récupérer l'unité du locataire
      const room = this.units.find(r => r._id === tenant.room);
      if (!room) {
        reject('Unité non trouvée pour ce locataire');
        return;
      }

      // Récupérer la location active
      const location = this.locations.find(loc =>
        loc.locataire === tenant._id &&
        loc.room === tenant.room &&
        loc.isRunning === true
      );

      if (!location) {
        reject('Aucune location active trouvée pour ce locataire');
        return;
      }

      // Charger l'historique des paiements pour ce locataire
      this.store.dispatch(new HistoryLocationPaymentAction.FetchHistoryLocationByLocataireId(tenant._id))
        .subscribe({
          next: () => {
            console.log('✅ Historique des paiements chargé pour:', tenant.fullName);
            resolve({ location, room });
          },
          error: (error) => {
            console.error('❌ Erreur lors du chargement de l\'historique:', error);
            reject('Erreur lors du chargement des données de paiement');
          }
        });
    });
  }

  onAddPaymentFromPanel(tenant: LocataireModel): void {
    console.log('💰 PropertyTenants: onAddPaymentFromPanel appelé pour:', tenant);

    if (!this.dialog) {
      console.error('❌ Service MatDialog non disponible !');
      return;
    }

    // Charger les données nécessaires
    this.loadPaymentDataForTenant(tenant)
      .then(({ location, room }) => {
        console.log('📝 Ouverture du modal ModernPaymentModalComponent...');

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

        console.log('✅ Modal AddPayment ouvert, dialogRef:', dialogRef);

        dialogRef.afterClosed().subscribe(result => {
          console.log('🔄 Modal AddPayment fermé avec résultat:', result);
          if (result) {
            console.log('✅ Paiement ajouté avec succès');
            this.toastr.success('Paiement ajouté avec succès', 'Succès');
          }
          this.selectedTenant = null;
        });
      })
      .catch(error => {
        console.error('❌ Erreur:', error);
        this.toastr.error(error, 'Erreur');
      });
  }



  /**
   * Ouvre le modal de modification d'un paiement
   */
  onEditPayment(payment: any): void {
    console.log('🔧 PropertyTenants: onEditPayment appelé', payment);

    if (!payment?.transaction || !payment?.history) {
      console.error('❌ Données de paiement manquantes pour la modification');
      this.toastr.error('Données de paiement manquantes', 'Erreur');
      return;
    }

    if (!this.dialog) {
      console.error('❌ Service MatDialog non disponible !');
      return;
    }

    console.log('📝 Ouverture du modal ModernPaymentModalComponent...');

    // Récupérer les données nécessaires
    const room = payment.history?.room;
    const tenant = payment.history?.locataire;
    const location = payment.history?.location;

    try {
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
          console.log('✅ Paiement modifié avec succès');
          this.toastr.success('Paiement modifié avec succès', 'Succès');
        }
      });
    } catch (error) {
      console.error('❌ Erreur lors de l\'ouverture du modal UpdatePayment:', error);
      this.toastr.error('Erreur lors de l\'ouverture du modal', 'Erreur');
    }
  }

  /**
   * Ouvre le modal de suppression d'un paiement
   */
  onDeletePayment(payment: any): void {
    console.log('🗑️ PropertyTenants: onDeletePayment appelé', payment);

    if (!payment?.transaction || !payment?.history) {
      console.error('❌ Données de paiement manquantes pour la suppression');
      this.toastr.error('Données de paiement manquantes', 'Erreur');
      return;
    }

    if (!this.dialog) {
      console.error('❌ Service MatDialog non disponible !');
      return;
    }

    console.log('🗑️ Ouverture du modal ModernDeletePaymentModalComponent...');

    try {
      const dialogRef = this.dialog.open(ModernDeletePaymentModalComponent, {
        width: '100%',
        maxWidth: '600px',
        disableClose: true,
        data: {
          transaction: payment.transaction,
          history: payment.history
        }
      });

      console.log('✅ Modal ModernDeletePayment ouvert, dialogRef:', dialogRef);

      dialogRef.afterClosed().subscribe(result => {
        console.log('🔄 Modal ModernDeletePayment fermé avec résultat:', result);
        if (result) {
          console.log('✅ Paiement supprimé avec succès');
          this.toastr.success('Paiement supprimé avec succès', 'Succès');
        }
      });
    } catch (error) {
      console.error('❌ Erreur lors de l\'ouverture du modal ModernDeletePayment:', error);
      this.toastr.error('Erreur lors de l\'ouverture du modal', 'Erreur');
    }
  }

  // === MÉTHODES D'EXPORT ===

  /**
   * Exporter la liste des locataires en CSV
   */
  exportTenantsToCSV(): void {
    const columns: ExportColumn[] = [
      { key: 'fullName', label: 'Nom complet' },
      { key: 'email', label: 'Email' },
      { key: 'phoneNumber', label: 'Téléphone' },
      { key: 'room.code', label: 'Unité occupée' },
      { key: 'room.price', label: 'Loyer', formatter: ExportService.formatters.currency },
      { key: 'createdAt', label: 'Date d\'ajout', formatter: ExportService.formatters.date },
      { key: 'isActive', label: 'Statut', formatter: ExportService.formatters.boolean }
    ];

    this.exportService.exportToCSV({
      filename: 'Locataires',
      propertyName: this.property?.name || `Propriete_${this.propertyId}`,
      columns,
      data: this.filteredTenants
    });
  }

  /**
   * Exporter la liste des locataires en Excel
   */
  exportTenantsToExcel(): void {
    const columns: ExportColumn[] = [
      { key: 'fullName', label: 'Nom complet' },
      { key: 'email', label: 'Email' },
      { key: 'phoneNumber', label: 'Téléphone' },
      { key: 'room.code', label: 'Unité occupée' },
      { key: 'room.price', label: 'Loyer', formatter: ExportService.formatters.currency },
      { key: 'createdAt', label: 'Date d\'ajout', formatter: ExportService.formatters.date },
      { key: 'isActive', label: 'Statut', formatter: ExportService.formatters.boolean }
    ];

    this.exportService.exportToExcel({
      filename: 'Locataires',
      propertyName: this.property?.name || `Propriete_${this.propertyId}`,
      columns,
      data: this.filteredTenants
    });
  }

  /**
   * Supprimer un locataire
   */
  onDeleteTenant(tenant: LocataireModel, event: Event): void {
    event.stopPropagation();
    console.log('🗑️ PropertyTenants: onDeleteTenant appelé pour:', tenant);

    if (!this.dialog) {
      console.error('❌ Service MatDialog non disponible !');
      return;
    }

    // Vérifier que le locataire n'est pas assigné à une unité
    if (this.getTenantUnit(tenant)) {
      this.toastr.warning('Impossible de supprimer un locataire assigné à une unité. Résiliez d\'abord son contrat.', 'Attention');
      return;
    }

    console.log('🗑️ Ouverture du modal de suppression...');

    const dialogRef = this.dialog.open(ModernDeleteTenantModalComponent, {
      width: '100%',
      maxWidth: '600px',
      disableClose: true,
      data: {
        tenant: tenant,
        propertyName: this.property?.name
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('✅ Locataire supprimé, rechargement des données...');
        // Les données sont automatiquement mises à jour par le state
        // Pas besoin de recharger manuellement
      }
    });
  }
}
