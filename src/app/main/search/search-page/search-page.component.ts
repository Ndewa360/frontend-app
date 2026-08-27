import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, ChangeDetectionStrategy, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Select, Store } from '@ngxs/store';
import { Observable, Subject, debounceTime, distinctUntilChanged, shareReplay } from 'rxjs';
import { takeUntil, map, filter, take, finalize } from 'rxjs/operators';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { ViewContainerRef } from '@angular/core';

// Services et modèles
import { SearchService, AdvancedSearchFilters } from 'src/app/shared/store/search/search.service';
import { CityModel, CityState, CityAction, SearchPropertyModel, SearchState, CountryAction, SearchAction } from 'src/app/shared/store';
import { MediaUtil } from 'src/app/shared/utils/media-utils';

import { GeolocationService, LocationInfo } from 'src/app/shared/services/geolocation/geolocation.service';
import { TranslationService } from 'src/app/shared/services/localization/translation.service';
import { CityResolverService } from 'src/app/shared/services/city-resolver.service';
import { SmartFiltersService } from 'src/app/shared/services/smart-filters.service';
import { UnitDetailDialogComponent } from '../components/unit-detail-dialog/unit-detail-dialog.component';

// Interfaces locales
export interface QuickFilter {
  key: string;
  label: string;
  icon: string;
  active: boolean;
  count?: number;
}

export interface PopularSearch {
  label: string;
  filters: AdvancedSearchFilters;
  count: number;
  searchCount: number;
  resultsCount: number;
  lastSearchDate: Date;
  cityId: string;
  cityName: string;
}

export interface SearchSuggestion {
  type: 'city' | 'property' | 'recent';
  label: string;
  value: any;
  icon: string;
}

