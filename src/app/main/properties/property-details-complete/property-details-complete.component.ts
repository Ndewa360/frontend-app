import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { MatDialog } from '@angular/material/dialog';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  PropertyModel,
  PropertyAction,
  PropertyState,
  RoomModel,
  RoomAction,
  RoomState,
  LocataireModel,
  LocataireState,
  LocationAction,
  LocationState,
  LocationModel,
  StatisticAction
} from 'src/app/shared/store';
import { PropertyDataService, HistoryItem } from '../services/property-data.service';
import { UnitAction } from '../components/property-units-list/property-units-list.component';
import { UpdatePropertyComponent, UpdatePropertyDialogData } from '../update-property/update-property.component';
import { GaleryComponent } from '../../room/components/galery/galery.component';
import { PropertyGalleryComponent } from '../components/property-gallery/property-gallery.component';
import { ModernUnitModalComponent } from '../components/modern-unit-modal/modern-unit-modal.component';
import { ModernTenantModalComponent } from '../components/modern-tenant-modal/modern-tenant-modal.component';
import { AssignLocationModalService } from '../../assign-location/services/assign-location-modal.service';
import { ModernContractTerminationModalComponent } from '../components/modern-contract-termination-modal/modern-contract-termination-modal.component';
import { LanguageUrlService } from 'src/app/shared/services/language-url.service';
import { PropertyAccessService } from 'src/app/shared/services/property-access.service';

interface Tab {
  id: string;
  label: string;
  icon: string;
  count?: number;
}

interface PropertyMetrics {
  totalUnits: number;
  occupiedUnits: number;
  availableUnits: number;
  occupancyRate: number;
  monthlyRevenue: number;
  averageRent: number;
  revenueGrowth: number;
}

