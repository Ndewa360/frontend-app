import { Component, Input, OnInit, OnDestroy, OnChanges } from '@angular/core';
import { LocataireModel, RoomModel, LocationModel, LocationState, LocataireState, HistoryLocationPaymentState, PropertyState } from 'src/app/shared/store';
import { LocationPaymentAction } from 'src/app/shared/store/payment-location';
import { HistoryLocationPaymentAction } from 'src/app/shared/store/history-payment-location';
import { Store } from '@ngxs/store';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { AddPropertyLocataireComponent } from '../add-property-locataire/add-property-locataire.component';
import { ContractViewerModalComponent } from '../contract-viewer-modal/contract-viewer-modal.component';
import { RemoveLocataireRoomComponent } from '../remove-locataire-room/remove-locataire-room.component';
import { AddPaymentComponent } from 'src/app/main/location-payment/components/add-payment/add-payment.component';
import { UpdatePaymentComponent } from 'src/app/main/location-payment/components/update-payment/update-payment.component';
import { DeletePaymentComponent } from 'src/app/main/location-payment/components/delete-payment/delete-payment.component';
import { UpdateLocataireComponent } from 'src/app/main/locataires/components/update-locataire/update-locataire.component';

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

  // Données de location pour récupérer les vraies dates d'entrée
  locations: LocationModel[] = [];

  // Locataire sélectionné pour le panneau de détails
  selectedTenant: LocataireModel | null = null;

  constructor(
    private store: Store,
    private dialog: MatDialog,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.filteredTenants = [...this.tenants];
    this.loadLocations();
    this.filterTenants();

    // Charger les données de paiement pour cette propriété
    if (this.propertyId) {
      this.store.dispatch(new LocationPaymentAction.FetchLocationPaymentsByPropertyId(this.propertyId));
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
    const name = tenant.fullName || 'Locataire';
    return name.split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  getTenantAvatarColor(tenant: LocataireModel): string {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
    ];

    const hash = (tenant._id || tenant.fullName || '').split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);

    return colors[Math.abs(hash) % colors.length];
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

    console.log('📝 Ouverture du modal AddPropertyLocataireComponent...');

    try {
      const dialogRef = this.dialog.open(AddPropertyLocataireComponent, {
        width: '600px',
        maxWidth: '95vw',
        disableClose: true,
        data: {
          property: property
        }
      });

      console.log('✅ Modal AddPropertyLocataire ouvert, dialogRef:', dialogRef);

      dialogRef.afterClosed().subscribe(result => {
        console.log('🔄 Modal AddPropertyLocataire fermé avec résultat:', result);
        if (result) {
          console.log('✅ Locataire ajouté avec succès');
          this.toastr.success('Locataire ajouté avec succès', 'Succès');
          // Les données seront automatiquement mises à jour via les observables
        }
      });
    } catch (error) {
      console.error('❌ Erreur lors de l\'ouverture du modal AddPropertyLocataire:', error);
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

    console.log('📝 Ouverture du modal UpdateLocataireComponent...');

    try {
      const dialogRef = this.dialog.open(UpdateLocataireComponent, {
        width: '600px',
        maxWidth: '95vw',
        disableClose: true,
        data: {
          locataire: tenant
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
        console.log('📝 Ouverture du modal AddPaymentComponent...');

        const dialogRef = this.dialog.open(AddPaymentComponent, {
          width: '100%',
          maxWidth: '800px',
          disableClose: true,
          data: {
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
    console.log('Assigner unité:', tenant);
    // Logique pour assigner une unité
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

    console.log('📝 Ouverture du modal UpdateLocataireComponent...');

    try {
      const dialogRef = this.dialog.open(UpdateLocataireComponent, {
        width: '600px',
        maxWidth: '95vw',
        disableClose: true,
        data: {
          locataire: tenant
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

    console.log('🚫 Ouverture du modal RemoveLocataireRoomComponent...');

    try {
      const dialogRef = this.dialog.open(RemoveLocataireRoomComponent, {
        width: '500px',
        maxWidth: '95vw',
        disableClose: true,
        data: {
          location: location
        }
      });

      console.log('✅ Modal RemoveLocataireRoom ouvert, dialogRef:', dialogRef);

      dialogRef.afterClosed().subscribe(result => {
        console.log('🔄 Modal RemoveLocataireRoom fermé avec résultat:', result);
        if (result) {
          console.log('✅ Contrat résilié avec succès');
          this.toastr.success('Contrat résilié avec succès', 'Succès');
          this.selectedTenant = null;
          // Les données seront automatiquement mises à jour via les observables
        }
      });
    } catch (error) {
      console.error('❌ Erreur lors de l\'ouverture du modal RemoveLocataireRoom:', error);
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
        console.log('📝 Ouverture du modal AddPaymentComponent...');

        const dialogRef = this.dialog.open(AddPaymentComponent, {
          width: '100%',
          maxWidth: '800px',
          disableClose: true,
          data: {
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

    console.log('📝 Ouverture du modal UpdatePaymentComponent...');

    try {
      const dialogRef = this.dialog.open(UpdatePaymentComponent, {
        width: '100%',
        maxWidth: '800px',
        disableClose: true,
        data: {
          transaction: payment.transaction,
          history: payment.history
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

    console.log('🗑️ Ouverture du modal DeletePaymentComponent...');

    try {
      const dialogRef = this.dialog.open(DeletePaymentComponent, {
        width: '500px',
        maxWidth: '95vw',
        panelClass: 'delete-payment-modal-dialog',
        disableClose: true,
        data: {
          transaction: payment.transaction,
          history: payment.history
        }
      });

      console.log('✅ Modal DeletePayment ouvert, dialogRef:', dialogRef);

      dialogRef.afterClosed().subscribe(result => {
        console.log('🔄 Modal DeletePayment fermé avec résultat:', result);
        if (result) {
          console.log('✅ Paiement supprimé avec succès');
          this.toastr.success('Paiement supprimé avec succès', 'Succès');
        }
      });
    } catch (error) {
      console.error('❌ Erreur lors de l\'ouverture du modal DeletePayment:', error);
      this.toastr.error('Erreur lors de l\'ouverture du modal', 'Erreur');
    }
  }
}
