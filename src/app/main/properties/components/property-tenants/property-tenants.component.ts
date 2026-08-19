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
import { PropertyAccessService } from 'src/app/shared/services/property-access.service';

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
    private assignLocationModalService: AssignLocationModalService,
    public propertyAccessService: PropertyAccessService
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

  getTenantStatus(tenant: LocataireModel): 'active' | 'planned' | 'inactive' {
    if (!tenant.room) return 'inactive';
    // Chercher la location pour cette chambre
    const location = this.locations.find(loc =>
      loc.locataire === tenant._id && loc.room === tenant.room && !loc.endedAt
    );
    if (!location) return 'active'; // fallback : room assignée sans location trouvée
    if (location.isRunning) return 'active';
    // isRunning=false, endedAt=null → date d'entrée future
    return 'planned';
  }

  getTenantStatusLabel(tenant: LocataireModel): string {
    const status = this.getTenantStatus(tenant);
    switch (status) {
      case 'active':   return 'Actif';
      case 'planned':  return 'Planifié';
      case 'inactive': return 'Inactif';
      default:         return 'Inconnu';
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

  // Récupère la vraie date d'entrée depuis LocationModel (active ou future)
  getTenantLeaseStartDate(tenant: LocataireModel): Date | null {
    if (!tenant.room) return null;
    const location = this.locations.find(loc =>
      loc.locataire === tenant._id && loc.room === tenant.room && !loc.endedAt
    );
    if (location?.startedAt) return new Date(location.startedAt);
    return tenant.createdAt ? new Date(tenant.createdAt) : null;
  }

  /** Vrai si la location du locataire est planifiée (date d'entrée future) */
  isTenantLocationFuture(tenant: LocataireModel): boolean {
    if (!tenant.room) return false;
    const location = this.locations.find(loc =>
      loc.locataire === tenant._id && loc.room === tenant.room && !loc.endedAt
    );
    return !!location && !location.isRunning && new Date(location.startedAt) > new Date();
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

    if (!this.dialog) {
      return;
    }

    // Récupérer les données de la propriété depuis le store
    const property = this.store.selectSnapshot(PropertyState.selectStateProperty(this.propertyId));

    if (!property) {
      this.toastr.error('Propriété non trouvée', 'Erreur');
      return;
    }

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

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.toastr.success('Locataire ajouté avec succès', 'Succès');
          // Les données seront automatiquement mises à jour via les observables
        }
      });
    } catch (error) {
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

    if (!this.dialog) {
      return;
    }

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

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.toastr.success('Locataire modifié avec succès', 'Succès');
          // Les données seront automatiquement mises à jour via les observables
        }
      });
    } catch (error) {
      this.toastr.error('Erreur lors de l\'ouverture du modal', 'Erreur');
    }
  }

  onAddPayment(tenant: LocataireModel, event: Event): void {
    event.stopPropagation();

    if (!this.dialog) {
      return;
    }

    // Charger les données nécessaires
    this.loadPaymentDataForTenant(tenant)
      .then(({ location, room }) => {

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

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.toastr.success('Paiement ajouté avec succès', 'Succès');
          }
        });
      })
      .catch(error => {
        this.toastr.error(error, 'Erreur');
      });
  }

  onAssignUnit(tenant: LocataireModel, event: Event): void {
    event.stopPropagation();

    if (!this.assignLocationModalService) {
      return;
    }

    // Ouvrir le modal d'assignation avec le locataire pré-sélectionné
    this.assignLocationModalService.openAssignLocationModal({
      propertyId: this.propertyId,
      locataireId: tenant._id,  // ← Correction: locataireId au lieu de tenantId
      assistant: true
    }).subscribe(result => {

      if (result && result.success) {
        // Les données seront automatiquement mises à jour par le state
        this.toastr.success('Locataire assigné avec succès', 'Succès');
      } else if (result && result.success === false) {
        // Erreur réelle d'assignation
        this.toastr.error('Erreur lors de l\'assignation du locataire', 'Erreur');
      } else {
        // Annulation par l'utilisateur (result === null)
        // Pas de message pour une annulation normale
      }
    });
  }

  // === MÉTHODES DE GESTION DU PANNEAU DE DÉTAILS ===

  onCloseTenantDetails(): void {
    this.selectedTenant = null;
  }

  onEditTenantFromPanel(tenant: LocataireModel): void {

    if (!this.dialog) {
      return;
    }

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

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.toastr.success('Locataire modifié avec succès', 'Succès');
        }
        this.selectedTenant = null;
      });
    } catch (error) {
      this.toastr.error('Erreur lors de l\'ouverture du modal', 'Erreur');
      this.selectedTenant = null;
    }
  }

  onAssignRoomFromPanel(tenant: LocataireModel): void {
    // Fermer le panneau et ouvrir le modal d'assignation
    this.selectedTenant = null;
    // TODO: Ouvrir modal d'assignation de chambre
  }

  onViewContractFromPanel(tenant: LocataireModel): void {
    if (!this.dialog) return;
    const room = this.units.find(r => r._id === tenant.room);
    if (!room) { this.toastr.error('Unité non trouvée pour ce locataire', 'Erreur'); return; }
    // Accepter location active OU future
    const location = this.locations.find(loc =>
      loc.locataire === tenant._id && loc.room === tenant.room && !loc.endedAt
    );
    if (!location) { this.toastr.error('Aucune location trouvée pour ce locataire', 'Erreur'); return; }

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

      dialogRef.afterClosed().subscribe(() => {
      });
    } catch (error) {
      this.toastr.error('Erreur lors de l\'ouverture du contrat', 'Erreur');
    }
  }

  onCancelContractFromPanel(tenant: LocataireModel): void {
    if (!this.dialog) return;
    // Accepter location active OU future
    const location = this.locations.find(loc =>
      loc.locataire === tenant._id && loc.room === tenant.room && !loc.endedAt
    );
    if (!location) { this.toastr.error('Aucune location trouvée pour ce locataire', 'Erreur'); return; }

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

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.toastr.success('Contrat résilié avec succès', 'Succès');
          this.selectedTenant = null;
          // Les données seront automatiquement mises à jour via les observables
        }
      });
    } catch (error) {
      this.toastr.error('Erreur lors de la résiliation du contrat', 'Erreur');
    }
  }

  /**
   * Charge les données de paiement nécessaires pour un locataire
   */
  private loadPaymentDataForTenant(tenant: LocataireModel): Promise<{location: LocationModel, room: RoomModel}> {
    return new Promise((resolve, reject) => {
      const room = this.units.find(r => r._id === tenant.room);
      if (!room) { reject('Unité non trouvée pour ce locataire'); return; }
      // Accepter location active OU future
      const location = this.locations.find(loc =>
        loc.locataire === tenant._id && loc.room === tenant.room && !loc.endedAt
      );
      if (!location) { reject('Aucune location trouvée pour ce locataire'); return; }
      resolve({ location, room });
    });
  }

  onAddPaymentFromPanel(tenant: LocataireModel): void {

    if (!this.dialog) {
      return;
    }

    // Charger les données nécessaires
    this.loadPaymentDataForTenant(tenant)
      .then(({ location, room }) => {

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

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.toastr.success('Paiement ajouté avec succès', 'Succès');
          }
          this.selectedTenant = null;
        });
      })
      .catch(error => {
        this.toastr.error(error, 'Erreur');
      });
  }

  /**
   * Ouvre le modal de modification d'un paiement
   */
  onEditPayment(payment: any): void {
    if (!payment?.transaction || !payment?.history) {
      this.toastr.error('Données de paiement manquantes', 'Erreur');
      return;
    }

    if (!this.dialog) return;

    // Résoudre room et tenant depuis history ou depuis le store
    const room = (typeof payment.history?.room === 'object' && payment.history?.room?._id)
      ? payment.history.room
      : this.units.find(r => r._id === (payment.history?.room || payment.transaction?.room)) || null;

    const tenant = (typeof payment.history?.locataire === 'object' && payment.history?.locataire?._id)
      ? payment.history.locataire
      : this.tenants.find(t => t._id === (payment.history?.locataire || payment.transaction?.locataire)) || null;

    const location = payment.history?.location
      || this.locations.find(loc =>
          loc.locataire === tenant?._id &&
          loc.room === room?._id &&
          !loc.endedAt
        ) || null;

    try {
      const dialogRef = this.dialog.open(ModernPaymentModalComponent, {
        width: '100%',
        maxWidth: '700px',
        disableClose: true,
        data: {
          mode: 'edit',
          room,
          tenant,
          location,
          transaction: payment.transaction
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) this.toastr.success('Paiement modifié avec succès', 'Succès');
      });
    } catch (error) {
      this.toastr.error('Erreur lors de l\'ouverture du modal', 'Erreur');
    }
  }

  /**
   * Ouvre le modal de suppression d'un paiement
   */
  onDeletePayment(payment: any): void {

    if (!payment?.transaction || !payment?.history) {
      this.toastr.error('Données de paiement manquantes', 'Erreur');
      return;
    }

    if (!this.dialog) {
      return;
    }

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

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.toastr.success('Paiement supprimé avec succès', 'Succès');
        }
      });
    } catch (error) {
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

    if (!this.dialog) {
      return;
    }

    // Vérifier que le locataire n'est pas assigné à une unité
    if (this.getTenantUnit(tenant)) {
      this.toastr.warning('Impossible de supprimer un locataire assigné à une unité. Résiliez d\'abord son contrat.', 'Attention');
      return;
    }

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
        // Les données sont automatiquement mises à jour par le state
        // Pas besoin de recharger manuellement
      }
    });
  }
}
