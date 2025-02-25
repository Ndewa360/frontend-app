import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { CityModel, CityState, RoomType, SearchAction } from 'src/app/shared/store';
import { FormUtils, UtilsString, DefaultCoordCity, DefaultCoordCountry } from 'src/app/shared/utils';

@Component({
  selector: 'filter-zone',
  templateUrl: './filter-zone.component.html',
  styleUrls: ['./filter-zone.component.css']
})
export class FilterZoneComponent implements OnInit{



  @Select(CityState.setlectStateCities) cities:Observable<CityModel[]>
  public formGroup: FormGroup;

 
  currentCityChoise=null;

  waittingResponse:boolean = false;

  
  
  villeList:{content:string,selected:boolean,valueType}[]=[];

  roomListType =[];


  loadingProperty:boolean=false
  public opened: boolean = false

  showFilteredForm:boolean=true
  showFilteredSpecificityForm:boolean=false
  constructor(
        protected formBuilder: FormBuilder,
        private _store:Store
  ) {}

  
 
  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      type:[null,Validators.required],
      formControlSearch:[],
      ville:[null,[Validators.required]],
      minPrice:[0],
      maxPrice:[100000],
      specifity:this.formBuilder.group({
        numberOfBathroom:[1,Validators.required],
        numberOfLivingRoom:[2,Validators.required],
        numberOfShower:[1,Validators.required],
        isInternalShower:[false,Validators.required],
        hasKitchen:[true,Validators.required],
        isInternalKitchen:[false,Validators.required],
        hasClosure:[true,Validators.required],
        hasParking:[false,Validators.required],
      })
    })
    this.roomListType= Object.values(RoomType).map((value)=>({content:UtilsString.getStringOfRoomType(value), valueType:value}));
    this.cities.subscribe((cities)=>{
      this.villeList=cities.map((city)=>{
        if(city.lat==DefaultCoordCity.latitude && city.long== DefaultCoordCity.longitude) {
          this.formGroup.get("ville").setValue({ content:city.fullName,valueType:city._id,selected:true});
          this.currentCityChoise=city._id
        }
        return { content:city.fullName,valueType:city._id,selected:(city.lat==DefaultCoordCountry.latitude && city.long==DefaultCoordCountry.longitude)}
      })
    })
    // this.formGroup.get("ville").valueChanges.subscribe((ville)=>{
    //   this.currentCityChoise=ville.valueType
    // })
  }

  getLocation(): void{
    console.log("Navigateor ",navigator.geolocation)
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position)=>{
          const longitude = position.coords.longitude;
          const latitude = position.coords.latitude;
          console.log("Geo Position ",position);
        });
    } else {
       console.log("No support for geolocation")
    }
  }

  onSelectedType(roomType)
  {
    this.formGroup.get('type').setValue(roomType.valueType)
  }

  onToggleFilterSearch()
  {
    this.showFilteredForm = !this.showFilteredForm
  }
  
  onToggle() {
    this.opened = !this.opened
  }

  onToggleSepcifity() {
    this.showFilteredSpecificityForm = !this.showFilteredSpecificityForm
  }

  getMoney()
  {
    return UtilsString.getDefaultCurrency()
  }

  isValid(name) {
    const instance = this.formGroup.get(name)
    return instance.invalid && (instance.dirty || instance.touched)
  }

  callToSubmitSearch()
  {
    let filterToApply = {...this.formGroup.value, ville:this.formGroup.value.ville.valueType}
    if(!this.showFilteredSpecificityForm) delete filterToApply.specifity;
    filterToApply = {...FormUtils.removeNullAttribut(filterToApply)}
    if(this.formGroup.value.minPrice==0) filterToApply["minPrice"]=0;

    this._store.dispatch(new SearchAction.ApplyFilter(filterToApply,this.formGroup.value.ville.valueType!=this.currentCityChoise));
  }
}
