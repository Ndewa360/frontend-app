import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Store, Actions, ofActionSuccessful, ofActionCompleted, ofActionErrored } from '@ngxs/store';
import { NotificationService } from 'carbon-components-angular';
import { RoomType, RoomAction, LocataireAction, PropertyModel, RoomState, RoomModel } from 'src/app/shared/store';
import { FormUtils, UtilsString } from 'src/app/shared/utils';
import { AddPropertyRoomComponent } from '../add-property-room/add-property-room.component';

@Component({
  selector: 'app-add-property-locataire',
  templateUrl: './add-property-locataire.component.html',
  styleUrls: ['./add-property-locataire.component.scss'],
  encapsulation:ViewEncapsulation.None
})
export class AddPropertyLocataireComponent implements OnInit {

  public formGroup: FormGroup;
  layout: string = 'horizontal'
  theme: string = 'light'

  roomList =[];
  roomListType =[];
  waittingResponse = false;


  constructor(
    private dialogRef: MatDialogRef<AddPropertyLocataireComponent>,
    protected formBuilder: FormBuilder,
    private _store:Store,
    @Inject(MAT_DIALOG_DATA) public data:{property:PropertyModel},
    private _ngxsAction:Actions
) { }

  ngOnInit(): void {
    this._store.select(RoomState.selectStateRoomByPropertyId(this.data.property._id)).subscribe((roomList:RoomModel[])=>{
      this.roomList = roomList.map((value)=>({content:value.code,valueType:value._id}))
    });
    this.formGroup = this.formBuilder.group({
      fullName:[null,[Validators.required]],
      email: [null, [Validators.email]],
      phoneNumber:[null, [Validators.required, Validators.pattern('^(\\+\\d{1,3}\\s)?(\\d{2,3}[\\s.-]?){4}$')]],
      roomId:[null],
      description:[null],
      confirm:[false],
      fullNameRef:[null,[]],
      phoneNumberRef:[null, [Validators.pattern('^(\\+\\d{1,3}\\s)?(\\d{2,3}[\\s.-]?){4}$')]],
      emailRef: [null, [Validators.email]],

    })
    this.roomListType= Object.values(RoomType).map((value)=>({content:UtilsString.getStringOfRoomType(value), valueType:value, selected:value==RoomType.ROOM}));
    this._ngxsAction.pipe(ofActionSuccessful(LocataireAction.CreateLocataire)).subscribe((value)=>{
      // Navigate to the parent
      this.waittingResponse=false;
      this.onClose()    
      }
    );
    this._ngxsAction.pipe(ofActionCompleted(LocataireAction.CreateLocataire)).subscribe(
      (value) => {
        this.waittingResponse=false;        
      }
    )

    this._ngxsAction.pipe(ofActionErrored(LocataireAction.CreateLocataire)).subscribe(
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
    if(this.formGroup.invalid) return;
    this.waittingResponse=true;
    this._store.dispatch(new LocataireAction.CreateLocataire({...FormUtils.removeNullAttribut({...this.formGroup.value,confirm:null}),propertyId:this.data.property._id}));
    
  }

  getRowLayout(num) {
    if (this.layout === 'vertical') {
      return '100%'
    }
    return num + '%'
  }

}
