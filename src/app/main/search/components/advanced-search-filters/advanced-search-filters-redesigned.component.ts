import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';

// Interfaces
export interface SearchFilters {
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

export interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  createdAt: Date;
}

interface City {
  value: string;
  label: string;
}

interface District {
  value: string;
  label: string;
  cityId: string;
}

interface PropertyType {
  value: string;
  label: string;
  icon: string;
  count: number;
}

interface Amenity {
  value: string;
  label: string;
  description: string;
  icon: string;
}

interface Preference {
  value: string;
  label: string;
  icon: string;
}

interface PriceSuggestion {
  label: string;
  min: number;
  max: number;
}

@Component({
  selector: 'app-advanced-search-filters-redesigned',
  templateUrl: './advanced-search-filters-redesigned.component.html',
  styleUrls: ['./advanced-search-filters-redesigned.component.scss']
})
export class AdvancedSearchFiltersRedesignedComponent implements OnInit, OnChanges {
  @Input() initialFilters: SearchFilters = {};
  @Input() resultCount: number = 0;
  @Input() canSaveSearch: boolean = false;

  @Output() filtersChanged = new EventEmitter<SearchFilters>();
  @Output() searchRequested = new EventEmitter<SearchFilters>();
  @Output() saveSearchRequested = new EventEmitter<SearchFilters>();
  @Output() resetRequested = new EventEmitter<void>();

  // État des filtres
  filters: SearchFilters = {};
  savedSearches: SavedSearch[] = [];

  // Configuration des données
  availableCities: City[] = [
    { value: 'douala', label: 'Douala' },
    { value: 'yaounde', label: 'Yaoundé' },
    { value: 'bafoussam', label: 'Bafoussam' },
    { value: 'bamenda', label: 'Bamenda' },
    { value: 'limbe', label: 'Limbé' },
    { value: 'kribi', label: 'Kribi' }
  ];

  districts: District[] = [
    // Douala
    { value: 'akwa', label: 'Akwa', cityId: 'douala' },
    { value: 'bonanjo', label: 'Bonanjo', cityId: 'douala' },
    { value: 'deido', label: 'Deido', cityId: 'douala' },
    { value: 'bonapriso', label: 'Bonapriso', cityId: 'douala' },
    { value: 'new-bell', label: 'New Bell', cityId: 'douala' },
    { value: 'makepe', label: 'Makepe', cityId: 'douala' },
    
    // Yaoundé
    { value: 'centre-ville', label: 'Centre-ville', cityId: 'yaounde' },
    { value: 'bastos', label: 'Bastos', cityId: 'yaounde' },
    { value: 'melen', label: 'Melen', cityId: 'yaounde' },
    { value: 'essos', label: 'Essos', cityId: 'yaounde' },
    { value: 'emana', label: 'Emana', cityId: 'yaounde' },
    { value: 'odza', label: 'Odza', cityId: 'yaounde' },
    
    // Bafoussam
    { value: 'centre', label: 'Centre', cityId: 'bafoussam' },
    { value: 'famla', label: 'Famla', cityId: 'bafoussam' },
    { value: 'djeleng', label: 'Djeleng', cityId: 'bafoussam' }
  ];

  propertyTypes: PropertyType[] = [
    { value: 'room', label: 'Chambre', icon: 'fas fa-bed', count: 0 },
    { value: 'studio', label: 'Studio', icon: 'fas fa-home', count: 0 },
    { value: 'apartment', label: 'Appartement', icon: 'fas fa-building', count: 0 },
    { value: 'house', label: 'Maison', icon: 'fas fa-house-user', count: 0 }
  ];

  amenitiesList: Amenity[] = [
    { 
      value: 'kitchen', 
      label: 'Cuisine équipée', 
      description: 'Cuisine avec équipements de base',
      icon: 'fas fa-utensils' 
    },
    { 
      value: 'private_shower', 
      label: 'Douche privée', 
      description: 'Salle de bain privative',
      icon: 'fas fa-shower' 
    },
    { 
      value: 'parking', 
      label: 'Parking', 
      description: 'Place de parking disponible',
      icon: 'fas fa-parking' 
    },
    { 
      value: 'security', 
      label: 'Sécurisé', 
      description: 'Gardien ou système de sécurité',
      icon: 'fas fa-shield-alt' 
    },
    { 
      value: 'furnished', 
      label: 'Meublé', 
      description: 'Logement avec mobilier',
      icon: 'fas fa-couch' 
    },
    { 
      value: 'wifi', 
      label: 'WiFi inclus', 
      description: 'Connexion internet incluse',
      icon: 'fas fa-wifi' 
    },
    { 
      value: 'air_conditioning', 
      label: 'Climatisation', 
      description: 'Système de climatisation',
      icon: 'fas fa-snowflake' 
    },
    { 
      value: 'balcony', 
      label: 'Balcon/Terrasse', 
      description: 'Espace extérieur privé',
      icon: 'fas fa-tree' 
    }
  ];

