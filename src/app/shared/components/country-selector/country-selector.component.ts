import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl } from '@angular/forms';
import { Observable, Subject, BehaviorSubject, combineLatest } from 'rxjs';
import { takeUntil, map, startWith, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Store, Select } from '@ngxs/store';
import { CountryState, CountryAction } from '../../store/country';
import { CountryModel } from '../../store/country/country.model';

/**
 * 🌍 COMPOSANT SÉLECTEUR DE PAYS
 * 
 * Composant personnalisé pour sélectionner un pays avec :
 * - Autocomplétion avec recherche
 * - Affichage du drapeau
 * - Intégration avec le store NGXS
 * - Support des formulaires réactifs
 * - Gestion des valeurs présélectionnées
 */

@Component({
  selector: 'app-country-selector',
  templateUrl: './country-selector.component.html',
  styleUrls: ['./country-selector.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CountrySelectorComponent),
      multi: true
    }
  ]
})
export class CountrySelectorComponent implements OnInit, OnDestroy, ControlValueAccessor {
  private destroy$ = new Subject<void>();
  private onChange = (value: any) => {};
  private onTouched = () => {};

  // Inputs
  @Input() placeholder: string = 'Sélectionner un pays';
  @Input() disabled: boolean = false;
  @Input() required: boolean = false;
  @Input() showFlag: boolean = true;
  @Input() showCode: boolean = true;
  @Input() preselectedCountryId: string | null = null;

  // Outputs
  @Output() countrySelected = new EventEmitter<CountryModel>();
  @Output() countryCleared = new EventEmitter<void>();

  // Form controls
  searchControl = new FormControl('');
  
  // Observables
  @Select(CountryState.selectStateCountries) countries$: Observable<CountryModel[]>;
  @Select(CountryState.selectStateLoading) loading$: Observable<boolean>;

  // Component state
  filteredCountries$ = new BehaviorSubject<CountryModel[]>([]);
  selectedCountry: CountryModel | null = null;
  isOpen = false;
  isInitialized = false;

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.initializeComponent();
    this.setupSearch();
    this.loadCountries();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialiser le composant
   */
  private initializeComponent(): void {
    // Observer les changements de pays depuis le store
    this.countries$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(countries => {
      if (countries && countries.length > 0) {
        this.filteredCountries$.next(countries);
        
        // Si un pays est présélectionné, le sélectionner
        if (this.preselectedCountryId && !this.isInitialized) {
          this.selectPreselectedCountry(countries);
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
      this.countries$
    ]).pipe(
      takeUntil(this.destroy$),
      map(([searchTerm, countries]) => {
        if (!searchTerm || searchTerm.trim() === '') {
          return countries || [];
        }
        
        const term = searchTerm.toLowerCase().trim();
        return (countries || []).filter(country =>
          country.fullName?.toLowerCase().includes(term) ||
          country.shortName?.toLowerCase().includes(term)
        );
      })
    ).subscribe(filtered => {
      this.filteredCountries$.next(filtered);
    });
  }

  /**
   * Charger les pays depuis le store
   */
  private loadCountries(): void {
    // Dispatcher l'action pour charger les pays si nécessaire
    const currentCountries = this.store.selectSnapshot(CountryState.selectStateCountries);
    if (!currentCountries || currentCountries.length === 0) {
      this.store.dispatch(new CountryAction.FetchCountries());
    }
  }

  /**
   * Sélectionner le pays présélectionné
   */
  private selectPreselectedCountry(countries: CountryModel[]): void {
    if (this.preselectedCountryId) {
      const preselectedCountry = countries.find(c => c._id === this.preselectedCountryId);
      if (preselectedCountry) {
        this.selectCountry(preselectedCountry, false);
      }
    }
  }

  /**
   * Sélectionner un pays
   */
  selectCountry(country: CountryModel, emitChange: boolean = true): void {
    this.selectedCountry = country;
    this.searchControl.setValue(country.fullName, { emitEvent: false });
    this.isOpen = false;
    
    if (emitChange) {
      this.onChange(country);
      this.onTouched();
      this.countrySelected.emit(country);
    }
  }

  /**
   * Effacer la sélection
   */
  clearSelection(): void {
    this.selectedCountry = null;
    this.searchControl.setValue('', { emitEvent: false });
    this.onChange(null);
    this.onTouched();
    this.countryCleared.emit();
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
  onOptionClick(country: CountryModel): void {
    this.selectCountry(country);
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
    // Délai pour permettre le clic sur une option
    setTimeout(() => {
      this.closeDropdown();
    }, 200);
  }

  /**
   * Obtenir le texte d'affichage pour un pays
   */
  getDisplayText(country: CountryModel): string {
    if (!country) return '';

    let text = country.fullName || country.shortName || '';

    if (this.showCode && country.iso2) {
      text += ` (${country.iso2})`;
    }

    return text;
  }

  /**
   * Obtenir l'emoji du drapeau
   */
  getFlagEmoji(country: CountryModel): string {
    return country.flag || '🏳️';
  }

  /**
   * TrackBy function pour la performance
   */
  trackByCountryId(index: number, country: CountryModel): string {
    return country._id;
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    if (value && typeof value === 'object' && value._id) {
      // Si c'est un objet pays complet
      this.selectedCountry = value;
      this.searchControl.setValue(value.fullName, { emitEvent: false });
    } else if (typeof value === 'string') {
      // Si c'est juste un ID, on le stocke pour la présélection
      this.preselectedCountryId = value;
    } else {
      // Valeur nulle ou vide
      this.selectedCountry = null;
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
}
