import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { combineLatest, combineLatestAll, Observable } from 'rxjs';
import { PlateformService } from 'src/app/shared/services/plateform/plateform.service';
import { CityModel, CityState, RoomType, SearchAction, SearchState, SearchPropertyModel } from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';
import { SearchFilters } from '../components/advanced-search-filters/advanced-search-filters.component';

export interface SavedSearch {
  id: string;
  name: string;
  criteria: string;
  filters: SearchFilters;
  createdAt: Date;
}

export interface ActiveFilter {
  key: string;
  label: string;
  value: any;
}

export interface SortOption {
  content: string;
  value: string;
}

@Component({
  selector: 'search-page',
  templateUrl: './search-page.component.html',
  styleUrls: ['./search-page-new.component.scss']
})
export class SearchPageComponent implements OnInit {
  @Select(CityState.selectStateCities) cities: Observable<CityModel[]>;
  @Select(SearchState.selectStateFilteredProperty) searchResults$: Observable<SearchPropertyModel[]>;

  currentFilters: SearchFilters = {};
  resultCount: number = 0;
  loading: boolean = false;
  currentView: 'grid' | 'list' = 'grid';

  // Nouvelles propriétés pour la recherche moderne
  savedSearches: SavedSearch[] = [];
  activeFilters: ActiveFilter[] = [];
  sortOptions = [
    { content: 'Prix croissant', value: 'price_asc', selected: false },
    { content: 'Prix décroissant', value: 'price_desc', selected: false },
    { content: 'Plus récent', value: 'date_desc', selected: false },
    { content: 'Superficie', value: 'area_desc', selected: false },
    { content: 'Pertinence', value: 'relevance', selected: true }
  ];

  paginationModel = {
    currentPage: 1,
    pageSize: 12,
    totalDataLength: 0
  };

  constructor(
    private plateformService:PlateformService,
    private activedRoute: ActivatedRoute,
    private router: Router,
    private _store:Store,
    
  ){}
  
  ngOnInit(): void {
    // Charger les recherches sauvegardées
    this.loadSavedSearches();

    // Surveiller les résultats de recherche pour mettre à jour le compteur
    this.searchResults$.subscribe(results => {
      this.resultCount = results ? results.length : 0;
    });

    combineLatest([this.activedRoute.queryParams, this.cities]).subscribe(([value, cities]) => {
      let data = {
        type: null,
        ville: null,
        minPrice: 0,
        maxPrice: 100000,
        specifity: {
          numberOfBathroom: 1,
          numberOfLivingRoom: 2,
          numberOfShower: 1,
          isInternalShower: false,
          hasKitchen: true,
          isInternalKitchen: false,
          hasClosure: true,
          hasParking: false,
        }
      };

      // Convertir les paramètres d'URL en filtres
      if (value['type']) data.type = value['type'];
      if (value['ville']) {
        const selectedCity = cities.find(city => city.fullName == value['ville']);
        if (selectedCity) data.ville = selectedCity._id;
      }
      if (value['minPrice']) data.minPrice = value['minPrice'];
      if (value['maxPrice']) data.maxPrice = value['maxPrice'];
      if (value['numberOfBathroom']) data.specifity.numberOfBathroom = value['numberOfBathroom'];
      if (value['numberOfLivingRoom']) data.specifity.numberOfLivingRoom = value['numberOfLivingRoom'];
      if (value['numberOfShower']) data.specifity.numberOfShower = value['numberOfShower'];
      if (value['isInternalShower']) data.specifity.isInternalShower = value['isInternalShower'];
      if (value['hasKitchen']) data.specifity.hasKitchen = value['hasKitchen'];
      if (value['isInternalKitchen']) data.specifity.isInternalKitchen = value['isInternalKitchen'];
      if (value['hasClosure']) data.specifity.hasClosure = value['hasClosure'];
      if (value['hasParking']) data.specifity.hasParking = value['hasParking'];

      // Convertir vers le nouveau format de filtres
      this.currentFilters = this.convertToNewFilters(data, value);

      this._store.dispatch(new SearchAction.ApplyFilter(data, false));
    });
  }

  // Convertir l'ancien format vers le nouveau format de filtres
  private convertToNewFilters(data: any, queryParams: any): SearchFilters {
    return {
      city: data.ville,
      priceMin: data.minPrice,
      priceMax: data.maxPrice,
      amenities: [],
      preferences: []
    };
  }

  // Gestionnaires d'événements pour le nouveau composant de filtres
  onFiltersChanged(filters: SearchFilters): void {
    this.currentFilters = filters;
    // Optionnel : mettre à jour l'URL avec les nouveaux filtres
    this.updateUrlWithFilters(filters);
  }

  onSearchRequested(filters: SearchFilters): void {
    this.currentFilters = filters;

    // Convertir les nouveaux filtres vers l'ancien format pour la compatibilité
    const legacyData = this.convertToLegacyFormat(filters);

    // Déclencher la recherche
    this._store.dispatch(new SearchAction.ApplyFilter(legacyData, true));

    // Mettre à jour l'URL
    this.updateUrlWithFilters(filters);
  }

