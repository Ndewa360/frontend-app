import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { TableModel, TableHeaderItem, TableItem, TableRowSize } from 'carbon-components-angular';
import { Observable } from 'rxjs';
import { LocataireModel, LocataireState, RoomState, RoomModel, PropertyModel } from 'src/app/shared/store';
import { AssignLocationModalService } from 'src/app/main/assign-location/services/assign-location-modal.service';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { UpdateLocataireComponent } from 'src/app/main/locataires/components/update-locataire/update-locataire.component';
import { AddLocataireComponent } from 'src/app/main/locataires/components/add-locataire/add-locataire.component';

@Component({
  selector: 'app-locataire-property-list',
  templateUrl: './locataire-property-list.component.html',
  styleUrls: ['./locataire-property-list.component.scss']
})
export class LocatairePropertyListComponent implements OnInit, OnChanges {

  @Input() public propertyId = null;
  @Input() public property: PropertyModel = null;
  @Output() selectedLocataireEvent: EventEmitter<LocataireModel> = new EventEmitter();

  @Select(LocataireState.selectStateInitLoading) public loadingData$: Observable<string>;

  // Données
  hasNoData = true;
  tenants: LocataireModel[] = [];
  filteredTenants: LocataireModel[] = [];
  rooms: RoomModel[] = [];

  // Filtres et recherche
  searchTerm = '';
  statusFilter = '';
  sortBy = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Anciens modèles (pour compatibilité)
  public model: TableModel | null = null;
  public searchModel: any = null;
  public size: TableRowSize = 'md';
  public offset = {x: -9, y: 0};
  public batchText = '';



