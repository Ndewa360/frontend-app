import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Store, Actions, ofActionSuccessful, ofActionCompleted, ofActionErrored } from '@ngxs/store';
import { PropertyAction, PropertyModel } from 'src/app/shared/store';
import { FormUtils } from 'src/app/shared/utils';

@Component({
  selector: 'update-property',
  templateUrl: './update-property.component.html',
  styleUrls: ['./update-property.component.css'],
  encapsulation:ViewEncapsulation.None
})
export class UpdatePropertyComponent {
  public formGroup: FormGroup;

  waittingResponse = false;

  constructor(
    private dialogRef: MatDialogRef<UpdatePropertyComponent>,
    protected formBuilder: FormBuilder,
    private _store:Store,
    private _ngxsAction:Actions,
    @Inject(MAT_DIALOG_DATA) public data:{property:PropertyModel},
) { }

  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      name: [this.data.property.name, [Validators.required,]],
      location: [this.data.property.location, [Validators.required, ]],
      description: [this.data.property.description?this.data.property.description:"", ],
    })

    this._ngxsAction.pipe(ofActionSuccessful(PropertyAction.UpdateProperty)).subscribe((value)=>{
      // Navigate to the parent
      this.waittingResponse=false;
      this.onClose()
      }
    );
    this._ngxsAction.pipe(ofActionCompleted(PropertyAction.UpdateProperty)).subscribe(
      (value) => {
        this.waittingResponse=false;
        
      }
    )

    this._ngxsAction.pipe(ofActionErrored(PropertyAction.UpdateProperty)).subscribe(
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
    this._store.dispatch(new PropertyAction.UpdateProperty(FormUtils.removeNullAttribut(this.formGroup.value),this.data.property._id));
    
  }
}
