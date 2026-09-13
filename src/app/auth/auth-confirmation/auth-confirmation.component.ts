import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Actions, ofActionCompleted, ofActionErrored, ofActionSuccessful, Store } from '@ngxs/store';
import { UserProfileAction } from 'src/app/shared/store';
import { LanguageUrlService } from 'src/app/shared/services/language-url.service';
import { TranslatePipe } from '@ngx-translate/core';
import { IbmIconComponent } from '../../../@youpez/components/ibm-icon/ibm-icon.component';
import { LoadingModule } from 'carbon-components-angular/loading';
import { NgIf } from '@angular/common';
import { ButtonModule } from 'carbon-components-angular/button';
import { AppLogoComponent } from '../../../@youpez/components/app-logo/app-logo.component';
import { ExtendedModule } from '@angular/flex-layout/extended';

@Component({
  selector: 'app-auth-confirmation',
  templateUrl: './auth-confirmation.component.html',
  styleUrls: ['./auth-confirmation.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [ExtendedModule, AppLogoComponent, ButtonModule, NgIf, LoadingModule, IbmIconComponent, RouterLink, TranslatePipe]
})
export class AuthConfirmationComponent implements OnInit {
  waittingResponse=false;
  email:string='';

  constructor(
    private route: ActivatedRoute,
    private _ngxsAction:Actions,
    private _store:Store,
    private router:Router,
    private languageUrlService: LanguageUrlService
  ) {}

  ngOnInit(): void {
    
    this.email = this.route.snapshot.paramMap.get('email');

    this._ngxsAction.pipe(ofActionCompleted(UserProfileAction.ResentLinkForUserProfilePassWord)).subscribe((value) => {
      this.waittingResponse =false;
    });

    this._ngxsAction.pipe(ofActionSuccessful(UserProfileAction.ResentLinkForUserProfilePassWord)).subscribe((value) => {
      const currentLang = this.languageUrlService.getCurrentLanguage();
      this.router.navigate([`/${currentLang}/auth/askto-valid-email`]);
    });
  }

  onResendEmailConfirmation()
  {
    this._store.dispatch(new UserProfileAction.ResentLinkForUserProfilePassWord(this.email));
    this.waittingResponse=true;
  }

}
