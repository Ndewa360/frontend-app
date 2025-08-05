import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormBuilder, FormGroup, Validator, NG_VALIDATORS, AbstractControl, ValidationErrors } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CountryModel } from '../../store/country/country.model';
import { CityModel } from '../../store/city/city.model';

export interface CountryCityValue {
  country: CountryModel | null;
  city: CityModel | null;
}

/**
 * 🌍🏙️ COMPOSANT SÉLECTEUR PAYS + VILLE
 * 
 * Composant combiné pour sélectionner un pays et une ville avec :
 * - Sélection de pays avec drapeau
 * - Sélection de ville filtrée par pays
 * - Gestion des valeurs présélectionnées
 * - Support des formulaires réactifs
 * - Validation automatique
 */

@Component({
  selector: 'app-country-city-selector',
  templateUrl: './country-city-selector.component.html',
  styleUrls: ['./country-city-selector.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CountryCitySelectorComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => CountryCitySelectorComponent),
      multi: true
    }
  ]
})
export class CountryCitySelectorComponent implements OnInit, OnDestroy, ControlValueAccessor, Validator {
  private destroy$ = new Subject<void>();
  private onChange = (value: CountryCityValue) => {};
  private onTouched = () => {};

  // Inputs
  @Input() countryPlaceholder: string = 'Sélectionner un pays';
  @Input() cityPlaceholder: string = 'Sélectionner une ville';
  @Input() disabled: boolean = false;
  @Input() countryRequired: boolean = true;
  @Input() cityRequired: boolean = true;
  @Input() showCountryFlag: boolean = true;
  @Input() showCountryCode: boolean = true;
  @Input() showCityRegion: boolean = true;
  @Input() showCityPopulation: boolean = false;
  @Input() layout: 'horizontal' | 'vertical' = 'horizontal';

  /**
   * Contrôle l'affichage des erreurs de validation. Doit être passé par le parent (ex: après clic sur "Suivant").
   */
  @Input() showValidationErrors: boolean = false;

  // Valeurs présélectionnées
  @Input() preselectedCountryId: string | null = null;
  @Input() preselectedCityId: string | null = null;

  // Outputs
  @Output() countrySelected = new EventEmitter<CountryModel>();
  @Output() citySelected = new EventEmitter<CityModel>();
  @Output() selectionChanged = new EventEmitter<CountryCityValue>();

  // Form
  selectorForm: FormGroup;

  // Component state
  selectedCountry: CountryModel | null = null;
  selectedCity: CityModel | null = null;
  isCityDisabled = true;

  constructor(private formBuilder: FormBuilder) {
    this.selectorForm = this.formBuilder.group({
      country: [null],
      city: [null]
    });
  }

