import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { combineLatest, combineLatestAll, Observable } from 'rxjs';
import { PlateformService } from 'src/app/shared/services/plateform/plateform.service';
import { CityModel, CityState, RoomType, SearchAction } from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';

@Component({
  selector: 'search-page',
  templateUrl: './search-page.component.html',
  styleUrls: ['./search-page.component.css']
})
export class SearchPageComponent implements OnInit {
  @Select(CityState.setlectStateCities) cities:Observable<CityModel[]>

  constructor(
    private plateformService:PlateformService,
    private activedRoute: ActivatedRoute,
    private router: Router,
    private _store:Store,
    
  ){}
  
  ngOnInit(): void {
    combineLatest([this.activedRoute.queryParams,this.cities]).subscribe(([value,cities])=>{
        let data = {
          type:null,
          ville: null,
          minPrice:0,
          maxPrice:100000,
          specifity:{
            numberOfBathroom:1,
            numberOfLivingRoom:2,
            numberOfShower:1,
            isInternalShower:false,
            hasKitchen:true,
            isInternalKitchen:false,
            hasClosure:true,
            hasParking:false,
          }
        };
        if(value['type'] ) data.type = value['type']
        if(value['ville'] ) {          
          const selectedCity = cities.find(city => city.fullName == value['ville']);
          if(selectedCity) data.ville = selectedCity._id
        }
        if(value['minPrice'] ) data.minPrice = value['minPrice']
        if(value['maxPrice'] ) data.maxPrice = value['maxPrice']
        if(value['numberOfBathroom'] ) data.specifity.numberOfBathroom = value['numberOfBathroom']
        if(value['numberOfLivingRoom'] ) data.specifity.numberOfLivingRoom = value['numberOfLivingRoom']
        if(value['numberOfShower'] ) data.specifity.numberOfShower = value['numberOfShower']
        if(value['isInternalShower'] ) data.specifity.isInternalShower = value['isInternalShower']
        if(value['hasKitchen'] ) data.specifity.hasKitchen = value['hasKitchen']
        if(value['isInternalKitchen'] ) data.specifity.isInternalKitchen = value['isInternalKitchen']
        if(value['hasClosure'] ) data.specifity.hasClosure = value['hasClosure']
        if(value['hasParking'] ) data.specifity.hasParking = value['hasParking']
  
            this._store.dispatch(new SearchAction.ApplyFilter(data,false));
    })
    
   

  }

  

}
