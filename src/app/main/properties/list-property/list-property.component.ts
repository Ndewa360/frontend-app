import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { Observable, Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { PropertyModel, PropertyState, RoomState } from 'src/app/shared/store';
import { AddPropertyComponent } from '../add-property/add-property.component';
import { UpdatePropertyComponent } from '../update-property/update-property.component';
import { PropertyAlert } from '../components/property-overview-card/property-overview-card.component';
import { ModernTenantModalComponent } from '../components/modern-tenant-modal/modern-tenant-modal.component';
import { PropertyNavigationService } from '../services/property-navigation.service';
import { PropertiesTourService } from '../services/properties-tour.service';
import { PropertyManagerState, ManagedPropertyItem, PropertyManagerAction } from 'src/app/shared/store/property-manager';
import { PropertyAccessService } from 'src/app/shared/services/property-access.service';
import { LanguageUrlService } from 'src/app/shared/services/language-url.service';

/** Métriques pré-calculées par propriété pour éviter selectSnapshot dans le template */
interface PropertyCardMetrics {
  occupancyRate: number;
  occupiedRooms: number;
  freeRooms: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  overduePayments: number;
}

@Component({
  selector: 'app-list-property',
  templateUrl: './list-property.component.html',
  styleUrls: ['./list-property.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ListPropertyComponent implements OnInit, OnDestroy {

  @Select(PropertyState.selectStateProperties) properties$: Observable<PropertyModel[]>;
  @Select(PropertyState.selectStateInitLoading) initLoading$: Observable<string>;
  @Select(PropertyManagerState.selectManagedProperties) managedProperties$: Observable<ManagedPropertyItem[]>;

  loadingProperties$: Observable<Set<string>>;

  // Métriques globales pré-calculées (pour la barre de stats)
  totalProperties = 0;
  totalUnits = 0;
  globalOccupancyRate = 0;
  totalMonthlyRevenue = 0;

  // Métriques par propriété pré-calculées (pour les cartes)
  propertyMetrics: Map<string, PropertyCardMetrics> = new Map();

  private destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    private _store: Store,
    private router: Router,
    private propertyNavigationService: PropertyNavigationService,
    private translate: TranslateService,
    private propertiesTourService: PropertiesTourService,
    public propertyAccessService: PropertyAccessService,
    private languageUrlService: LanguageUrlService
  ) {}

  ngOnInit(): void {
    this.loadingProperties$ = this.propertyNavigationService.loading$;
    this._store.dispatch(new PropertyManagerAction.LoadMyAssignments());

    // Recalculer dès que properties OU rooms changent
    // Les champs enrichis (occupiedRooms, monthlyRevenue) viennent de l'API
    // Le fallback sur RoomState couvre la transition si l'API n'a pas encore répondu
    combineLatest([
      this._store.select(PropertyState.selectStateProperties),
      this._store.select(RoomState.selectStateRooms)
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([properties]) => {
      if (!properties?.length) return;
      this.totalProperties = properties.length;
      this.recalculateAllMetrics(properties);
    });

    this.initLoading$.pipe(takeUntil(this.destroy$)).subscribe(value => {
      if (value === 'LOADED') {
        setTimeout(() => this.propertiesTourService.startPropertiesMainTour(), 1000);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private recalculateAllMetrics(properties: PropertyModel[]): void {
    let totalRooms    = 0;
    let totalOccupied = 0;
    let totalMonthly  = 0;

    properties.forEach(property => {
      // Priorité 1 : champs enrichis par l'API (disponibles dès le chargement)
      // Priorité 2 : fallback sur RoomState si les champs enrichis ne sont pas encore là
      let occupied = property.occupiedRooms;
      let free     = property.freeRooms;
      let total    = property.roomLength ?? 0;
      let rate     = property.occupancyRate;
      let monthly  = property.monthlyRevenue ?? 0;

      if (occupied === undefined || occupied === null) {
        const rooms = this._store.selectSnapshot(RoomState.selectStateRoomByPropertyId(property._id)) || [];
        occupied = rooms.filter(r => !r.isFree).length;
        free     = rooms.filter(r =>  r.isFree).length;
        total    = rooms.length || property.roomLength || 0;
        rate     = total > 0 ? Math.round((occupied / total) * 100) : 0;
      }

      this.propertyMetrics.set(property._id, {
        occupancyRate:   rate   ?? 0,
        occupiedRooms:   occupied ?? 0,
        freeRooms:       free    ?? 0,
        monthlyRevenue:  monthly,
        revenueGrowth:   0,
        overduePayments: 0
      });

      totalRooms    += total;
      totalOccupied += (occupied ?? 0);
      totalMonthly  += monthly;
    });

    this.totalUnits          = properties.reduce((s, p) => s + (p.roomLength || 0), 0);
    this.globalOccupancyRate = totalRooms > 0 ? Math.round((totalOccupied / totalRooms) * 100) : 0;
    this.totalMonthlyRevenue = totalMonthly;
  }

  private calcMonthlyRevenue(_payments: any[]): number { return 0; }
  private calcRevenueGrowth(_payments: any[]): number { return 0; }
  private calcOverduePayments(_payments: any[]): number { return 0; }

  // ── Accesseurs pour le template (lecture depuis le Map pré-calculé) ──────

  getPropertyOccupancyRate(propertyId: string): number {
    return this.propertyMetrics.get(propertyId)?.occupancyRate ?? 0;
  }

  getMonthlyRevenue(propertyId: string): number {
    return this.propertyMetrics.get(propertyId)?.monthlyRevenue ?? 0;
  }

  getOccupiedRooms(propertyId: string): number {
    return this.propertyMetrics.get(propertyId)?.occupiedRooms ?? 0;
  }

  getFreeRooms(propertyId: string): number {
    return this.propertyMetrics.get(propertyId)?.freeRooms ?? 0;
  }

  getOverduePayments(propertyId: string): number {
    return this.propertyMetrics.get(propertyId)?.overduePayments ?? 0;
  }

  getRevenueGrowth(propertyId: string): number {
    return this.propertyMetrics.get(propertyId)?.revenueGrowth ?? 0;
  }

  // ── Métriques globales (déjà pré-calculées) ──────────────────────────────

  getTotalProperties(): number { return this.totalProperties; }
  getTotalUnits(): number { return this.totalUnits; }
  getOccupancyRate(): number { return this.globalOccupancyRate; }
  getTotalMonthlyRevenue(): number { return this.totalMonthlyRevenue; }

  // ── Alertes ──────────────────────────────────────────────────────────────

  getPropertyAlerts(propertyId: string): PropertyAlert[] {
    const lang = this.languageUrlService.getCurrentLanguage();
    const alerts: PropertyAlert[] = [];

    const overdueCount = this.getOverduePayments(propertyId);
    if (overdueCount > 0) {
      alerts.push({
        type: overdueCount > 2 ? 'critical' : 'warning',
        message: `${overdueCount} ${this.translate.instant('properties.card.paymentOverdue')}`,
        actionRoute: `/${lang}/app/properties/details/${propertyId}`
      });
    }

    const freeRooms = this.getFreeRooms(propertyId);
    if (freeRooms > 0) {
      alerts.push({
        type: 'info',
        message: `${freeRooms} ${this.translate.instant('properties.card.roomsFree')}`,
        actionRoute: `/${lang}/app/properties/details/${propertyId}`
      });
    }

    return alerts;
  }

  // ── Navigation ───────────────────────────────────────────────────────────

  onViewPropertyDetails(property: PropertyModel): void {
    this.propertyNavigationService.navigateToPropertyDetails(property._id);
  }

  onViewManagedPropertyDetails(propertyId: string): void {
    if (!propertyId) return;
    this.propertyNavigationService.navigateToPropertyDetails(propertyId);
  }

  onRecordPayment(property: PropertyModel): void {
    const lang = this.languageUrlService.getCurrentLanguage();
    this.router.navigate([`/${lang}/app/location-payment`, 'add'], {
      queryParams: { propertyId: property._id }
    });
  }

  onViewFinances(property: PropertyModel): void {
    const lang = this.languageUrlService.getCurrentLanguage();
    this.router.navigate([`/${lang}/app/properties/details`, property._id], { fragment: 'finances' });
  }

  onAlertClick(alert: PropertyAlert): void {
    if (alert.actionRoute) this.router.navigateByUrl(alert.actionRoute);
  }

  // ── Actions sur les propriétés ───────────────────────────────────────────

  updateProperty(property: PropertyModel, event: Event): void {
    event.stopPropagation();
    this.dialog.open(UpdatePropertyComponent, {
      viewContainerRef: null,
      disableClose: true,
      role: 'alertdialog',
      width: '500px',
      data: { property }
    });
  }

  onEditProperty(property: PropertyModel): void {
    this.updateProperty(property, new Event('click'));
  }

  onAddTenant(property: PropertyModel): void {
    this.dialog.open(ModernTenantModalComponent, {
      width: '100%',
      maxWidth: '800px',
      disableClose: true,
      data: { property, mode: 'add' }
    });
  }

  onAddProperty(): void {
    this.dialog.open(AddPropertyComponent, {
      viewContainerRef: null,
      disableClose: true,
      role: 'alertdialog',
      width: '500px',
      maxWidth: '90vw',
      maxHeight: '90vh'
    });
  }

  // ── Permissions ──────────────────────────────────────────────────────────

  getManagedPropertyPermissions(propertyId: string): string[] {
    return this.propertyAccessService.getPermissionsForProperty(propertyId);
  }

  canAccessManagedProperty(propertyId: string, action: string): boolean {
    switch (action) {
      case 'finances': return this.propertyAccessService.canViewFinances(propertyId);
      case 'tenants':  return this.propertyAccessService.canManageTenants(propertyId);
      case 'payments': return this.propertyAccessService.canManagePayments(propertyId);
      default: return true;
    }
  }

  isPropertyLoading(propertyId: string): boolean {
    return this.propertyNavigationService.isPropertyLoading(propertyId);
  }

  trackByPropertyId(index: number, property: PropertyModel): string {
    return property._id;
  }

  // ── Tour guidé ───────────────────────────────────────────────────────────

  startTour(): void {
    this.propertiesTourService.resetTour('properties_main');
    this.propertiesTourService.startPropertiesMainTour();
  }

  resetTour(): void {
    this.propertiesTourService.resetTour('properties_main');
    this.startTour();
  }

  // ── Méthodes non utilisées conservées pour compatibilité ─────────────────

  getNumberOfRoom(propertyID: string): Observable<number> {
    return this._store.select(RoomState.selectStateNumberOfRoomByPropertyId(propertyID));
  }

  onToggleFavorite(_property: PropertyModel): void { /* À implémenter */ }
  onQuickAction(_property: PropertyModel): void { /* À implémenter */ }
}
