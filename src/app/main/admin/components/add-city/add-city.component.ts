import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Store, Actions, ofActionSuccessful, ofActionCompleted, ofActionErrored } from '@ngxs/store';
import { CityAction, CountryModel } from 'src/app/shared/store';
import { FormUtils } from 'src/app/shared/utils';

@Component({
  selector: 'add-city',
  templateUrl: './add-city.component.html',
  styleUrls: ['./add-city.component.css'],
  encapsulation:ViewEncapsulation.None
})
export class AddCityComponent {
  public formGroup: FormGroup;
    
      waittingResponse = false;
    
      constructor(
        private dialogRef: MatDialogRef<AddCityComponent>,
        protected formBuilder: FormBuilder,
        private router: Router,
      private _store:Store,
      private _ngxsAction:Actions,
      @Inject(MAT_DIALOG_DATA) public data: {country: CountryModel}
    ) { }
    
      ngOnInit(): void {
        this.formGroup = this.formBuilder.group({
          fullName: [null, [Validators.required,]]
        })
    
        this._ngxsAction.pipe(ofActionSuccessful(CityAction.CreateCity)).subscribe((value)=>{
          // Navigate to the parent
          this.waittingResponse=false;
          this.onClose()
          }
        );
        this._ngxsAction.pipe(ofActionCompleted(CityAction.CreateCity)).subscribe(
          (value) => {
            this.waittingResponse=false;
          }
        )
    
        this._ngxsAction.pipe(ofActionErrored(CityAction.CreateCity)).subscribe(
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
        this._store.dispatch(new CityAction.CreateCity({...FormUtils.removeNullAttribut(this.formGroup.value),country:this.data.country._id}));
        
      }
}
