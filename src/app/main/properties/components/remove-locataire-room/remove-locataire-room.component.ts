import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Store, Actions, ofActionSuccessful, ofActionCompleted, ofActionErrored } from '@ngxs/store';
import { Observable } from 'rxjs';
import { PropertyModel, RoomType, RoomAction, LocationModel, LocataireModel, RoomModel, LocataireState, RoomState, LocationAction } from 'src/app/shared/store';
import { UtilsString, FormUtils } from 'src/app/shared/utils';

@Component({
  selector: 'remove-locataire-room',
  templateUrl: './remove-locataire-room.component.html',
  styleUrls: ['./remove-locataire-room.component.css'],
  encapsulation:ViewEncapsulation.None

})
export class RemoveLocataireRoomComponent {
  
  public formGroup: FormGroup;
  layout: string = 'horizontal'
  theme: string = 'light'
  locataire$:Observable<LocataireModel>
  room$:Observable<RoomModel>;

  roomList =[];
  waittingResponse = false;

  constructor(
    private dialogRef: MatDialogRef<RemoveLocataireRoomComponent>,
    protected formBuilder: FormBuilder,
    private router: Router,
  private _store:Store,
  private _ngxsAction:Actions,
  @Inject(MAT_DIALOG_DATA) public data: {location: LocationModel}
  
) { }

  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      confirm:[false,[Validators.requiredTrue]],
      description:[""]
    })
    this.roomList= Object.values(RoomType).map((value)=>({content:UtilsString.getStringOfRoomType(value), valueType:value, selected:value==RoomType.ROOM}));
    
    this.locataire$=this._store.select(LocataireState.selectStateLocataire(this.data.location.locataire));
    this.room$=this._store.select(RoomState.selectStateRoom(this.data.location.room));

    this._ngxsAction.pipe(ofActionSuccessful(LocationAction.RemoveAssignationLocation)).subscribe((value)=>{
      // Navigate to the parent
      this.waittingResponse=false;
      this.onClose()
      }
    );
    this._ngxsAction.pipe(ofActionCompleted(LocationAction.RemoveAssignationLocation)).subscribe(
      (value) => {
        this.waittingResponse=false;        
      }
    )

    this._ngxsAction.pipe(ofActionErrored(LocationAction.RemoveAssignationLocation)).subscribe(
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
    this._store.dispatch(new LocationAction.RemoveAssignationLocation(this.data.location._id,bodyToSend?.description));
    
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
}
