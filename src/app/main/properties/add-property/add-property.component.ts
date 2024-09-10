import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Store, Actions, ofActionCompleted, ofActionErrored, ofActionSuccessful } from '@ngxs/store';
import { PropertyAction } from 'src/app/shared/store';
import { FormUtils } from 'src/app/shared/utils';

@Component({
  selector: 'app-add-property',
  templateUrl: './add-property.component.html',
  styleUrls: ['./add-property.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AddPropertyComponent implements OnInit {
  public formGroup: FormGroup;

  waittingResponse = false;

  constructor(
    private dialogRef: MatDialogRef<AddPropertyComponent>,
    protected formBuilder: FormBuilder,
    private router: Router,
  private _store:Store,
  private _ngxsAction:Actions) { }

  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      name: [null, [Validators.required,]],
      location: [null, [Validators.required, ]],
      description: [null, ],
    })

    this._ngxsAction.pipe(ofActionSuccessful(PropertyAction.CreateProperty)).subscribe((value)=>{
      // Navigate to the parent
      this.waittingResponse=false;
      this.onClose()
      }
    );
    this._ngxsAction.pipe(ofActionCompleted(PropertyAction.CreateProperty)).subscribe(
      (value) => {
        this.waittingResponse=false;
        
      }
    )

    this._ngxsAction.pipe(ofActionErrored(PropertyAction.CreateProperty)).subscribe(
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
    this._store.dispatch(new PropertyAction.CreateProperty(FormUtils.removeNullAttribut(this.formGroup.value)));
    
  }

}