  onSaveSearch(filters: SearchFilters): void {
    // Implémenter la sauvegarde de recherche
    console.log('Sauvegarde de la recherche:', filters);
    // Ici vous pourriez sauvegarder dans le localStorage ou envoyer au serveur
  }

  onResetFilters(): void {
    this.currentFilters = {};
    this.router.navigate([], {
      relativeTo: this.activedRoute,
      queryParams: {},
      replaceUrl: true
    });
  }

  // Convertir les nouveaux filtres vers l'ancien format
  private convertToLegacyFormat(filters: SearchFilters): any {
    return {
      type: filters.propertyType || null,
      ville: filters.city,
      minPrice: filters.priceMin || 0,
      maxPrice: filters.priceMax || 100000,
      specifity: {
        numberOfBathroom: 1,
        numberOfLivingRoom: 2,
        numberOfShower: 1,
        isInternalShower: filters.amenities?.includes('private_shower') || false,
        hasKitchen: filters.amenities?.includes('kitchen') || false,
        isInternalKitchen: false,
        hasClosure: filters.amenities?.includes('security') || false,
        hasParking: filters.amenities?.includes('parking') || false,
      }
    };
  }

  // Mettre à jour l'URL avec les filtres
  private updateUrlWithFilters(filters: SearchFilters): void {
    const queryParams: any = {};

    if (filters.city) queryParams.ville = filters.city;
    if (filters.priceMin) queryParams.minPrice = filters.priceMin;
    if (filters.priceMax) queryParams.maxPrice = filters.priceMax;
    if (filters.propertyType) queryParams.type = filters.propertyType;
    if (filters.amenities?.includes('kitchen')) queryParams.hasKitchen = true;
    if (filters.amenities?.includes('private_shower')) queryParams.isInternalShower = true;
    if (filters.amenities?.includes('parking')) queryParams.hasParking = true;

    this.router.navigate([], {
      relativeTo: this.activedRoute,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  // Nouvelles méthodes pour la recherche moderne
  onMainSearchChange(value: string): void {
    // Logique de recherche principale
    console.log('Main search:', value);
  }

  loadSavedSearch(search: SavedSearch): void {
    this.currentFilters = search.filters;
    this.onSearchRequested(search.filters);
  }

  deleteSavedSearch(search: SavedSearch, event: Event): void {
    event.stopPropagation();
    this.savedSearches = this.savedSearches.filter(s => s.id !== search.id);
    this.saveSavedSearches();
  }

  removeFilter(filter: ActiveFilter): void {
    this.activeFilters = this.activeFilters.filter(f => f.key !== filter.key);
    this.updateActiveFilters();
  }

  clearAllFilters(): void {
    this.activeFilters = [];
    this.currentFilters = {};
    this.onResetFilters();
  }

  onSortChange(event: any): void {
    const value = event.target ? event.target.value : event.value || event;
    console.log('Sort changed:', value);
    // Logique de tri
  }

  onViewChange(view: string): void {
    this.currentView = view as 'grid' | 'list';
  }

  onBrowseAll(): void {
    // Rediriger vers la page de navigation générale ou réinitialiser tous les filtres
    this.onResetFilters();
  }

  // Méthodes utilitaires
  private updateActiveFilters(): void {
    this.activeFilters = [];

    if (this.currentFilters.city) {
      this.activeFilters.push({
        key: 'city',
        label: `Ville: ${this.currentFilters.city}`,
        value: this.currentFilters.city
      });
    }

    if (this.currentFilters.priceMin) {
      this.activeFilters.push({
        key: 'priceMin',
        label: `Prix min: ${this.currentFilters.priceMin} XAF`,
        value: this.currentFilters.priceMin
      });
    }

    if (this.currentFilters.priceMax) {
      this.activeFilters.push({
        key: 'priceMax',
        label: `Prix max: ${this.currentFilters.priceMax} XAF`,
        value: this.currentFilters.priceMax
      });
    }

    if (this.currentFilters.propertyType) {
      this.activeFilters.push({
        key: 'propertyType',
        label: `Type: ${this.currentFilters.propertyType}`,
        value: this.currentFilters.propertyType
      });
    }

    if (this.currentFilters.amenities?.includes('kitchen')) {
      this.activeFilters.push({
        key: 'kitchen',
        label: 'Avec cuisine',
        value: 'kitchen'
      });
    }

    if (this.currentFilters.amenities?.includes('private_shower')) {
      this.activeFilters.push({
        key: 'private_shower',
        label: 'Douche privée',
        value: 'private_shower'
      });
    }

    if (this.currentFilters.amenities?.includes('parking')) {
      this.activeFilters.push({
        key: 'parking',
        label: 'Avec parking',
        value: 'parking'
      });
    }
  }

  private loadSavedSearches(): void {
    // Charger depuis le localStorage ou le serveur
    const saved = localStorage.getItem('savedSearches');
    if (saved) {
      try {
        this.savedSearches = JSON.parse(saved);
      } catch (error) {
        console.error('Erreur lors du chargement des recherches sauvegardées:', error);
        this.savedSearches = [];
      }
    }
  }

  private saveSavedSearches(): void {
    try {
      localStorage.setItem('savedSearches', JSON.stringify(this.savedSearches));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des recherches:', error);
    }
  }

}
