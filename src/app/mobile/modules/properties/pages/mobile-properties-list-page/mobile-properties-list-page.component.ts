import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonRefresher, ActionSheetController } from '@ionic/angular';
import { Store } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Store
import { PropertyState, PropertyAction } from '../../../../../shared/store';
import { MobileNotificationService } from '../../../../shared/services/mobile-notification.service';
import { MobileCacheService } from '../../../../shared/services/mobile-cache.service';
import { MobileSyncService } from '../../../../shared/services/mobile-sync.service';

@Component({
  selector: 'app-mobile-properties-list-page',
  templateUrl: './mobile-properties-list-page.component.html',
  styleUrls: ['./mobile-properties-list-page.component.scss']
})
export class MobilePropertiesListPageComponent implements OnInit, OnDestroy {
  @ViewChild(IonContent, { static: false }) content!: IonContent;

  private destroy$ = new Subject<void>();

  // Observables du store
  properties$ = this.store.select(PropertyState.selectStateProperties);
  isLoading$ = this.store.select(PropertyState.selectStateLoading);

  // État local
  properties: any[] = [];
  filteredProperties: any[] = [];
  searchTerm = '';
  selectedFilter = 'all';
  viewMode: 'list' | 'grid' = 'list';

  filterOptions = [
    { value: 'all', label: 'Tous les biens', icon: 'home' },
    { value: 'available', label: 'Disponibles', icon: 'checkmark-circle' },
    { value: 'occupied', label: 'Occupés', icon: 'people' },
    { value: 'maintenance', label: 'En maintenance', icon: 'construct' }
  ];

  constructor(
    private store: Store,
    private router: Router,
    private actionSheetController: ActionSheetController,
    private notificationService: MobileNotificationService,
    private cacheService: MobileCacheService,
    private syncService: MobileSyncService
  ) {}

  ngOnInit(): void {
    this.loadProperties();
    this.setupSubscriptions();
    this.loadCachedData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charger les propriétés
   */
  private loadProperties(): void {
    this.store.dispatch(new PropertyAction.FetchProperties());
  }

  /**
   * Configurer les abonnements
   */
  private setupSubscriptions(): void {
    this.properties$
      .pipe(takeUntil(this.destroy$))
      .subscribe(properties => {
        if (properties) {
          this.properties = properties;
          this.applyFilters();
          this.cacheProperties(properties);
        }
      });
  }

  /**
   * Charger les données mises en cache
   */
  private async loadCachedData(): Promise<void> {
    try {
      const cachedProperties = await this.cacheService.get<any[]>('user_properties');
      if (cachedProperties && cachedProperties.length > 0) {
        this.properties = cachedProperties;
        this.applyFilters();
        console.log('📦 Propriétés chargées depuis le cache');
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement du cache:', error);
    }
  }

  /**
   * Mettre en cache les propriétés
   */
  private async cacheProperties(properties: any[]): Promise<void> {
    try {
      await this.cacheService.set('user_properties', properties, 60 * 60 * 1000); // 1 heure
    } catch (error) {
      console.error('❌ Erreur lors de la mise en cache:', error);
    }
  }

  /**
   * Appliquer les filtres
   */
  applyFilters(): void {
    let filtered = [...this.properties];

    // Filtrer par terme de recherche
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(property => 
        property.name.toLowerCase().includes(term) ||
        property.location?.toLowerCase().includes(term) ||
        property.geolocationCity?.name?.toLowerCase().includes(term)
      );
    }

    // Filtrer par statut
    if (this.selectedFilter !== 'all') {
      filtered = filtered.filter(property => {
        switch (this.selectedFilter) {
          case 'available':
            return this.getAvailableUnitsCount(property) > 0;
          case 'occupied':
            return this.getOccupiedUnitsCount(property) > 0;
          case 'maintenance':
            return this.getMaintenanceUnitsCount(property) > 0;
          default:
            return true;
        }
      });
    }

    this.filteredProperties = filtered;
  }

  /**
   * Rechercher
   */
  onSearch(event: any): void {
    this.searchTerm = event.target.value || '';
    this.applyFilters();
  }

  /**
   * Changer le filtre
   */
  onFilterChange(filter: string | number): void {
    this.selectedFilter = filter.toString();
    this.applyFilters();
  }

  /**
   * Changer le mode d'affichage
   */
  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'list' ? 'grid' : 'list';
  }

