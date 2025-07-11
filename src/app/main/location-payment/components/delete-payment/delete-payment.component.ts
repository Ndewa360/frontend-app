import { Component, Inject, ViewEncapsulation, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Store, Actions, ofActionCompleted, ofActionErrored, ofActionSuccessful } from '@ngxs/store';
import { HistoryLocationPaymentModel, LocationPaymentAction, LocationPaymentModel, LocationPaymentType } from 'src/app/shared/store';

@Component({
  selector: 'delete-payment',
  templateUrl: './delete-payment.component.html',
  styleUrls: ['./delete-payment.component.css'],
  encapsulation: ViewEncapsulation.None
  
})
export class DeletePaymentComponent implements OnInit {
  waittingResponse = false;

  get payment(): LocationPaymentModel | null {
    return this.data?.transaction || null;
  }

  constructor(
    private dialogRef: MatDialogRef<DeletePaymentComponent>,
    protected formBuilder: FormBuilder,
    private router: Router,
    private _store:Store,
    private _ngxsAction:Actions,
    @Inject(MAT_DIALOG_DATA) public data: {history: HistoryLocationPaymentModel, transaction:LocationPaymentModel}
    
  ){}

  ngOnInit(): void 
  {
    console.log("Data ",this.data.history.locataire)
    this._ngxsAction.pipe(ofActionSuccessful(LocationPaymentAction.DeletehLocationPayment)).subscribe((value)=>{
            // Navigate to the parent
      this.waittingResponse=false;
      this.dialogRef.close(true); // Retourner true pour indiquer le succès
      }
    );
    this._ngxsAction.pipe(ofActionCompleted(LocationPaymentAction.DeletehLocationPayment)).subscribe(
      (value) => {
        this.waittingResponse=false;        
      }
    )

    this._ngxsAction.pipe(ofActionErrored(LocationPaymentAction.DeletehLocationPayment)).subscribe(
      (value) => {
        this.waittingResponse=false;
      })
  }

  onClose() {
    this.dialogRef.close(false);
  }

  onSubmit() {
    this.waittingResponse = true;
    this._store.dispatch(new LocationPaymentAction.DeletehLocationPayment(
      this.data.transaction._id,
      this.data.history.locataire._id,
      this.data.transaction.property
    ));
  }

  getPaymentTypeLabel(): string {
    if (!this.payment?.paymentLocationType) return 'N/A';

    switch (this.payment.paymentLocationType) {
      case LocationPaymentType.LOCATION:
        return 'Loyer';
      case LocationPaymentType.CAUTION:
        return 'Caution';
      default:
        return 'Non spécifié';
    }
  }
}
