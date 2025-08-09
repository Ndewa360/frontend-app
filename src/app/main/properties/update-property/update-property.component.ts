import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store, Actions, ofActionSuccessful, ofActionErrored } from '@ngxs/store';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, filter, take } from 'rxjs/operators';
import { PropertyAction, PropertyModel, CountryState, CountryModel, CityModel, CityState } from 'src/app/shared/store';
import { FormUtils } from 'src/app/shared/utils';
import { CountryCityValue } from 'src/app/shared/components/geography-selectors';

export interface UpdatePropertyDialogData {
  property: PropertyModel;
}

@Component({
  selector: 'app-update-property',
  templateUrl: './update-property.component.html',
  styleUrls: ['./update-property.component.scss']
})
export class UpdatePropertyComponent implements OnInit {
  public formGroup: FormGroup;
  waittingResponse = false;
  currentStep = 1;
  currentYear = new Date().getFullYear();
  private destroy$ = new Subject<void>();

  // Plus besoin de ces propriétés avec le nouveau composant
  // @Select(CountryState.selectStateCountries) countries$: Observable<CountryModel[]>;
  // countriesList = [];
  // citiesList: CityModel[] = [];
  // selectedCitiesList = [];

  constructor(
    public dialogRef: MatDialogRef<UpdatePropertyComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UpdatePropertyDialogData,
    private formBuilder: FormBuilder,
    private _store: Store,
    private _ngxsAction: Actions
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setupSubscriptions();
    this.loadExistingValues();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    const property = this.data.property;
    
    this.formGroup = this.formBuilder.group({
      // Étape 1: Informations générales
      name: [property.name, [Validators.required]],
      propertyType: [property.propertyType || 'APARTMENT', [Validators.required]],
      totalSurface: [property.totalSurface],
      geolocation: [null, [Validators.required]], // Nouveau champ unifié
      location: [property.location, [Validators.required]],
      buildingYear: [property.buildingYear],
      floors: [property.floors || 1],
      description: [property.description],
      
      // Étape 2: Caractéristiques
      condition: [property.condition || 'GOOD'],
      furnishingStatus: [property.furnishingStatus || 'UNFURNISHED'],
      hasClosure: [property.hasClosure || false],
      hasParking: [property.hasParking || false],
      hasElevator: [property.hasElevator || false],
      hasWater: [property.hasWater !== false], // true par défaut
      hasInternet: [property.hasInternet || false],
      hasGenerator: [property.hasGenerator || false],
      hasGarden: [property.hasGarden || false],
      hasPool: [property.hasPool || false],
      hasGym: [property.hasGym || false],
      hasSecurity: [property.hasSecurity || false],
      
      // Étape 3: Finances
      acquisitionPrice: [property.acquisitionPrice],
      currentValue: [property.currentValue],
      rentMin: [property.rentRange?.min],
      rentMax: [property.rentRange?.max],
      monthlyCharges: [property.monthlyCharges],
      managementFees: [property.managementFees],
      propertyTax: [property.propertyTax],
      insuranceCost: [property.insuranceCost],
      contractTemplate: [property.contractTemplate]
    });
  }

  private setupSubscriptions(): void {
    this._ngxsAction.pipe(
      ofActionSuccessful(PropertyAction.UpdateProperty),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.waittingResponse = false;
      this.onClose(true);
    });

