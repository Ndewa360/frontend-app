import {Component, OnInit} from '@angular/core'
import {UntypedFormBuilder, UntypedFormGroup, Validators} from "@angular/forms"
import {Router} from "@angular/router"
import { Store, Actions, ofActionSuccessful, ofActionCompleted, ofActionErrored } from '@ngxs/store'
import { UserProfileAction } from 'src/app/shared/store'

@Component({
  selector: 'app-auth-forgot-password',
  templateUrl: './auth-forgot-password.component.html',
  styleUrls: ['./auth-forgot-password.component.scss']
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
    }, {updateOn: 'blur'})

    this._ngxsAction.pipe(ofActionSuccessful(UserProfileAction.ForgotPasswordUserProfile)).subscribe((value)=>{
      // Navigate to the parent
      this.waittingResponse=false;
      this.router.navigate(['/auth/signin']);
      // this.notificationService.showToast({
      //   type: "success",
      //   title: "Mot de passe oublié",
      //   subtitle: "Code envoyé avec success! ",
      //   target: "body",
      //   message: "message",
      //   duration: 2000,
      // })
      }
    );
    this._ngxsAction.pipe(ofActionCompleted(UserProfileAction.ForgotPasswordUserProfile)).subscribe(
      (value) => {
        this.waittingResponse=false;        
      }
    )

    this._ngxsAction.pipe(ofActionErrored(UserProfileAction.ForgotPasswordUserProfile)).subscribe(
      (value) => {
        this.waittingResponse=false;
        // this.notificationService.showToast({
        //   type: "error",
        //   title: "Mot de passe oublié",
        //   subtitle: "Une erreur c'est produite ",
        //   target: "body",
        //   message: "message",
        //   duration: 2000,
        // })
      })
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