@Component({
  selector: 'app-property-details-complete',
  templateUrl: './property-details-complete.component.html',
  styleUrls: ['./property-details-complete.component.scss']
})
export class PropertyDetailsCompleteComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  property$: Observable<PropertyModel | null>;
  units$: Observable<RoomModel[]>;
  tenants$: Observable<LocataireModel[]>;
  locations$: Observable<LocationModel[]>;
  history$: Observable<HistoryItem[]>;
  loadingStates$: Observable<{ property: boolean; units: boolean; tenants: boolean; }>;

  propertyId: string | null = null;
  activeTab: string = 'overview';
  currentUser: any = null;
  isAgent = false;
  currentProperty: PropertyModel | null = null;

  metrics: PropertyMetrics = {
    totalUnits: 0, occupiedUnits: 0, availableUnits: 0,
    occupancyRate: 0, monthlyRevenue: 0, averageRent: 0, revenueGrowth: 0
  };

  tabs: Tab[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store,
    private propertyDataService: PropertyDataService,
    private dialog: MatDialog,
    private assignLocationModalService: AssignLocationModalService,
    private languageUrlService: LanguageUrlService,
    public propertyAccessService: PropertyAccessService
  ) {
    this.property$ = new Observable();
    this.units$ = new Observable();
    this.tenants$ = new Observable();
    this.locations$ = new Observable();
    this.history$ = new Observable();
    this.loadingStates$ = new Observable();
  }

  ngOnInit(): void {
    this.currentUser = this.store.selectSnapshot((state: any) => state.userprofile?.userProfile);
    this.isAgent = this.currentUser?.userType === 'AGENT';
    this.propertyId = this.route.snapshot.paramMap.get('id');
    if (this.propertyId) this.initializeSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeSubscriptions(): void {
    if (!this.propertyId) return;

    this.property$ = this.propertyDataService.getProperty(this.propertyId);
    this.units$ = this.store.select(RoomState.selectStateRoomByPropertyId(this.propertyId));
    this.tenants$ = this.store.select(LocataireState.selectStateLocataireByPropertyId(this.propertyId));
    this.locations$ = this.store.select(LocationState.selectStateLocationByPropertyId(this.propertyId));
    this.history$ = this.propertyDataService.getPropertyHistory(this.propertyId);
    this.loadingStates$ = this.propertyDataService.getLoadingStates();

    const currentYear = new Date().getFullYear();
    this.store.dispatch(new StatisticAction.FetchStaticByPropertyIdAndYear(this.propertyId, currentYear.toString()));

    this.updateTabCounts();

    this.property$.pipe(takeUntil(this.destroy$)).subscribe(property => {
      this.currentProperty = property;
      this.updateTabsForUserRole();
    });
  }

  private updateTabCounts(): void {
    this.units$.pipe(takeUntil(this.destroy$)).subscribe(units => {
      const unitsTab = this.tabs.find(tab => tab.id === 'units');
      if (unitsTab) unitsTab.count = units.length;
      this.calculateMetrics(units);
    });

    this.tenants$.pipe(takeUntil(this.destroy$)).subscribe(tenants => {
      const tenantsTab = this.tabs.find(tab => tab.id === 'tenants');
      if (tenantsTab) tenantsTab.count = tenants.length;
    });

    this.history$.pipe(takeUntil(this.destroy$)).subscribe(history => {
      const historyTab = this.tabs.find(tab => tab.id === 'history');
      if (historyTab) historyTab.count = history.length;
    });
  }

  private calculateMetrics(units: RoomModel[]): void {
    const totalUnits = units.length;
    const occupiedUnits = units.filter(unit => !unit.isFree).length;
    const availableUnits = totalUnits - occupiedUnits;
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
    const monthlyRevenue = units.reduce((total, unit) => total + (!unit.isFree ? (unit.price || 0) : 0), 0);
    const averageRent = occupiedUnits > 0 ? monthlyRevenue / occupiedUnits : 0;

    this.metrics = { totalUnits, occupiedUnits, availableUnits, occupancyRate, monthlyRevenue, averageRent, revenueGrowth: 0 };
  }

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
  }

  private updateTabsForUserRole(): void {
    const baseTabs = [
      { id: 'overview', label: 'PROPERTY_DETAILS.TABS.OVERVIEW', icon: 'home' },
      { id: 'units',    label: 'PROPERTY_DETAILS.TABS.UNITS',    icon: 'balcony' }
    ];

    const isOwner   = this.propertyAccessService.isOwner(this.propertyId);
    const isManager = this.propertyAccessService.isManager(this.propertyId);

    if (isOwner) {
      this.tabs = [
        ...baseTabs,
        { id: 'tenants',  label: 'PROPERTY_DETAILS.TABS.TENANTS',  icon: 'user' },
        { id: 'history',  label: 'PROPERTY_DETAILS.TABS.HISTORY',  icon: 'time' },
        { id: 'finances', label: 'PROPERTY_DETAILS.TABS.FINANCES', icon: 'money' },
        { id: 'managers', label: 'PROPERTY_MANAGERS.TAB_LABEL',    icon: 'user-multiple' },
      ];
    } else if (isManager) {
      const tabs = [...baseTabs];
      if (this.propertyAccessService.canManageTenants(this.propertyId))
        tabs.push({ id: 'tenants', label: 'PROPERTY_DETAILS.TABS.TENANTS', icon: 'user' });
      if (this.propertyAccessService.canViewFinances(this.propertyId))
        tabs.push({ id: 'finances', label: 'PROPERTY_DETAILS.TABS.FINANCES', icon: 'money' });
      this.tabs = tabs;
    } else {
      this.tabs = [...baseTabs];
    }
  }

  canAccessTab(tabId: string): boolean {
    if (!this.propertyId) return true;
    if (this.propertyAccessService.isOwner(this.propertyId)) return true;
    switch (tabId) {
      case 'tenants':  return this.propertyAccessService.canManageTenants(this.propertyId);
      case 'finances': return this.propertyAccessService.canViewFinances(this.propertyId);
      case 'history':
      case 'managers': return this.propertyAccessService.isOwner(this.propertyId);
      default: return true;
    }
  }

  canPerformAction(action: string): boolean {
    if (!this.propertyId) return true;
    if (this.propertyAccessService.isOwner(this.propertyId)) return true;
    switch (action) {
      case 'assign_tenant':    return this.propertyAccessService.canManageTenants(this.propertyId);
      case 'terminate_lease':  return this.propertyAccessService.canManageContracts(this.propertyId);
      case 'add_tenant':       return this.propertyAccessService.canManageTenants(this.propertyId);
      case 'financial_report': return this.propertyAccessService.canViewFinances(this.propertyId);
      case 'add_unit':         return this.propertyAccessService.canManageUnits(this.propertyId);
      default: return true;
    }
  }

  onUnitAction(action: UnitAction): void {
    switch (action.type) {
      case 'view':            this.onViewUnit(action.room); break;
      case 'edit':            this.onEditUnit(action.room); break;
      case 'assign_tenant':   if (this.canPerformAction('assign_tenant'))  this.onAssignTenant(action.room); break;
      case 'terminate_lease': if (this.canPerformAction('terminate_lease')) this.onTerminateLease(action.room); break;
      case 'manage_media':    this.onManageMedia(action.room); break;
      case 'toggle_status':   this.onToggleStatus(action.room); break;
      case 'edit_galery':     this.onEditGaleryUnit(action.room); break;
    }
  }

  onAddUnit(): void {
    if (!this.propertyId) return;

    const dialogRef = this.dialog.open(ModernUnitModalComponent, {
      width: '100%',
      maxWidth: '900px',
      disableClose: true,
      data: { property: { _id: this.propertyId } }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => { if (result) this.reloadPropertyData(); });
  }

  // Correction : navigue vers la page de détails de la propriété (onglet units)
  // La route /:lang/app/rooms/:id n'existe pas dans le routing
  private onViewUnit(room: RoomModel): void {
    const currentLang = this.languageUrlService.getCurrentLanguage();
    this.router.navigate([`/${currentLang}/app/properties/details`, this.propertyId], { fragment: 'units' });
  }

  private onEditUnit(_room: RoomModel): void {
    // TODO: ouvrir le modal d'édition d'unité
  }

  private onAssignTenant(room: RoomModel): void {
    this.assignLocationModalService.openAssignLocationModal({
      propertyId: this.propertyId,
      roomId: room._id,
      assistant: true,
      returnUrl: this.router.url
    }).subscribe(result => {
      if (result?.success) this.reloadPropertyData();
    });
  }

  private onTerminateLease(room: RoomModel): void {
    const locations = this.store.selectSnapshot(LocationState.selectStateLocations);
    const location = locations?.find(loc => loc.room === room._id && loc.isRunning);
    if (!location) return;

    const rooms   = this.store.selectSnapshot(RoomState.selectStateRooms);
    const tenants = this.store.selectSnapshot(LocataireState.selectStateLocataires);
    const roomData = rooms?.find(r => r._id === location.room);
    const tenant   = tenants?.find(l => l._id === location.locataire);

    const dialogRef = this.dialog.open(ModernContractTerminationModalComponent, {
      width: '100%', maxWidth: '900px', disableClose: true,
      data: { location, tenant, room: roomData || room }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => { if (result) this.reloadPropertyData(); });
  }

  private onManageMedia(_room: RoomModel): void {
    // TODO: ouvrir le gestionnaire de médias
  }

  private onToggleStatus(_room: RoomModel): void {
    // TODO: implémenter le changement de statut
  }

  private onEditGaleryUnit(room: RoomModel): void {
    const dialogRef = this.dialog.open(GaleryComponent, {
      width: '900px', maxWidth: '95vw', height: '90vh', maxHeight: '90vh',
      panelClass: ['property-form-dialog', 'unit-gallery-modal'],
      disableClose: true, data: { room }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result?.mediaUpdated)
          this.store.dispatch(new RoomAction.FetchRoomsByPropertyID(this.propertyId));
      });
  }

  // Correction : utilise selectSnapshot au lieu d'une subscription ouverte
  onEditProperty(): void {
    const property = this.store.selectSnapshot(PropertyState.selectStateProperty(this.propertyId));
    if (!property) return;

    const dialogRef = this.dialog.open(UpdatePropertyComponent, {
      width: '900px', maxWidth: '95vw', height: '90vh', maxHeight: '90vh',
      panelClass: 'property-form-dialog', disableClose: true,
      data: { property } as UpdatePropertyDialogData
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => { if (result) this.refreshData(); });
  }

  onAddTenant(): void {
    if (!this.canPerformAction('add_tenant')) return;
    if (!this.propertyId) return;

    const property = this.store.selectSnapshot(PropertyState.selectStateProperty(this.propertyId));
    if (!property) return;

    const dialogRef = this.dialog.open(ModernTenantModalComponent, {
      width: '100%',
      maxWidth: '800px',
      disableClose: true,
      data: { mode: 'create', property }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => { if (result) this.reloadPropertyData(); });
  }

  goBack(): void {
    const currentLang = this.languageUrlService.getCurrentLanguage();
    this.router.navigate([`/${currentLang}/app/properties/home`]);
  }

  trackByTabId(index: number, tab: Tab): string { return tab.id; }

  getTabIcon(iconName: string): string {
    const iconMap: { [key: string]: string } = {
      'home': 'home', 'building': 'building', 'user': 'user',
      'time': 'time', 'money': 'currency-dollar'
    };
    return iconMap[iconName] || iconName;
  }

  formatPrice(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency', currency: 'XAF',
      minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(amount);
  }

  formatPercentage(value: number): string { return `${Math.round(value)}%`; }

  onQuickAction(actionType: string): void {
    switch (actionType) {
      case 'add_unit':
        this.onAddUnit();
        break;
      case 'add_tenant':
        if (this.canPerformAction('add_tenant')) this.onAddTenant();
        break;
      case 'financial_report':
        if (this.canPerformAction('financial_report')) this.generateFinancialReport();
        break;
      case 'schedule_maintenance':
        this.scheduleMaintenance();
        break;
      case 'edit_property':
        this.onEditProperty();
        break;

      // ── Actions depuis les blocs empty-state de l'overview ──────────────
      case 'go_add_unit':
        // Naviguer vers le tab unités ET ouvrir le modal de création
        this.setActiveTab('units');
        setTimeout(() => this.onAddUnit(), 150);
        break;

      case 'go_add_tenant':
        // Naviguer vers le tab locataires ET ouvrir le modal de création
        this.setActiveTab('tenants');
        setTimeout(() => this.onAddTenant(), 150);
        break;

      case 'go_assign_tenant':
        // Naviguer vers le tab unités pour que l'utilisateur assigne depuis les cartes
        this.setActiveTab('units');
        break;
    }
  }

  private generateFinancialReport(): void {
    // TODO: implémenter la génération de rapport
  }

  private scheduleMaintenance(): void {
    // TODO: implémenter la planification de maintenance
  }

  onError(_error: any): void {
    // Les erreurs sont gérées par l'intercepteur HTTP
  }

  refreshData(): void {
    if (this.propertyId) this.initializeSubscriptions();
  }

  reloadPropertyData(): void {
    if (!this.propertyId) return;
    const currentYear = new Date().getFullYear();
    this.store.dispatch(new PropertyAction.FetchPropertyForced(this.propertyId));
    this.store.dispatch(new RoomAction.FetchRoomsByPropertyID(this.propertyId));
    this.store.dispatch(new LocationAction.FetchLocationsByPropertyId(this.propertyId));
    this.store.dispatch(new StatisticAction.FetchStaticByPropertyIdAndYear(this.propertyId, currentYear.toString()));
  }

  exportData(_format: 'pdf' | 'excel' | 'csv'): void {
    // TODO: implémenter l'export de données
  }

  onOpenPropertyGallery(): void {
    const property = this.store.selectSnapshot(PropertyState.selectStateProperty(this.propertyId));
    if (!property) return;

    this.dialog.open(PropertyGalleryComponent, {
      width: '900px', maxWidth: '95vw', height: '90vh', maxHeight: '90vh',
      panelClass: ['property-form-dialog', 'property-gallery-modal'],
      disableClose: true, data: { property }
    });
  }

  // Correction : utilise selectSnapshot pour éviter le retour toujours 0
  getTotalMediaCount(): number {
    const property = this.store.selectSnapshot(PropertyState.selectStateProperty(this.propertyId));
    return property?.medias?.length ?? 0;
  }

  getTabLabel(tabId: string): string {
    if (tabId === 'managers') return 'PROPERTY_MANAGERS.TAB_LABEL';
    return `PROPERTY_DETAILS.TABS.${tabId.toUpperCase()}`;
  }
}
