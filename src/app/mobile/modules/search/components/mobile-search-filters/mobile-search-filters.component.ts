import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Store } from '@ngxs/store';
import { CityState } from '../../../../../shared/store';
import { SmartFiltersService } from '../../../../../shared/services/smart-filters.service';
import { TranslateService } from '@ngx-translate/core';

export interface SearchFilters {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  roomType?: string;
  hasWifi?: boolean;
  hasAirConditioner?: boolean;
  hasKitchen?: boolean;
  hasParking?: boolean;
  hasBalcony?: boolean;
  hasSecurity?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Component({
  selector: 'app-mobile-search-filters',
  templateUrl: './mobile-search-filters.component.html',
  styleUrls: ['./mobile-search-filters.component.scss']
})
export class MobileSearchFiltersComponent implements OnInit {
  filterForm: FormGroup;
  cities$ = this.store.select(CityState.selectStateCities);
  
  // Types de logement (seront traduits dynamiquement)
  roomTypes: Array<{value: string, label: string}> = [];

  // Options de tri (seront traduites dynamiquement)
  sortOptions: Array<{value: string, label: string}> = [];

  // Gammes de prix prédéfinies (seront traduites dynamiquement)
  priceRanges: Array<{min: number, max: number, label: string}> = [];

  constructor(
    private modalController: ModalController,
    private formBuilder: FormBuilder,
    private store: Store,
    private smartFiltersService: SmartFiltersService,
    private translate: TranslateService
  ) {
    this.filterForm = this.createForm();
    this.initializeTranslatedOptions();
  }

  ngOnInit(): void {
    // Charger les villes si pas déjà fait
    this.loadCities();

    // Initialiser les filtres intelligents
    this.initializeSmartFilters();

    // Réinitialiser les options traduites si la langue change
    this.initializeTranslatedOptions();
  }

  /**
   * Créer le formulaire de filtres
   */
  private createForm(): FormGroup {
    return this.formBuilder.group({
      city: [''],
      minPrice: [null],
      maxPrice: [null],
      roomType: [''],
      hasWifi: [false],
      hasAirConditioner: [false],
      hasKitchen: [false],
      hasParking: [false],
      hasBalcony: [false],
      hasSecurity: [false],
      sortBy: ['price_asc']
    });
  }

  /**
   * Charger les villes
   */
  private loadCities(): void {
    // Les villes devraient déjà être chargées par le resolver public
    // Sinon, on peut dispatcher une action ici
  }

  /**
   * Initialiser les filtres intelligents
   */
  private initializeSmartFilters(): void {
    const defaultFilters = {
      city: '',
      minPrice: null,
      maxPrice: null,
      roomType: '',
      hasWifi: false,
      hasAirConditioner: false,
      hasKitchen: false,
      hasParking: false,
      hasBalcony: false,
      hasSecurity: false,
      sortBy: 'price_asc'
    };

    this.smartFiltersService.initializeFilters(defaultFilters);

    // Écouter les changements du formulaire
    this.filterForm.valueChanges.subscribe(formValue => {
      Object.keys(formValue).forEach(key => {
        this.smartFiltersService.updateFilter(key, formValue[key]);
      });
    });
  }

  /**
   * Appliquer les filtres
   */
  applyFilters(): void {
    // Utiliser les filtres intelligents pour obtenir seulement les filtres actifs
    const activeFilters = this.smartFiltersService.getActiveFilters();
    const filters: SearchFilters = {};

    // Traiter les filtres actifs
    Object.keys(activeFilters).forEach(key => {
      const value = activeFilters[key];

      switch (key) {
        case 'city':
        case 'roomType':
          if (value) filters[key] = value;
          break;
        case 'minPrice':
        case 'maxPrice':
          if (value !== null && value !== undefined) filters[key] = value;
          break;
        case 'hasWifi':
        case 'hasAirConditioner':
        case 'hasKitchen':
        case 'hasParking':
        case 'hasBalcony':
        case 'hasSecurity':
          if (value === true) filters[key] = true;
          break;
        case 'sortBy':
          if (value) {
            const [sortBy, sortOrder] = value.split('_');
            filters.sortBy = sortBy;
            filters.sortOrder = sortOrder as 'asc' | 'desc';
          }
          break;
      }
    });

    console.log('📱 Filtres mobiles appliqués:', filters);
    this.modalController.dismiss(filters);
  }