  ngOnInit(): void {
    this.setupFormSubscriptions();
    this.initializePreselectedValues();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Configurer les souscriptions du formulaire
   */
  private setupFormSubscriptions(): void {
    // Observer les changements de pays
    this.selectorForm.get('country')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(country => {
      this.onCountryChange(country);
    });

    // Observer les changements de ville
    this.selectorForm.get('city')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(city => {
      this.onCityChange(city);
    });
  }

  /**
   * Initialiser les valeurs présélectionnées
   */
  private initializePreselectedValues(): void {
    if (this.preselectedCountryId || this.preselectedCityId) {
      // Les valeurs seront définies via writeValue ou les inputs
      setTimeout(() => {
        this.updateCityState();
      }, 100);
    }
  }

  /**
   * Gérer le changement de pays
   */
  private onCountryChange(country: CountryModel | null): void {
    this.selectedCountry = country;

    // Toujours réinitialiser la ville quand le pays change
    // pour forcer la mise à jour du sélecteur de ville
    if (country) {
      // Si on a une ville sélectionnée, vérifier si elle appartient au nouveau pays
      if (this.selectedCity) {
        const cityCountryId = typeof this.selectedCity.country === 'string'
          ? this.selectedCity.country
          : this.selectedCity.country?._id;

        if (cityCountryId !== country._id) {
          // La ville ne correspond pas au nouveau pays, la réinitialiser
          this.selectedCity = null;
          this.selectorForm.get('city')?.setValue(null, { emitEvent: false });
        }
      }
    } else {
      // Pas de pays sélectionné, réinitialiser la ville
      this.selectedCity = null;
      this.selectorForm.get('city')?.setValue(null, { emitEvent: false });
    }

    this.updateCityState();
    this.emitChanges();
    this.countrySelected.emit(country);
  }

  /**
   * Gérer le changement de ville
   */
  private onCityChange(city: CityModel | null): void {
    this.selectedCity = city;
    this.emitChanges();
    this.citySelected.emit(city);
  }

  /**
   * Mettre à jour l'état du sélecteur de ville
   */
  private updateCityState(): void {
    this.isCityDisabled = !this.selectedCountry || this.disabled;

    // Forcer la mise à jour du composant city-selector en changeant la référence
    // Cela déclenche la détection de changement et la mise à jour de la liste des villes
    if (this.selectedCountry) {
      // Créer une nouvelle référence pour déclencher ngOnChanges dans city-selector
      this.selectedCountry = { ...this.selectedCountry };
    }
  }

  /**
   * Émettre les changements
   */
  private emitChanges(): void {
    const value: CountryCityValue = {
      country: this.selectedCountry,
      city: this.selectedCity
    };

    this.onChange(value);
    this.onTouched();
    this.selectionChanged.emit(value);
  }

  /**
   * Gérer la sélection de pays depuis le composant enfant
   */
  onCountrySelected(country: CountryModel): void {
    this.selectorForm.get('country')?.setValue(country);
  }

  /**
   * Gérer la sélection de ville depuis le composant enfant
   */
  onCitySelected(city: CityModel): void {
    this.selectorForm.get('city')?.setValue(city);
  }

  /**
   * Gérer l'effacement du pays
   */
  onCountryCleared(): void {
    this.selectorForm.get('country')?.setValue(null);
  }

  /**
   * Gérer l'effacement de la ville
   */
  onCityCleared(): void {
    this.selectorForm.get('city')?.setValue(null);
  }

  /**
   * Effacer toute la sélection
   */
  clearAll(): void {
    this.selectorForm.reset();
    this.selectedCountry = null;
    this.selectedCity = null;
    this.updateCityState();
    this.emitChanges();
  }

  /**
   * Vérifier si la sélection est valide
   */
  isValid(): boolean {
    const countryValid = !this.countryRequired || !!this.selectedCountry;
    const cityValid = !this.cityRequired || !!this.selectedCity;
    return countryValid && cityValid;
  }

  /**
   * Obtenir les erreurs de validation
   */
  getValidationErrors(): string[] {
    const errors: string[] = [];
    if (this.countryRequired && !this.selectedCountry) {
      errors.push('Le pays est obligatoire');
    }
    if (this.cityRequired && !this.selectedCity) {
      errors.push('La ville est obligatoire');
    }
    return errors;
  }

  // ControlValueAccessor implementation
  writeValue(value: CountryCityValue | null): void {
    if (value) {
      this.selectedCountry = value.country;
      this.selectedCity = value.city;
      
      this.selectorForm.patchValue({
        country: value.country,
        city: value.city
      }, { emitEvent: false });
      
      this.updateCityState();
    } else {
      this.clearAll();
    }
  }

  registerOnChange(fn: (value: CountryCityValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.updateCityState();

    if (isDisabled) {
      this.selectorForm.disable();
    } else {
      this.selectorForm.enable();
    }
  }

  // Validator implementation
  validate(control: AbstractControl): ValidationErrors | null {
    // Si le contrôle n'a pas de valeur, vérifier les exigences
    if (!control.value) {
      const errors: ValidationErrors = {};

      if (this.countryRequired) {
        errors['countryRequired'] = { message: 'Le pays est obligatoire' };
      }

      if (this.cityRequired) {
        errors['cityRequired'] = { message: 'La ville est obligatoire' };
      }

      return Object.keys(errors).length > 0 ? errors : null;
    }

    // Si le contrôle a une valeur, vérifier qu'elle est complète
    const value = control.value as CountryCityValue;
    const errors: ValidationErrors = {};

    if (this.countryRequired && !value.country) {
      errors['countryRequired'] = { message: 'Le pays est obligatoire' };
    }

    if (this.cityRequired && !value.city) {
      errors['cityRequired'] = { message: 'La ville est obligatoire' };
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }
}