    this._ngxsAction.pipe(
      ofActionErrored(PropertyAction.UpdateProperty),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.waittingResponse = false;
    });

    // Plus besoin d'observer les changements de pays/villes
    // Le composant country-city-selector gère cela automatiquement
  }

  /**
   * Charger les valeurs existantes de la propriété
   */
  private loadExistingValues(): void {
    // Vérifier que les données de géolocalisation existent
    const hasCountry = this.data.property?.geolocationCountry;
    const hasCity = this.data.property?.geolocationCity;

    if (this.data.property && hasCountry && hasCity) {
      // Récupérer les objets complets depuis les stores
      combineLatest([
        this._store.select(CountryState.selectStateCountries),
        this._store.select(CityState.selectStateCities)
      ]).pipe(
        takeUntil(this.destroy$),
        filter(([countries, cities]: [CountryModel[], CityModel[]]) =>
          countries && countries.length > 0 && cities && cities.length > 0),
        take(1)
      ).subscribe(([countries, cities]: [CountryModel[], CityModel[]]) => {
        // Gérer le cas où geolocationCountry/City peuvent être des strings (IDs) ou des objets
        const countryId = typeof this.data.property.geolocationCountry === 'string'
          ? this.data.property.geolocationCountry
          : this.data.property.geolocationCountry?._id;

        const cityId = typeof this.data.property.geolocationCity === 'string'
          ? this.data.property.geolocationCity
          : this.data.property.geolocationCity?._id;

        const country = countries.find(c => c._id === countryId);
        const city = cities.find(c => c._id === cityId);

        if (country && city) {
          this.formGroup.patchValue({
            geolocation: {
              country: country,
              city: city
            }
          });
          console.log('Localisation existante chargée:', { country: country.fullName, city: city.fullName });
        } else {
          console.warn('Impossible de trouver le pays ou la ville dans les stores', { countryId, cityId });
        }
      });
    }

    // Charger le template de contrat si présent
    this.loadContractTemplate();
  }

  /**
   * Charger le template de contrat existant
   */
  private loadContractTemplate(): void {
    if (this.data.property?.contractTemplate) {
      console.log('Chargement du template de contrat:', this.data.property.contractTemplate);

      // Déterminer l'ID du template
      const templateId = typeof this.data.property.contractTemplate === 'string'
        ? this.data.property.contractTemplate
        : this.data.property.contractTemplate._id;

      if (templateId) {
        // Attendre que les templates soient chargés puis définir la valeur
        setTimeout(() => {
          this.formGroup.patchValue({
            contractTemplate: templateId
          });
          console.log('Template de contrat défini:', templateId);
        }, 500);
      }
    }
  }

  /**
   * Gérer le changement de localisation
   */
  onLocationChanged(location: CountryCityValue): void {
    console.log('Localisation mise à jour:', location);
    // Le FormControl 'geolocation' est automatiquement mis à jour
    if (location.country && location.city) {
      console.log(`Pays: ${location.country.fullName}, Ville: ${location.city.fullName}`);
    }
  }

  // Navigation entre les étapes
  nextStep(): void {
    if (this.currentStep < 3 && this.isStepValid(this.currentStep)) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  // Validation par étape
  isStepValid(step: number): boolean {
    switch (step) {
      case 1:
        return this.formGroup.get('name')?.valid &&
               this.formGroup.get('propertyType')?.valid &&
               this.formGroup.get('geolocation')?.valid &&
               this.formGroup.get('location')?.valid;
      case 2:
        return true; // Étape 2 est optionnelle
      case 3:
        return true; // Étape 3 est optionnelle
      default:
        return false;
    }
  }

  onSubmit(): void {
    this.formGroup.markAllAsTouched();

    if (this.formGroup.invalid) {
      return;
    }

    this.updateProperty();
  }

  private updateProperty(): void {
    this.waittingResponse = true;
    const formValue = this.formGroup.value;
    const location = formValue.geolocation;

    // Vérifier que la localisation est complète
    if (!location || !location.country || !location.city) {
      console.error('Localisation incomplète');
      this.waittingResponse = false;
      return;
    }

    // Exclure le champ geolocation du payload et ajouter les IDs séparément
    const { geolocation, ...cleanFormValue } = formValue;

    this._store.dispatch(new PropertyAction.UpdateProperty({
      ...FormUtils.removeNullAttribut(cleanFormValue),
      geolocationCity: typeof location.city === 'string' ? location.city : location.city._id,
      geolocationCountry: typeof location.country === 'string' ? location.country : location.country._id,
      
      // Propriétés existantes
      hasClosure: formValue.hasClosure || false,
      hasParking: formValue.hasParking || false,
      contractTemplate: formValue.contractTemplate,
      
      // Nouvelles propriétés
      propertyType: formValue.propertyType || 'APARTMENT',
      totalSurface: formValue.totalSurface || 0,
      buildingYear: formValue.buildingYear,
      floors: formValue.floors || 1,
      condition: formValue.condition || 'GOOD',
      furnishingStatus: formValue.furnishingStatus || 'UNFURNISHED',
      
      // Équipements
      hasElevator: formValue.hasElevator || false,
      hasWater: formValue.hasWater !== false,
      hasInternet: formValue.hasInternet || false,
      hasGenerator: formValue.hasGenerator || false,
      hasGarden: formValue.hasGarden || false,
      hasPool: formValue.hasPool || false,
      hasGym: formValue.hasGym || false,
      hasSecurity: formValue.hasSecurity || false,
      
      // Finances
      acquisitionPrice: formValue.acquisitionPrice || 0,
      currentValue: formValue.currentValue || 0,
      monthlyCharges: formValue.monthlyCharges || 0,
      managementFees: formValue.managementFees || 0,
      propertyTax: formValue.propertyTax || 0,
      insuranceCost: formValue.insuranceCost || 0,
      rentRange: {
        min: formValue.rentMin || 0,
        max: formValue.rentMax || 0
      }
    }, this.data.property._id));
  }

  onClose(updated: boolean = false): void {
    this.formGroup.reset();
    this.dialogRef.close(updated);
  }

  isValid(name: string): boolean {
    const instance = this.formGroup.get(name);
    return instance?.invalid && (instance?.dirty || instance?.touched);
  }
}
