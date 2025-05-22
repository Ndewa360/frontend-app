import { Component, OnInit,ViewEncapsulation } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Store, Actions, ofActionCompleted, ofActionSuccessful,Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { ProspectionState, ProspectionAction,UserProfileState,UserProfileModel } from 'src/app/shared/store';
import { FormUtils } from 'src/app/shared/utils';


@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss'],
  encapsulation: ViewEncapsulation.None

})
export class SupportComponent implements OnInit {
  waittingResponse = false;
  public formGroup: UntypedFormGroup  
  @Select(ProspectionState.selectStateLoadingProspection) prospectionLoading:Observable<boolean>;
  @Select(UserProfileState.selectStateUserProfile) userProfil$:Observable<UserProfileModel>

  routingLink="/support/home"

  constructor(
    protected formBuilder: UntypedFormBuilder,
    private router: Router,
    private _store:Store,
    private _ngxsAction:Actions

  ) { }

  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      name: ['', [Validators.required,]],
      email: ['', [Validators.required, Validators.email]],
      object: ['', Validators.required],
      tel:[null, [Validators.required, Validators.pattern('^(\\+\\d{1,3}\\s)?(\\d{2,3}[\\s.-]?){4}$')]],
      message: ['', Validators.required],
    })

    this._ngxsAction.pipe(ofActionCompleted(ProspectionAction.CreateNewProspection)).subscribe((value)=>{
      this.waittingResponse =false;
    });

    this._ngxsAction.pipe(ofActionSuccessful(ProspectionAction.CreateNewProspection)).subscribe((value)=>{
      this.formGroup.reset();
    });
    this.userProfil$.subscribe((user)=>{if(user) this.routingLink="/app/welcome"})

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
