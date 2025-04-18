import { Component, ViewEncapsulation } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Store, Actions, Select, ofActionCompleted, ofActionSuccessful } from '@ngxs/store';
import { Observable } from 'rxjs';
import { ProspectionAction, ProspectionState } from 'src/app/shared/store';
import { FormUtils } from 'src/app/shared/utils';

@Component({
  selector: 'contact-us',
  templateUrl: './contact-us.component.html',
  styleUrls: ['./contact-us.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ContactUsComponent {

  @Select(ProspectionState.selectStateLoadingProspection) prospectionLoading:Observable<boolean>
  public formGroup: UntypedFormGroup

  waittingResponse = false;
  constructor(protected formBuilder: UntypedFormBuilder,
              private router: Router,
            private _store:Store,
            private _ngxsAction:Actions

          ) {
  }

  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      name: ['', [Validators.required,]],
      email: ['', [Validators.required, Validators.email]],
      object: ['', Validators.required],
      message: ['', Validators.required],
      tel:[null, [Validators.required, Validators.pattern('^(\\+\\d{1,3}\\s)?(\\d{2,3}[\\s.-]?){4}$')]],
    })

    this._ngxsAction.pipe(ofActionCompleted(ProspectionAction.CreateNewProspection)).subscribe((value)=>{
      this.waittingResponse =false;
    });

    this._ngxsAction.pipe(ofActionSuccessful(ProspectionAction.CreateNewProspection)).subscribe((value)=>{
      this.formGroup.reset();
    });
  }

  onSubmit() {
    this.formGroup.markAllAsTouched()
    this.waittingResponse=true;
    this._store.dispatch(new ProspectionAction.CreateNewProspection({...FormUtils.removeNullAttribut(this.formGroup.value)}));
  }

  isValid(name) {
    const instance = this.formGroup.get(name)
    return instance.invalid && (instance.dirty || instance.touched)
  }
}