  /**
   * Réinitialiser les filtres
   */
  resetFilters(): void {
    this.smartFiltersService.resetFilters();

    // Mettre à jour le formulaire avec les valeurs par défaut
    const defaultValues = this.smartFiltersService.getAllFilters();
    this.filterForm.patchValue(defaultValues);
  }

  /**
   * Fermer le modal sans appliquer
   */
  dismiss(): void {
    this.modalController.dismiss();
  }

  /**
   * Sélectionner une gamme de prix prédéfinie
   */
  selectPriceRange(range: any): void {
    this.filterForm.patchValue({
      minPrice: range.min || null,
      maxPrice: range.max || null
    });
  }

  /**
   * Vérifier si une gamme de prix est sélectionnée
   */
  isPriceRangeSelected(range: any): boolean {
    const formValue = this.filterForm.value;
    return formValue.minPrice === (range.min || null) && 
           formValue.maxPrice === (range.max || null);
  }

  /**
   * Obtenir le nombre de filtres actifs
   */
  getActiveFiltersCount(): number {
    const formValue = this.filterForm.value;
    let count = 0;

    if (formValue.city) count++;
    if (formValue.minPrice || formValue.maxPrice) count++;
    if (formValue.roomType) count++;
    
    // Compter les équipements
    const amenities = ['hasWifi', 'hasAirConditioner', 'hasKitchen', 'hasParking', 'hasBalcony', 'hasSecurity'];
    count += amenities.filter(amenity => formValue[amenity]).length;

    return count;
  }

  /**
   * Formater le prix pour l'affichage
   */
  formatPrice(price: number): string {
    if (!price) return '';
    
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  /**
   * Initialise les options traduites
   */
  private initializeTranslatedOptions(): void {
    // Types de logement
    this.roomTypes = [
      { value: '', label: this.translate.instant('SEARCH.ALL_CITIES') },
      { value: 'STUDIO', label: this.translate.instant('ROOM_TYPES.STUDIO') },
      { value: 'ROOM', label: this.translate.instant('ROOM_TYPES.ROOM') },
      { value: 'APARTMENT', label: this.translate.instant('ROOM_TYPES.APARTMENT') },
      { value: 'HOUSE', label: this.translate.instant('ROOM_TYPES.HOUSE') }
    ];

    // Options de tri
    this.sortOptions = [
      { value: 'price_asc', label: this.translate.instant('SEARCH.SORT_PRICE_ASC') },
      { value: 'price_desc', label: this.translate.instant('SEARCH.SORT_PRICE_DESC') },
      { value: 'date_desc', label: this.translate.instant('SEARCH.SORT_NEWEST') },
      { value: 'rating_desc', label: this.translate.instant('SORT.RELEVANCE') }
    ];

    // Gammes de prix
    this.priceRanges = [
      { min: 0, max: 50000, label: this.translate.instant('SEARCH.PRICE_RANGES.UNDER_50K') },
      { min: 50000, max: 100000, label: this.translate.instant('SEARCH.PRICE_RANGES.50K_100K') },
      { min: 100000, max: 200000, label: this.translate.instant('SEARCH.PRICE_RANGES.100K_200K') },
      { min: 200000, max: 300000, label: this.translate.instant('SEARCH.PRICE_RANGES.200K_300K') },
      { min: 300000, max: 0, label: this.translate.instant('SEARCH.PRICE_RANGES.OVER_300K') }
    ];
  }
}
