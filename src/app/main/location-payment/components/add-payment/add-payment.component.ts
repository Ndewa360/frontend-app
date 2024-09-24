import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Store, Actions, ofActionSuccessful, ofActionCompleted, ofActionErrored } from '@ngxs/store';
import { Observable } from 'rxjs';
import { AddPropertyRoomComponent } from 'src/app/main/properties/components/add-property-room/add-property-room.component';
import { RemoveLocataireRoomComponent } from 'src/app/main/properties/components/remove-locataire-room/remove-locataire-room.component';
import { PropertyModel, RoomType, RoomAction, LocataireModel, LocataireState, LocationAction, LocationModel, RoomModel, RoomState } from 'src/app/shared/store';
import { LocationPaymentAction, LocationPaymentType } from 'src/app/shared/store/payment-location';
import { UtilsString, FormUtils } from 'src/app/shared/utils';

@Component({
  selector: 'add-payment',
  templateUrl: './add-payment.component.html',
  styleUrls: ['./add-payment.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class AddPaymentComponent {
  public formGroup: FormGroup;
  layout: string = 'horizontal'
  theme: string = 'light'
  locataire$:Observable<LocataireModel>
  room$:Observable<RoomModel>;

  paymentTypeList=[]
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
      paymentLocationType:[LocationPaymentType.LOCATION,[Validators.required]],
      locationPaymentPrice:[5000,[Validators.required,Validators.min(1000)]],
      datePayment:[null,[Validators.required]],
      reason:[null]
    })
    this.paymentTypeList= Object.values(LocationPaymentType).map((value)=>({content:UtilsString.getStringOfLocationPaymentType(value), valueType:value, selected:value==LocationPaymentType.LOCATION}));
    
    this.locataire$=this._store.select(LocataireState.selectStateLocataire(this.data.location.locataire));
    this.room$=this._store.select(RoomState.selectStateRoom(this.data.location.room));

    this._ngxsAction.pipe(ofActionSuccessful(LocationPaymentAction.CreateLocationPayment)).subscribe((value)=>{
      // Navigate to the parent
      this.waittingResponse=false;
      this.onClose()
      }
    );
    this._ngxsAction.pipe(ofActionCompleted(LocationPaymentAction.CreateLocationPayment)).subscribe(
      (value) => {
        this.waittingResponse=false;        
      }
    )

    this._ngxsAction.pipe(ofActionErrored(LocationPaymentAction.CreateLocationPayment)).subscribe(
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
    this._store.dispatch(new LocationPaymentAction.CreateLocationPayment({
      ...bodyToSend,
      datePayment:bodyToSend.datePayment[0],
      locataireId:this.data.location.locataire,
      locationId:this.data.location._id,
      roomId:this.data.location.room,
      propertyId:this.data.location.property
    }));
    
  }

  getRowLayout(num) {
    if (this.layout === 'vertical') {
      return '100%'
    }
    return num + '%'
  }

  onSelectedType(payementType)
  {
    this.formGroup.get('paymentLocationType').setValue(payementType.valueType)
  }
  
  getMoney()
  {
    return UtilsString.getDefaultCurrency()
  }}
