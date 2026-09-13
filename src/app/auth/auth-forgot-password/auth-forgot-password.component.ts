import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Store, Actions, ofActionSuccessful, ofActionCompleted, ofActionErrored } from '@ngxs/store';
import { UserProfileAction } from 'src/app/shared/store';
import { TranslatePipe } from '@ngx-translate/core';
import { IbmIconComponent } from '../../../@youpez/components/ibm-icon/ibm-icon.component';
import { LoadingModule } from 'carbon-components-angular/loading';
import { NgIf } from '@angular/common';
import { ButtonModule } from 'carbon-components-angular/button';
import { InputModule } from 'carbon-components-angular';
import { AppLogoComponent } from '../../../@youpez/components/app-logo/app-logo.component';
import { ExtendedModule } from '@angular/flex-layout/extended';

@Component({
  selector: 'app-auth-forgot-password',
  templateUrl: './auth-forgot-password.component.html',
  styleUrls: ['./auth-forgot-password.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [ExtendedModule, AppLogoComponent, FormsModule, ReactiveFormsModule, InputModule, ButtonModule, NgIf, LoadingModule, IbmIconComponent, RouterLink, TranslatePipe]
})
export class AuthForgotPasswordComponent implements OnInit {

  public formGroup: UntypedFormGroup;
  waittingResponse = false;


  constructor(protected formBuilder: UntypedFormBuilder,
              private router: Router,
              private _store:Store,
              private _ngxsAction:Actions
  ) {
  }

  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this._ngxsAction.pipe(ofActionCompleted(UserProfileAction.ForgotPasswordUserProfile)).subscribe(
      (value) => {
        this.waittingResponse=false;     
      }
    );

    this._ngxsAction.pipe(ofActionSuccessful(UserProfileAction.ForgotPasswordUserProfile)).subscribe(
      (value) => {
        this.formGroup.reset();   
      }
    );


  }

  onSubmit() {
    this.formGroup.markAllAsTouched();
    this._store.dispatch(new UserProfileAction.ForgotPasswordUserProfile(this.formGroup.value.email));
    this.waittingResponse=true;


  }

  isValid(name) {
    const instance = this.formGroup.get(name);
    return instance.invalid && (instance.dirty || instance.touched);
  }
}
