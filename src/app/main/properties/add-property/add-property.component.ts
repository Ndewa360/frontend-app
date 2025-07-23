import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Store, Actions, ofActionCompleted, ofActionErrored, ofActionSuccessful, Select } from '@ngxs/store';
import { has } from 'cypress/types/lodash';
import { Observable } from 'rxjs';
import { CityModel, CountryModel, CountryState, PropertyAction } from 'src/app/shared/store';
import { FormUtils } from 'src/app/shared/utils';
import { SubscriptionLimitAction } from 'src/app/shared/store/subscription-limit';
import { SubscriptionLimitModalComponent, SubscriptionLimitModalData } from 'src/app/shared/components/subscription-limit-modal/subscription-limit-modal.component';

@Component({
  selector: 'app-add-property',
  templateUrl: './add-property.component.html',
  styleUrls: ['./add-property.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AddPropertyComponent implements OnInit {
  public formGroup: FormGroup;
  waittingResponse = false;
  currentStep = 1;
  currentYear = new Date().getFullYear();

  @Select(CountryState.selectStateCountries) countries$:Observable<CountryModel[]>;

  countriesList=[];
  citiesList:CityModel[]=[];
  selectedCitiesList=[]

  constructor(
    private dialogRef: MatDialogRef<AddPropertyComponent>,
    protected formBuilder: FormBuilder,
    private router: Router,
    private dialog: MatDialog,

  private _store:Store,
  private _ngxsAction:Actions) { }

  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      // Étape 1: Informations générales
      name: [null, [Validators.required]],
      propertyType: ['APARTMENT', [Validators.required]],
      totalSurface: [null],
      geolocationCountry: [null, [Validators.required]],
      geolocationCity: [null, [Validators.required]],
      location: [null, [Validators.required]],
      buildingYear: [null],
      floors: [1],
      description: [null],

      // Étape 2: Caractéristiques
      condition: ['GOOD'],
      furnishingStatus: ['UNFURNISHED'],
      hasClosure: [false],
      hasParking: [false],
      hasElevator: [false],
      hasWater: [true],
      hasInternet: [false],
      hasGenerator: [false],
      hasGarden: [false],
      hasPool: [false],
      hasGym: [false],
      hasSecurity: [false],

      // Étape 3: Finances
      acquisitionPrice: [null],
      currentValue: [null],
      rentMin: [null],
      rentMax: [null],
      monthlyCharges: [null],
      managementFees: [null],
      propertyTax: [null],
      insuranceCost: [null],
      contractTemplate: [null]
    })

    this.countries$.subscribe((countries:CountryModel[])=>{
      this.countriesList=countries.map((country)=>({content:country.fullName,valueType:country._id}));
      if(this.countriesList.length>0) this.formGroup.get("geolocationCountry").setValue(this.countriesList[0].valueType);
      this.citiesList = countries.map((country)=>country.cities).reduce((acc,curr)=>[...acc,...curr],[])
    });
    
    this.formGroup.get("geolocationCountry").valueChanges.subscribe((value)=>{
      this.selectedCitiesList=this.citiesList.filter((city)=>city.country==value.valueType).map((city)=>({content:city.fullName, valueType:city._id}));
    })


    this._ngxsAction.pipe(ofActionSuccessful(PropertyAction.CreateProperty)).subscribe((value)=>{
      // Navigate to the parent
      this.waittingResponse=false;
      this.onClose()
      }
    );
    this._ngxsAction.pipe(ofActionCompleted(PropertyAction.CreateProperty)).subscribe(
      (value) => {
        this.waittingResponse=false;
        
      }
    )

    this._ngxsAction.pipe(ofActionErrored(PropertyAction.CreateProperty)).subscribe(
      (value) => {
        this.waittingResponse=false;
      })
  }

  onClose() {
    this.formGroup.reset();
    this.dialogRef.close(false)
  }

  isValid(name) {
    const instance = this.formGroup.get(name)
    return instance.invalid && (instance.dirty || instance.touched)
  }

  onSubmit() {
    this.formGroup.markAllAsTouched();

    if (this.formGroup.invalid) {
      return;
    }

    // Vérifier les limites de souscription avant de créer
    this.checkSubscriptionLimits();
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

  private checkSubscriptionLimits(): void {
    this.waittingResponse = true;

    this._store.dispatch(new SubscriptionLimitAction.CheckCanCreateProperty()).subscribe({
      next: () => {
        // Vérifier le résultat dans le store
        const canCreate = this._store.selectSnapshot(state => state.subscriptionLimit.canCreateProperty);
        const needsUpgrade = this._store.selectSnapshot(state => state.subscriptionLimit.needsUpgrade);

        if (canCreate) {
          this.createProperty();
        } else {
          this.waittingResponse = false;
          this.showSubscriptionLimitModal(needsUpgrade);
        }
      },
      error: (error) => {
        this.waittingResponse = false;
        console.error('Erreur lors de la vérification des limites:', error);

        // Vérifier le type d'erreur
        if (error.error?.error === 'Account/Suspended') {
          this.showAccountSuspendedModal();
        } else if (error.error?.error === 'PropertyLimit/Exceeded') {
          this.showSubscriptionLimitModal(true);
        } else {
          // Erreur générique, permettre la création quand même
          this.createProperty();
        }
      }
    });
  }

  private createProperty(): void {
    const formValue = this.formGroup.value;

    this._store.dispatch(new PropertyAction.CreateProperty({
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
      availabilityStatus: 'AVAILABLE',

      // Équipements
      hasElevator: formValue.hasElevator || false,
      hasWater: formValue.hasWater !== false, // true par défaut
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
    }));
  }

  private showSubscriptionLimitModal(needsUpgrade: boolean): void {
    const modalData: SubscriptionLimitModalData = {
      type: needsUpgrade ? 'limit_reached' : 'upgrade_prompt',
      currentLimit: 1,
      limitType: 'property'
    };

    const dialogRef = this.dialog.open(SubscriptionLimitModalComponent, {
      width: '600px',
      disableClose: true,
      data: modalData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.upgraded) {
        // L'utilisateur a upgradé, permettre la création
        this.waittingResponse = true;
        this.createProperty();
      }
      // Sinon, ne rien faire (l'utilisateur a annulé)
    });
  }

  private showAccountSuspendedModal(): void {
    const modalData: SubscriptionLimitModalData = {
      type: 'account_suspended'
    };

    const dialogRef = this.dialog.open(SubscriptionLimitModalComponent, {
      width: '600px',
      disableClose: true,
      data: modalData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.reactivated) {
        // Le compte a été réactivé, permettre la création
        this.waittingResponse = true;
        this.createProperty();
      }
      // Sinon, ne rien faire
    });
  }

}
