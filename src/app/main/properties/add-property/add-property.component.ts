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
import { CountryCityValue } from 'src/app/shared/components/geography-selectors';

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
  showValidationErrors = false;

  // Plus besoin de ces propriétés avec le nouveau composant
  // @Select(CountryState.selectStateCountries) countries$:Observable<CountryModel[]>;
  // countriesList=[];
  // citiesList:CityModel[]=[];
  // selectedCitiesList=[]

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
      geolocation: [null, [Validators.required]], // Nouveau champ unifié
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

    // Plus besoin de cette logique avec le nouveau composant
    // Le composant country-city-selector gère automatiquement les pays et villes


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

  /**
   * Gérer le changement de localisation
   */
  onLocationChanged(location: CountryCityValue): void {
    console.log('Localisation sélectionnée:', location);
    // Le FormControl 'geolocation' est automatiquement mis à jour
    // Optionnel : actions supplémentaires quand la localisation change
    if (location.country && location.city) {
      console.log(`Pays: ${location.country.fullName}, Ville: ${location.city.fullName}`);
    }
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
    this.showValidationErrors = true; // Activer l'affichage des erreurs
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
    const location = formValue.geolocation;

    // Vérifier que la localisation est complète
    if (!location || !location.country || !location.city) {
      console.error('Localisation incomplète');
      return;
    }

    // Exclure le champ geolocation du payload et ajouter les IDs séparément
    const { geolocation, ...cleanFormValue } = formValue;

    let rentMin = formValue.rentMin || 0, rentMax = formValue.rentMax || 0;
    delete cleanFormValue.rentMin;
    delete cleanFormValue.rentMax;

    this._store.dispatch(new PropertyAction.CreateProperty({
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
      
      rentRange: { min:rentMin, max:rentMax }
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
