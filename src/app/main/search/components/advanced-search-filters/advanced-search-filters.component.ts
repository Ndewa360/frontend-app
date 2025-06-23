import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { Select } from '@ngxs/store';
import { Observable } from 'rxjs';

import { BaseComponent } from 'src/app/shared/utils/base-component';
import { CityModel, CityState } from 'src/app/shared/store';

export interface SearchFilters {
  city?: string;
  district?: string;
  priceMin?: number;
  priceMax?: number;
  propertyType?: string;
  rooms?: number;
  amenities?: string[];
  preferences?: string[];
}

interface QuickFilter {
  id: string;
  label: string;
  active: boolean;
  filters: Partial<SearchFilters>;
}

interface PropertyType {
  value: string;
  label: string;
  icon: string;
}

interface Amenity {
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
  selector: 'app-advanced-search-filters',
  templateUrl: './advanced-search-filters.component.html',
  styleUrls: ['./advanced-search-filters.component.scss']
})
export class AdvancedSearchFiltersComponent extends BaseComponent implements OnInit {
  @Select(CityState.selectStateCities) cities$: Observable<CityModel[]>;

  @Input() initialFilters?: SearchFilters;
  @Input() resultCount: number = 0;
  @Input() canSaveSearch: boolean = false;

  @Output() filtersChanged = new EventEmitter<SearchFilters>();
  @Output() searchRequested = new EventEmitter<SearchFilters>();
  @Output() saveSearchRequested = new EventEmitter<SearchFilters>();
  @Output() resetRequested = new EventEmitter<void>();

  // Données pour les filtres modernes
  filters: SearchFilters = {
    city: '',
    district: '',
    priceMin: 0,
    priceMax: 500000,
    propertyType: '',
    rooms: 0,
    amenities: [],
    preferences: []
  };

  quickFilters: QuickFilter[] = [
    { id: 'budget', label: 'Petit budget', active: false, filters: { priceMax: 100000 } },
    { id: 'studio', label: 'Studio', active: false, filters: { rooms: 1 } },
    { id: 'family', label: 'Familial', active: false, filters: { rooms: 3 } },
    { id: 'luxury', label: 'Haut standing', active: false, filters: { priceMin: 300000 } }
  ];

