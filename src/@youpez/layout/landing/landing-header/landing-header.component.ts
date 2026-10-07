import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { UserProfileState, UserProfileModel, AuthTokenState } from 'src/app/shared/store';
import { LanguageUrlService } from 'src/app/shared/services/language-url.service';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'carbon-components-angular/button';
import { LandingHeaderProfilDataComponent } from '../landing-header-profil-data/landing-header-profil-data.component';
import { NgIf, AsyncPipe } from '@angular/common';
import { AppLogoComponent } from '../../../components/app-logo/app-logo.component';

@Component({
  selector: 'app-landing-header',
  templateUrl: './landing-header.component.html',
  styleUrls: ['./landing-header.component.scss'],
  standalone: true,
  imports: [RouterLink, AppLogoComponent, NgIf, LandingHeaderProfilDataComponent, RouterLinkActive, ButtonModule, AsyncPipe, TranslatePipe]
})
export class LandingHeaderComponent implements OnInit {
  isMenuOpen=false;
  @Select(UserProfileState.selectStateUserProfile) userProfil$:Observable<UserProfileModel>;
  @Select(AuthTokenState.selectStateUserIsLogin)  isLogin$:Observable<boolean>;

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
      { queryParams: { ville:'Bangangté'} }
    );
  }

  scrollToProfiles(): void {
    const isOnHome = this.router.url.includes('/home') && !this.router.url.includes('/home/');

    if (isOnHome) {
      // Déjà sur la landing — scroll direct vers la section profils
      this.scrollToProfilesSection();
    } else {
      // Naviguer vers la landing puis scroller
      this.router.navigate([`/${this.getCurrentLanguage()}/home`]).then(() => {
        setTimeout(() => this.scrollToProfilesSection(), 400);
      });
    }
  }

  private scrollToProfilesSection(): void {
    const el = document.getElementById('profiles-section');
    if (!el) return;
    const offset = 80; // hauteur du header fixe

    // La landing rend son contenu dans un conteneur ngx-scrollbar : le scroll
    // se fait sur `.ng-scroll-viewport`, pas sur le `window` (sinon rien ne bouge).
    const viewport = document.querySelector<HTMLElement>('ng-scrollbar .ng-scroll-viewport');
    if (viewport) {
      const top = el.getBoundingClientRect().top - viewport.getBoundingClientRect().top
        + viewport.scrollTop - offset;
      viewport.scrollTo({ top, behavior: 'smooth' });
    } else {
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  getCurrentLanguage(): string {
    return this.languageUrlService.getCurrentLanguage();
  }
}
