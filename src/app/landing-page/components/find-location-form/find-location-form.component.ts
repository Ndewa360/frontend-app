import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder } from '@angular/forms';
import { RoomType } from 'src/app/shared/store';
import { UtilsString } from 'src/app/shared/utils';

@Component({
  selector: 'find-location-form',
  templateUrl: './find-location-form.component.html',
  styleUrls: ['./find-location-form.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class FindLocationFormComponent implements OnInit {
    public formGroup: UntypedFormGroup;
    roomListType =[];

  
   constructor(protected formBuilder: UntypedFormBuilder){} 
   
  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
          location: [''],
          propertyType: [''],
          price: [''],
        })

        //Room Type
      this.roomListType= Object.values(RoomType).map((valueRoomType)=>({
        content:UtilsString.getStringOfRoomType(valueRoomType), 
        valueType:valueRoomType,
        selected:false
      }));
  }
  
  isValid(name) {
    const instance = this.formGroup.get(name)
    return instance.invalid && (instance.dirty || instance.touched)
  }

  onSubmit() {
    this.formGroup.markAllAsTouched();
  }

}