  propertyTypes: PropertyType[] = [
    { value: 'studio', label: 'Studio', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z' },
    { value: 'apartment', label: 'Appartement', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h4M9 21v-4a2 2 0 012-2h2a2 2 0 012 2v4M9 21h6' },
    { value: 'house', label: 'Maison', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { value: 'villa', label: 'Villa', icon: 'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z' }
  ];

  amenitiesList: Amenity[] = [
    { value: 'parking', label: 'Parking', icon: 'M19 7h3v12h-3V7zM5 7H2v12h3V7zm7-5h2v2h-2V2zm0 17h2v2h-2v-2z' },
    { value: 'security', label: 'Sécurité 24h/24', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { value: 'wifi', label: 'Internet/WiFi', icon: 'M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0' },
    { value: 'water', label: 'Eau courante', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547A1.998 1.998 0 004 17.658V18a2 2 0 002 2h12a2 2 0 002-2v-.342a1.998 1.998 0 00-.572-1.415z' },
    { value: 'generator', label: 'Générateur', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { value: 'kitchen', label: 'Cuisine équipée', icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16l3-3m-3 3l-3-3' }
  ];

  preferencesList: Amenity[] = [
    { value: 'pets', label: 'Animaux acceptés', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
    { value: 'students', label: 'Étudiants bienvenus', icon: 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' },
    { value: 'furnished', label: 'Meublé', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z' },
    { value: 'short_term', label: 'Location courte durée', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' }
  ];

  priceSuggestions: PriceSuggestion[] = [
    { label: '< 50k', min: 0, max: 50000 },
    { label: '50k - 100k', min: 50000, max: 100000 },
    { label: '100k - 200k', min: 100000, max: 200000 },
    { label: '200k - 300k', min: 200000, max: 300000 },
    { label: '> 300k', min: 300000, max: 1000000 }
  ];

  priceRange = { min: 0, max: 500000 };
  roomNumbers = [1, 2, 3, 4, 5];

  constructor() {
    super();
  }

  ngOnInit(): void {
    if (this.initialFilters) {
      this.filters = { ...this.filters, ...this.initialFilters };
    }
  }

  // Méthodes pour les filtres rapides
  applyQuickFilter(filter: QuickFilter): void {
    filter.active = !filter.active;

    if (filter.active) {
      // Désactiver les autres filtres rapides
      this.quickFilters.forEach(f => {
        if (f.id !== filter.id) f.active = false;
      });

      // Appliquer les filtres
      this.filters = { ...this.filters, ...filter.filters };
    } else {
      // Réinitialiser les filtres du filtre rapide
      Object.keys(filter.filters).forEach(key => {
        if (key in this.filters) {
          (this.filters as any)[key] = this.getDefaultValue(key);
        }
      });
    }

    this.emitFiltersChange();
  }

  private getDefaultValue(key: string): any {
    const defaults: any = {
      city: '',
      district: '',
      priceMin: 0,
      priceMax: 500000,
      propertyType: '',
      rooms: 0,
      amenities: [],
      preferences: []
    };
    return defaults[key];
  }

  // Méthodes pour la gestion des filtres
  private emitFiltersChange(): void {
    this.filtersChanged.emit({ ...this.filters });
  }

  onLocationChange(): void {
    this.emitFiltersChange();
  }

  onPriceChange(): void {
    this.emitFiltersChange();
  }

  getPricePercentage(value: number): number {
    return ((value - this.priceRange.min) / (this.priceRange.max - this.priceRange.min)) * 100;
  }

  setPriceSuggestion(suggestion: PriceSuggestion): void {
    this.filters.priceMin = suggestion.min;
    this.filters.priceMax = suggestion.max;
    this.emitFiltersChange();
  }

  setPropertyType(type: string): void {
    this.filters.propertyType = this.filters.propertyType === type ? '' : type;
    this.emitFiltersChange();
  }

  setRoomFilter(rooms: number): void {
    this.filters.rooms = this.filters.rooms === rooms ? 0 : rooms;
    this.emitFiltersChange();
  }

  toggleAmenity(amenity: string): void {
    if (!this.filters.amenities) this.filters.amenities = [];

    const index = this.filters.amenities.indexOf(amenity);
    if (index > -1) {
      this.filters.amenities.splice(index, 1);
    } else {
      this.filters.amenities.push(amenity);
    }
    this.emitFiltersChange();
  }

  togglePreference(preference: string): void {
    if (!this.filters.preferences) this.filters.preferences = [];

    const index = this.filters.preferences.indexOf(preference);
    if (index > -1) {
      this.filters.preferences.splice(index, 1);
    } else {
      this.filters.preferences.push(preference);
    }
    this.emitFiltersChange();
  }

  // Actions principales
  clearAllFilters(): void {
    this.resetFilters();
  }

  applyFilters(): void {
    this.searchRequested.emit({ ...this.filters });
  }

  resetFilters(): void {
    this.filters = {
      city: '',
      district: '',
      priceMin: 0,
      priceMax: 500000,
      propertyType: '',
      rooms: 0,
      amenities: [],
      preferences: []
    };

    // Réinitialiser les filtres rapides
    this.quickFilters.forEach(filter => filter.active = false);

    this.resetRequested.emit();
    this.emitFiltersChange();
  }

  saveSearch(): void {
    if (this.canSaveSearch) {
      this.saveSearchRequested.emit({ ...this.filters });
    }
  }

  // Méthodes utilitaires
  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(price);
  }

  getDistrictsByCity(city: string): { value: string; label: string }[] {
    // Simulation de données - à remplacer par des données réelles
    const districts: { [key: string]: { value: string; label: string }[] } = {
      'douala': [
        { value: 'akwa', label: 'Akwa' },
        { value: 'bonanjo', label: 'Bonanjo' },
        { value: 'deido', label: 'Deido' },
        { value: 'bonapriso', label: 'Bonapriso' }
      ],
      'yaounde': [
        { value: 'centre', label: 'Centre-ville' },
        { value: 'bastos', label: 'Bastos' },
        { value: 'melen', label: 'Melen' },
        { value: 'nlongkak', label: 'Nlongkak' }
      ]
    };

    return districts[city] || [];
  }
}
