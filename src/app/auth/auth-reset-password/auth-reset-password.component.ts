import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Actions, ofActionCompleted,ofActionSuccessful, Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { UserProfileAction } from 'src/app/shared/store';
import { LanguageUrlService } from 'src/app/shared/services/language-url.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { IbmIconComponent } from '../../../@youpez/components/ibm-icon/ibm-icon.component';
import { LoadingModule } from 'carbon-components-angular/loading';
import { ButtonModule } from 'carbon-components-angular/button';
import { NgIf } from '@angular/common';
import { InputModule } from 'carbon-components-angular';
import { AppLogoComponent } from '../../../@youpez/components/app-logo/app-logo.component';
import { ExtendedModule } from '@angular/flex-layout/extended';

@Component({
  selector: 'app-auth-reset-password',
  templateUrl: './auth-reset-password.component.html',
  styleUrls: ['./auth-reset-password.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [ExtendedModule, AppLogoComponent, FormsModule, ReactiveFormsModule, InputModule, NgIf, ButtonModule, LoadingModule, IbmIconComponent, RouterLink, TranslatePipe]
})
export class AuthResetPasswordComponent implements OnInit {

  public formGroup: UntypedFormGroup;
  token = '';
  waittingResponse: boolean = false;
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    protected formBuilder: UntypedFormBuilder,
    private router: Router,
    private route:ActivatedRoute,
    private _store:Store,
    private _ngxsAction:Actions,
    private _toastrService:ToastrService,
    private languageUrlService: LanguageUrlService,
    private translate: TranslateService
  ) {
  }

  ngOnInit(): void {
    if(!this.route.snapshot.queryParamMap.has('resetTokenPwd'))
    {
      this._toastrService.error(this.translate.instant('NOTIFICATIONS.TOKEN_NOT_PROVIDED'), 'Ndewa360°');
      const currentLang = this.languageUrlService.getCurrentLanguage();
      this.router.navigate([`/${currentLang}/auth/signin`]);
      return;
    }
    this.token = this.route.snapshot.queryParamMap.get('resetTokenPwd');
    
    this.formGroup = this.formBuilder.group({
      password: ['', [Validators.required]],
      passwordConfirm: ['', [Validators.required]]
    });
    
    this._ngxsAction.pipe(ofActionCompleted(UserProfileAction.ResetPasswordForUserProfile)).subscribe(
      (value) => {
        this.waittingResponse=false;        
      }
    );

    this._ngxsAction.pipe(ofActionSuccessful(UserProfileAction.ResetPasswordForUserProfile)).subscribe(
      (value) => {
        const currentLang = this.languageUrlService.getCurrentLanguage();
        this.router.navigate([`/${currentLang}/auth/signin`]);
      }
    );
  }

  onSubmit() {
    if (this.formGroup.value.password !== this.formGroup.value.passwordConfirm) {
      this._toastrService.error(this.translate.instant('VALIDATION.PASSWORDS_NOT_MATCH'), 'Ndewa360°');
      return;
    }
    this._store.dispatch(new UserProfileAction.ResetPasswordForUserProfile(this.formGroup.value.password, this.token));
    this.waittingResponse = true;
  }

  isValid(name) {
    const instance = this.formGroup.get(name);
    return instance.invalid && (instance.dirty || instance.touched);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
  isValidConfirmPassword()
  {
    return this.isValid('passwordConfirm') || this.formGroup.value.password != this.formGroup.value.passwordConfirm;
  }
  getValidText()
  {
    if(this.formGroup.value.password != this.formGroup.value.passwordConfirm) return this.translate.instant('VALIDATION.PASSWORDS_NOT_MATCH');
    return this.translate.instant('VALIDATION.REQUIRED');
  }
}
