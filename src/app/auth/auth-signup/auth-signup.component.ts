import {Component, OnInit, ViewEncapsulation} from '@angular/core'
import {UntypedFormBuilder, UntypedFormGroup, Validators} from "@angular/forms"
import {Router} from "@angular/router"
import { Actions, ofActionCompleted, ofActionErrored, ofActionSuccessful, Store } from '@ngxs/store'
import {UserProfileAction} from "src/app/shared/store"

/**
 * Signup component
 */
@Component({
  selector: 'app-auth-signup',
  templateUrl: './auth-signup.component.html',
  styleUrls: ['./auth-signup.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AuthSignupComponent implements OnInit {

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
      fullName: ['', [Validators.required,]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],

      condition: [true],
    })

    this._ngxsAction.pipe(ofActionSuccessful(UserProfileAction.SignupSimpleUserProfile)).subscribe((value)=>{
      // Navigate to the parent
      this.waittingResponse=false;
      this.router.navigate(['/auth/signin']);
      }
    );
    this._ngxsAction.pipe(ofActionCompleted(UserProfileAction.SignupSimpleUserProfile)).subscribe(
      (value) => {
        this.waittingResponse=false;
      }
    )

    this._ngxsAction.pipe(ofActionErrored(UserProfileAction.SignupSimpleUserProfile)).subscribe(
      (value) => {
        this.waittingResponse=false;        
      })
  }

  onSubmit() {
    this.formGroup.markAllAsTouched()
    this.waittingResponse=true;
    this._store.dispatch(new UserProfileAction.SignupSimpleUserProfile(this.formGroup.value.email,this.formGroup.value.password,this.formGroup.value.fullName));
    
  }

  isValid(name) {
    const instance = this.formGroup.get(name)
    return instance.invalid && (instance.dirty || instance.touched)
  }

}
