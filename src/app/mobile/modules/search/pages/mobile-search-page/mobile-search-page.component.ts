import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonInfiniteScroll, ModalController } from '@ionic/angular';
import { Store } from '@ngxs/store';
import { Observable, Subject, combineLatest } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormControl } from '@angular/forms';

// Store
import { SearchState, SearchAction } from '../../../../../shared/store';
import { MobileCacheService } from '../../../../shared/services/mobile-cache.service';
import { MobileNotificationService } from '../../../../shared/services/mobile-notification.service';
import { MobileSearchFiltersComponent } from '../../components/mobile-search-filters/mobile-search-filters.component';

@Component({
  selector: 'app-mobile-search-page',
  templateUrl: './mobile-search-page.component.html',
  styleUrls: ['./mobile-search-page.component.scss']
})
export class MobileSearchPageComponent implements OnInit, OnDestroy {
  @ViewChild(IonContent, { static: false }) content!: IonContent;
  @ViewChild(IonInfiniteScroll, { static: false }) infiniteScroll!: IonInfiniteScroll;

  private destroy$ = new Subject<void>();

  // Observables du store
  searchResults$ = this.store.select(SearchState.selectStateSearchs);
  isLoading$ = this.store.select(SearchState.selectStateLoading);
  
  // Contrôles de recherche
  searchControl = new FormControl('');
  currentCity = '';
  currentFilters: any = {};
  
  // État de la page
  viewMode: 'list' | 'grid' = 'list';
  showFilters = false;
  currentPage = 1;
  hasMoreResults = true;
  
  // Données locales
  searchResults: any[] = [];
  filteredResults: any[] = [];
  favoriteUnits: string[] = [];

  constructor(
    private store: Store,
    private router: Router,
    private modalController: ModalController,
    private cacheService: MobileCacheService,
    private notificationService: MobileNotificationService
  ) {}

