import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Store, Actions, ofActionCompleted, ofActionErrored, ofActionSuccessful, Select } from '@ngxs/store';
import { has } from 'cypress/types/lodash';
import { Observable } from 'rxjs';
import { CityModel, CountryModel, CountryState, PropertyAction } from 'src/app/shared/store';
import { FormUtils } from 'src/app/shared/utils';

@Component({
  selector: 'app-add-property',
  templateUrl: './add-property.component.html',
  styleUrls: ['./add-property.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AddPropertyComponent implements OnInit {
  public formGroup: FormGroup;
  waittingResponse = false;

  @Select(CountryState.selectStateCountries) countries$:Observable<CountryModel[]>;
  
  countriesList=[];
  citiesList:CityModel[]=[];
  selectedCitiesList=[]

  constructor(
    private dialogRef: MatDialogRef<AddPropertyComponent>,
    protected formBuilder: FormBuilder,
    private router: Router,
  private _store:Store,
  private _ngxsAction:Actions) { }

  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      name: [null, [Validators.required,]],
      geolocationCountry: [null, [Validators.required]],
      geolocationCity: [null, [Validators.required]],
      hasClosure:[false,Validators.required],
      hasParking:[false,Validators.required],
      location: [null, [Validators.required, ]],
      description: [null, ],
      contractTemplate: [null], // Modèle de contrat (optionnel)
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
    this.formGroup.markAllAsTouched()

    this.waittingResponse=true;

    this._store.dispatch(new PropertyAction.CreateProperty({
      ...FormUtils.removeNullAttribut(this.formGroup.value),
      geolocationCity:this.formGroup.value.geolocationCity.valueType,
      geolocationCountry:this.formGroup.value.geolocationCountry.valueType,
      hasClosure:this.formGroup.value.hasClosure?true:false,
      hasParking:this.formGroup.value.hasParking?true:false,
      contractTemplate: this.formGroup.value.contractTemplate
    }));
    
  }

}
