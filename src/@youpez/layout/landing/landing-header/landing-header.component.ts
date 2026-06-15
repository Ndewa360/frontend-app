import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { UserProfileState, UserProfileModel, AuthTokenState } from 'src/app/shared/store';
import { LanguageUrlService } from 'src/app/shared/services/language-url.service';

@Component({
  selector: 'app-landing-header',
  templateUrl: './landing-header.component.html',
  styleUrls: ['./landing-header.component.scss']
})
export class LandingHeaderComponent implements OnInit {
  isMenuOpen=false;
  @Select(UserProfileState.selectStateUserProfile) userProfil$:Observable<UserProfileModel>
  @Select(AuthTokenState.selectStateUserIsLogin)  isLogin$:Observable<boolean>

  constructor(
    private router:Router,
    private languageUrlService: LanguageUrlService
  ) { }
  
  ngOnInit(): void {
  }
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  /**
   * Fermer le menu mobile quand on redimensionne vers desktop
   */
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (event.target.innerWidth >= 768 && this.isMenuOpen) {
      this.isMenuOpen = false;
    }
  }

  navigateToSearchPage()
  {
    this.router.navigate(
      [`/${this.getCurrentLanguage()}/search/index`],
      { queryParams: { ville:"Bangangté"} }
    );
  }

  scrollToProfiles(): void {
    const currentUrl = this.router.url;
    const isOnHome = currentUrl.includes('/home') && !currentUrl.includes('/home/');

    if (isOnHome) {
      // Déjà sur la landing — scroll direct vers la section profils
      const el = document.getElementById('profiles-section');
      if (el) {
        const offset = 80; // hauteur du header fixe
        const top = el.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    } else {
      // Naviguer vers la landing puis scroller
      this.router.navigate([`/${this.getCurrentLanguage()}/home`]).then(() => {
        setTimeout(() => {
          const el = document.getElementById('profiles-section');
          if (el) {
            const offset = 80;
            const top = el.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: 'smooth' });
          }
        }, 400);
      });
    }
  }

  getCurrentLanguage(): string {
    return this.languageUrlService.getCurrentLanguage();
  }
}