  preferencesList: Preference[] = [
    { value: 'pet_friendly', label: 'Animaux acceptés', icon: 'fas fa-paw' },
    { value: 'smoking_allowed', label: 'Fumeur accepté', icon: 'fas fa-smoking' },
    { value: 'students_welcome', label: 'Étudiants bienvenus', icon: 'fas fa-graduation-cap' },
    { value: 'short_term', label: 'Location courte durée', icon: 'fas fa-calendar-alt' },
    { value: 'couples_welcome', label: 'Couples acceptés', icon: 'fas fa-heart' },
    { value: 'quiet_area', label: 'Quartier calme', icon: 'fas fa-volume-mute' }
  ];

  roomNumbers: number[] = [1, 2, 3, 4, 5];

  // Configuration du slider de prix
  priceRange = {
    min: 10000,
    max: 500000,
    step: 5000
  };

  priceSuggestions: PriceSuggestion[] = [
    { label: 'Moins de 50k', min: 0, max: 50000 },
    { label: '50k - 100k', min: 50000, max: 100000 },
    { label: '100k - 200k', min: 100000, max: 200000 },
    { label: '200k - 300k', min: 200000, max: 300000 },
    { label: 'Plus de 300k', min: 300000, max: 1000000 }
  ];

  constructor() {}