@Component({
  selector: 'search-page',
  templateUrl: './search-page.component.html',
  styleUrls: ['./search-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchPageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  @ViewChild('searchInput', { static: true }) searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('filtersPanelTpl', { static: true }) filtersPanelTpl!: TemplateRef<any>;

  private filtersOverlayRef: OverlayRef | null = null;

  // Store selectors
  @Select(CityState.selectStateCities) cities$: Observable<CityModel[]>;
  @Select(SearchState.selectStateFilteredProperty) searchResults$: Observable<SearchPropertyModel[]>;
  @Select(SearchState.selectStateLoading) loading$: Observable<boolean>;
  @Select(SearchState.selectStatePagination) pagination$: Observable<any>;

  // cities$ partagé avec shareReplay(1) pour éviter les souscriptions multiples
  cities$$: Observable<CityModel[]>;

  // Form et état
  searchForm: FormGroup;
  searchControl = new FormControl('');
  
  // État de l'interface
  isSearchFocused = false;
  showFilters = false;
  showSuggestions = false;
  currentView: 'grid' | 'list' = 'grid';
  hasSearched = false; // Pour éviter l'affichage prématuré de "aucune donnée"

  // Cache des médias par index de carte pour éviter les recalculs à chaque cycle
  private mediasCache: Map<string, string[]> = new Map();

  // Gestion du slider d'images
  currentImageIndexes: { [cardIndex: number]: number } = {};
  
  // Variables pour le swipe tactile des cartes
  private cardTouchData: { [cardIndex: number]: { startX: number; startY: number; startTime: number; isDragging: boolean } } = {};
  private minSwipeDistance = 50;

  // Gestion du modal de détails d'unité
  selectedUnit: SearchPropertyModel | null = null;
  isUnitDetailVisible = false;

  // Protection contre les recherches en boucle
  private isPerformingSearch = false;

  // Protection contre les rechargements répétitifs
  private hasTriedReloading = false;
  
  // Données
  searchResults: SearchPropertyModel[] = [];
  suggestions: SearchSuggestion[] = [];
  popularSearches: PopularSearch[] = [];
  quickFilters: QuickFilter[] = [];
  currentFilters: AdvancedSearchFilters = {};

  // Pagination — réelle côté backend
  readonly ITEMS_PER_PAGE = 20;
  currentPage = 1;
  totalPages = 1;
  totalResults = 0;
  paginatedResults: SearchPropertyModel[] = [];
  allResults: SearchPropertyModel[] = [];

  // Gestion des favoris (stockage local)
  favoriteIds: Set<string> = new Set();

  // Géolocalisation
  userLocation: LocationInfo | null = null;
  isDetectingLocation = false;
  locationDetected = false;
  isFromUrl = false; // Indique si la localisation provient de l'URL

  // Loading states
  isLoading = false;
  isLoadingMore = false;

  // Utilitaires pour le template
  Object = Object;
  Math = Math;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private store: Store,
    private searchService: SearchService,
    private cdr: ChangeDetectorRef,
    private geolocationService: GeolocationService,
    private translationService: TranslationService,
    private dialog: MatDialog,
    private cityResolver: CityResolverService,
    private smartFiltersService: SmartFiltersService,
    private overlay: Overlay,
    private viewContainerRef: ViewContainerRef
  ) {
    this.initializeForm();
    this.initializeQuickFilters();
    // Partager cities$ avec shareReplay(1) pour éviter N souscriptions au store
    this.cities$$ = this.cities$.pipe(shareReplay(1));
  }

  ngOnInit(): void {
    this.initializeSmartFilters();
    this.setupFormAutoApply();       // UN seul abonnement valueChanges
    this.setupSearchSubscriptions();
    this.loadInitialData();
    this.loadFavorites();
    this.loadCities();

    // Lire les params URL UNE SEULE FOIS au démarrage (take(1))
    this.initFromUrlParams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // Fermer le panel filtre si ouvert
    this.closeFilters();
  }

  private initializeForm(): void {
    this.searchForm = this.fb.group({
      searchText: [''],
      city: [''],
      district: [''],
      roomType: [''],
      priceMin: [0],
      priceMax: [0],
      minArea: [0],
      hasKitchen: [false],
      isInternalKitchen: [false],
      hasPrivateShower: [false],
      numberOfBathroom: [''],
      numberOfLivingRoom: [''],
      numberOfShower: [''],
      hasParking: [false],
      hasClosure: [false],
      furnished: [false],
      sortBy: ['createdAt'],
      sortOrder: ['desc']
    });
  }

  /**
   * Configure l'application automatique des filtres — UN SEUL abonnement à valueChanges
   */
  private setupFormAutoApply(): void {
    this.searchForm.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
        takeUntil(this.destroy$)
      )
      .subscribe(formValues => {
        // Mettre à jour currentFilters ET smartFilters en une seule passe
        this.currentFilters = { ...this.currentFilters, ...formValues };

        Object.keys(formValues).forEach(key => {
          this.smartFiltersService.updateFilter(key, formValues[key]);
          if (formValues[key] !== null && formValues[key] !== undefined && formValues[key] !== '') {
            this.smartFiltersService.markFieldAsModified(key);
          }
        });

        this.hasSearched = true;
        this.currentPage = 1;
        this.performSearch();
        this.updateUrl();
      });
  }

  /**
   * Lit les paramètres URL UNE SEULE FOIS au démarrage (take(1)).
   * Pas d'abonnement persistant → pas de boucle URL → recherche.
   */
  private initFromUrlParams(): void {
    this.route.queryParams
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe(params => {
        const cityParam = params['city'] || params['ville'] || '';
        const hasParams = Object.keys(params).length > 0;

        if (cityParam) {
          this.cities$$.pipe(
            filter(cities => cities && cities.length > 0),
            take(1)
          ).subscribe(cities => {
            let finalCityId = cityParam;

            if (!this.cityResolver.isObjectId(cityParam)) {
              const found = cities.find(c =>
                c.fullName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') ===
                cityParam.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
              );
              if (found) finalCityId = found._id;
            }

            this.processCityFilters(finalCityId, params);
            this.checkForUnitInUrl();
          });
        } else if (hasParams) {
          this.processCityFilters('', params);
          this.checkForUnitInUrl();
        } else {
          this.detectUserLocation();
          this.checkForUnitInUrl();
        }
      });
  }

  /**
   * Traiter les filtres avec l'ID de ville
   */
  private processCityFilters(cityId: string, params: any): void {
    const urlFilters = {
      city: cityId,
      district: params['district'] || '',
      roomType: params['roomType'] || '',
      priceMin: params['priceMin'] ? parseInt(params['priceMin']) : 0,
      priceMax: params['priceMax'] ? parseInt(params['priceMax']) : 500000,
      minArea: params['minArea'] ? parseInt(params['minArea']) : 0,
      hasKitchen: params['hasKitchen'] === 'true',
      isInternalKitchen: params['isInternalKitchen'] === 'true',
      hasPrivateShower: params['hasPrivateShower'] === 'true',
      hasParking: params['hasParking'] === 'true',
      furnished: params['furnished'] === 'true',
      sortBy: params['sortBy'] || 'createdAt',
      sortOrder: params['sortOrder'] || 'desc'
    };

    // Charger les filtres dans le service intelligent
    this.smartFiltersService.loadFiltersFromUrl(urlFilters);

    // Mettre à jour les filtres actuels pour compatibilité
    this.currentFilters = { ...this.currentFilters, ...urlFilters };

    // Mettre à jour la pagination
    this.currentPage = params['page'] ? parseInt(params['page']) : 1;

    // Synchroniser l'affichage de géolocalisation avec la ville sélectionnée
    if (cityId) {
      this.syncLocationDisplayWithCity(cityId);
    }

    // Mettre à jour le formulaire SANS déclencher les événements pour éviter les boucles
    this.searchForm.patchValue(this.currentFilters, { emitEvent: false });

    // Effectuer la recherche
    this.performSearch();
    
    // S'assurer que le sélecteur affiche la bonne ville après chargement
    this.ensureCitySelectorSync();
  }

  /**
   * Initialiser les filtres intelligents — sans second abonnement à valueChanges
   */
  private initializeSmartFilters(): void {
    const defaultFilters = {
      city: '',
      district: '',
      roomType: '',
      priceMin: 0,
      priceMax: 0,
      minArea: 0,
      hasKitchen: false,
      isInternalKitchen: false,
      hasPrivateShower: false,
      hasParking: false,
      furnished: false,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };

    this.smartFiltersService.initializeFilters(defaultFilters);
  }

  private initializeQuickFilters(): void {
    this.quickFilters = [
      { key: 'hasKitchen',      label: 'SEARCH_MODULE.FILTERS.KITCHEN',       icon: 'restaurant',    active: false },
      { key: 'hasPrivateShower', label: 'SEARCH_MODULE.FILTERS.PRIVATE_SHOWER', icon: 'shower',        active: false },
      { key: 'hasParking',      label: 'SEARCH_MODULE.FILTERS.PARKING',        icon: 'local_parking', active: false },
      { key: 'furnished',       label: 'SEARCH_MODULE.FILTERS.FURNISHED',      icon: 'chair',         active: false }
    ];
  }

  private setupSearchSubscriptions(): void {
    // Recherche en temps réel
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(value => {
        if (value && value.length > 2) {
          this.loadSuggestions(value);
          this.showSuggestions = true;
        } else {
          this.showSuggestions = false;
        }
      });

    // L'abonnement au store searchResults$ est conservé pour compatibilité
    // mais performSearch() gère directement les résultats via HTTP
    this.searchResults$.pipe(takeUntil(this.destroy$)).subscribe();
  }

  private loadInitialData(): void {
    this.loadPopularSearches();
    this.cities$$.pipe(take(1)).subscribe(cities => this.updateCitySuggestions(cities));
  }

  /**
   * Charge la liste des villes depuis le backend
   */
  private loadCities(): void {
    this.store.dispatch(new CountryAction.FetchCountries());
    this.store.dispatch(new CityAction.LoadAllCities());

    this.cities$$
      .pipe(takeUntil(this.destroy$))
      .subscribe(cities => {
        if (!cities || cities.length === 0) {
          if (!this.hasTriedReloading) {
            this.hasTriedReloading = true;
            setTimeout(() => {
              this.store.dispatch(new CountryAction.FetchCountries());
              this.store.dispatch(new CityAction.LoadAllCities());
            }, 1000);
          }
        } else {
          this.hasTriedReloading = false;
        }
      });
  }

  private loadSuggestions(query: string): void {
    this.cities$$
      .pipe(
        take(1),
        map(cities => cities.filter(city =>
          city.fullName.toLowerCase().includes(query.toLowerCase())
        ))
      ).subscribe(filteredCities => {
        this.suggestions = filteredCities.map(city => ({
          type: 'city' as const,
          label: city.fullName,
          value: city,
          icon: 'location_on'
        }));
        this.cdr.markForCheck();
      });
  }

  private loadPopularSearches(): void {
    this.searchService.getPopularSearches(3).subscribe({
      next: (response) => {
        if (response.statusCode === 200 && response.data) {
          this.popularSearches = response.data.map((search: any) => ({
            label: this.buildSearchLabel(search),
            filters: this.buildSearchFilters(search),
            count: search.searchCount,
            searchCount: search.searchCount,
            resultsCount: search.resultsCount,
            lastSearchDate: search.lastSearchDate,
            cityId: search.cityId,
            cityName: search.cityName
          }));
        } else {
          this.loadDefaultPopularSearches();
        }
      },
      error: (error) => {
        this.loadDefaultPopularSearches();
      }
    });
  }

  /**
   * Construire le label d'une recherche populaire
   */
  private buildSearchLabel(search: any): string {
    let label = '';

    if (search.roomType) {
      // Normaliser en majuscules pour la comparaison (le backend stocke en minuscules)
      const roomTypeUpper = search.roomType.toUpperCase();
      const roomTypeLabel =
        roomTypeUpper === 'STUDIO' ? this.translationService.instant('SEARCH_MODULE.POPULAR_SEARCHES.STUDIOS') :
        roomTypeUpper === 'ROOM'   ? this.translationService.instant('SEARCH_MODULE.POPULAR_SEARCHES.ROOMS') :
                                     this.translationService.instant('SEARCH_MODULE.POPULAR_SEARCHES.PROPERTIES');
      label += roomTypeLabel;
    } else {
      label += this.translationService.instant('SEARCH_MODULE.POPULAR_SEARCHES.PROPERTIES');
    }

    if (search.cityName) {
      label += ` ${this.translationService.instant('SEARCH_MODULE.POPULAR_SEARCHES.IN')} ${search.cityName}`;
    }

    if (search.features && search.features.length > 0) {
      label += ` (${search.features.join(', ')})`;
    }

    return label;
  }

  /**
   * Obtenir le nombre d'unités disponibles pour une recherche populaire
   */
  getAvailableUnitsCount(search: PopularSearch): number {
    // S'assurer qu'on retourne le nombre d'unités disponibles, pas le nombre de recherches
    return search.resultsCount || 0;
  }

  /**
   * Obtenir le nombre de recherches pour une recherche populaire
   */
  getSearchCount(search: PopularSearch): number {
    return search.searchCount || 0;
  }

  private syncLocationDisplayWithCity(cityId: string): void {
    if (!cityId) { this.userLocation = null; this.updateCurrentCityName(''); return; }
    this.cities$$.pipe(filter(cities => cities && cities.length > 0), take(1)).subscribe(cities => {
      const selectedCity = cities.find(city => city._id === cityId);
      if (selectedCity) {
        this.userLocation = { city: selectedCity.fullName, country: 'Cameroun', region: '', latitude: 0, longitude: 0 };
        this.locationDetected = false;
        this.isFromUrl = true;
        this.updateCurrentCityName(cityId);
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Construire les filtres d'une recherche populaire
   */
  private buildSearchFilters(search: any): any {
    const filters: any = {};
    if (search.cityId) filters.city = search.cityId;
    if (search.roomType) filters.roomType = search.roomType;
    if (search.priceMin) filters.priceMin = search.priceMin;
    if (search.priceMax) filters.priceMax = search.priceMax;
    if (search.hasKitchen) filters.hasKitchen = search.hasKitchen;
    if (search.hasParking) filters.hasParking = search.hasParking;
    if (search.hasPrivateShower) filters.hasPrivateShower = search.hasPrivateShower;
    // Utiliser furnished (boolean) — le backend accepte les deux formats
    if (search.furnished) filters.furnished = true;
    return filters;
  }

  /**
   * Charge les recherches populaires par défaut en cas d'erreur
   */
  private loadDefaultPopularSearches(): void {
    // Données par défaut avec les principales villes du Cameroun
    this.popularSearches = [
      {
        label: `${this.translationService.instant('SEARCH_MODULE.POPULAR_SEARCHES.PROPERTIES')} ${this.translationService.instant('SEARCH_MODULE.POPULAR_SEARCHES.IN')} Douala`,
        filters: { city: 'douala' },
        count: 150,
        searchCount: 150,
        resultsCount: 45,
        lastSearchDate: new Date(),
        cityId: 'douala',
        cityName: 'Douala'
      },
      {
        label: `${this.translationService.instant('SEARCH_MODULE.POPULAR_SEARCHES.STUDIOS')} ${this.translationService.instant('SEARCH_MODULE.POPULAR_SEARCHES.IN')} Yaoundé`,
        filters: { city: 'yaounde', roomType: 'STUDIO' },
        count: 120,
        searchCount: 120,
        resultsCount: 32,
        lastSearchDate: new Date(),
        cityId: 'yaounde',
        cityName: 'Yaoundé'
      },
      {
        label: `${this.translationService.instant('SEARCH_MODULE.POPULAR_SEARCHES.ROOMS')} ${this.translationService.instant('SEARCH_MODULE.POPULAR_SEARCHES.IN')} Bangangté`,
        filters: { city: 'bangangte', roomType: 'ROOM' },
        count: 80,
        searchCount: 80,
        resultsCount: 28,
        lastSearchDate: new Date(),
        cityId: 'bangangte',
        cityName: 'Bangangté'
      }
    ];
  }

  private updateCitySuggestions(cities: CityModel[]): void {
    // Mettre à jour les suggestions avec les villes populaires
    const popularCities = cities.slice(0, 5);
    this.suggestions = [
      ...this.suggestions.filter(s => s.type !== 'city'),
      ...popularCities.map(city => ({
        type: 'city' as const,
        label: city.fullName,
        value: city,
        icon: 'location_on'
      }))
    ];
  }

  // === MÉTHODES PUBLIQUES ===

  onSearchFocus(): void {
    this.isSearchFocused = true;
    if (this.searchControl.value && this.searchControl.value.length > 2) {
      this.showSuggestions = true;
    }
  }

  onSearchBlur(): void {
    // Délai pour permettre le clic sur les suggestions
    setTimeout(() => {
      this.isSearchFocused = false;
      this.showSuggestions = false;
    }, 200);
  }

  onSuggestionClick(suggestion: SearchSuggestion): void {
    if (suggestion.type === 'city') {
      // Mettre à jour le formulaire avec l'ID de la ville
      this.searchForm.patchValue({ city: suggestion.value._id }, { emitEvent: false });
      this.searchControl.setValue(suggestion.label);
      
      // Mettre à jour les filtres actuels
      this.currentFilters.city = suggestion.value._id;
      
      // Synchroniser l'affichage de géolocalisation
      this.syncLocationDisplayWithCity(suggestion.value._id);
      
      // Forcer la détection de changement
      this.cdr.detectChanges();
    }
    this.showSuggestions = false;
    this.performSearch();
  }

  onPopularSearchClick(popularSearch: PopularSearch): void {
    // Appliquer les filtres directement sans passer par l'URL
    // (initFromUrlParams utilise take(1) donc ne se re-déclenche pas)
    const cityId = popularSearch.cityId;
    const filters = popularSearch.filters;

    // Mettre à jour currentFilters
    this.currentFilters = {
      city: cityId || '',
      roomType: filters.roomType || '',
      priceMin: filters.priceMin || 0,
      priceMax: filters.priceMax || 500000,
      hasKitchen: filters.hasKitchen || false,
      hasParking: filters.hasParking || false,
      hasPrivateShower: filters.hasPrivateShower || false,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };

    // Mettre à jour le formulaire sans déclencher valueChanges
    this.searchForm.patchValue(this.currentFilters, { emitEvent: false });

    // Mettre à jour les filtres intelligents
    Object.keys(this.currentFilters).forEach(key => {
      this.smartFiltersService.updateFilter(key, this.currentFilters[key]);
      if (this.currentFilters[key]) {
        this.smartFiltersService.markFieldAsModified(key);
      }
    });

    // Synchroniser l'affichage de la ville
    if (cityId) {
      this.syncLocationDisplayWithCity(cityId);
    }

    this.currentPage = 1;
    this.hasSearched = true;
    this.performSearch();
    this.updateUrl();
  }

  toggleFilters(): void {
    this.showFilters ? this.closeFilters() : this.openFilters();
  }

  openFilters(): void {
    if (this.filtersOverlayRef) return;
    this.showFilters = true;

    // Créer l'overlay CDK directement dans le body — indépendant de tout conteneur scrollable
    this.filtersOverlayRef = this.overlay.create({
      hasBackdrop: false,       // On gère notre propre overlay visuel dans le template
      scrollStrategy: this.overlay.scrollStrategies.block(), // Bloque le scroll de la page
      positionStrategy: this.overlay.position().global(),    // Positionné par rapport au viewport
      width: '100vw',
      height: '100vh',
    });

    const portal = new TemplatePortal(this.filtersPanelTpl, this.viewContainerRef);
    this.filtersOverlayRef.attach(portal);
    this.cdr.markForCheck();
  }

  closeFilters(): void {
    this.showFilters = false;
    if (this.filtersOverlayRef) {
      this.filtersOverlayRef.detach();
      this.filtersOverlayRef.dispose();
      this.filtersOverlayRef = null;
    }
    this.cdr.markForCheck();
  }

  toggleView(): void {
    this.currentView = this.currentView === 'grid' ? 'list' : 'grid';
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.searchForm.reset();
    this.quickFilters.forEach(f => f.active = false);
    this.currentFilters = {};
    this.allResults = [];
    this.searchResults = [];
    this.paginatedResults = [];
    this.currentPage = 1;
    this.totalPages = 1;
    this.totalResults = 0;
    this.hasSearched = false;
    this.mediasCache.clear();
  }

  private performSearch(): void {
    if (this.isPerformingSearch) return;

    const activeFilters = this.smartFiltersService.getActiveFilters();
    const filtersToUse = Object.keys(activeFilters).length > 0 ? activeFilters : this.currentFilters;

    if (Object.keys(filtersToUse).length === 0 && !this.searchControl.value) return;

    this.isPerformingSearch = true;
    this.isLoading = true;
    this.hasSearched = true;
    // Invalider le cache des médias lors d'une nouvelle recherche
    this.mediasCache.clear();
    this.cdr.markForCheck();

    const filters: AdvancedSearchFilters = {
      ...filtersToUse,
      page: this.currentPage,
      limit: this.ITEMS_PER_PAGE
    };

    this.searchService.advancedSearch(filters)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.isPerformingSearch = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response) => {
          if (response.statusCode === 200) {
            const payload = response.data as any;
            this.allResults = Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload) ? payload : []);
            this.paginatedResults = this.allResults;
            this.searchResults = this.allResults;
            const pagination = payload?.pagination;
            if (pagination) {
              this.totalResults = pagination.total ?? this.allResults.length;
              this.totalPages = pagination.totalPages ?? 1;
              this.currentPage = pagination.page ?? this.currentPage;
            } else {
              this.totalResults = this.allResults.length;
              this.totalPages = 1;
            }
            this.currentImageIndexes = {};
          }
        },
        error: () => {}
      });
  }

  /**
   * Obtient les initiales du propriétaire pour l'avatar
   */
  getOwnerInitials(owner: any): string {
    if (!owner || !owner.fullName) {
      return 'P';
    }

    const names = owner.fullName.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  }

  /**
   * Contacte le propriétaire via différents moyens
   */
  contactOwner(owner: any, method: 'phone' | 'email' | 'whatsapp'): void {
    if (!owner) return;

    switch (method) {
      case 'phone':
        if (owner.phoneNumber) {
          window.open(`tel:${owner.phoneNumber}`, '_self');
        }
        break;

      case 'email':
        if (owner.email) {
          const subject = this.translationService.instant('SEARCH_MODULE.UNIT_DETAIL.EMAIL_SUBJECT');
          window.open(`mailto:${owner.email}?subject=${encodeURIComponent(subject)}`, '_self');
        }
        break;

      case 'whatsapp':
        if (owner.phoneNumber) {
          const message = encodeURIComponent(this.translationService.instant('SEARCH_MODULE.UNIT_DETAIL.WHATSAPP_MESSAGE'));
          window.open(`https://wa.me/${owner.phoneNumber.replace(/\D/g, '')}?text=${message}`, '_blank');
        }
        break;
    }
  }

  /**
   * Vérifie si un logement est en favori
   */
  isFavorite(result: SearchPropertyModel): boolean {
    return this.favoriteIds.has(result._id);
  }

  /**
   * Bascule le statut favori d'un logement
   */
  toggleFavorite(result: SearchPropertyModel): void {
    if (this.favoriteIds.has(result._id)) {
      this.favoriteIds.delete(result._id);
    } else {
      this.favoriteIds.add(result._id);
    }

    // Sauvegarder dans le localStorage
    localStorage.setItem('ndiye_favorites', JSON.stringify(Array.from(this.favoriteIds)));

    // Ici vous pouvez ajouter l'appel API pour sauvegarder le favori
  }

  /**
   * Charge les favoris depuis le localStorage
   */
  private loadFavorites(): void {
    try {
      const saved = localStorage.getItem('ndiye_favorites');
      if (saved) {
        const favoriteArray = JSON.parse(saved);
        this.favoriteIds = new Set(favoriteArray);
      }
    } catch (error) {
      this.favoriteIds = new Set();
    }
  }

  /**
   * Détecte la localisation de l'utilisateur
   */
  private detectUserLocation(): void {
    this.isDetectingLocation = true;

    this.geolocationService.getUserLocation()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (location) => {
          this.userLocation = location;
          this.locationDetected = true;
          this.isDetectingLocation = false;

          // Lancer la recherche automatique pour la ville détectée
          this.searchByUserLocation();
        },
        error: (error) => {
          this.isDetectingLocation = false;

          // Fallback vers Bangangté
          this.userLocation = this.geolocationService.getDefaultLocation();
          this.locationDetected = false;

          // Lancer la recherche pour Bangangté
          this.searchByUserLocation();
        }
      });
  }

  /**
   * Lance une recherche basée sur la localisation de l'utilisateur
   */
  private searchByUserLocation(): void {
    if (!this.userLocation) return;

    // Utiliser le service de résolution pour convertir le nom en ID
    this.cityResolver.getCityIdByName(this.userLocation.city).subscribe(cityId => {
      const finalCityId = cityId || this.userLocation!.city;

      this.currentFilters = {
        city: finalCityId,
        page: 1,
        limit: this.ITEMS_PER_PAGE
      };

      // Mettre à jour le formulaire SANS déclencher les événements
      this.searchForm.patchValue({ city: finalCityId }, { emitEvent: false });

      // Mettre à jour les filtres intelligents
      this.smartFiltersService.updateFilter('city', finalCityId);
      this.smartFiltersService.markFieldAsModified('city');

      this.currentPage = 1;
      this.performSearch();

      // Mettre à jour l'URL seulement si la localisation a été détectée automatiquement
      if (this.locationDetected && !this.isFromUrl) {
        this.updateUrl();
      }
      
      // S'assurer que le sélecteur affiche la bonne ville
      this.ensureCitySelectorSync();
    });
  }

  /**
   * Relance la détection de localisation
   */
  retryLocationDetection(): void {
    this.detectUserLocation();
  }

  /**
   * Utilise Bangangté comme ville par défaut
   */
  useDefaultLocation(): void {
    this.userLocation = this.geolocationService.getDefaultLocation();
    this.locationDetected = false;
    this.searchByUserLocation();
  }

  applyFilters(): void {
    this.closeFilters();
  }

  /**
   * Réinitialise tous les filtres
   */
  resetFilters(): void {
    this.smartFiltersService.resetFilters();
    const defaultValues = this.smartFiltersService.getAllFilters();
    this.searchForm.patchValue(defaultValues, { emitEvent: false });
    this.quickFilters.forEach(f => f.active = false);
    this.currentFilters = {};
    this.currentPage = 1;
    this.allResults = [];
    this.searchResults = [];
    this.paginatedResults = [];
    this.totalResults = 0;
    this.totalPages = 1;
    this.hasSearched = false;
    this.userLocation = null;
    this.mediasCache.clear();
    this.cdr.markForCheck();
    this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
  }

  /**
   * Bascule un filtre rapide
   */
  toggleQuickFilter(filter: any): void {
    filter.active = !filter.active;

    // Mettre à jour le filtre intelligent
    this.smartFiltersService.updateFilter(filter.key, filter.active);

    // Marquer le champ comme modifié
    this.smartFiltersService.markFieldAsModified(filter.key);

    // Mettre à jour le formulaire
    this.searchForm.patchValue({ [filter.key]: filter.active }, { emitEvent: false });

    // Appliquer le filtre selon son type (pour compatibilité)
    switch (filter.key) {
      case 'hasKitchen':
        this.currentFilters.hasKitchen = filter.active;
        break;
      case 'hasParking':
        this.currentFilters.hasParking = filter.active;
        break;
      case 'hasPrivateShower':
        this.currentFilters.hasPrivateShower = filter.active;
        break;
      case 'furnished':
        // Envoyer furnished (boolean) — le backend accepte les deux formats
        this.currentFilters.furnished = filter.active;
        break;
      default:
        break;
    }

    this.performSearch();
    this.updateUrl();
  }

  /**
   * Vérifie si la ville provient de l'URL
   */
  hasUrlCity(): boolean {
    const params = this.route.snapshot.queryParams;
    return params['city'] !== undefined || params['ville'] !== undefined;
  }

  // Cache du nom de ville courant pour éviter le subscribe synchrone dans le template
  currentCityName = '';

  private updateCurrentCityName(cityId: string): void {
    if (!cityId) { this.currentCityName = this.translationService.instant('SEARCH_MODULE.FILTERS.ALL_CITIES'); return; }
    this.cities$$.pipe(take(1)).subscribe(cities => {
      const city = cities?.find(c => c._id === cityId);
      this.currentCityName = city ? city.fullName : this.translationService.instant('SEARCH_MODULE.FILTERS.SELECTED_CITY');
      this.cdr.markForCheck();
    });
  }

  getCurrentCityName(): string {
    return this.currentCityName || this.translationService.instant('SEARCH_MODULE.FILTERS.ALL_CITIES');
  }

  /**
   * S'assure que le sélecteur de ville affiche la bonne valeur
   */
  private ensureCitySelectorSync(): void {
    const cityToSync = this.currentFilters.city || this.route.snapshot.queryParams['city'] || this.route.snapshot.queryParams['ville'];
    if (cityToSync) {
      this.cities$$.pipe(
        filter(cities => cities && cities.length > 0),
        take(1)
      ).subscribe(cities => {
        let finalCityId = cityToSync;
        if (!this.cityResolver.isObjectId(cityToSync)) {
          const city = cities.find(c => c.fullName.toLowerCase() === cityToSync.toLowerCase());
          if (city) finalCityId = city._id;
        }
        this.currentFilters.city = finalCityId;
        this.searchForm.patchValue({ city: finalCityId }, { emitEvent: false });
        this.cdr.detectChanges();
      });
    }
  }

  /**
   * Compte le nombre de filtres actifs
   */
  getActiveFiltersCount(): number {
    let count = 0;
    const formValues = this.searchForm.value;

    // Filtres de localisation
    if (formValues.district) count++;

    // Filtres de type
    if (formValues.roomType) count++;

    // Filtres de prix
    if (formValues.priceMin && formValues.priceMin > 0) count++;
    if (formValues.priceMax && formValues.priceMax > 0) count++;

    // Filtres de superficie
    if (formValues.minArea && formValues.minArea > 0) count++;

    // Spécificités de la chambre (RoomSpecificity)
    if (formValues.hasKitchen) count++;
    if (formValues.isInternalKitchen) count++;
    if (formValues.hasPrivateShower) count++;
    if (formValues.numberOfBathroom) count++;
    if (formValues.numberOfShower) count++;
    if (formValues.numberOfLivingRoom) count++;

    // Équipements de la propriété
    if (formValues.hasParking) count++;
    if (formValues.hasClosure) count++;

    // Tri personnalisé
    if (formValues.sortBy && formValues.sortBy !== 'createdAt') count++;

    return count;
  }

  /**
   * Détermine si l'état vide doit être affiché
   */
  shouldShowEmptyState(): boolean {
    const hasResults = this.allResults && this.allResults.length > 0;
    const isCurrentlyLoading = this.isLoading || this.isLoadingMore || this.isPerformingSearch;

    // Critères de recherche plus larges
    const hasSearchCriteria = !!(
      this.currentFilters?.city ||
      this.searchControl?.value ||
      Object.keys(this.currentFilters || {}).some(key =>
        key !== 'page' && key !== 'limit' && this.currentFilters[key]
      )
    );

    // PROTECTION ABSOLUE: Si on a des résultats, ne jamais afficher l'état vide
    if (hasResults) {
      return false;
    }

    // Afficher l'état vide si :
    // 1. Pas de chargement en cours
    // 2. Une recherche a été effectuée OU il y a des critères de recherche
    // 3. Pas de résultats
    const shouldShow = !isCurrentlyLoading &&
                      (this.hasSearched || hasSearchCriteria) &&
                      !hasResults;

    // Logs détaillés pour debugging
    // console.log('🔍 Empty state check - DETAILED:', {
    //   timestamp: new Date().toISOString(),
    //   isLoading: this.isLoading,
    //   isLoadingMore: this.isLoadingMore,
    //   isPerformingSearch: this.isPerformingSearch,
    //   hasSearched: this.hasSearched,
    //   searchResults: this.searchResults,
    //   searchResultsLength: this.searchResults?.length || 0,
    //   hasResults,
    //   currentFilters: this.currentFilters,
    //   searchControlValue: this.searchControl?.value,
    //   hasSearchCriteria,
    //   shouldShow,
    //   '--- BREAKDOWN ---': '---',
    //   'NOT loading': !isCurrentlyLoading,
    //   'HAS searched': this.hasSearched,
    //   'NO results': !hasResults,
    //   'HAS criteria': hasSearchCriteria,
    //   '🛡️ PROTECTION': hasResults ? 'BLOQUÉ - On a des résultats!' : 'OK'
    // });

    return shouldShow;
  }

  // === MÉTHODES UTILITAIRES ===

  /**
   * TrackBy function pour les villes
   */
  trackByCity(_index: number, city: CityModel): string {
    return city._id;
  }

  /**
   * Recharger manuellement les villes
   */
  reloadCities(): void {
    this.store.dispatch(new CountryAction.FetchCountries());
    this.store.dispatch(new CityAction.LoadAllCities());
  }

  /**
   * Debug: Afficher les informations du slider pour une carte
   */
  debugSlider(cardIndex: number): void {
    const result = this.paginatedResults[cardIndex];
    const medias = this.getMediasForCard(result);
    const currentIndex = this.getCurrentImageIndex(cardIndex);
  }

  /**
   * Debug: Tester la conversion de ville
   */
  debugCityConversion(): void {
    this.cities$$.pipe(take(1)).subscribe(cities => {

      if (cities && cities.length > 0) {
        const testCity = cities[0];

        this.cityResolver.getCityIdByName(testCity.fullName).subscribe(id => {
        });
      }
    });
  }

  // === MÉTHODES POUR LE SLIDER D'IMAGES ===

  /**
   * Obtient l'index de l'image actuelle pour une carte donnée
   */
  getCurrentImageIndex(cardIndex: number): number {
    return this.currentImageIndexes[cardIndex] || 0;
  }

  /**
   * Définit l'image actuelle pour une carte donnée
   */
  setCurrentImage(cardIndex: number, imageIndex: number): void {
    const result = this.paginatedResults[cardIndex];
    if (!result) {
      return;
    }

    const medias = this.getMediasForCard(result);
    if (imageIndex < 0 || imageIndex >= medias.length) {
      return;
    }

    this.currentImageIndexes[cardIndex] = imageIndex;

    // Déclencher la détection de changement pour les animations
    this.cdr.detectChanges();
  }

  /**
   * Passe à l'image suivante
   */
  nextImage(cardIndex: number): void {
    const result = this.paginatedResults[cardIndex];
    if (!result) {
      return;
    }

    const medias = this.getMediasForCard(result);
    if (medias.length <= 1) {
      return;
    }

    const currentIndex = this.getCurrentImageIndex(cardIndex);
    const nextIndex = (currentIndex + 1) % medias.length;
    this.setCurrentImage(cardIndex, nextIndex);
  }

  /**
   * Passe à l'image précédente
   */
  previousImage(cardIndex: number): void {
    const result = this.paginatedResults[cardIndex];
    if (!result) {
      return;
    }

    const medias = this.getMediasForCard(result);
    if (medias.length <= 1) {
      return;
    }

    const currentIndex = this.getCurrentImageIndex(cardIndex);
    const prevIndex = currentIndex === 0 ? medias.length - 1 : currentIndex - 1;
    this.setCurrentImage(cardIndex, prevIndex);
  }

  /**
   * Obtient la liste des médias pour une carte avec fallback
   */
  getMediasForCard(result: any): string[] {
    if (!result) return ['/assets/images/placeholder-room.jpg'];

    // Clé de cache basée sur l'ID du résultat
    const cacheKey = result._id || JSON.stringify(result);
    if (this.mediasCache.has(cacheKey)) {
      return this.mediasCache.get(cacheKey)!;
    }

    const raw: string[] = [];
    if (result.medias && Array.isArray(result.medias)) raw.push(...result.medias);
    if (result.property?.medias && Array.isArray(result.property.medias)) raw.push(...result.property.medias);
    if (result.property?.image) raw.push(result.property.image);

    const images = [...new Set(raw.filter(url => url && typeof url === 'string'))]
      .filter(url => {
        const t = MediaUtil.classifyUrlSync(url);
        return t === 'image' || t === 'unknown';
      });

    const result2 = images.length > 0 ? images : ['/assets/images/placeholder-room.jpg'];
    this.mediasCache.set(cacheKey, result2);
    return result2;
  }

  // === GESTION TACTILE POUR LES CARTES ===

  /**
   * Début du toucher sur une carte
   */
  onCardTouchStart(event: TouchEvent, cardIndex: number): void {
    if (event.touches.length !== 1) return;
    
    const touch = event.touches[0];
    this.cardTouchData[cardIndex] = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      isDragging: false
    };
  }

  /**
   * Mouvement du toucher sur une carte
   */
  onCardTouchMove(event: TouchEvent, cardIndex: number): void {
    if (event.touches.length !== 1 || !this.cardTouchData[cardIndex]) return;
    
    const touch = event.touches[0];
    const touchData = this.cardTouchData[cardIndex];
    
    const deltaX = touch.clientX - touchData.startX;
    const absDeltaX = Math.abs(deltaX);
    
    // Seulement gérer le mouvement horizontal pour le swipe d'image
    if (absDeltaX > 10) {
      event.preventDefault();
      touchData.isDragging = true;
    }
  }

  /**
   * Fin du toucher sur une carte
   */
  onCardTouchEnd(event: TouchEvent, cardIndex: number): void {
    if (!this.cardTouchData[cardIndex]) return;
    
    const touchData = this.cardTouchData[cardIndex];
    const touch = event.changedTouches[0];
    
    const deltaX = touch.clientX - touchData.startX;
    const deltaY = touch.clientY - touchData.startY;
    const deltaTime = Date.now() - touchData.startTime;
    
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
    const isQuickSwipe = deltaTime < 500;
    const isLongEnoughSwipe = Math.abs(deltaX) > this.minSwipeDistance;
    
    if (touchData.isDragging && isHorizontalSwipe && (isQuickSwipe || isLongEnoughSwipe)) {
      event.preventDefault();
      event.stopPropagation();
      
      if (deltaX > 0) {
        this.previousImage(cardIndex);
      } else {
        this.nextImage(cardIndex);
      }
    }
    
    delete this.cardTouchData[cardIndex];
  }

  /**
   * Annulation du toucher sur une carte
   */
  onCardTouchCancel(event: TouchEvent, cardIndex: number): void {
    delete this.cardTouchData[cardIndex];
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
    this.performSearch();
    const resultsElement = document.querySelector('.search-results-section');
    if (resultsElement) resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * Page précédente
   */
  previousPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  /**
   * Page suivante
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  /**
   * Obtient les numéros de pages à afficher dans la pagination
   */
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;

    if (this.totalPages <= maxPagesToShow) {
      // Afficher toutes les pages si elles sont peu nombreuses
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Logique pour afficher les pages autour de la page actuelle
      const startPage = Math.max(1, this.currentPage - 2);
      const endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  /**
   * Traduit le type de logement selon la langue actuelle
   */
  getRoomTypeLabel(type: string): string {
    if (!type) return '';

    // Normaliser le type (enlever les espaces et mettre en majuscules)
    const normalizedType = type.trim().toUpperCase();

    // Utiliser le service de traduction
    const translationKey = `ROOM_TYPES.${normalizedType}`;
    const translated = this.translationService.instant(translationKey);

    // Si la traduction n'existe pas, retourner le type original ou un fallback
    if (translated === translationKey) {
      // Fallback pour les types courants
      const fallbacks: { [key: string]: string } = {
        'ROOM': 'Chambre',
        'STUDIO': 'Studio',
        'APARTMENT': 'Appartement',
        'SIMPLE_APARTMENT': 'Appartement',
        'FURNISHED_APARTMENT': 'Appartement meublé',
        'HOUSE': 'Maison',
        'VILLA': 'Villa'
      };
      return fallbacks[normalizedType] || type;
    }

    return translated;
  }

  /**
   * Obtient le texte des résultats trouvés avec gestion correcte du singulier/pluriel
   */
  getResultsFoundText(count: number): string {
    if (count === 0) {
      return this.translationService.instant('SEARCH.NO_RESULTS');
    } else if (count === 1) {
      return this.translationService.instant('SEARCH.RESULTS_FOUND_SINGULAR', { count });
    } else {
      return this.translationService.instant('SEARCH.RESULTS_FOUND_PLURAL', { count });
    }
  }

  /**
   * Met à jour l'URL avec les filtres actuels
   */
  private updateUrl(): void {
    if (this.currentFilters.city) {
      if (this.cityResolver.isObjectId(this.currentFilters.city)) {
        this.cityResolver.getCityNameById(this.currentFilters.city)
          .pipe(take(1), takeUntil(this.destroy$))
          .subscribe(cityName => {
            this.buildAndNavigateUrl(cityName || this.currentFilters.city);
          });
      } else {
        this.buildAndNavigateUrl(this.currentFilters.city);
      }
    } else {
      this.buildAndNavigateUrl(null);
    }
  }

  /**
   * Construire et naviguer vers l'URL avec les paramètres
   */
  private buildAndNavigateUrl(cityName: string | null): void {
    const queryParams: any = {};

    // Localisation (utiliser le nom de la ville)
    if (cityName) {
      queryParams.ville = cityName; // Utiliser 'ville' pour la cohérence
    }

    if (this.currentFilters.district) {
      queryParams.district = this.currentFilters.district;
    }

    // Recherche textuelle
    if (this.searchControl.value) {
      queryParams.search = this.searchControl.value;
    }

    // Type de logement
    if (this.currentFilters.roomType) {
      queryParams.roomType = this.currentFilters.roomType;
    }

    // Prix
    if (this.currentFilters.priceMin && this.currentFilters.priceMin > 0) {
      queryParams.priceMin = this.currentFilters.priceMin;
    }

    if (this.currentFilters.priceMax && this.currentFilters.priceMax < 500000) {
      queryParams.priceMax = this.currentFilters.priceMax;
    }

    // Superficie
    if (this.currentFilters.minArea && this.currentFilters.minArea > 0) {
      queryParams.minArea = this.currentFilters.minArea;
    }

    // Spécificités de la chambre
    if (this.currentFilters.hasKitchen) {
      queryParams.hasKitchen = this.currentFilters.hasKitchen;
    }

    if (this.currentFilters.isInternalKitchen) {
      queryParams.isInternalKitchen = this.currentFilters.isInternalKitchen;
    }

    if (this.currentFilters.hasPrivateShower) {
      queryParams.hasPrivateShower = this.currentFilters.hasPrivateShower;
    }

    if (this.currentFilters.numberOfBathroom) {
      queryParams.numberOfBathroom = this.currentFilters.numberOfBathroom;
    }

    if (this.currentFilters.numberOfShower) {
      queryParams.numberOfShower = this.currentFilters.numberOfShower;
    }

    if (this.currentFilters.numberOfLivingRoom) {
      queryParams.numberOfLivingRoom = this.currentFilters.numberOfLivingRoom;
    }

    // Équipements de la propriété
    if (this.currentFilters.hasParking) {
      queryParams.hasParking = this.currentFilters.hasParking;
    }

    // Tri
    if (this.currentFilters.sortBy && this.currentFilters.sortBy !== 'createdAt') {
      queryParams.sortBy = this.currentFilters.sortBy;
    }

    if (this.currentFilters.sortOrder && this.currentFilters.sortOrder !== 'desc') {
      queryParams.sortOrder = this.currentFilters.sortOrder;
    }

    // Pagination
    if (this.currentPage > 1) {
      queryParams.page = this.currentPage;
    }

    // Remplacer tous les paramètres pour éviter les duplications
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      replaceUrl: true // Remplace l'URL actuelle au lieu d'ajouter une nouvelle entrée
    });
  }

  // === GESTION DU MODAL DE DÉTAILS D'UNITÉ ===

  /**
   * Ouvre le dialog de détails pour une unité avec MatDialog
   */
  openUnitDetail(unit: SearchPropertyModel): void {
    const currentIndex = this.allResults.findIndex(u => u._id === unit._id);

    const dialogRef = this.dialog.open(UnitDetailDialogComponent, {
      data: {
        unit: unit,
        allUnits: this.allResults,
        currentIndex: currentIndex
      },
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      panelClass: 'unit-detail-dialog-container',
      disableClose: false,
      hasBackdrop: true,
      backdropClass: 'unit-detail-backdrop'
    });

    dialogRef.afterClosed()
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe(() => {
        this.selectedUnit = null;
        this.isUnitDetailVisible = false;
      });
  }

  /**
   * Gère le changement d'unité dans le modal
   */
  onUnitChanged(unit: SearchPropertyModel): void {
    this.selectedUnit = unit;
  }

  /**
   * Gère le contact avec le propriétaire
   */
  onContactOwner(unit: SearchPropertyModel): void {
    // TODO: Implémenter la logique de contact
    // Peut ouvrir un modal de contact ou rediriger vers une page de contact
  }

  /**
   * Vérifie si une unité doit être ouverte depuis l'URL
   */
  private checkForUnitInUrl(): void {
    const unitId = this.route.snapshot.queryParams['unit'];
    if (unitId) {
      // Si les résultats sont déjà chargés, ouvrir directement
      if (this.allResults && this.allResults.length > 0) {
        const unit = this.allResults.find(u => u._id === unitId);
        if (unit) {
          setTimeout(() => this.openUnitDetail(unit), 100); // Petit délai pour s'assurer que tout est initialisé
        }
      } else {
        // Sinon, attendre que les résultats soient chargés
        this.waitForSearchResultsAndOpenUnit(unitId);
      }
    }
  }

  /**
   * Attend que les résultats de recherche soient chargés puis ouvre l'unité
   */
  private waitForSearchResultsAndOpenUnit(unitId: string): void {
    this.searchResults$.pipe(
      filter((results: SearchPropertyModel[] | null) => results !== null && results.length > 0),
      take(1),
      takeUntil(this.destroy$)
    ).subscribe((results: SearchPropertyModel[]) => {
      const unit = results.find((u: SearchPropertyModel) => u._id === unitId);
      if (unit) {
        setTimeout(() => this.openUnitDetail(unit), 200);
      }
    });
  }
}