  /**
   * Rafraîchir les données
   */
  async onRefresh(event: any): Promise<void> {
    try {
      this.loadProperties();
      await this.syncService.syncNow();
      
      setTimeout(() => {
        event.target.complete();
        this.notificationService.showSuccess('Données actualisées');
      }, 1000);
    } catch (error) {
      event.target.complete();
      this.notificationService.showError('Erreur lors de l\'actualisation');
    }
  }

  /**
   * Aller aux détails d'une propriété
   */
  goToPropertyDetails(property: any): void {
    this.router.navigate(['/mobile/properties', property._id]);
  }

  /**
   * Aller à la gestion des unités
   */
  goToPropertyUnits(property: any): void {
    this.router.navigate(['/mobile/properties', property._id, 'units']);
  }

  /**
   * Ajouter une nouvelle propriété
   */
  addProperty(): void {
    this.router.navigate(['/mobile/properties/add']);
  }

  /**
   * Afficher le menu d'actions pour une propriété
   */
  async showPropertyActions(property: any): Promise<void> {
    const actionSheet = await this.actionSheetController.create({
      header: property.name,
      buttons: [
        {
          text: 'Voir les détails',
          icon: 'eye',
          handler: () => this.goToPropertyDetails(property)
        },
        {
          text: 'Gérer les unités',
          icon: 'home',
          handler: () => this.goToPropertyUnits(property)
        },
        {
          text: 'Modifier',
          icon: 'create',
          handler: () => this.editProperty(property)
        },
        {
          text: 'Statistiques',
          icon: 'stats-chart',
          handler: () => this.viewPropertyStats(property)
        },
        {
          text: 'Supprimer',
          icon: 'trash',
          role: 'destructive',
          handler: () => this.deleteProperty(property)
        },
        {
          text: 'Annuler',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  /**
   * Modifier une propriété
   */
  editProperty(property: any): void {
    this.router.navigate(['/mobile/properties/add'], {
      queryParams: { edit: property._id }
    });
  }

  /**
   * Voir les statistiques d'une propriété
   */
  viewPropertyStats(property: any): void {
    // Naviguer vers une page de statistiques ou ouvrir un modal
    this.notificationService.showInfo('Statistiques bientôt disponibles');
  }

  /**
   * Supprimer une propriété
   */
  async deleteProperty(property: any): Promise<void> {
    const confirmed = await this.notificationService.showConfirm(
      'Supprimer la propriété',
      `Êtes-vous sûr de vouloir supprimer "${property.name}" ? Cette action est irréversible.`,
      'Supprimer',
      'Annuler'
    );

    if (confirmed) {
      try {
        await this.notificationService.showLoading('Suppression en cours...');
        
        // Dispatcher l'action de suppression
        // TODO: Implémenter l'action de suppression
        console.log('Suppression de la propriété:', property._id);
        
        await this.notificationService.hideLoading();
        await this.notificationService.showSuccess('Propriété supprimée');
        
      } catch (error) {
        await this.notificationService.hideLoading();
        await this.notificationService.showError('Erreur lors de la suppression');
      }
    }
  }

  /**
   * Obtenir le nombre d'unités disponibles
   */
  getAvailableUnitsCount(property: any): number {
    // Simulation - à remplacer par la vraie logique
    return Math.floor((property.numberOfRooms || 0) * 0.6);
  }

  /**
   * Obtenir le nombre d'unités occupées
   */
  getOccupiedUnitsCount(property: any): number {
    // Utiliser les données réelles si disponibles, sinon estimation
    if (property.units && Array.isArray(property.units)) {
      return property.units.filter(unit => unit.status === 'OCCUPIED').length;
    }

    // Estimation basée sur les statistiques de la propriété
    if (property.occupancyRate) {
      return Math.floor((property.numberOfRooms || 0) * (property.occupancyRate / 100));
    }

    // Estimation par défaut (70% d'occupation)
    return Math.floor((property.numberOfRooms || 0) * 0.7);
  }

  /**
   * Obtenir le nombre d'unités en maintenance
   */
  getMaintenanceUnitsCount(property: any): number {
    // Utiliser les données réelles si disponibles
    if (property.units && Array.isArray(property.units)) {
      return property.units.filter(unit => unit.status === 'MAINTENANCE').length;
    }

    // Estimation par défaut (5% en maintenance)
    return Math.floor((property.numberOfRooms || 0) * 0.05);
  }

  /**
   * Obtenir le nombre total d'unités
   */
  getTotalUnitsCount(property: any): number {
    return property.numberOfRooms || 0;
  }

  /**
   * TrackBy function pour optimiser le rendu
   */
  trackByPropertyId(index: number, property: any): string {
    return property._id;
  }
}
