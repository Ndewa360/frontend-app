import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { combineLatest, Observable } from 'rxjs';
import { CityModel, CityState, RoomType, SearchAction } from 'src/app/shared/store';
import { FormUtils, UtilsString, DefaultCoordCity, DefaultCoordCountry } from 'src/app/shared/utils';

@Component({
  selector: 'filter-zone',
  templateUrl: './filter-zone.component.html',
  styleUrls: ['./filter-zone.component.css']
})
export class FilterZoneComponent implements OnInit{


  formData = {
    type:null,
    ville: null,
    minPrice:0,
    maxPrice:100000,
    
    numberOfBathroom:1,
    numberOfLivingRoom:2,
    numberOfShower:1,
    isInternalShower:false,
    hasKitchen:true,
    isInternalKitchen:false,
    hasClosure:true,
    hasParking:false,
  }

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
        private _store:Store,
      private activedRoute: ActivatedRoute,
      private router: Router

  ) {}

  
 
  ngOnInit(): void {
    // this.activedRoute.queryParams.subscribe((value)=>{
    combineLatest([this.activedRoute.queryParams,this.cities]).subscribe(([value,cities])=>{
      this.formData = {...this.formData,...value};
      // console.log("Init formData",this.formData)

      this.formGroup = this.formBuilder.group({
        type:[null,[Validators.required]],
        formControlSearch:[],
        ville:[null,[Validators.required]],
        minPrice:[this.formData.minPrice],
        maxPrice:[this.formData.maxPrice],
        specifity:this.formBuilder.group({
          numberOfBathroom:[this.formData.numberOfBathroom,Validators.required],
          numberOfLivingRoom:[this.formData.numberOfLivingRoom,Validators.required],
          numberOfShower:[this.formData.numberOfShower,Validators.required],
          isInternalShower:[this.formData.isInternalShower,Validators.required],
          hasKitchen:[this.formData.hasKitchen,Validators.required],
          isInternalKitchen:[this.formData.isInternalKitchen,Validators.required],
          hasClosure:[this.formData.hasClosure,Validators.required],
          hasParking:[this.formData.hasParking,Validators.required],
        })
      })   
      
      //Room Type
      this.roomListType= Object.values(RoomType).map((valueRoomType)=>({
        content:UtilsString.getStringOfRoomType(valueRoomType), 
        valueType:valueRoomType,
        selected:(valueRoomType==this.formData.type)
      }));
      setTimeout(() => {
        const selectedRoomType = this.roomListType.find(roomType => roomType.selected);
        if (selectedRoomType) {
          this.formGroup.get('type')?.setValue(selectedRoomType);

        }
      },1000)

      this.villeList=cities.map((city)=>{
        let isSelected = this.formData.ville?city.fullName==this.formData.ville:false;
        return { content:city.fullName,valueType:city._id, selected:isSelected}        
      })
      const selectedCity = this.villeList.find(city => city.selected );

      if (selectedCity) {
        this.formGroup.get('ville')?.setValue(selectedCity);
      }

    })



    // this.formGroup.get("ville").valueChanges.subscribe((value)=>{
    //   if(value.content!=this.currentCityChoise) this.currentCityChoise = value.content;
    // })
  }

  getLocation(): void{
    //console.log("Navigateor ",navigator.geolocation)
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position)=>{
          const longitude = position.coords.longitude;
          const latitude = position.coords.latitude;
          //console.log("Geo Position ",position);
        });
    } else {
       //console.log("No support for geolocation")
    }
  }

  onSelectedType(roomType)
  {
    // this.formGroup.get('type').setValue(roomType.valueType)
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
    let filterToApply = {...FormUtils.removeNullAttribut(this.formGroup.value)}
    // console.log("Filter Toi  ",filterToApply)

    if(!this.showFilteredSpecificityForm) delete filterToApply.specifity;

    // filterToApply = {...FormUtils.removeNullAttribut({...filterToApply, ville:this.formGroup.value.ville.content})}

    if(this.formGroup.value.minPrice==0) filterToApply["minPrice"]=0;

    const queryString = Object.keys(filterToApply).map(key => {
      if(key=="specifity") return Object.keys(filterToApply[key]).map(specKey => `${encodeURIComponent(specKey)}=${encodeURIComponent(filterToApply[key][specKey])}`).join('&')
      else if(key=="type" ) return  `${encodeURIComponent(key)}=${encodeURIComponent(filterToApply[key].valueType)}`
      else if(key=="ville" ) return  `${encodeURIComponent(key)}=${encodeURIComponent(filterToApply[key].content)}`
      return `${encodeURIComponent(key)}=${encodeURIComponent(filterToApply[key])}`
    }).join('&'); 

    let findNewCity=false;
    if(this.formGroup.value.ville) {
      filterToApply = {...filterToApply,ville:this.formGroup.value.ville.valueType}
      findNewCity = this.formGroup.value.ville.valueType!=this.currentCityChoise
    }
    if(this.formGroup.value.type) filterToApply = {...filterToApply,type:this.formGroup.value.type.valueType}

    this.router.navigateByUrl(`/search/index?${queryString}`)
    this._store.dispatch(new SearchAction.ApplyFilter(filterToApply,findNewCity)); 
  }
}
