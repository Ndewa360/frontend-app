import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Store, Actions, ofActionSuccessful, ofActionCompleted, ofActionErrored, Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { CityModel, CountryModel, CountryState, PropertyAction, PropertyModel } from 'src/app/shared/store';
import { FormUtils } from 'src/app/shared/utils';

@Component({
  selector: 'update-property',
  templateUrl: './update-property.component.html',
  styleUrls: ['./update-property.component.css'],
  encapsulation:ViewEncapsulation.None
})
export class UpdatePropertyComponent {
  public formGroup: FormGroup;
  @Select(CountryState.selectStateCountries) countries$:Observable<CountryModel[]>;
  

  waittingResponse = false;
  countriesList=[];
  citiesList:CityModel[]=[];
  selectedCitiesList=[]

  constructor(
    private dialogRef: MatDialogRef<UpdatePropertyComponent>,
    protected formBuilder: FormBuilder,
    private _store:Store,
    private _ngxsAction:Actions,
    @Inject(MAT_DIALOG_DATA) public data:{property:PropertyModel},
) { }

  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      name: [this.data.property.name, [Validators.required,]],
      location: [this.data.property.location, [Validators.required, ]],
      description: [this.data.property.description?this.data.property.description:null, ],
      geolocationCountry: [null, [Validators.required]],
      geolocationCity: [null, [Validators.required]],
      hasClosure:[this.data.property.hasClosure,Validators.required],
      hasParking:[this.data.property.hasParking,Validators.required],
      contractTemplate: [this.data.property.contractTemplate || null], // Modèle de contrat
    })

    this._ngxsAction.pipe(ofActionSuccessful(PropertyAction.UpdateProperty)).subscribe((value)=>{
      // Navigate to the parent
      this.waittingResponse=false;
      this.onClose()
      }
    );
    this.countries$.subscribe((countries:CountryModel[])=>{
      this.citiesList = countries.map((country)=>country.cities).reduce((acc,curr)=>[...acc,...curr],[])

      let selectedCountry= null;
      this.countriesList=countries.map((country)=>{
        if(country._id==this.data.property.geolocationCountry?._id) selectedCountry = country;
        return {content:country.fullName,valueType:country._id,selected:country._id==this.data.property.geolocationCountry?._id}
      });
      if(selectedCountry) {
        this.formGroup.get("geolocationCountry").setValue({content:selectedCountry.fullName,valueType:selectedCountry._id})

        this.selectedCitiesList=this.citiesList.filter((city)=>city.country==selectedCountry._id).map((city)=>{
          if(city._id==this.data.property.geolocationCity?._id) this.formGroup.get("geolocationCity").setValue({content:city.fullName, valueType:city._id})
          return {content:city.fullName, valueType:city._id,selected:city._id==this.data.property.geolocationCity?._id}
      });
      }
    // //console.log("Cities",this.selectedCitiesList,this.countriesList)

    });

    
    this.formGroup.get("geolocationCountry").valueChanges.subscribe((value)=>{
      if(!value) return
      this.selectedCitiesList=this.citiesList.filter((city)=>city.country==value.valueType).map((city)=>({content:city.fullName, valueType:city._id}));
    })


    this._ngxsAction.pipe(ofActionCompleted(PropertyAction.UpdateProperty)).subscribe(
      (value) => {
        this.waittingResponse=false;
        
      }
    )

    this._ngxsAction.pipe(ofActionErrored(PropertyAction.UpdateProperty)).subscribe(
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
   
    this._store.dispatch(new PropertyAction.UpdateProperty({
      ...FormUtils.removeNullAttribut(this.formGroup.value),
      geolocationCity:this.formGroup.value.geolocationCity.valueType,
      geolocationCountry:this.formGroup.value.geolocationCountry.valueType,
      contractTemplate: this.formGroup.value.contractTemplate
    },
    this.data.property._id)
    );
    
  }
}
