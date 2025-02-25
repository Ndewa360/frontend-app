import { Component, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store, Actions, ofActionSuccessful, ofActionCompleted, ofActionErrored, Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { LocataireModel, UserProfileAction, UserProfileModel, UserProfileState } from 'src/app/shared/store';
import { FormUtils } from 'src/app/shared/utils';

@Component({
  selector: 'user-profile-infos',
  templateUrl: './user-profile-infos.component.html',
  styleUrls: ['./user-profile-infos.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class UserProfileInfosComponent {
  @Select(UserProfileState.selectStateUserProfile) userProfile$:Observable<UserProfileModel>;
  @Select(UserProfileState.selectStateSavedLoading) profileStateSavedLoading$:Observable<boolean>
  userProfile:UserProfileModel=null;
  public formGroup: FormGroup;
    formGroupRef:FormGroup;
    waittingResponse = false;
    waittingResponseRef = false;
    title = 'Locataire'
    locataire:LocataireModel=null;
  
    constructor(
      protected formBuilder: FormBuilder,
      private _store:Store,
      private _ngxsAction:Actions,
      private _activatedRoute: ActivatedRoute,
  ) { }
  
    ngOnInit(): void {

      this.userProfile$.subscribe((value)=>{
        this.userProfile = value;
      })
  
      this.formGroup = this.formBuilder.group({
        name:[this.userProfile?.name,[Validators.required]],
        phoneNumber:[this.userProfile?.phoneNumber, [Validators.required, Validators.pattern('^(\\+\\d{1,3}\\s)?(\\d{2,3}[\\s.-]?){4}$')]],
        bio:[this.userProfile?.bio],
        location:[this.userProfile?.bio],
      })
  
      this._ngxsAction.pipe(ofActionSuccessful(UserProfileAction.UpdateUserProfile)).subscribe((value)=>{
        // Navigate to the parent
        this.waittingResponse=false;  
        }
      );
      this._ngxsAction.pipe(ofActionCompleted(UserProfileAction.UpdateUserProfile)).subscribe(
        (value) => {
          this.waittingResponse=false;        
        }
      )
  
      this._ngxsAction.pipe(ofActionErrored(UserProfileAction.UpdateUserProfile)).subscribe(
        (value) => {
          this.waittingResponse=false;
        })
    }

    isValid(name) {
      const instance = this.formGroup.get(name)
      return instance.invalid && (instance.dirty || instance.touched)
    }
  
    onSubmitUpdateUserInfos() {
      this.formGroup.markAllAsTouched()
      if(this.formGroup.invalid) return;
      this.waittingResponse=true;
      this._store.dispatch(new UserProfileAction.UpdateUserProfile({...FormUtils.removeNullAttribut(this.formGroup.value)},this.userProfile._id));
    }
  
    isValidRef(name) {
      const instance = this.formGroupRef.get(name)
      return instance.invalid && (instance.dirty || instance.touched)
    }
  
}
