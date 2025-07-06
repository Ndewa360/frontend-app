import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Select, Store } from '@ngxs/store';
import { Observable, Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntil, map, filter, take } from 'rxjs/operators';


// Services et modèles
import { SearchService, AdvancedSearchFilters } from 'src/app/shared/store/search/search.service';
import { CityModel, CityState, CityAction, SearchPropertyModel, SearchState, CountryAction } from 'src/app/shared/store';

import { GeolocationService, LocationInfo } from 'src/app/shared/services/geolocation/geolocation.service';
import { TranslationService } from 'src/app/shared/services/localization/translation.service';
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
  styleUrls: ['./search-page.component.scss']
})
export class SearchPageComponent implements OnInit, OnDestroy {
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

  // Gestion du modal de détails d'unité
  selectedUnit: SearchPropertyModel | null = null;
  isUnitDetailVisible = false;

  // Protection contre les recherches en boucle
  private isPerformingSearch = false;
  
  // Données
  searchResults: SearchPropertyModel[] = [];
  suggestions: SearchSuggestion[] = [];
  popularSearches: PopularSearch[] = [];
  quickFilters: QuickFilter[] = [];
  currentFilters: AdvancedSearchFilters = {};

  // Pagination
  readonly ITEMS_PER_PAGE = 12; // 12 unités par page (entre 10-15)
  currentPage = 1;
  totalPages = 1;
  totalResults = 0;
  paginatedResults: SearchPropertyModel[] = [];

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
    private dialog: MatDialog
  ) {
    this.initializeForm();
    this.initializeQuickFilters();
  }

  ngOnInit(): void {
    this.setupSearchSubscriptions();
    this.setupUrlSubscriptions(); // Écouter les changements d'URL
    this.loadInitialData();
    this.loadFavorites();
    this.loadCities();

    // Prioriser les paramètres URL avant la géolocalisation
    this.handleRouteParams().then(() => {
      // Détecter la géolocalisation seulement si aucune ville n'est spécifiée dans l'URL
      if (!this.currentFilters.city) {
        this.detectUserLocation();
      }

      // Vérifier si une unité doit être ouverte depuis l'URL
      this.checkForUnitInUrl();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Restaurer le scroll au cas où
    this.unblockPageScroll();
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

    // Écouter les changements du formulaire pour application automatique
    this.setupFormAutoApply();
  }

  /**
   * Configure l'application automatique des filtres
   */
  private setupFormAutoApply(): void {
    // Appliquer automatiquement les filtres avec un délai pour éviter trop de requêtes
    this.searchForm.valueChanges
      .pipe(
        debounceTime(500), // Attendre 500ms après le dernier changement
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
        takeUntil(this.destroy$)
      )
      .subscribe(formValues => {
        console.log('🔄 Application automatique des filtres:', formValues);

        // Mettre à jour les filtres actuels
        this.currentFilters = {
          ...this.currentFilters,
          ...formValues
        };

        // Réinitialiser la pagination
        this.currentPage = 1;

        // Effectuer la recherche et mettre à jour l'URL
        this.performSearch();
        this.updateUrl();
      });
  }

  /**
   * Configure l'écoute des changements d'URL pour recharger les données
   */
  private setupUrlSubscriptions(): void {
    // Écouter les changements de paramètres d'URL
    this.route.queryParams
      .pipe(
        debounceTime(300), // Éviter les rechargements trop fréquents
        takeUntil(this.destroy$)
      )
      .subscribe(params => {
        console.log('🔗 Changement des paramètres URL:', params);

        // Vérifier si les paramètres ont vraiment changé
        const hasChanged = this.hasUrlParamsChanged(params);

        if (hasChanged) {
          console.log('🔄 Rechargement des données suite au changement d\'URL');
          // Recharger les filtres depuis l'URL et effectuer une nouvelle recherche
          this.loadFiltersFromUrl(params);
        }
      });
  }

  /**
   * Vérifie si les paramètres URL ont changé
   */
  private hasUrlParamsChanged(newParams: any): boolean {
    const currentParams = this.route.snapshot.queryParams;
    return JSON.stringify(currentParams) !== JSON.stringify(newParams);
  }

  /**
   * Charge les filtres depuis les paramètres URL
   */
  private loadFiltersFromUrl(params: any): void {
    // Mettre à jour les filtres depuis l'URL
    this.currentFilters = {
      ...this.currentFilters,
      city: params['ville'] || params['city'] || '',
      district: params['district'] || '',
      roomType: params['roomType'] || '',
      priceMin: params['priceMin'] ? parseInt(params['priceMin']) : 0,
      priceMax: params['priceMax'] ? parseInt(params['priceMax']) : 500000,
      minArea: params['minArea'] ? parseInt(params['minArea']) : 0,
      hasKitchen: params['hasKitchen'] === 'true',
      isInternalKitchen: params['isInternalKitchen'] === 'true',
      isInternalShower: params['isInternalShower'] === 'true',
      hasParking: params['hasParking'] === 'true',
      hasClosure: params['hasClosure'] === 'true',
      sortBy: params['sortBy'] || 'createdAt',
      sortOrder: params['sortOrder'] || 'desc'
    };

    // Mettre à jour la pagination
    this.currentPage = params['page'] ? parseInt(params['page']) : 1;

    // Mettre à jour le formulaire
    this.searchForm.patchValue(this.currentFilters, { emitEvent: false });

    // Effectuer la recherche
    this.performSearch();
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
    console.log('🏙️ Chargement des villes...');

    // D'abord charger les pays (qui contiennent les villes)
    this.store.dispatch(new CountryAction.FetchCountries());

    // Puis charger spécifiquement les villes
    this.store.dispatch(new CityAction.LoadAllCities());

    // Debug: écouter les changements de villes
    this.cities$
      .pipe(takeUntil(this.destroy$))
      .subscribe(cities => {
        console.log('🏙️ Villes chargées:', cities?.length || 0, cities);
        if (!cities || cities.length === 0) {
          console.warn('⚠️ Aucune ville chargée, tentative de rechargement...');
          // Retry après 2 secondes
          setTimeout(() => {
            this.store.dispatch(new CountryAction.FetchCountries());
          }, 2000);
        }
      });
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
    console.log('🔧 Toggle filters:', this.showFilters);

    if (this.showFilters) {
      this.blockPageScroll();
    } else {
      this.unblockPageScroll();
    }
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
    this.paginatedResults = [];
    this.currentPage = 1;
    this.totalPages = 1;
    this.totalResults = 0;
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
      limit: this.ITEMS_PER_PAGE
    };

    this.searchService.advancedSearch(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.statusCode === 200) {
            // Vérification de la structure des données
            const data = response.data?.data || response.data || [];

            this.searchResults = Array.isArray(data) ? data : [];
            this.totalResults = this.searchResults.length; // Total des résultats reçus
            this.updatePagination(); // Calculer la pagination côté client

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
          limit: this.ITEMS_PER_PAGE
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
          limit: this.ITEMS_PER_PAGE
        };

        this.searchService.advancedSearch(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.statusCode === 200) {
            // Vérification de la structure des données
            const data = response.data?.data || response.data || [];

            this.searchResults = Array.isArray(data) ? data : [];
            this.totalResults = this.searchResults.length;
            this.updatePagination();

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
    this.unblockPageScroll();
  }

  /**
   * Bloque le scroll de la page
   */
  private blockPageScroll(): void {
    // Sauvegarder la position actuelle du scroll
    const scrollY = window.scrollY;

    // Appliquer les styles pour bloquer le scroll
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.width = '100%';

    // Bloquer aussi le scroll sur l'élément html
    document.documentElement.style.overflow = 'hidden';

    // Sauvegarder la position pour la restaurer plus tard
    document.body.setAttribute('data-scroll-y', scrollY.toString());
  }

  /**
   * Débloque le scroll de la page
   */
  private unblockPageScroll(): void {
    // Récupérer la position sauvegardée
    const scrollY = document.body.getAttribute('data-scroll-y');

    // Restaurer les styles
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.overflow = '';
    document.body.style.width = '';

    // Restaurer le scroll sur l'élément html
    document.documentElement.style.overflow = '';

    // Restaurer la position du scroll
    if (scrollY) {
      window.scrollTo(0, parseInt(scrollY, 10));
      document.body.removeAttribute('data-scroll-y');
    }
  }



  /**
   * Ferme le panneau de filtres (les filtres s'appliquent automatiquement)
   */
  applyFilters(): void {
    console.log('🔧 Fermeture du panneau de filtres');
    this.closeFilters();
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
   * Met à jour la pagination côté client
   */
  private updatePagination(): void {
    this.totalPages = Math.ceil(this.totalResults / this.ITEMS_PER_PAGE);
    this.updatePaginatedResults();
  }

  /**
   * Met à jour les résultats paginés pour la page actuelle
   */
  private updatePaginatedResults(): void {
    const startIndex = (this.currentPage - 1) * this.ITEMS_PER_PAGE;
    const endIndex = startIndex + this.ITEMS_PER_PAGE;
    this.paginatedResults = this.searchResults.slice(startIndex, endIndex);
  }

  /**
   * Navigue vers une page spécifique
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.updatePaginatedResults();

      // Scroll vers le haut des résultats
      const resultsElement = document.querySelector('.results-grid');
      if (resultsElement) {
        resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
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

  // === GESTION DU MODAL DE DÉTAILS D'UNITÉ ===

  /**
   * Ouvre le dialog de détails pour une unité avec MatDialog
   */
  openUnitDetail(unit: SearchPropertyModel): void {
    const currentIndex = this.searchResults.findIndex(u => u._id === unit._id);

    const dialogRef = this.dialog.open(UnitDetailDialogComponent, {
      data: {
        unit: unit,
        allUnits: this.searchResults,
        currentIndex: currentIndex
      },
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      panelClass: 'unit-detail-dialog-container',
      disableClose: false,
      hasBackdrop: false // Pas de backdrop car on occupe tout l'écran
    });

    // Écouter la fermeture du dialog
    dialogRef.afterClosed().subscribe(() => {
      // Ne pas affecter les données de recherche lors de la fermeture
      this.selectedUnit = null;
      this.isUnitDetailVisible = false;

      // Pas de manipulation des searchResults ici pour éviter de vider la liste
      // Les données restent intactes
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
    console.log('🏠 Contact propriétaire pour:', unit.code || unit._id);
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
      if (this.searchResults && this.searchResults.length > 0) {
        const unit = this.searchResults.find(u => u._id === unitId);
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
    const subscription = this.searchResults$.pipe(
      filter((results: SearchPropertyModel[] | null) => results !== null && results.length > 0),
      take(1)
    ).subscribe((results: SearchPropertyModel[]) => {
      const unit = results.find((u: SearchPropertyModel) => u._id === unitId);
      if (unit) {
        setTimeout(() => this.openUnitDetail(unit), 200);
      }
      subscription.unsubscribe();
    });

    // Timeout de sécurité après 10 secondes
    setTimeout(() => {
      if (!subscription.closed) {
        subscription.unsubscribe();
      }
    }, 10000);
  }


}
