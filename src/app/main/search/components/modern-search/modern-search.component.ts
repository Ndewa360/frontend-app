import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { Observable, Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';

// Services et modèles
import { SearchService, AdvancedSearchFilters } from 'src/app/shared/store/search/search.service';
import { CityModel, CityState, CityAction, SearchPropertyModel, SearchState } from 'src/app/shared/store';

import { GeolocationService, LocationInfo } from 'src/app/shared/services/geolocation/geolocation.service';
import { TranslationService } from 'src/app/shared/services/localization/translation.service';

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
}

export interface SearchSuggestion {
  type: 'city' | 'property' | 'recent';
  label: string;
  value: any;
  icon: string;
}

@Component({
  selector: 'app-modern-search',
  templateUrl: './modern-search.component.html',
  styleUrls: ['./modern-search.component.scss']
})
export class ModernSearchComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  @ViewChild('searchInput', { static: true }) searchInput!: ElementRef<HTMLInputElement>;

  // Store selectors
  @Select(CityState.selectStateCities) cities$: Observable<CityModel[]>;
  @Select(SearchState.selectStateFilteredProperty) searchResults$: Observable<SearchPropertyModel[]>;
  @Select(SearchState.selectStateLoading) loading$: Observable<boolean>;

  // Form et état
  searchForm: FormGroup;
  searchControl = new FormControl('');
  
  // État de l'interface
  isSearchFocused = false;
  showFilters = false;
  showSuggestions = false;
  currentView: 'grid' | 'list' = 'grid';
  hasSearched = false; // Pour éviter l'affichage prématuré de "aucune donnée"

  // Gestion du slider d'images
  currentImageIndexes: { [cardIndex: number]: number } = {};

  // Protection contre les recherches en boucle
  private isPerformingSearch = false;
  
  // Données
  searchResults: SearchPropertyModel[] = [];
  suggestions: SearchSuggestion[] = [];
  popularSearches: PopularSearch[] = [];
  quickFilters: QuickFilter[] = [];
  currentFilters: AdvancedSearchFilters = {};

  // Gestion des favoris (stockage local)
  favoriteIds: Set<string> = new Set();

  // Géolocalisation
  userLocation: LocationInfo | null = null;
  isDetectingLocation = false;
  locationDetected = false;
  isFromUrl = false; // Indique si la localisation provient de l'URL

  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalResults = 0;
  itemsPerPage = 12;

  // Loading states
  isLoading = false;
  isLoadingMore = false;

  // Utilitaires pour le template
  Object = Object;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private store: Store,
    private searchService: SearchService,
    private cdr: ChangeDetectorRef,
    private geolocationService: GeolocationService,
    private translationService: TranslationService
  ) {
    this.initializeForm();
    this.initializeQuickFilters();
  }

  ngOnInit(): void {
    this.setupSearchSubscriptions();
    this.loadInitialData();
    this.loadFavorites();
    this.loadCities();

    // Prioriser les paramètres URL avant la géolocalisation
    this.handleRouteParams().then(() => {
      // Détecter la géolocalisation seulement si aucune ville n'est spécifiée dans l'URL
      if (!this.currentFilters.city) {
        this.detectUserLocation();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.searchForm = this.fb.group({
      // Recherche et localisation
      searchText: [''],
      city: [''],
      district: [''],

      // Type de chambre (selon enum RoomType)
      roomType: [''], // ROOM, STUDIO, SIMPLE_APARTMENT, FURNISHED_APARTMENT

      // Prix
      priceMin: [0],
      priceMax: [500000],

      // Superficie minimale
      minArea: [0],

      // Spécificités de la chambre (RoomSpecificity)
      hasKitchen: [false],
      isInternalKitchen: [false],
      isInternalShower: [false], // Note: c'est isInternalShower pas hasPrivateShower
      numberOfBathroom: [''],
      numberOfLivingRoom: [''],
      numberOfShower: [''],

      // Propriétés de la propriété
      hasParking: [false],
      hasClosure: [false],

      // Disponibilité
      isFree: [true], // Toujours true pour la recherche
      isShowToPublic: [true], // Toujours true pour la recherche
      isActiveForSouscription: [true], // Toujours true pour la recherche

      // Tri
      sortBy: ['createdAt'], // price, createdAt, area
      sortOrder: ['desc'] // asc, desc
    });
  }

  private initializeQuickFilters(): void {
    this.quickFilters = [
      {
        key: 'hasKitchen',
        label: 'Cuisine équipée',
        icon: 'restaurant',
        active: false
      },
      {
        key: 'hasPrivateShower',
        label: 'Douche privée',
        icon: 'shower',
        active: false
      },
      {
        key: 'hasParking',
        label: 'Parking',
        icon: 'local_parking',
        active: false
      },
      {
        key: 'furnished',
        label: 'Meublé',
        icon: 'chair',
        active: false
      }
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

    // Écouter les changements de filtres (désactivé temporairement pour debugging)
    // this.searchForm.valueChanges
    //   .pipe(
    //     debounceTime(500),
    //     distinctUntilChanged(),
    //     takeUntil(this.destroy$)
    //   )
    //   .subscribe(formValue => {
    //     console.log('🔄 Form value changed:', formValue);
    //     this.currentFilters = { ...formValue };
    //     this.performSearch();
    //   });
  }

  private loadInitialData(): void {
    // Charger les recherches populaires
    this.loadPopularSearches();

    // Charger les villes
    this.cities$
      .pipe(takeUntil(this.destroy$))
      .subscribe(cities => {
        // Mettre à jour les suggestions avec les villes
        this.updateCitySuggestions(cities);
      });
  }

  /**
   * Charge la liste des villes depuis le backend
   */
  private loadCities(): void {
    // Pour le Cameroun, on peut utiliser un ID spécifique ou charger toutes les villes
    // Ici on charge toutes les villes disponibles
    this.store.dispatch(new CityAction.LoadAllCities());
  }

  private handleRouteParams(): Promise<void> {
    return new Promise((resolve) => {
      this.route.queryParams
        .pipe(takeUntil(this.destroy$))
        .subscribe(params => {
          let hasParams = false;

          // Supporter les deux paramètres : 'ville' (ancien) et 'city' (nouveau)
          const cityParam = params['city'] || params['ville'];
          if (cityParam) {
            this.currentFilters.city = cityParam;
            this.searchForm.patchValue({ city: cityParam });

            // Mettre à jour la localisation affichée si ville dans URL
            this.userLocation = {
              city: cityParam,
              country: 'Cameroun',
              region: '',
              latitude: 0,
              longitude: 0
            };
            this.locationDetected = false; // Indiquer que c'est depuis l'URL
            this.isFromUrl = true; // Nouvelle propriété pour identifier la source
            hasParams = true;
          }

          if (params['search']) {
            this.searchControl.setValue(params['search']);
            hasParams = true;
          }

          if (params['priceMin']) {
            this.currentFilters.priceMin = +params['priceMin'];
            this.searchForm.patchValue({ priceMin: +params['priceMin'] });
            hasParams = true;
          }

          if (params['priceMax']) {
            this.currentFilters.priceMax = +params['priceMax'];
            this.searchForm.patchValue({ priceMax: +params['priceMax'] });
            hasParams = true;
          }

          if (params['hasKitchen']) {
            this.currentFilters.hasKitchen = params['hasKitchen'] === 'true';
            this.searchForm.patchValue({ hasKitchen: params['hasKitchen'] === 'true' });
            hasParams = true;
          }

          if (params['hasParking']) {
            this.currentFilters.hasParking = params['hasParking'] === 'true';
            this.searchForm.patchValue({ hasParking: params['hasParking'] === 'true' });
            hasParams = true;
          }

          if (params['hasPrivateShower']) {
            this.currentFilters.hasPrivateShower = params['hasPrivateShower'] === 'true';
            this.searchForm.patchValue({ hasPrivateShower: params['hasPrivateShower'] === 'true' });
            hasParams = true;
          }

          // Lancer la recherche si des paramètres sont présents
          if (hasParams) {
            this.performSearch();
          }

          resolve();
        });
    });
  }

  private loadSuggestions(query: string): void {
    this.cities$
      .pipe(
        map(cities => cities.filter(city =>
          city.fullName.toLowerCase().includes(query.toLowerCase())
        )),
        takeUntil(this.destroy$)
      )
      .subscribe(filteredCities => {
        this.suggestions = [
          ...filteredCities.map(city => ({
            type: 'city' as const,
            label: city.fullName,
            value: city,
            icon: 'location_on'
          }))
        ];
        this.cdr.detectChanges();
      });
  }

  private loadPopularSearches(): void {
    // Données mockées - à remplacer par un appel API
    this.popularSearches = [
      {
        label: 'Studios à Douala',
        filters: { city: 'douala', roomType: 'STUDIO' },
        count: 45
      },
      {
        label: 'Appartements meublés',
        filters: { roomType: 'FURNISHED_APARTMENT' },
        count: 32
      },
      {
        label: 'Chambres avec cuisine',
        filters: { hasKitchen: true },
        count: 28
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
      this.searchForm.patchValue({ city: suggestion.value._id });
      this.searchControl.setValue(suggestion.label);
    }
    this.showSuggestions = false;
    this.performSearch();
  }

  onPopularSearchClick(popularSearch: PopularSearch): void {
    this.searchForm.patchValue(popularSearch.filters);
    this.performSearch();
  }



  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  toggleView(): void {
    this.currentView = this.currentView === 'grid' ? 'list' : 'grid';
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.searchForm.reset();
    this.quickFilters.forEach(f => f.active = false);
    this.currentFilters = {};
    this.searchResults = [];
    this.hasSearched = false; // Réinitialiser l'état de recherche
  }

  private performSearch(): void {
    if (!this.currentFilters.city && !this.searchControl.value) {
      return;
    }

    // Protection contre les recherches en boucle
    if (this.isPerformingSearch) {
      console.log('🔄 Recherche déjà en cours, ignorée');
      return;
    }

    console.log('🔍 Début de performSearch:', {
      currentFilters: this.currentFilters,
      searchControlValue: this.searchControl.value,
      isLoading: this.isLoading,
      hasSearched: this.hasSearched
    });

    this.isPerformingSearch = true;
    this.isLoading = true;
    this.hasSearched = true; // Marquer qu'une recherche a été effectuée
    const filters: AdvancedSearchFilters = {
      ...this.currentFilters,
      page: this.currentPage,
      limit: this.itemsPerPage
    };

    this.searchService.advancedSearch(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.statusCode === 200) {
            // Vérification de la structure des données
            const data = response.data?.data || response.data || [];
            const pagination: any = response.data?.pagination || {};

            this.searchResults = Array.isArray(data) ? data : [];
            this.totalResults = pagination.total || 0;
            this.totalPages = pagination.totalPages || 1;
            this.currentPage = pagination.page || 1;

            // Réinitialiser les index d'images pour les nouvelles cartes
            this.currentImageIndexes = {};

            console.log('✅ Recherche terminée avec succès:', {
              resultCount: this.searchResults.length,
              totalResults: this.totalResults
            });

            // Si aucun résultat et que ce n'est pas déjà Bangangté, essayer Bangangté
            if (this.searchResults.length === 0 && filters.city !== 'Bangangté') {
              console.log(`Aucun résultat trouvé pour ${filters.city}, recherche à Bangangté...`);
              this.fallbackToBangangte();
              return;
            }
          }
          this.isLoading = false;
          this.isPerformingSearch = false;
        },
        error: (error) => {
          console.error('Erreur de recherche:', error);
          this.isLoading = false;
          this.isPerformingSearch = false;

          // En cas d'erreur, essayer Bangangté si ce n'était pas déjà le cas
          if (filters.city !== 'Bangangté') {
            console.log('Erreur de recherche, fallback vers Bangangté...');
            this.fallbackToBangangte();
          }
        }
      });
  }

  loadMore(): void {
    if (this.currentPage < this.totalPages && !this.isLoadingMore) {
      this.isLoadingMore = true;
      this.currentPage++;

      const filters: AdvancedSearchFilters = {
        ...this.currentFilters,
        page: this.currentPage,
        limit: this.itemsPerPage
      };

      this.searchService.advancedSearch(filters)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.statusCode === 200) {
              const data = response.data?.data || response.data || [];
              const newResults = Array.isArray(data) ? data : [];
              this.searchResults = [...this.searchResults, ...newResults];
            }
            this.isLoadingMore = false;
          },
          error: (error) => {
            console.error('Erreur de chargement:', error);
            this.isLoadingMore = false;
            this.currentPage--; // Revenir à la page précédente en cas d'erreur
          }
        });
    }
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
          window.open(`mailto:${owner.email}?subject=Intérêt pour votre logement`, '_self');
        }
        break;

      case 'whatsapp':
        if (owner.phoneNumber) {
          const message = encodeURIComponent('Bonjour, je suis intéressé par votre logement sur Ndiye.');
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
      console.log(`Logement ${result.code} retiré des favoris`);
    } else {
      this.favoriteIds.add(result._id);
      console.log(`Logement ${result.code} ajouté aux favoris`);
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
      console.error('Erreur lors du chargement des favoris:', error);
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

          console.log('Localisation détectée:', location);

          // Lancer la recherche automatique pour la ville détectée
          this.searchByUserLocation();
        },
        error: (error) => {
          console.error('Erreur de géolocalisation:', error);
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

    // Trouver l'ID de la ville dans la liste des villes
    this.cities$
      .pipe(takeUntil(this.destroy$))
      .subscribe(cities => {
        const detectedCity = cities.find(city =>
          city.fullName.toLowerCase().includes(this.userLocation!.city.toLowerCase())
        );

        // Utiliser l'ObjectId de la ville si trouvé, sinon le nom
        const cityId = detectedCity ? detectedCity._id : this.userLocation!.city;

        this.currentFilters = {
          city: cityId,
          page: 1,
          limit: this.itemsPerPage
        };

        this.currentPage = 1;
        this.performSearch();

        // Mettre à jour l'URL seulement si la localisation a été détectée automatiquement
        if (this.locationDetected && !this.isFromUrl) {
          this.updateUrl();
        }
      });
  }

  /**
   * Fallback vers Bangangté en cas d'absence de résultats
   */
  private fallbackToBangangte(): void {
    const defaultLocation = this.geolocationService.getDefaultLocation();
    this.userLocation = defaultLocation;

    // Trouver l'ID de Bangangté dans la liste des villes
    this.cities$
      .pipe(takeUntil(this.destroy$))
      .subscribe(cities => {
        const bangangteCity = cities.find(city =>
          city.fullName.toLowerCase().includes('bangangté') ||
          city.fullName.toLowerCase().includes('bangangte')
        );

        // Utiliser l'ObjectId de la ville si trouvé, sinon le nom
        const cityId = bangangteCity ? bangangteCity._id : defaultLocation.city;

        this.currentFilters = {
          ...this.currentFilters,
          city: cityId,
          page: 1
        };

        this.currentPage = 1;

        console.log('Recherche de fallback à Bangangté avec ID:', cityId);

        const filters: AdvancedSearchFilters = {
          ...this.currentFilters,
          page: this.currentPage,
          limit: this.itemsPerPage
        };

        this.searchService.advancedSearch(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.statusCode === 200) {
            // Vérification de la structure des données
            const data = response.data?.data || response.data || [];
            const pagination: any = response.data?.pagination || {};

            this.searchResults = Array.isArray(data) ? data : [];
            this.totalResults = pagination.total || 0;
            this.totalPages = pagination.totalPages || 1;
            this.currentPage = pagination.page || 1;

            // Réinitialiser les index d'images pour les nouvelles cartes
            this.currentImageIndexes = {};
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du fallback vers Bangangté:', error);
          this.searchResults = [];
          this.isLoading = false;
        }
      });
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

  /**
   * Ferme le panneau de filtres
   */
  closeFilters(): void {
    this.showFilters = false;
  }

  /**
   * Applique les filtres et ferme le panneau
   */
  applyFilters(): void {
    // Mettre à jour les filtres depuis le formulaire
    const formValues = this.searchForm.value;
    console.log('🔧 Application manuelle des filtres:', formValues);

    this.currentFilters = {
      ...this.currentFilters,
      ...formValues
    };

    this.performSearch();
    this.closeFilters();
    this.updateUrl();
  }

  /**
   * Réinitialise tous les filtres
   */
  resetFilters(): void {
    this.searchForm.reset();
    this.currentFilters = {};
    this.performSearch();
  }

  /**
   * Bascule un filtre rapide
   */
  toggleQuickFilter(filter: any): void {
    filter.active = !filter.active;

    // Appliquer le filtre selon son type
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
    if (formValues.priceMax && formValues.priceMax < 500000) count++;

    // Filtres de superficie
    if (formValues.minArea && formValues.minArea > 0) count++;

    // Spécificités de la chambre (RoomSpecificity)
    if (formValues.hasKitchen) count++;
    if (formValues.isInternalKitchen) count++;
    if (formValues.isInternalShower) count++;
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
    const hasResults = this.searchResults && this.searchResults.length > 0;
    const isCurrentlyLoading = this.isLoading || this.isLoadingMore || this.isPerformingSearch;
    const hasSearchCriteria = !!(this.currentFilters?.city || this.searchControl?.value);

    // PROTECTION ABSOLUE: Si on a des résultats, ne jamais afficher l'état vide
    if (hasResults) {
      return false;
    }

    const shouldShow = !isCurrentlyLoading && this.hasSearched && !hasResults && hasSearchCriteria;

    // Logs détaillés pour debugging
    console.log('🔍 Empty state check - DETAILED:', {
      timestamp: new Date().toISOString(),
      isLoading: this.isLoading,
      isLoadingMore: this.isLoadingMore,
      isPerformingSearch: this.isPerformingSearch,
      hasSearched: this.hasSearched,
      searchResults: this.searchResults,
      searchResultsLength: this.searchResults?.length || 0,
      hasResults,
      currentFilters: this.currentFilters,
      searchControlValue: this.searchControl?.value,
      hasSearchCriteria,
      shouldShow,
      '--- BREAKDOWN ---': '---',
      'NOT loading': !isCurrentlyLoading,
      'HAS searched': this.hasSearched,
      'NO results': !hasResults,
      'HAS criteria': hasSearchCriteria,
      '🛡️ PROTECTION': hasResults ? 'BLOQUÉ - On a des résultats!' : 'OK'
    });

    return shouldShow;
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
    console.log(`🖼️ Slider: Définir image ${imageIndex} pour carte ${cardIndex}`);
    this.currentImageIndexes[cardIndex] = imageIndex;
  }

  /**
   * Passe à l'image suivante
   */
  nextImage(cardIndex: number): void {
    const result = this.searchResults[cardIndex];
    if (!result || !result.medias || result.medias.length <= 1) {
      console.log(`🖼️ Slider: Pas d'image suivante pour carte ${cardIndex}`);
      return;
    }

    const currentIndex = this.getCurrentImageIndex(cardIndex);
    const nextIndex = (currentIndex + 1) % result.medias.length;
    console.log(`🖼️ Slider: Image suivante carte ${cardIndex}: ${currentIndex} → ${nextIndex}`);
    this.setCurrentImage(cardIndex, nextIndex);
  }

  /**
   * Passe à l'image précédente
   */
  previousImage(cardIndex: number): void {
    const result = this.searchResults[cardIndex];
    if (!result || !result.medias || result.medias.length <= 1) {
      console.log(`🖼️ Slider: Pas d'image précédente pour carte ${cardIndex}`);
      return;
    }

    const currentIndex = this.getCurrentImageIndex(cardIndex);
    const prevIndex = currentIndex === 0 ? result.medias.length - 1 : currentIndex - 1;
    console.log(`🖼️ Slider: Image précédente carte ${cardIndex}: ${currentIndex} → ${prevIndex}`);
    this.setCurrentImage(cardIndex, prevIndex);
  }

  /**
   * Obtient la liste des médias pour une carte avec fallback
   */
  getMediasForCard(result: any): string[] {
    if (result.medias && result.medias.length > 0) {
      return result.medias;
    }
    return ['/assets/images/placeholder-room.jpg'];
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
   * Met à jour l'URL avec les filtres actuels
   */
  private updateUrl(): void {
    const queryParams: any = {};

    // Localisation
    if (this.currentFilters.city) {
      queryParams.ville = this.currentFilters.city; // Utiliser 'ville' pour la cohérence
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

    if (this.currentFilters.isInternalShower) {
      queryParams.isInternalShower = this.currentFilters.isInternalShower;
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

    if (this.currentFilters.hasClosure) {
      queryParams.hasClosure = this.currentFilters.hasClosure;
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
}