  constructor(
    private _store: Store,
    private _router: Router,
    private assignLocationModalService: AssignLocationModalService,
    private toastr: ToastrService,
    private dialog: MatDialog
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['propertyId']?.currentValue) {
      // Charger les locataires
      this._store.select(LocataireState.selectStateLocataireByPropertyId(changes['propertyId'].currentValue))
        .subscribe((data: LocataireModel[]) => {
          this.tenants = data || [];
          this.hasNoData = this.tenants.length === 0;
          this.model = this.generateLocataireDataModel(data); // Pour compatibilité
          this.applyFilters();
        });

      // Charger les chambres pour les informations d'unité
      this._store.select(RoomState.selectStateRoomByPropertyId(changes['propertyId'].currentValue))
        .subscribe((rooms: RoomModel[]) => {
          this.rooms = rooms || [];
        });
    }
  }

  ngOnInit(): void {
    // Initialisation si nécessaire
  }

  /**
   * Recharger les données après une assignation réussie
   */
  private reloadData(): void {
    if (this.propertyId) {
      // Recharger les locataires
      this._store.select(LocataireState.selectStateLocataireByPropertyId(this.propertyId))
        .subscribe((data: LocataireModel[]) => {
          this.tenants = data || [];
          this.generateLocataireDataModel(this.tenants);
        });

      // Recharger les chambres
      this._store.select(RoomState.selectStateRoomByPropertyId(this.propertyId))
        .subscribe((rooms: RoomModel[]) => {
          this.rooms = rooms || [];
        });
    }
  }

  generateLocataireDataModel(locataireList:LocataireModel[])
  { 
    this.hasNoData = locataireList.length == 0;
    let  model= new TableModel()
     model.header = [
      new TableHeaderItem({
        data: "Nom",
        className: "items-center font-bold"
      }),
      new TableHeaderItem({
        data: "Tél",
        className: "items-center"
      }),
      new TableHeaderItem({
        data: "Email",
        className: "items-center",
      }),
      new TableHeaderItem({
        data: "Bien occupé",
        className: "items-center",
      }),
      new TableHeaderItem({
        data: "Actions",
        className: "items-center",
      })
    ]
     model.data = locataireList.map((locataire)=> {
      return ([
        new TableItem({data: locataire.fullName}),
        new TableItem({data: locataire.phoneNumber}),
        new TableItem({data: locataire.email}),
        new TableItem({data: locataire.room}),
        new TableItem({data: locataire})
      ])
    });
    return model;
  }


  onSelectedLocataire(locataire: LocataireModel): void {
    this.selectedLocataireEvent.emit(locataire);
  }

  // === MÉTHODES DE FILTRAGE ET RECHERCHE ===

  applyFilters(): void {
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

    // Tri
    filtered.sort((a, b) => {
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
        case 'date':
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
        case 'rent':
          aValue = this.getTenantRent(a) || 0;
          bValue = this.getTenantRent(b) || 0;
          break;
        default:
          aValue = a.fullName || '';
          bValue = b.fullName || '';
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredTenants = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  // === MÉTHODES DE STATISTIQUES ===

  getTotalTenants(): number {
    return this.tenants.length;
  }

  getActiveTenants(): number {
    return this.tenants.filter(tenant => this.getTenantStatus(tenant) === 'active').length;
  }

  getTotalRevenue(): number {
    return this.tenants.reduce((total, tenant) => {
      const rent = this.getTenantRent(tenant);
      return total + (rent || 0);
    }, 0);
  }

  getOccupancyRate(): number {
    if (this.rooms.length === 0) return 0;
    const occupiedRooms = this.rooms.filter(room => !room.isFree).length;
    return Math.round((occupiedRooms / this.rooms.length) * 100);
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
    const room = this.rooms.find(r => r._id === tenant.room);
    return room ? (room.code || `Unité ${room._id?.substring(0, 8)}`) : null;
  }

  getTenantRent(tenant: LocataireModel): number | null {
    if (!tenant.room) return null;
    const room = this.rooms.find(r => r._id === tenant.room);
    return room ? room.price : null;
  }

  getTenantLeaseStart(tenant: LocataireModel): Date | null {
    return tenant.createdAt ? new Date(tenant.createdAt) : null;
  }

  getTenantLeaseProgress(tenant: LocataireModel): number | null {
    const startDate = this.getTenantLeaseStart(tenant);
    if (!startDate) return null;

    const now = new Date();
    const oneYear = 365 * 24 * 60 * 60 * 1000; // 1 an en millisecondes
    const elapsed = now.getTime() - startDate.getTime();
    const progress = Math.min((elapsed / oneYear) * 100, 100);

    return Math.round(progress);
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

  // === MÉTHODES D'ACTIONS ===

  onViewTenantDetails(tenant: LocataireModel, event: Event): void {
    event.stopPropagation();
    // Logique pour voir les détails du locataire
    console.log('Voir détails:', tenant);
  }

  onAddPayment(tenant: LocataireModel, event: Event): void {
    event.stopPropagation();
    // Logique pour ajouter un paiement
    console.log('Ajouter paiement:', tenant);
  }

  onAssignUnit(tenant: LocataireModel, event: Event): void {
    event.stopPropagation();

    // Ouvrir le modal d'assignation avec le locataire pré-sélectionné
    this.assignLocationModalService.openAssignLocationModal({
      propertyId: this.propertyId,
      locataireId: tenant._id,
      assistant: true,
      returnUrl: this._router.url
    }).subscribe(result => {
      if (result && result.success) {
        // Recharger les données après succès
        this.reloadData();
        this.toastr.success('Assignation réalisée avec succès', 'Succès');
      }
    });
  }

  /**
   * Ouvrir le modal de modification d'un locataire
   */
  onEditTenant(tenant: LocataireModel, event: Event): void {
    event.stopPropagation();

    const dialogRef = this.dialog.open(UpdateLocataireComponent, {
      width: '100%',
      maxWidth: '800px',
      disableClose: true,
      data: {
        locataire: tenant
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Recharger les données après modification
        this.reloadData();
        this.toastr.success('Locataire modifié avec succès', 'Succès');
      }
    });
  }

  /**
   * Ajouter un nouveau locataire
   */
  onAddTenant(): void {
    const dialogRef = this.dialog.open(AddLocataireComponent, {
      width: '100%',
      maxWidth: '800px',
      disableClose: true,
      data: {
        propertyId: this.propertyId
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Recharger les données après création
        this.reloadData();
        this.toastr.success('Locataire créé avec succès', 'Succès');
      }
    });
  }

}
