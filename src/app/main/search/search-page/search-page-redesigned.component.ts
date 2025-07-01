import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { Observable, Subject, combineLatest } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Store imports
import { 
  CityModel, 
  CityState, 
  SearchAction, 
  SearchState, 
  SearchPropertyModel 
} from 'src/app/shared/store';

// Service imports
import { PlateformService } from 'src/app/shared/services/plateform/plateform.service';

// Interfaces locales
export interface SearchFiltersLocal {
  city?: string;
  district?: string;
  propertyType?: string;
  priceMin?: number;
  priceMax?: number;
  rooms?: number;
  minArea?: number;
  amenities?: string[];
  preferences?: string[];
  searchText?: string;
}

export interface PopularSearch {
  label: string;
  filters: SearchFiltersLocal;
}

export interface QuickFilter {
  key: string;
  label: string;
  icon: string;
  count?: number;
}

export interface ActiveFilter {
  key: string;
  label: string;
  value: any;
}

export interface SortOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-search-page-redesigned',
  templateUrl: './search-page-redesigned.component.html',
  styleUrls: ['./search-page-redesigned.component.scss']
})
export class SearchPageRedesignedComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Store selectors
  @Select(CityState.selectStateCities) cities$: Observable<CityModel[]>;
  @Select(SearchState.selectStateFilteredProperty) searchResults$: Observable<SearchPropertyModel[]>;
  @Select(SearchState.selectStateLoading) loadingRoom$: Observable<boolean>;

  // État du composant
  currentFilters: SearchFiltersLocal = {};
  activeFilters: ActiveFilter[] = [];
  currentView: 'grid' | 'list' = 'grid';
  currentSort: string = 'relevance';
  filtersExpanded: boolean = false;
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 12;
  totalPages: number = 1;
  currentPageResults: SearchPropertyModel[] = [];

  // Données pour l'interface
  availableCities: string[] = ['Douala', 'Yaoundé', 'Bafoussam', 'Bamenda'];
  averagePrice: number = 75000;
  
  // Configuration des filtres rapides
  quickFiltersList: QuickFilter[] = [
    { key: 'kitchen', label: 'Avec cuisine', icon: 'fas fa-utensils', count: 0 },
    { key: 'private_shower', label: 'Douche privée', icon: 'fas fa-shower', count: 0 },
    { key: 'parking', label: 'Parking', icon: 'fas fa-parking', count: 0 },
    { key: 'security', label: 'Sécurisé', icon: 'fas fa-shield-alt', count: 0 },
    { key: 'furnished', label: 'Meublé', icon: 'fas fa-couch', count: 0 },
    { key: 'wifi', label: 'WiFi', icon: 'fas fa-wifi', count: 0 }
  ];

  // Recherches populaires
  popularSearches: PopularSearch[] = [
    { 
      label: 'Studios Douala', 
      filters: { city: 'douala', propertyType: 'studio' } 
    },
    { 
      label: 'Chambres < 50k', 
      filters: { priceMax: 50000, propertyType: 'room' } 
    },
    { 
      label: 'Avec cuisine', 
      filters: { amenities: ['kitchen'] } 
    },
    { 
      label: 'Yaoundé centre', 
      filters: { city: 'yaounde', district: 'centre' } 
    }
  ];

  // Options de tri
  sortOptions: SortOption[] = [
    { label: 'Pertinence', value: 'relevance' },
    { label: 'Prix croissant', value: 'price_asc' },
    { label: 'Prix décroissant', value: 'price_desc' },
    { label: 'Plus récent', value: 'date_desc' },
    { label: 'Superficie', value: 'area_desc' }
  ];

  // Pagination
  paginationModel = {
    currentPage: 1,
    pageSize: 12,
    totalDataLength: 0
  };

  paginationTranslations = {
    PREVIOUS: 'Précédent',
    NEXT: 'Suivant',
    ITEMS_PER_PAGE: 'éléments par page',
    OPEN_LIST_OF_OPTIONS: 'Ouvrir la liste des options',
    CLOSE_LIST_OF_OPTIONS: 'Fermer la liste des options'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store,
    private plateformService: PlateformService
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
    this.setupRouteSubscription();
    this.setupSearchResultsSubscription();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== INITIALISATION =====
  private initializeComponent(): void {
    this.filtersExpanded = window.innerWidth >= 1024;
    this.loadQuickFiltersCount();
  }

  private setupRouteSubscription(): void {
    combineLatest([
      this.route.queryParams,
      this.cities$
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([queryParams, cities]) => {
      this.processRouteParams(queryParams, cities);
    });
  }

  private setupSearchResultsSubscription(): void {
    this.searchResults$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(results => {
      this.updatePagination(results || []);
      this.updateQuickFiltersCount(results || []);
    });
  }

  private processRouteParams(queryParams: any, cities: CityModel[]): void {
    const filters: SearchFiltersLocal = {};
    
    if (queryParams.city) filters.city = queryParams.city;
    if (queryParams.type) filters.propertyType = queryParams.type;
    if (queryParams.minPrice) filters.priceMin = Number(queryParams.minPrice);
    if (queryParams.maxPrice) filters.priceMax = Number(queryParams.maxPrice);
    if (queryParams.district) filters.district = queryParams.district;
    
    const amenities: string[] = [];
    if (queryParams.kitchen === 'true') amenities.push('kitchen');
    if (queryParams.privateShower === 'true') amenities.push('private_shower');
    if (queryParams.parking === 'true') amenities.push('parking');
    if (queryParams.security === 'true') amenities.push('security');
    
    if (amenities.length > 0) filters.amenities = amenities;

    this.currentFilters = filters;
    this.updateActiveFilters();
    this.performSearch();
  }

  // ===== RECHERCHE PRINCIPALE =====
  onMainSearchChange(value: string): void {
    // Recherche en temps réel avec debounce
  }

  onMainSearchSubmit(value: string): void {
    if (value.trim()) {
      this.currentFilters.searchText = value.trim();
      this.performSearch();
    }
  }

  applyPopularSearch(search: PopularSearch): void {
    this.currentFilters = { ...search.filters };
    this.updateActiveFilters();
    this.performSearch();
    this.updateUrlWithFilters();
  }

  // ===== FILTRES RAPIDES =====
  toggleQuickFilter(filterKey: string): void {
    if (!this.currentFilters.amenities) {
      this.currentFilters.amenities = [];
    }

    const index = this.currentFilters.amenities.indexOf(filterKey);
    if (index > -1) {
      this.currentFilters.amenities.splice(index, 1);
    } else {
      this.currentFilters.amenities.push(filterKey);
    }

    if (this.currentFilters.amenities.length === 0) {
      delete this.currentFilters.amenities;
    }

    this.updateActiveFilters();
    this.performSearch();
    this.updateUrlWithFilters();
  }

  isQuickFilterActive(filterKey: string): boolean {
    return this.currentFilters.amenities?.includes(filterKey) || false;
  }

  private loadQuickFiltersCount(): void {
    this.quickFiltersList.forEach(filter => {
      filter.count = Math.floor(Math.random() * 50) + 10;
    });
  }

  private updateQuickFiltersCount(results: SearchPropertyModel[]): void {
    this.quickFiltersList.forEach(filter => {
      filter.count = this.countResultsWithAmenity(results, filter.key);
    });
  }

  private countResultsWithAmenity(results: SearchPropertyModel[], amenity: string): number {
    return results.filter(room => {
      switch (amenity) {
        case 'kitchen': return room.specifity?.hasKitchen;
        case 'private_shower': return room.specifity?.isInternalShower;
        case 'parking': return room.property?.hasParking;
        case 'security': return (room.specifity as any)?.hasClosure || false;
        default: return false;
      }
    }).length;
  }

  // ===== GESTION DES FILTRES =====
  toggleFiltersPanel(): void {
    this.filtersExpanded = !this.filtersExpanded;
  }

  onFiltersChanged(filters: SearchFiltersLocal): void {
    this.currentFilters = { ...filters };
    this.updateActiveFilters();
  }

  onSearchRequested(filters: SearchFiltersLocal): void {
    this.currentFilters = { ...filters };
    this.updateActiveFilters();
    this.performSearch();
    this.updateUrlWithFilters();
  }

  onSaveSearch(filters: SearchFiltersLocal): void {
    const searchName = prompt('Nom de la recherche sauvegardée :');
    if (searchName) {
      const savedSearches = this.getSavedSearches();
      savedSearches.push({
        id: Date.now().toString(),
        name: searchName,
        filters: { ...filters },
        createdAt: new Date()
      });
      localStorage.setItem('savedSearches', JSON.stringify(savedSearches));
    }
  }

  onResetFilters(): void {
    this.currentFilters = {};
    this.activeFilters = [];
    this.performSearch();
    this.updateUrlWithFilters();
  }

  private updateActiveFilters(): void {
    this.activeFilters = [];

    if (this.currentFilters.city) {
      this.activeFilters.push({
        key: 'city',
        label: `Ville: ${this.getCityLabel(this.currentFilters.city)}`,
        value: this.currentFilters.city
      });
    }

    if (this.currentFilters.district) {
      this.activeFilters.push({
        key: 'district',
        label: `Quartier: ${this.currentFilters.district}`,
        value: this.currentFilters.district
      });
    }

    if (this.currentFilters.propertyType) {
      this.activeFilters.push({
        key: 'propertyType',
        label: `Type: ${this.getPropertyTypeLabel(this.currentFilters.propertyType)}`,
        value: this.currentFilters.propertyType
      });
    }

    if (this.currentFilters.priceMin) {
      this.activeFilters.push({
        key: 'priceMin',
        label: `Prix min: ${this.currentFilters.priceMin.toLocaleString()} FCFA`,
        value: this.currentFilters.priceMin
      });
    }

    if (this.currentFilters.priceMax) {
      this.activeFilters.push({
        key: 'priceMax',
        label: `Prix max: ${this.currentFilters.priceMax.toLocaleString()} FCFA`,
        value: this.currentFilters.priceMax
      });
    }

    if (this.currentFilters.amenities) {
      this.currentFilters.amenities.forEach(amenity => {
        this.activeFilters.push({
          key: `amenity_${amenity}`,
          label: this.getAmenityLabel(amenity),
          value: amenity
        });
      });
    }
  }

  removeActiveFilter(filter: ActiveFilter): void {
    if (filter.key === 'city') {
      delete this.currentFilters.city;
    } else if (filter.key === 'district') {
      delete this.currentFilters.district;
    } else if (filter.key === 'propertyType') {
      delete this.currentFilters.propertyType;
    } else if (filter.key === 'priceMin') {
      delete this.currentFilters.priceMin;
    } else if (filter.key === 'priceMax') {
      delete this.currentFilters.priceMax;
    } else if (filter.key.startsWith('amenity_')) {
      const amenity = filter.value;
      if (this.currentFilters.amenities) {
        this.currentFilters.amenities = this.currentFilters.amenities.filter(a => a !== amenity);
        if (this.currentFilters.amenities.length === 0) {
          delete this.currentFilters.amenities;
        }
      }
    }

    this.updateActiveFilters();
    this.performSearch();
    this.updateUrlWithFilters();
  }

  clearAllFilters(): void {
    this.onResetFilters();
  }

  get hasActiveFilters(): boolean {
    return this.activeFilters.length > 0;
  }

  // ===== TRI ET VUE =====
  onSortChange(sortValue: string): void {
    this.currentSort = sortValue;
    this.applySorting();
  }

  setView(view: 'grid' | 'list'): void {
    this.currentView = view;
  }

  private applySorting(): void {
    this.performSearch();
  }

  // ===== PAGINATION =====
  private updatePagination(results: SearchPropertyModel[]): void {
    this.paginationModel.totalDataLength = results.length;
    this.totalPages = Math.ceil(results.length / this.itemsPerPage);
    this.updateCurrentPageResults(results);
  }

  private updateCurrentPageResults(results: SearchPropertyModel[]): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.currentPageResults = results.slice(startIndex, endIndex);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.paginationModel.currentPage = page;
    
    this.searchResults$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(results => {
      this.updateCurrentPageResults(results || []);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ===== ACTIONS SUR LES LOGEMENTS =====
  navigateToRoom(room: SearchPropertyModel): void {
    this.router.navigate(['/app/search/room', room._id]);
  }

  toggleFavorite(room: SearchPropertyModel, event: Event): void {
    event.stopPropagation();
    console.log('Toggle favorite for room:', room._id);
  }

  isFavorite(room: SearchPropertyModel): boolean {
    return false;
  }

  openGallery(room: SearchPropertyModel, event: Event): void {
    event.stopPropagation();
    console.log('Open gallery for room:', room._id);
  }

  start360Tour(room: SearchPropertyModel, event: Event): void {
    event.stopPropagation();
    console.log('Start 360 tour for room:', room._id);
  }

  contactOwner(room: SearchPropertyModel, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/app/contact', room.property?._id]);
  }

  // ===== UTILITAIRES =====
  private performSearch(): void {
    const legacyFilters = this.convertToLegacyFormat(this.currentFilters);
    this.store.dispatch(new SearchAction.ApplyFilter(legacyFilters, true));
  }

  private convertToLegacyFormat(filters: SearchFiltersLocal): any {
    return {
      type: filters.propertyType || null,
      ville: filters.city || null,
      minPrice: filters.priceMin || 0,
      maxPrice: filters.priceMax || 1000000,
      specifity: {
        numberOfBathroom: 1,
        numberOfLivingRoom: 1,
        numberOfShower: 1,
        isInternalShower: filters.amenities?.includes('private_shower') || false,
        hasKitchen: filters.amenities?.includes('kitchen') || false,
        isInternalKitchen: false,
        hasClosure: filters.amenities?.includes('security') || false,
        hasParking: filters.amenities?.includes('parking') || false,
      }
    };
  }

  private updateUrlWithFilters(): void {
    const queryParams: any = {};

    if (this.currentFilters.city) queryParams.city = this.currentFilters.city;
    if (this.currentFilters.propertyType) queryParams.type = this.currentFilters.propertyType;
    if (this.currentFilters.priceMin) queryParams.minPrice = this.currentFilters.priceMin;
    if (this.currentFilters.priceMax) queryParams.maxPrice = this.currentFilters.priceMax;
    if (this.currentFilters.district) queryParams.district = this.currentFilters.district;

    if (this.currentFilters.amenities?.includes('kitchen')) queryParams.kitchen = 'true';
    if (this.currentFilters.amenities?.includes('private_shower')) queryParams.privateShower = 'true';
    if (this.currentFilters.amenities?.includes('parking')) queryParams.parking = 'true';
    if (this.currentFilters.amenities?.includes('security')) queryParams.security = 'true';

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      replaceUrl: true
    });
  }

  private getSavedSearches(): any[] {
    try {
      return JSON.parse(localStorage.getItem('savedSearches') || '[]');
    } catch {
      return [];
    }
  }

  // ===== HELPERS POUR L'AFFICHAGE =====
  getRoomMainImage(room: SearchPropertyModel): string {
    if (room.medias && room.medias.length > 0) {
      const firstMedia = room.medias[0];
      return (firstMedia as any)?.url || '/assets/images/default-room.jpg';
    }
    return '/assets/images/default-room.jpg';
  }

  getRoomTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'ROOM': 'Chambre',
      'STUDIO': 'Studio',
      'APARTMENT': 'Appartement',
      'HOUSE': 'Maison'
    };
    return labels[type] || type;
  }

  getRoomDisplayName(room: SearchPropertyModel): string {
    return `${this.getRoomTypeLabel(room.type)} ${room.code || ''}`.trim();
  }

  getRoomLocation(room: SearchPropertyModel): string {
    return room.property?.location || 'Localisation non spécifiée';
  }

  has360Media(room: SearchPropertyModel): boolean {
    if (room.medias && room.medias.length > 0) {
      return room.medias.some(media => (media as any)?.type === '360') || false;
    }
    return false;
  }

  getStarsArray(rating: number): number[] {
    if (!rating || rating <= 0) return [];
    return Array(Math.floor(rating)).fill(0);
  }

  // Méthodes helper sécurisées pour les propriétés optionnelles
  getRoomName(room: SearchPropertyModel): string {
    return (room as any)?.name || 'Logement';
  }

  getRoomArea(room: SearchPropertyModel): number | null {
    return (room as any)?.area || null;
  }

  getRoomRating(room: SearchPropertyModel): number {
    return (room as any)?.rating || 0;
  }

  getRoomReviewsCount(room: SearchPropertyModel): number {
    return (room as any)?.reviewsCount || 0;
  }

  hasRoomClosure(room: SearchPropertyModel): boolean {
    return (room.specifity as any)?.hasClosure || false;
  }

  private getCityLabel(cityValue: string): string {
    const labels: { [key: string]: string } = {
      'douala': 'Douala',
      'yaounde': 'Yaoundé',
      'bafoussam': 'Bafoussam',
      'bamenda': 'Bamenda'
    };
    return labels[cityValue] || cityValue;
  }

  private getPropertyTypeLabel(type: string): string {
    return this.getRoomTypeLabel(type);
  }

  private getAmenityLabel(amenity: string): string {
    const labels: { [key: string]: string } = {
      'kitchen': 'Cuisine',
      'private_shower': 'Douche privée',
      'parking': 'Parking',
      'security': 'Sécurisé',
      'furnished': 'Meublé',
      'wifi': 'WiFi'
    };
    return labels[amenity] || amenity;
  }

  trackByRoomId(index: number, room: SearchPropertyModel): string {
    return room._id;
  }

  resetAllFilters(): void {
    this.onResetFilters();
  }

  browseAllProperties(): void {
    this.router.navigate(['/app/properties']);
  }

  // ===== RESPONSIVE =====
  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    const width = event.target.innerWidth;
    if (width >= 1024 && !this.filtersExpanded) {
      this.filtersExpanded = true;
    } else if (width < 1024 && this.filtersExpanded) {
      this.filtersExpanded = false;
    }
  }
}