import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store, Select, Actions, ofActionSuccessful, ofActionErrored } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PropertyAction, PropertyModel, CountryState, CountryModel, CityModel } from 'src/app/shared/store';
import { FormUtils } from 'src/app/shared/utils';

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

  @Select(CountryState.selectStateCountries) countries$: Observable<CountryModel[]>;
  
  countriesList = [];
  citiesList: CityModel[] = [];
  selectedCitiesList = [];

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
    this.loadCountries();
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
      geolocationCountry: [null, [Validators.required]], // Sera rempli après chargement des pays
      geolocationCity: [null, [Validators.required]], // Sera rempli après chargement des villes
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

    // Observer les changements de pays pour charger les villes
    this.formGroup.get('geolocationCountry')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(country => {
        console.log("Country cities ",country)
        if (country?.cities) {
          this.selectedCitiesList = country.cities.map(city => ({
            content: city.fullName,
            valueType: city._id,
            selected:this.data.property.geolocationCity?._id==city._id
          }));
          
          // Si la propriété a une ville, la sélectionner
          if (this.data.property.geolocationCity) {
            const currentCity = country.cities.find(city => city._id === this.data.property.geolocationCity._id);
            if (currentCity) {
              this.formGroup.patchValue({
                geolocationCity: {
                  content: currentCity.fullName,
                  valueType: currentCity._id
                }
              });
            }
          }
        }
      });
  }

  private loadCountries(): void {
    this.countries$.pipe(takeUntil(this.destroy$)).subscribe(countries => {
      if (countries?.length) {
        this.countriesList = countries.map(country => ({
          content: country.fullName,
          valueType: country._id,
          selected:country._id==this.data.property.geolocationCountry?._id,
          cities: country.cities
        }));

        // Sélectionner le pays actuel de la propriété
        if (this.data.property.geolocationCountry) {
          const currentCountry = countries.find(country =>  country._id === this.data.property.geolocationCountry._id);
          if (currentCountry) {
            this.formGroup.patchValue({
              geolocationCountry: {
                content: currentCountry.fullName,
                valueType: currentCountry._id,
                cities: currentCountry.cities
              }
            });
          }
        }
      }
    });
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
               this.formGroup.get('geolocationCountry')?.valid &&
               this.formGroup.get('geolocationCity')?.valid &&
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
    
    this._store.dispatch(new PropertyAction.UpdateProperty({
      ...FormUtils.removeNullAttribut(formValue),
      geolocationCity: formValue.geolocationCity.valueType,
      geolocationCountry: formValue.geolocationCountry.valueType,
      
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
