import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { Subject, BehaviorSubject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { Store } from '@ngxs/store';

import { GeonamesService, TransformedCity } from '../../services/geonames.service';
import { AdminGeographyService } from '../../services/admin-geography.service';
import { AdminCountry } from '../../store/geography/admin-geography.model';
import { AdminGeographyState } from '../../store/geography/admin-geography.state';
import { AdminGeographyAction } from '../../store/geography/admin-geography.actions';

export interface CitySelectionResult {
  success: boolean;
  city?: any;
}

@Component({
  selector: 'app-city-selection-modal',
  templateUrl: './city-selection-modal.component.html',
  styleUrls: ['./city-selection-modal.component.scss']
})
export class CitySelectionModalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // États du modal
  currentStep: 'country' | 'city' = 'country';
  isLoading$ = new BehaviorSubject<boolean>(false);
  
  // Données
  countries: AdminCountry[] = [];
  cities: TransformedCity[] = [];
  filteredCities: TransformedCity[] = [];
  selectedCountry: AdminCountry | null = null;
  selectedCity: TransformedCity | null = null;
  
  // Contrôles de recherche
  countrySearchControl = new FormControl('');
  citySearchControl = new FormControl('');

  constructor(
    private dialogRef: MatDialogRef<CitySelectionModalComponent>,
    private geonamesService: GeonamesService,
    private adminGeographyService: AdminGeographyService,
    private toastr: ToastrService,
    private store: Store
  ) {}

  ngOnInit(): void {
    this.loadCountries();
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charger la liste des pays
   */
  private loadCountries(): void {
    this.store.select(AdminGeographyState.selectCountries).pipe(
      takeUntil(this.destroy$)
    ).subscribe(countries => {
      this.countries = countries.filter(country => country.isActive);
    });
  }

  /**
   * Configurer la recherche
   */
  private setupSearch(): void {
    // Recherche de pays
    this.countrySearchControl.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.filterCountries(searchTerm || '');
    });

    // Recherche de villes
    this.citySearchControl.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.filterCities(searchTerm || '');
    });
  }

  /**
   * Filtrer les pays
   */
  private filterCountries(searchTerm: string): void {
    // Le filtrage se fait déjà côté template avec le pipe
  }

  /**
   * Filtrer les villes
   */
  private filterCities(searchTerm: string): void {
    if (!searchTerm.trim()) {
      this.filteredCities = this.cities;
      return;
    }

    const term = searchTerm.toLowerCase();
    this.filteredCities = this.cities.filter(city =>
      city.name.toLowerCase().includes(term) ||
      city.region?.toLowerCase().includes(term)
    );
  }

  /**
   * Sélectionner un pays
   */
  onSelectCountry(country: AdminCountry): void {
    this.selectedCountry = country;
    this.isLoading$.next(true);
    
    this.geonamesService.getCitiesByCountry(country.code).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Erreur lors du chargement des villes:', error);
        this.toastr.error('Erreur lors du chargement des villes depuis Geonames', 'Erreur');
        this.isLoading$.next(false);
        throw error;
      })
    ).subscribe(cities => {
      this.cities = cities;
      this.filteredCities = cities;
      this.currentStep = 'city';
      this.isLoading$.next(false);
      this.citySearchControl.setValue('');
    });
  }

  /**
   * Sélectionner une ville
   */
  onSelectCity(city: TransformedCity): void {
    this.selectedCity = city;
  }

  /**
   * Confirmer la sélection
   */
  onConfirm(): void {
    if (!this.selectedCountry || !this.selectedCity) {
      this.toastr.warning('Veuillez sélectionner un pays et une ville', 'Sélection incomplète');
      return;
    }

    this.isLoading$.next(true);

    // Transformer les données pour le backend
    const cityData = this.geonamesService.transformCityForBackend(
      this.selectedCity, 
      this.selectedCountry._id
    );

    // Créer la ville via le store
    this.store.dispatch(new AdminGeographyAction.CreateCity(cityData)).pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Erreur lors de la création de la ville:', error);
        this.toastr.error('Erreur lors de la création de la ville', 'Erreur');
        this.isLoading$.next(false);
        throw error;
      })
    ).subscribe(() => {
      this.isLoading$.next(false);
      this.toastr.success(`La ville ${this.selectedCity!.name} a été ajoutée avec succès`, 'Succès');
      
      const result: CitySelectionResult = {
        success: true,
        city: {
          ...cityData,
          country: this.selectedCountry
        }
      };
      
      this.dialogRef.close(result);
    });
  }

  /**
   * Annuler la sélection
   */
  onCancel(): void {
    this.dialogRef.close({ success: false });
  }

  /**
   * Retourner à l'étape précédente
   */
  onBack(): void {
    if (this.currentStep === 'city') {
      this.currentStep = 'country';
      this.selectedCity = null;
      this.cities = [];
      this.filteredCities = [];
    }
  }

  /**
   * Obtenir les pays filtrés pour l'affichage
   */
  getFilteredCountries(): AdminCountry[] {
    const searchTerm = this.countrySearchControl.value?.toLowerCase() || '';
    if (!searchTerm.trim()) {
      return this.countries;
    }

    return this.countries.filter(country =>
      country.name.toLowerCase().includes(searchTerm) ||
      country.code.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Vérifier si une ville est sélectionnée
   */
  isCitySelected(city: TransformedCity): boolean {
    return this.selectedCity?.geonameId === city.geonameId;
  }

  /**
   * Obtenir le texte du bouton de confirmation
   */
  getConfirmButtonText(): string {
    if (this.isLoading$.value) {
      return 'Création en cours...';
    }
    return this.selectedCity ? `Ajouter ${this.selectedCity.name}` : 'Sélectionner une ville';
  }

  /**
   * Vérifier si la confirmation est possible
   */
  canConfirm(): boolean {
    return !!(this.selectedCountry && this.selectedCity && !this.isLoading$.value);
  }

  /**
   * TrackBy function pour les pays
   */
  trackByCountryId(index: number, country: AdminCountry): string {
    return country._id;
  }

  /**
   * TrackBy function pour les villes
   */
  trackByCityId(index: number, city: TransformedCity): number {
    return city.geonameId;
  }
}
