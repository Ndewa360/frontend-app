import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Store, Actions, ofActionSuccessful, ofActionCompleted, ofActionErrored } from '@ngxs/store';
import { Observable } from 'rxjs';
import { RemoveLocataireRoomComponent } from 'src/app/main/properties/components/remove-locataire-room/remove-locataire-room.component';
import { LocataireModel, RoomModel, LocationModel, LocationPaymentType, LocataireState, RoomState, LocationPaymentAction, HistoryLocationPaymentModel, LocationPaymentModel } from 'src/app/shared/store';
import { UtilsString, FormUtils } from 'src/app/shared/utils';

@Component({
  selector: 'update-payment',
  templateUrl: './update-payment.component.html',
  styleUrls: ['./update-payment.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class UpdatePaymentComponent {
  public formGroup: FormGroup;
    layout: string = 'horizontal'
    theme: string = 'light'
    locataire:LocataireModel
    room:RoomModel;
  
    paymentTypeList=[]
    waittingResponse = false;
  
    constructor(
      private dialogRef: MatDialogRef<UpdatePaymentComponent>,
      protected formBuilder: FormBuilder,
      private router: Router,
    private _store:Store,
    private _ngxsAction:Actions,
    @Inject(MAT_DIALOG_DATA) public data: {history: HistoryLocationPaymentModel, transaction:LocationPaymentModel}
    
  ) { }
  
    ngOnInit(): void {
      this.room = this.data.history.room;
      this.locataire = this.data.history.locataire;
      console.warn("Histo ",this.data.history)
      this.formGroup = this.formBuilder.group({
        paymentLocationType:[this.data.transaction.paymentLocationType,[Validators.required]],
        locationPaymentPrice:[this.data.transaction.locationPaymentPrice,[Validators.required,Validators.min(1000)]],
        datePayment:[this.data.transaction.datePayment,[Validators.required]],
        reason:[this.data.transaction.reason]
      })
      this.paymentTypeList= Object.values(LocationPaymentType).map((value)=>({content:UtilsString.getStringOfLocationPaymentType(value), valueType:value, selected:value==LocationPaymentType.LOCATION}));

      this._ngxsAction.pipe(ofActionSuccessful(LocationPaymentAction.UpdateLocationPayment)).subscribe((value)=>{
        // Navigate to the parent
        this.waittingResponse=false;
        this.onClose()
        }
      );
      this._ngxsAction.pipe(ofActionCompleted(LocationPaymentAction.UpdateLocationPayment)).subscribe(
        (value) => {
          this.waittingResponse=false;        
        }
      )
  
      this._ngxsAction.pipe(ofActionErrored(LocationPaymentAction.UpdateLocationPayment)).subscribe(
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
      this._store.dispatch(new LocationPaymentAction.UpdateLocationPayment({
        ...bodyToSend,
        datePayment:bodyToSend.datePayment[0],
      },this.data.transaction._id,this.locataire._id));
      
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
    }
}
