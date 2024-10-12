import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Store, Actions, ofActionSuccessful, ofActionCompleted, ofActionErrored } from '@ngxs/store';
import { AddPropertyRoomComponent } from 'src/app/main/properties/components/add-property-room/add-property-room.component';
import { PropertyModel, RoomAction, RoomModel, RoomType } from 'src/app/shared/store';
import { UtilsString, FormUtils } from 'src/app/shared/utils';

@Component({
  selector: 'update-room',
  templateUrl: './update-room.component.html',
  styleUrls: ['./update-room.component.css'],
  encapsulation:ViewEncapsulation.None
})
export class UpdateRoomComponent {

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
    @Inject(MAT_DIALOG_DATA) public data: {room: RoomModel}
    
  ) { }

  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      code:[this.data.room.code],
      description: [this.data.room.description],
      type:[this.data.room.type,Validators.required],
      price:[this.data.room.price,Validators.required],
      specifity:this.formBuilder.group({
        numberOfBathroom:[this.data.room.specifity?.numberOfBathroom?this.data.room.specifity.numberOfBathroom:1,Validators.required],
        numberOfLivingRoom:[this.data.room.specifity?.numberOfLivingRoom?this.data.room.specifity.numberOfLivingRoom:2,Validators.required],
        numberOfShower:[this.data.room.specifity?.numberOfShower?this.data.room.specifity.numberOfShower:1,Validators.required],
        isInternalShower:[this.data.room.specifity?.isInternalShower?this.data.room.specifity.isInternalShower:false,Validators.required],
        hasKitchen:[this.data.room.specifity?.hasKitchen?this.data.room.specifity.hasKitchen:true,Validators.required],
        isInternalKitchen:[this.data.room.specifity?.isInternalKitchen?this.data.room.specifity.isInternalKitchen:false,Validators.required],
      })
    })
    this.roomList= Object.values(RoomType).map((value)=>({content:UtilsString.getStringOfRoomType(value), valueType:value, selected:value==this.data.room.type}));
    // setTimeout(()=>this.onSelectedType(this.data.room.type));

    this._ngxsAction.pipe(ofActionSuccessful(RoomAction.UpdateRoom)).subscribe((value)=>{
      // Navigate to the parent
      this.waittingResponse=false;
      this.onClose()
      }
    );
    this._ngxsAction.pipe(ofActionCompleted(RoomAction.UpdateRoom)).subscribe(
      (value) => {
        this.waittingResponse=false;        
      }
    )

    this._ngxsAction.pipe(ofActionErrored(RoomAction.UpdateRoom)).subscribe(
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
    this._store.dispatch(new RoomAction.UpdateRoom(bodyToSend,this.data.room._id));
    
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
    // if(roomType.valueType!=RoomType.ROOM) this.formGroup.get('type').setValue(null);
    // else 
    this.formGroup.get('type').setValue(roomType.valueType)
  }
}
