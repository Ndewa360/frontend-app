import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { UserProfileState, UserProfileModel, UserProfileAction } from 'src/app/shared/store';
import { Actions, Select, ofActionSuccessful, Store } from '@ngxs/store';
import { Router, RouterLink } from '@angular/router';
import { LanguageUrlService } from 'src/app/shared/services/language-url.service';
import { LanguagePreservationService } from 'src/app/shared/services/language-preservation.service';
import { NgIf, AsyncPipe } from '@angular/common';
import { NgbDropdown, NgbDropdownToggle, NgbDropdownMenu, NgbDropdownItem } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'landing-header-profil-data',
  templateUrl: './landing-header-profil-data.component.html',
  styleUrls: ['./landing-header-profil-data.component.css'],
  standalone: true,
  imports: [NgbDropdown, NgbDropdownToggle, NgbDropdownMenu, NgbDropdownItem, NgIf, RouterLink, AsyncPipe]
})
export class LandingHeaderProfilDataComponent implements OnInit {
  constructor(
    private _store: Store,
    private _ngxsAction: Actions,
    private router: Router,
    private languageUrlService: LanguageUrlService,
    private languagePreservation: LanguagePreservationService
  ) {}

  @Select(UserProfileState.selectStateUserProfile) userProfil$: Observable<UserProfileModel>;

  ngOnInit(): void {
    this._ngxsAction.pipe(ofActionSuccessful(UserProfileAction.LogoutUserProfile)).subscribe(() => {
      const lang = this.languageUrlService.getCurrentLanguage();
      this.router.navigate([`/${lang}/auth/signin`]);
    });
  }

  logout(): void {
    this.languagePreservation.preserveCurrentLanguage();
    this._store.dispatch(new UserProfileAction.LogoutUserProfile(true));
  }

  get currentLang(): string {
    return this.languageUrlService.getCurrentLanguage();
  }
}
