import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { UserProfileState, UserProfileModel } from 'src/app/shared/store';
import { LanguageUrlService } from 'src/app/shared/services/language-url.service';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIf, AsyncPipe } from '@angular/common';
import { ListModule } from 'carbon-components-angular';
import { AppLogoComponent } from '../../../@youpez/components/app-logo/app-logo.component';
import { FlexModule } from '@angular/flex-layout/flex';
import { NgScrollbar } from 'ngx-scrollbar';

@Component({
  selector: 'home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: true,
  imports: [NgScrollbar, FlexModule, AppLogoComponent, ListModule, NgIf, AsyncPipe, TranslatePipe]
})
export class HomeComponent implements OnInit {
  
  @Select(UserProfileState.selectStateUserProfile) userProfil$:Observable<UserProfileModel>;
  
  constructor(
    private _router:Router,
    private languageUrlService: LanguageUrlService
  ){}
  
  ngOnInit(): void {
    // Plus besoin de routerLink statique
  }

  goToCreateHome()
  {
    const currentLang = this.languageUrlService.getCurrentLanguage();
    
    // Vérifier si l'utilisateur est connecté
    this.userProfil$.pipe(
      take(1)
    ).subscribe(user => {
      if (user) {
        // Utilisateur connecté : aller vers les propriétés
        this._router.navigate([`/${currentLang}/app/properties/home`]);
      } else {
        // Utilisateur non connecté : aller vers l'authentification avec returnUrl
        const returnUrl = encodeURIComponent(`/${currentLang}/app/properties/home`);
        this._router.navigate([`/${currentLang}/auth/signin`], { 
          queryParams: { returnUrl } 
        });
      }
    });
  }

  // Méthode pour naviguer vers une page du support avec la langue courante
  navigateToSupportPage(page: string): void {
    const currentLang = this.languageUrlService.getCurrentLanguage();
    this._router.navigate([`/${currentLang}/support/${page}`]);
  }
}
