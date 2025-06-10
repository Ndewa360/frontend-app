import { Component, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { Store, Actions, ofActionSuccessful, ofActionCompleted, ofActionErrored } from '@ngxs/store';
import { LocataireModel, LocataireState, LocataireAction, RoomModel } from 'src/app/shared/store';
import { FormUtils } from 'src/app/shared/utils';

@Component({
  selector: 'update-locataire',
  templateUrl: './update-locataire.component.html',
  styleUrls: ['./update-locataire.component.css']
})
export class UpdateLocataireComponent {
  public formGroup: FormGroup;
    formGroupRef:FormGroup;
    waittingResponse = false;
    waittingResponseRef = false;
    title = 'Locataire'
  
    constructor(
      protected formBuilder: FormBuilder,
      private _store:Store,
      private _ngxsAction:Actions,
      private _activatedRoute: ActivatedRoute,
      private dialogRef: MatDialogRef<UpdateLocataireComponent>,
      @Inject(MAT_DIALOG_DATA) public data:{locataire:LocataireModel},
  ) { }
  
    ngOnInit(): void {

  
      this.formGroup = this.formBuilder.group({
        fullName:[this.data.locataire?.fullName,[Validators.required]],
        email: [this.data.locataire?.email, [Validators.email]],
        phoneNumber:[this.data.locataire?.phoneNumber, [Validators.required, Validators.pattern('^(\\+\\d{1,3}\\s)?(\\d{2,3}[\\s.-]?){4}$')]],
        description:[this.data.locataire?.description],
        fullNameRef:[this.data.locataire?.fullNameRef],
        emailRef: [this.data.locataire?.emailRef, [Validators.email]],
        phoneNumberRef:[this.data.locataire?.phoneNumberRef, [ Validators.pattern('^(\\+\\d{1,3}\\s)?(\\d{2,3}[\\s.-]?){4}$')]],
      })
  
      this._ngxsAction.pipe(ofActionSuccessful(LocataireAction.UpdateLocataire)).subscribe((value)=>{
        // Navigate to the parent
        this.waittingResponse=false;  
        this.onClose();
        }
      );
      this._ngxsAction.pipe(ofActionCompleted(LocataireAction.UpdateLocataire)).subscribe(
        (value) => {
          this.waittingResponse=false;        
        }
      )
  
      this._ngxsAction.pipe(ofActionErrored(LocataireAction.UpdateLocataire)).subscribe(
        (value) => {
          this.waittingResponse=false;
        })
    }
    isValid(name) {
      const instance = this.formGroup.get(name)
      return instance.invalid && (instance.dirty || instance.touched)
    }
  
    onSubmitUpdateLocataire() {
      this.formGroup.markAllAsTouched()
      if(this.formGroup.invalid) return;
      this.waittingResponse=true;
      this._store.dispatch(new LocataireAction.UpdateLocataire({...FormUtils.removeNullAttribut(this.formGroup.value)},this.data.locataire._id));
    }
  

    

  onClose() {
    this.formGroup.reset();
    this.dialogRef.close(false)
  }
}
