import { Component, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Store, Actions, ofActionSuccessful, ofActionCompleted, ofActionErrored } from '@ngxs/store';
import { CountryAction } from 'src/app/shared/store';
import { FormUtils } from 'src/app/shared/utils';

@Component({
  selector: 'add-country',
  templateUrl: './add-country.component.html',
  styleUrls: ['./add-country.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class AddCountryComponent {
   public formGroup: FormGroup;
  
    waittingResponse = false;
  
    constructor(
      private dialogRef: MatDialogRef<AddCountryComponent>,
      protected formBuilder: FormBuilder,
      private router: Router,
    private _store:Store,
    private _ngxsAction:Actions) { }
  
    ngOnInit(): void {
      this.formGroup = this.formBuilder.group({
        fullName: [null, [Validators.required,]],
        shortName: [null, [Validators.required, ]],
        phoneCode: [null, [Validators.required]],
      })
  
      this._ngxsAction.pipe(ofActionSuccessful(CountryAction.CreateCountry)).subscribe((value)=>{
        // Navigate to the parent
        this.waittingResponse=false;
        this.onClose()
        }
      );
      this._ngxsAction.pipe(ofActionCompleted(CountryAction.CreateCountry)).subscribe(
        (value) => {
          this.waittingResponse=false;
        }
      )
  
      this._ngxsAction.pipe(ofActionErrored(CountryAction.CreateCountry)).subscribe(
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
      this.waittingResponse=true;
      this._store.dispatch(new CountryAction.CreateCountry(FormUtils.removeNullAttribut(this.formGroup.value)));
      
    }
}
