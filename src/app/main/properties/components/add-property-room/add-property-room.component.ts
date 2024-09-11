import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Store, Actions, ofActionSuccessful, ofActionCompleted, ofActionErrored } from '@ngxs/store';
import { RoomAction, RoomType,PropertyModel, LocataireModel, LocataireState } from 'src/app/shared/store';
import { FormUtils, UtilsString } from 'src/app/shared/utils';

@Component({
  selector: 'app-add-property-room',
  templateUrl: './add-property-room.component.html',
  styleUrls: ['./add-property-room.component.scss'],
  encapsulation:ViewEncapsulation.None
})
export class AddPropertyRoomComponent implements OnInit {

  public formGroup: FormGroup;
  layout: string = 'horizontal'
  theme: string = 'light'

  roomList =[];
  waittingResponse = false;

  constructor(
    private dialogRef: MatDialogRef<AddPropertyRoomComponent>,
    protected formBuilder: FormBuilder,
    private router: Router,
  private _store:Store,
  private _ngxsAction:Actions,
  @Inject(MAT_DIALOG_DATA) public data: {property: PropertyModel}
  
) { }

  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      code:[null],
      description: [null],
      type:[RoomType.ROOM,Validators.required],
      price:[5000,Validators.required],
    })
    this.roomList= Object.values(RoomType).map((value)=>({content:UtilsString.getStringOfRoomType(value), valueType:value, selected:value==RoomType.ROOM}));
    

    this._ngxsAction.pipe(ofActionSuccessful(RoomAction.CreateRoom)).subscribe((value)=>{
      // Navigate to the parent
      this.waittingResponse=false;
      this.onClose()
      }
    );
    this._ngxsAction.pipe(ofActionCompleted(RoomAction.CreateRoom)).subscribe(
      (value) => {
        this.waittingResponse=false;        
      }
    )

    this._ngxsAction.pipe(ofActionErrored(RoomAction.CreateRoom)).subscribe(
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
    let bodyToSend = FormUtils.removeNullAttribut({...this.formGroup.value})
    this.waittingResponse=true;
    this._store.dispatch(new RoomAction.CreateRoom(bodyToSend,this.data.property._id));
    
  }

  getRowLayout(num) {
    if (this.layout === 'vertical') {
      return '100%'
    }
    return num + '%'
  }

  

  getMoney()
  {
    return UtilsString.getDefaultCurrency()
  }

  onSelectedType(roomType)
  {
    if(roomType.valueType!=RoomType.ROOM) this.formGroup.get('type').setValue(null);
    else this.formGroup.get('type').setValue(roomType.valueType)
  }
}
