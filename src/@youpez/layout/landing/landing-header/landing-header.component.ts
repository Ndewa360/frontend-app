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
    // Toutes les villes : la recherche choisit la ville (position ou filtre).
    this.router.navigate([`/${this.getCurrentLanguage()}/search/index`]);
  }

  scrollToProfiles(): void {
    this.scrollToHomeSection('profiles-section');
  }

  /** Ouvre l'accueil si besoin, puis fait défiler jusqu'à la section [id]. */
  private scrollToHomeSection(id: string): void {
    const isOnHome = this.router.url.includes('/home') && !this.router.url.includes('/home/');

    if (isOnHome) {
      this.scrollToSection(id);
    } else {
      // Naviguer vers la landing puis scroller (la section peut mettre un
      // instant à être rendue : quelques essais espacés).
      this.router.navigate([`/${this.getCurrentLanguage()}/home`]).then(() => {
        let attempts = 0;
        const tryScroll = () => {
          if (this.scrollToSection(id) || ++attempts >= 10) return;
          setTimeout(tryScroll, 150);
        };
        setTimeout(tryScroll, 200);
      });
    }
  }

  private scrollToSection(id: string): boolean {
    const el = document.getElementById(id);
    if (!el) return false;
    // Le contenu commence sous l'en-tête fixe (décalage du layout) : petite marge seulement.
    const offset = 16;

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
    return true;
  }

  getCurrentLanguage(): string {
    return this.languageUrlService.getCurrentLanguage();
  }
}
