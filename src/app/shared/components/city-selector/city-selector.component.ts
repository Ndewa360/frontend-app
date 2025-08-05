import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl, Validator, NG_VALIDATORS, AbstractControl, ValidationErrors } from '@angular/forms';
import { Observable, Subject, BehaviorSubject, combineLatest } from 'rxjs';
import { takeUntil, map, startWith, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Store, Select } from '@ngxs/store';
import { CityState, CityAction } from '../../store/city';
import { CityModel } from '../../store/city/city.model';
import { CountryModel } from '../../store/country/country.model';

/**
 * 🏙️ COMPOSANT SÉLECTEUR DE VILLE
 * 
 * Composant personnalisé pour sélectionner une ville avec :
 * - Autocomplétion avec recherche
 * - Filtrage par pays
 * - Intégration avec le store NGXS
 * - Support des formulaires réactifs
 * - Gestion des valeurs présélectionnées
 */

@Component({
  selector: 'app-city-selector',
  templateUrl: './city-selector.component.html',
  styleUrls: ['./city-selector.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CitySelectorComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => CitySelectorComponent),
      multi: true
    }
  ]
})
export class CitySelectorComponent implements OnInit, OnDestroy, OnChanges, ControlValueAccessor, Validator {
  private destroy$ = new Subject<void>();
  private onChange = (value: any) => {};
  private onTouched = () => {};

  // Inputs
  @Input() placeholder: string = 'Sélectionner une ville';
  @Input() disabled: boolean = false;
  @Input() required: boolean = false;
  @Input() countryFilter: CountryModel | null = null; // Filtrer par pays
  @Input() preselectedCityId: string | null = null;
  @Input() showRegion: boolean = true;
  @Input() showPopulation: boolean = false;

  // Outputs
  @Output() citySelected = new EventEmitter<CityModel>();
  @Output() cityCleared = new EventEmitter<void>();

  // Form controls
  searchControl = new FormControl('');
  
  // Observables
  @Select(CityState.selectStateCities) cities$: Observable<CityModel[]>;
  @Select(CityState.selectStateLoading) loading$: Observable<boolean>;

  // Component state
  filteredCities$ = new BehaviorSubject<CityModel[]>([]);
  selectedCity: CityModel | null = null;
  isOpen = false;
  isInitialized = false;

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.initializeComponent();
    this.setupSearch();
    this.loadCities();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Réagir aux changements du filtre de pays
    if (changes['countryFilter'] && !changes['countryFilter'].firstChange) {
      this.updateCityFilter();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialiser le composant
   */
  private initializeComponent(): void {
    // Observer les changements de villes depuis le store
    this.cities$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(cities => {
      if (cities && cities.length > 0) {
        const filteredCities = this.filterCitiesByCountry(cities);
        this.filteredCities$.next(filteredCities);
        
        // Si une ville est présélectionnée, la sélectionner
        if (this.preselectedCityId && !this.isInitialized) {
          this.selectPreselectedCity(cities);
        }
        
        this.isInitialized = true;
      }
    });
  }

  /**
   * Configurer la recherche avec autocomplétion
   */
  private setupSearch(): void {
    combineLatest([
      this.searchControl.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged()
      ),
      this.cities$
    ]).pipe(
      takeUntil(this.destroy$),
      map(([searchTerm, cities]) => {
        let filteredCities = this.filterCitiesByCountry(cities || []);
        
        if (!searchTerm || searchTerm.trim() === '') {
          return filteredCities;
        }
        
        const term = searchTerm.toLowerCase().trim();
        return filteredCities.filter(city =>
          city.fullName?.toLowerCase().includes(term) ||
          city.region?.toLowerCase().includes(term)
        );
      })
    ).subscribe(filtered => {
      this.filteredCities$.next(filtered);
    });
  }

  /**
   * Mettre à jour le filtre des villes quand le pays change
   */
  private updateCityFilter(): void {
    this.cities$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(cities => {
      if (cities && cities.length > 0) {
        const filteredCities = this.filterCitiesByCountry(cities);
        this.filteredCities$.next(filteredCities);

        // Si la ville sélectionnée n'est plus dans la liste filtrée, la désélectionner
        if (this.selectedCity && !filteredCities.find(c => c._id === this.selectedCity!._id)) {
          this.clearSelection();
        }
      }
    });
  }

  /**
   * Filtrer les villes par pays si un filtre est appliqué
   */
  private filterCitiesByCountry(cities: CityModel[]): CityModel[] {
    if (!this.countryFilter || !this.countryFilter._id) {
      return cities;
    }
    
    return cities.filter(city =>
      city.country === this.countryFilter._id ||
      (typeof city.country === 'object' && city.country?._id === this.countryFilter._id)
    );
  }