  ngOnInit(): void {
    this.loadSavedSearches();
    this.loadPropertyTypeCounts();
    this.initializeFilters();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialFilters'] && changes['initialFilters'].currentValue) {
      this.filters = { ...this.initialFilters };
    }
  }

  // ===== INITIALISATION =====
  private initializeFilters(): void {
    this.filters = { ...this.initialFilters };
    
    // Initialiser les valeurs par défaut si nécessaire
    if (!this.filters.priceMin) this.filters.priceMin = this.priceRange.min;
    if (!this.filters.priceMax) this.filters.priceMax = this.priceRange.max;
    if (!this.filters.amenities) this.filters.amenities = [];
    if (!this.filters.preferences) this.filters.preferences = [];
  }

  private loadPropertyTypeCounts(): void {
    // Simuler le chargement des compteurs depuis l'API
    this.propertyTypes.forEach(type => {
      type.count = Math.floor(Math.random() * 100) + 10;
    });
  }

  private loadSavedSearches(): void {
    try {
      const saved = localStorage.getItem('savedSearches');
      if (saved) {
        this.savedSearches = JSON.parse(saved).map((search: any) => ({
          ...search,
          createdAt: new Date(search.createdAt)
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des recherches sauvegardées:', error);
      this.savedSearches = [];
    }
  }

  // ===== GESTION DES FILTRES =====
  onLocationChange(): void {
    // Réinitialiser le quartier si la ville change
    if (this.filters.district) {
      const currentDistrict = this.districts.find(d => d.value === this.filters.district);
      if (!currentDistrict || currentDistrict.cityId !== this.filters.city) {
        this.filters.district = undefined;
      }
    }
    this.emitFiltersChanged();
  }

  onDistrictChange(): void {
    this.emitFiltersChanged();
  }

  getDistrictsByCity(cityId?: string): District[] {
    if (!cityId) return [];
    return this.districts.filter(district => district.cityId === cityId);
  }

  // ===== GESTION DU PRIX =====
  onPriceChange(): void {
    // S'assurer que le prix min n'est pas supérieur au prix max
    if (this.filters.priceMin && this.filters.priceMax && this.filters.priceMin > this.filters.priceMax) {
      this.filters.priceMin = this.filters.priceMax;
    }
    this.emitFiltersChanged();
  }

  getPricePercentage(value: number): number {
    const range = this.priceRange.max - this.priceRange.min;
    return ((value - this.priceRange.min) / range) * 100;
  }

  formatPrice(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(0) + 'k';
    }
    return value.toString();
  }

  isPriceSuggestionActive(suggestion: PriceSuggestion): boolean {
    return this.filters.priceMin === suggestion.min && this.filters.priceMax === suggestion.max;
  }

  applyPriceSuggestion(suggestion: PriceSuggestion): void {
    this.filters.priceMin = suggestion.min;
    this.filters.priceMax = suggestion.max;
    this.emitFiltersChanged();
  }

  // ===== TYPES DE PROPRIÉTÉS =====
  selectPropertyType(type: string): void {
    if (this.filters.propertyType === type) {
      this.filters.propertyType = undefined;
    } else {
      this.filters.propertyType = type;
    }
    this.emitFiltersChanged();
  }

  // ===== CARACTÉRISTIQUES =====
  setRoomCount(count: number): void {
    if (this.filters.rooms === count) {
      this.filters.rooms = undefined;
    } else {
      this.filters.rooms = count;
    }
    this.emitFiltersChanged();
  }

  onAreaChange(): void {
    this.emitFiltersChanged();
  }

  // ===== ÉQUIPEMENTS =====
  isAmenitySelected(amenity: string): boolean {
    return this.filters.amenities?.includes(amenity) || false;
  }

  toggleAmenity(amenity: string): void {
    if (!this.filters.amenities) {
      this.filters.amenities = [];
    }

    const index = this.filters.amenities.indexOf(amenity);
    if (index > -1) {
      this.filters.amenities.splice(index, 1);
    } else {
      this.filters.amenities.push(amenity);
    }

    // Nettoyer le tableau si vide
    if (this.filters.amenities.length === 0) {
      this.filters.amenities = undefined;
    }

    this.emitFiltersChanged();
  }

  // ===== PRÉFÉRENCES =====
  isPreferenceSelected(preference: string): boolean {
    return this.filters.preferences?.includes(preference) || false;
  }

  togglePreference(preference: string): void {
    if (!this.filters.preferences) {
      this.filters.preferences = [];
    }

    const index = this.filters.preferences.indexOf(preference);
    if (index > -1) {
      this.filters.preferences.splice(index, 1);
    } else {
      this.filters.preferences.push(preference);
    }

    // Nettoyer le tableau si vide
    if (this.filters.preferences.length === 0) {
      this.filters.preferences = undefined;
    }

    this.emitFiltersChanged();
  }

  // ===== ACTIONS =====
  applyFilters(): void {
    this.searchRequested.emit({ ...this.filters });
  }

  resetAllFilters(): void {
    this.filters = {
      priceMin: this.priceRange.min,
      priceMax: this.priceRange.max,
      amenities: [],
      preferences: []
    };
    this.resetRequested.emit();
  }

  get hasActiveFilters(): boolean {
    return !!(
      this.filters.city ||
      this.filters.district ||
      this.filters.propertyType ||
      (this.filters.priceMin && this.filters.priceMin > this.priceRange.min) ||
      (this.filters.priceMax && this.filters.priceMax < this.priceRange.max) ||
      this.filters.rooms ||
      this.filters.minArea ||
      (this.filters.amenities && this.filters.amenities.length > 0) ||
      (this.filters.preferences && this.filters.preferences.length > 0)
    );
  }

  // ===== RECHERCHES SAUVEGARDÉES =====
  saveCurrentSearch(): void {
    const searchName = prompt('Nom de la recherche sauvegardée :');
    if (searchName && searchName.trim()) {
      const newSearch: SavedSearch = {
        id: Date.now().toString(),
        name: searchName.trim(),
        filters: { ...this.filters },
        createdAt: new Date()
      };

      this.savedSearches.unshift(newSearch);
      this.saveSavedSearches();
      this.saveSearchRequested.emit({ ...this.filters });
    }
  }

  loadSavedSearch(search: SavedSearch): void {
    this.filters = { ...search.filters };
    this.emitFiltersChanged();
    this.searchRequested.emit({ ...this.filters });
  }

  deleteSavedSearch(search: SavedSearch, event: Event): void {
    event.stopPropagation();
    if (confirm(`Supprimer la recherche "${search.name}" ?`)) {
      this.savedSearches = this.savedSearches.filter(s => s.id !== search.id);
      this.saveSavedSearches();
    }
  }

  getSearchCriteriaSummary(filters: SearchFilters): string {
    const criteria: string[] = [];

    if (filters.city) {
      const city = this.availableCities.find(c => c.value === filters.city);
      criteria.push(city?.label || filters.city);
    }

    if (filters.propertyType) {
      const type = this.propertyTypes.find(t => t.value === filters.propertyType);
      criteria.push(type?.label || filters.propertyType);
    }

    if (filters.priceMin || filters.priceMax) {
      const min = filters.priceMin || this.priceRange.min;
      const max = filters.priceMax || this.priceRange.max;
      criteria.push(`${this.formatPrice(min)} - ${this.formatPrice(max)}`);
    }

    if (filters.amenities && filters.amenities.length > 0) {
      criteria.push(`${filters.amenities.length} équipement(s)`);
    }

    return criteria.join(' • ') || 'Recherche personnalisée';
  }

  private saveSavedSearches(): void {
    try {
      localStorage.setItem('savedSearches', JSON.stringify(this.savedSearches));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des recherches:', error);
    }
  }

  // ===== UTILITAIRES =====
  private emitFiltersChanged(): void {
    this.filtersChanged.emit({ ...this.filters });
  }
}