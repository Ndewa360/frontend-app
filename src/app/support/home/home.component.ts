import { Component } from '@angular/core';
import { Router } from "@angular/router";
import { Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { UserProfileState, UserProfileModel } from 'src/app/shared/store';
import { LanguageUrlService } from 'src/app/shared/services/language-url.service';

@Component({
  selector: 'home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  
  @Select(UserProfileState.selectStateUserProfile) userProfil$:Observable<UserProfileModel>
  routerLink="/auth/signin?returnUrl=/app/properties/home"
  
  constructor(
    private _router:Router,
    private languageUrlService: LanguageUrlService
  ){}
  ngOnInit(): void {
    this.userProfil$.subscribe((user)=>{if(user) this.routerLink="/app/properties"})
  }

  goToCreateHome()
  {
    this._router.navigateByUrl(this.routerLink);
  }

  // Méthode pour naviguer vers une page du support avec la langue courante
  navigateToSupportPage(page: string): void {
    const currentLang = this.languageUrlService.getCurrentLanguage();
    this._router.navigate([`/${currentLang}/support/${page}`]);
  }
}
