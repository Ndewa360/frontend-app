import {Component, OnInit, ViewEncapsulation} from '@angular/core'
import {
  UntypedFormGroup,
  UntypedFormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators
} from "@angular/forms"
import {ActivatedRoute, ActivatedRouteSnapshot, Router} from '@angular/router'
import { Actions, ofActionCompleted, ofActionErrored, ofActionSuccessful, Store } from '@ngxs/store'

import { UserProfileAction } from 'src/app/shared/store'

@Component({
  selector: 'app-auth-login',
  templateUrl: './auth-login.component.html',
  styleUrls: ['./auth-login.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AuthLoginComponent implements OnInit {

  public formGroup: UntypedFormGroup
  waittingResponse = false;


  constructor(protected formBuilder: UntypedFormBuilder,
              private router: Router,
              private _store:Store,
              private _ngxsAction:Actions,
              private route: ActivatedRoute
          ) {
  }

  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    })



    this._ngxsAction.pipe(ofActionSuccessful(UserProfileAction.LoginUserProfile)).subscribe((value)=>{
      //console.log("User Connected ",value)
      if(this.route.snapshot.queryParamMap.has("returnUrl")) this.router.navigate([this.route.snapshot.queryParamMap.get("returnUrl")]); 
      // else this.router.navigate(["app/welcome"])
      else this.router.navigate(["/search/index"])
      // 
      }
    );
    this._ngxsAction.pipe(ofActionCompleted(UserProfileAction.LoginUserProfile)).subscribe(
      (value) => {
        this.waittingResponse=false;
        if(value?.result?.error?.['status']==406) this.router.navigate(['/auth/confirmation',this.formGroup.value.email]);
      }
    )

    this._ngxsAction.pipe(ofActionErrored(UserProfileAction.LoginUserProfile)).subscribe(
      (value) => {
        this.waittingResponse=false;        
      })
  }

  onSubmit() {
    this.formGroup.markAllAsTouched()
    this.waittingResponse=true;    
    this._store.dispatch(new UserProfileAction.LoginUserProfile(this.formGroup.value.email,this.formGroup.value.password));
    
  }

  isValid(name) {
    const instance = this.formGroup.get(name)
    return instance.invalid && (instance.dirty || instance.touched)
  }
}
