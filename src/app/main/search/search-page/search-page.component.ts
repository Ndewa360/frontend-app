import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RoomType } from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';

@Component({
  selector: 'search-page',
  templateUrl: './search-page.component.html',
  styleUrls: ['./search-page.component.css']
})
export class SearchPageComponent implements OnInit {
  
    public formGroup: FormGroup;
  
  villeList:{content:string,selected:boolean}[]=[
    {content:"Yaoundé",selected:false},
    {content:"Bangangté",selected:false},
    {content:"Douala",selected:false}
  ]

  roomListType =[];


  loadingProperty:boolean=false
  public opened: boolean = false

  constructor(
        protected formBuilder: FormBuilder,
  ) {}

  onToggle() {
    this.opened = !this.opened
  }
 
  ngOnInit(): void {

    this.formGroup = this.formBuilder.group({
      type:[RoomType.ROOM,Validators.required],
      price:[5000,Validators.required],
      formControlSearch:[],
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
    this.roomListType= Object.values(RoomType).map((value)=>({content:UtilsString.getStringOfRoomType(value), valueType:value, selected:value==RoomType.ROOM}));
  }

  onSelectedType(roomType)
  {
    this.formGroup.get('type').setValue(roomType.valueType)
  }
  
  getMoney()
  {
    return UtilsString.getDefaultCurrency()
  }

  isValid(name) {
    const instance = this.formGroup.get(name)
    return instance.invalid && (instance.dirty || instance.touched)
  }



}
