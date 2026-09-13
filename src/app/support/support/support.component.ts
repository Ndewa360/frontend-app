import { Component, OnInit,ViewEncapsulation } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Location, NgIf } from '@angular/common';
import { Store, Actions, ofActionCompleted, ofActionSuccessful,Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { ProspectionState, ProspectionAction,UserProfileState,UserProfileModel } from 'src/app/shared/store';
import { FormUtils } from 'src/app/shared/utils';
import { LanguageUrlService } from 'src/app/shared/services/language-url.service';
import { TranslatePipe } from '@ngx-translate/core';
import { LoadingModule } from 'carbon-components-angular/loading';
import { InputModule } from 'carbon-components-angular';
import { IbmIconComponent } from '../../../@youpez/components/ibm-icon/ibm-icon.component';
import { ButtonModule } from 'carbon-components-angular/button';
import { AppLogoComponent } from '../../../@youpez/components/app-logo/app-logo.component';
import { FlexModule } from '@angular/flex-layout/flex';
import { NgScrollbar } from 'ngx-scrollbar';


@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [NgScrollbar, FlexModule, AppLogoComponent, ButtonModule, IbmIconComponent, FormsModule, ReactiveFormsModule, InputModule, NgIf, LoadingModule, TranslatePipe]
})
export class SupportComponent implements OnInit {
  waittingResponse = false;
  public formGroup: UntypedFormGroup;  
  @Select(ProspectionState.selectStateLoadingProspection) prospectionLoading:Observable<boolean>;
  @Select(UserProfileState.selectStateUserProfile) userProfil$:Observable<UserProfileModel>;



  constructor(
    protected formBuilder: UntypedFormBuilder,
    private router: Router,
    private _store:Store,
    private _ngxsAction:Actions,
    private location: Location,
    private languageUrlService: LanguageUrlService
  ) { }

  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      object: ['', Validators.required],
      tel:[null, [Validators.required, Validators.pattern('^(\\+\\d{1,3}\\s)?(\\d{2,3}[\\s.-]?){4}$')]],
      message: ['', Validators.required]
    });

    this._ngxsAction.pipe(ofActionCompleted(ProspectionAction.CreateNewProspection)).subscribe((value) => {
      this.waittingResponse =false;
    });

    this._ngxsAction.pipe(ofActionSuccessful(ProspectionAction.CreateNewProspection)).subscribe((value) => {
      this.formGroup.reset();
    });
    // this.userProfil$.subscribe((user)=>{if(user) this.routingLink="/app/welcome"})

  }

  onSubmit() {
    this.formGroup.markAllAsTouched();
    this.waittingResponse=true;
    this._store.dispatch(new ProspectionAction.CreateNewProspection({...FormUtils.removeNullAttribut(this.formGroup.value)}));
  }
  
  isValid(name) {
    const instance = this.formGroup.get(name);
    return instance.invalid && (instance.dirty || instance.touched);
  }

  goBack()
  {
    // Naviguer vers la page d'accueil du support avec la langue courante
    const currentLang = this.languageUrlService.getCurrentLanguage();
    this.router.navigate([`/${currentLang}/support/welcome`]);
  }
}
