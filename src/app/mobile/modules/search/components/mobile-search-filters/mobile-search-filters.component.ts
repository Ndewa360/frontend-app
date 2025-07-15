import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Store } from '@ngxs/store';
import { CityState } from '../../../../../shared/store';

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
  
  roomTypes = [
    { value: '', label: 'Tous les types' },
    { value: 'STUDIO', label: 'Studio' },
    { value: 'ROOM', label: 'Chambre' },
    { value: 'APARTMENT', label: 'Appartement' },
    { value: 'HOUSE', label: 'Maison' }
  ];

  sortOptions = [
    { value: 'price_asc', label: 'Prix croissant' },
    { value: 'price_desc', label: 'Prix décroissant' },
    { value: 'date_desc', label: 'Plus récents' },
    { value: 'rating_desc', label: 'Mieux notés' }
  ];

  priceRanges = [
    { min: 0, max: 50000, label: 'Moins de 50 000 FCFA' },
    { min: 50000, max: 100000, label: '50 000 - 100 000 FCFA' },
    { min: 100000, max: 200000, label: '100 000 - 200 000 FCFA' },
    { min: 200000, max: 500000, label: '200 000 - 500 000 FCFA' },
    { min: 500000, max: 0, label: 'Plus de 500 000 FCFA' }
  ];

  constructor(
    private modalController: ModalController,
    private formBuilder: FormBuilder,
    private store: Store
  ) {
    this.filterForm = this.createForm();
  }

  ngOnInit(): void {
    // Charger les villes si pas déjà fait
    this.loadCities();
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
   * Appliquer les filtres
   */
  applyFilters(): void {
    const formValue = this.filterForm.value;
    const filters: SearchFilters = {};

    // Traiter les valeurs du formulaire
    if (formValue.city) filters.city = formValue.city;
    if (formValue.minPrice) filters.minPrice = formValue.minPrice;
    if (formValue.maxPrice) filters.maxPrice = formValue.maxPrice;
    if (formValue.roomType) filters.roomType = formValue.roomType;
    
    // Équipements
    if (formValue.hasWifi) filters.hasWifi = true;
    if (formValue.hasAirConditioner) filters.hasAirConditioner = true;
    if (formValue.hasKitchen) filters.hasKitchen = true;
    if (formValue.hasParking) filters.hasParking = true;
    if (formValue.hasBalcony) filters.hasBalcony = true;
    if (formValue.hasSecurity) filters.hasSecurity = true;

    // Tri
    if (formValue.sortBy) {
      const [sortBy, sortOrder] = formValue.sortBy.split('_');
      filters.sortBy = sortBy;
      filters.sortOrder = sortOrder as 'asc' | 'desc';
    }

    this.modalController.dismiss(filters);
  }

  /**
   * Réinitialiser les filtres
   */
  resetFilters(): void {
    this.filterForm.reset();
    this.filterForm.patchValue({
      city: '',
      roomType: '',
      sortBy: 'price_asc'
    });
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
}
