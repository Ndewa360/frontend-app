import {Component, OnInit, ViewEncapsulation} from '@angular/core'
import {UntypedFormBuilder, UntypedFormGroup, Validators} from "@angular/forms"
import {Router} from "@angular/router"
import { Store, Actions, ofActionSuccessful, ofActionCompleted, ofActionErrored } from '@ngxs/store'
import { UserProfileAction } from 'src/app/shared/store'

@Component({
  selector: 'app-auth-forgot-password',
  templateUrl: './auth-forgot-password.component.html',
  styleUrls: ['./auth-forgot-password.component.scss'],
  encapsulation:ViewEncapsulation.None
})
export class AuthForgotPasswordComponent implements OnInit {

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
      email: ['', [Validators.required, Validators.email]],
    })

    this._ngxsAction.pipe(ofActionCompleted(UserProfileAction.ForgotPasswordUserProfile)).subscribe(
      (value) => {
        this.waittingResponse=false;     
      }
    )

    this._ngxsAction.pipe(ofActionSuccessful(UserProfileAction.ForgotPasswordUserProfile)).subscribe(
      (value) => {
        this.formGroup.reset();   
      }
    )


  }

  onSubmit() {
    this.formGroup.markAllAsTouched()
    this._store.dispatch(new UserProfileAction.ForgotPasswordUserProfile(this.formGroup.value.email));
    this.waittingResponse=true;


  }

  isValid(name) {
    const instance = this.formGroup.get(name)
    return instance.invalid && (instance.dirty || instance.touched)
  }
}