  /**
   * Charger les villes depuis le store
   */
  private loadCities(): void {
    // Dispatcher l'action pour charger les villes si nécessaire
    const currentCities = this.store.selectSnapshot(CityState.selectStateCities);
    if (!currentCities || currentCities.length === 0) {
      this.store.dispatch(new CityAction.LoadAllCities());
    }
  }

  /**
   * Sélectionner la ville présélectionnée
   */
  private selectPreselectedCity(cities: CityModel[]): void {
    if (this.preselectedCityId) {
      const preselectedCity = cities.find(c => c._id === this.preselectedCityId);
      if (preselectedCity) {
        this.selectCity(preselectedCity, false);
      }
    }
  }

  /**
   * Sélectionner une ville
   */
  selectCity(city: CityModel, emitChange: boolean = true): void {
    this.selectedCity = city;
    this.searchControl.setValue(city.fullName, { emitEvent: false });
    this.isOpen = false;
    
    if (emitChange) {
      this.onChange(city);
      this.onTouched();
      this.citySelected.emit(city);
    }
  }

  /**
   * Effacer la sélection
   */
  clearSelection(): void {
    this.selectedCity = null;
    this.searchControl.setValue('', { emitEvent: false });
    this.onChange(null);
    this.onTouched();
    this.cityCleared.emit();
  }

  /**
   * Ouvrir/fermer le dropdown
   */
  toggleDropdown(): void {
    if (!this.disabled) {
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        this.onTouched();
      }
    }
  }

  /**
   * Fermer le dropdown
   */
  closeDropdown(): void {
    this.isOpen = false;
  }

  /**
   * Gérer le clic sur une option
   */
  onOptionClick(city: CityModel): void {
    this.selectCity(city);
  }

  /**
   * Gérer l'entrée de la souris sur le dropdown
   */
  onDropdownMouseEnter(): void {
    this.isDropdownHovered = true;
  }

  /**
   * Gérer la sortie de la souris du dropdown
   */
  onDropdownMouseLeave(): void {
    this.isDropdownHovered = false;
  }

  /**
   * Gérer le focus sur l'input
   */
  onInputFocus(): void {
    if (!this.disabled) {
      this.isOpen = true;
      this.onTouched();
    }
  }

  /**
   * Gérer la perte de focus
   */
  onInputBlur(): void {
    // Délai plus long pour permettre le clic sur une option
    // et éviter la fermeture prématurée du dropdown
    setTimeout(() => {
      if (!this.isDropdownHovered) {
        this.closeDropdown();
      }
    }, 300);
  }

  /**
   * Propriété pour tracker si la souris est sur le dropdown
   */
  isDropdownHovered = false;

  /**
   * Obtenir le texte d'affichage pour une ville
   */
  getDisplayText(city: CityModel): string {
    if (!city) return '';
    return city.fullName || '';
  }

  /**
   * Obtenir les détails d'une ville (région, population)
   */
  getCityDetails(city: CityModel): string {
    const details = [];
    
    if (this.showRegion && city.region) {
      details.push(city.region);
    }
    
    if (this.showPopulation && city.population && city.population > 0) {
      details.push(`${this.formatPopulation(city.population)} hab.`);
    }
    
    return details.join(' • ');
  }

  /**
   * Formater la population
   */
  private formatPopulation(population: number): string {
    if (population >= 1000000) {
      return `${(population / 1000000).toFixed(1)}M`;
    } else if (population >= 1000) {
      return `${(population / 1000).toFixed(0)}K`;
    }
    return population.toString();
  }

  /**
   * TrackBy function pour la performance
   */
  trackByCityId(index: number, city: CityModel): string {
    return city._id;
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    if (value && typeof value === 'object' && value._id) {
      // Si c'est un objet ville complet
      this.selectedCity = value;
      this.searchControl.setValue(value.fullName, { emitEvent: false });
    } else if (typeof value === 'string') {
      // Si c'est juste un ID, on le stocke pour la présélection
      this.preselectedCityId = value;
    } else {
      // Valeur nulle ou vide
      this.selectedCity = null;
      this.searchControl.setValue('', { emitEvent: false });
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) {
      this.searchControl.disable();
    } else {
      this.searchControl.enable();
    }
  }

  // Validator implementation
  validate(control: AbstractControl): ValidationErrors | null {
    if (this.required && !control.value) {
      return { 'cityRequired': { message: 'La ville est obligatoire' } };
    }
    return null;
  }
}