  ngOnInit(): void {
    this.initializeSearch();
    this.setupSearchSubscriptions();
    this.loadCachedData();
    this.detectUserLocation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialiser la recherche
   */
  private initializeSearch(): void {
    // Configuration de la recherche avec debounce
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.performSearch(searchTerm || '');
      });
  }

  /**
   * Configurer les abonnements aux données du store
   */
  private setupSearchSubscriptions(): void {
    // Écouter les résultats de recherche
    this.searchResults$
      .pipe(takeUntil(this.destroy$))
      .subscribe(results => {
        if (results && Array.isArray(results)) {
          this.searchResults = results;
          this.applyFilters();
          this.cacheSearchResults(results);
        }
      });

    // Écouter l'état de chargement
    this.isLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        if (!loading && this.infiniteScroll) {
          this.infiniteScroll.complete();
        }
      });
  }

  /**
   * Charger les données mises en cache
   */
  private async loadCachedData(): Promise<void> {
    try {
      const cachedResults = await this.cacheService.get<any[]>('search_results');
      const cachedFavorites = await this.cacheService.get<string[]>('favorite_units');
      
      if (cachedResults && cachedResults.length > 0) {
        this.searchResults = cachedResults;
        this.applyFilters();
        console.log('📦 Résultats de recherche chargés depuis le cache');
      }
      
      if (cachedFavorites) {
        this.favoriteUnits = cachedFavorites;
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement du cache:', error);
    }
  }

  /**
   * Détecter la localisation de l'utilisateur
   */
  private async detectUserLocation(): Promise<void> {
    try {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            console.log('📍 Position détectée:', latitude, longitude);
            // Ici on pourrait faire une recherche par géolocalisation
            this.searchNearby(latitude, longitude);
          },
          (error) => {
            console.log('📍 Géolocalisation refusée, recherche par défaut');
            this.performDefaultSearch();
          }
        );
      } else {
        this.performDefaultSearch();
      }
    } catch (error) {
      console.error('❌ Erreur de géolocalisation:', error);
      this.performDefaultSearch();
    }
  }

  /**
   * Effectuer une recherche
   */
  performSearch(searchTerm: string): void {
    const searchParams = {
      query: searchTerm,
      city: this.currentCity,
      ...this.currentFilters,
      page: 1
    };

    this.store.dispatch(new SearchAction.FetchSearch(searchParams.city || '', searchParams.page || 1));
    this.currentPage = 1;
    this.hasMoreResults = true;
  }

  /**
   * Recherche par défaut (Bangangté)
   */
  private performDefaultSearch(): void {
    this.currentCity = 'Bangangté';
    this.store.dispatch(new SearchAction.FetchSearch('Bangangté', 1));
  }

  /**
   * Recherche à proximité
   */
  private searchNearby(latitude: number, longitude: number): void {
    // Pour l'instant, utilisons une recherche par ville par défaut
    // TODO: Implémenter la recherche par géolocalisation
    this.store.dispatch(new SearchAction.FetchSearch('Bangangté', 1));
  }

  /**
   * Appliquer les filtres locaux
   */
  private applyFilters(): void {
    let filtered = [...this.searchResults];

    // Appliquer les filtres ici si nécessaire
    // Par exemple, filtrer par prix, type, etc.

    this.filteredResults = filtered;
  }

  /**
   * Mettre en cache les résultats de recherche
   */
  private async cacheSearchResults(results: any[]): Promise<void> {
    try {
      await this.cacheService.set('search_results', results, 30 * 60 * 1000); // 30 minutes
    } catch (error) {
      console.error('❌ Erreur lors de la mise en cache:', error);
    }
  }

  /**
   * Ouvrir les filtres
   */
  async openFilters(): Promise<void> {
    const modal = await this.modalController.create({
      component: MobileSearchFiltersComponent,
      componentProps: {
        currentFilters: this.currentFilters
      },
      presentingElement: await this.modalController.getTop()
    });

    modal.onDidDismiss().then((result) => {
      if (result.data) {
        this.currentFilters = result.data;
        this.performSearch(this.searchControl.value || '');
      }
    });

    await modal.present();
  }

  /**
   * Changer le mode d'affichage
   */
  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'list' ? 'grid' : 'list';
  }

  /**
   * Aller à la vue carte
   */
  goToMapView(): void {
    this.router.navigate(['/mobile/search/map'], {
      queryParams: { 
        results: JSON.stringify(this.filteredResults.slice(0, 50)) // Limiter pour l'URL
      }
    });
  }

  /**
   * Voir les détails d'une unité
   */
  viewUnitDetails(unit: any): void {
    this.router.navigate(['/mobile/search/unit', unit._id]);
  }

  /**
   * Basculer le favori
   */
  async toggleFavorite(unit: any): Promise<void> {
    const index = this.favoriteUnits.indexOf(unit._id);
    
    if (index > -1) {
      this.favoriteUnits.splice(index, 1);
      await this.notificationService.showToast('Retiré des favoris', 'info');
    } else {
      this.favoriteUnits.push(unit._id);
      await this.notificationService.showToast('Ajouté aux favoris', 'success');
    }

    // Sauvegarder en cache
    await this.cacheService.set('favorite_units', this.favoriteUnits);
  }

  /**
   * Vérifier si une unité est en favori
   */
  isFavorite(unit: any): boolean {
    return this.favoriteUnits.includes(unit._id);
  }

  /**
   * Charger plus de résultats (pagination infinie)
   */
  async loadMoreResults(event: any): Promise<void> {
    if (!this.hasMoreResults) {
      event.target.complete();
      return;
    }

    this.currentPage++;
    
    const searchParams = {
      query: this.searchControl.value || '',
      city: this.currentCity,
      ...this.currentFilters,
      page: this.currentPage
    };

    // Ici on devrait dispatcher une action pour charger plus de résultats
    // et les ajouter aux résultats existants
    
    setTimeout(() => {
      event.target.complete();
      // Simuler la fin des résultats après quelques pages
      if (this.currentPage >= 5) {
        this.hasMoreResults = false;
        event.target.disabled = true;
      }
    }, 1000);
  }

  /**
   * Rafraîchir les résultats
   */
  async refreshResults(event: any): Promise<void> {
    this.currentPage = 1;
    this.hasMoreResults = true;

    this.performSearch(this.searchControl.value || '');

    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }

  /**
   * Obtenir le nombre total de résultats
   */
  getTotalResults(): number {
    return this.filteredResults.length;
  }

  /**
   * Vérifier s'il y a des résultats
   */
  hasResults(): boolean {
    return this.filteredResults.length > 0;
  }

  /**
   * Vérifier si une unité est favorite
   */
  isUnitFavorite(unit: any): boolean {
    return this.favoriteUnits.includes(unit._id);
  }

  /**
   * Gérer le clic sur une unité
   */
  onUnitClick(unit: any): void {
    // Naviguer vers les détails de l'unité
    this.router.navigate(['/mobile/search/unit', unit._id]);
  }

  /**
   * Gérer le toggle des favoris
   */
  onFavoriteToggle(unit: any): void {
    const index = this.favoriteUnits.indexOf(unit._id);
    if (index > -1) {
      this.favoriteUnits.splice(index, 1);
      this.notificationService.showSuccess('Retiré des favoris');
    } else {
      this.favoriteUnits.push(unit._id);
      this.notificationService.showSuccess('Ajouté aux favoris');
    }

    // Sauvegarder en cache
    this.cacheService.set('favorite_units', this.favoriteUnits);
  }

  /**
   * TrackBy function pour optimiser le rendu des listes
   */
  trackByUnitId(index: number, unit: any): string {
    return unit._id || index.toString();
  }
}
