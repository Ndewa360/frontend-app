import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from "@angular/forms"
import {ActivatedRoute, Router} from "@angular/router"
import { Actions, ofActionCompleted,ofActionSuccessful, Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { UserProfileAction } from 'src/app/shared/store';
import { LanguageUrlService } from 'src/app/shared/services/language-url.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-auth-reset-password',
  templateUrl: './auth-reset-password.component.html',
  styleUrls: ['./auth-reset-password.component.scss'],
  encapsulation:ViewEncapsulation.None
})
export class AuthResetPasswordComponent implements OnInit {

  public formGroup: UntypedFormGroup;
  token=""
  waittingResponse:boolean=false;

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
    if(!this.route.snapshot.queryParamMap.has("resetTokenPwd"))
      {
        this._toastrService.error(`Token non fournis! `, 'Ndewa360°');
        const currentLang = this.languageUrlService.getCurrentLanguage();
        this.router.navigate([`/${currentLang}/auth/signin`])
        return;
      }
    this.token = this.route.snapshot.queryParamMap.get("resetTokenPwd");
    
    this.formGroup = this.formBuilder.group({
      password: ['', [Validators.required,]],
      passwordConfirm: ['', [Validators.required,]],
    })
    
    this._ngxsAction.pipe(ofActionCompleted(UserProfileAction.ResetPasswordForUserProfile)).subscribe(
      (value) => {
        this.waittingResponse=false;        
      }
    )

    this._ngxsAction.pipe(ofActionSuccessful(UserProfileAction.ResetPasswordForUserProfile)).subscribe(
      (value) => {
        const currentLang = this.languageUrlService.getCurrentLanguage();
        this.router.navigate([`/${currentLang}/auth/signin`])
      }
    )
  }

  onSubmit() {
    this._store.dispatch(new UserProfileAction.ResetPasswordForUserProfile(this.formGroup.value.password,this.token));
    this.waittingResponse=true;
  }

  isValid(name) {
    const instance = this.formGroup.get(name)
    return instance.invalid && (instance.dirty || instance.touched)
  }
  isValidConfirmPassword()
  {
    return this.isValid("passwordConfirm") || this.formGroup.value.password != this.formGroup.value.passwordConfirm
  }
  getValidText()
  {
    if(this.formGroup.value.password != this.formGroup.value.passwordConfirm) return this.translate.instant('VALIDATION.PASSWORDS_NOT_MATCH');
    return this.translate.instant('VALIDATION.REQUIRED');
  }
}
