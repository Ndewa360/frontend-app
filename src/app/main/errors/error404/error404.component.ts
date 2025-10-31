import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { UserProfileState, UserProfileModel } from 'src/app/shared/store';
import { LanguageUrlService } from 'src/app/shared/services/language-url.service';
import { LanguagePreservationService } from 'src/app/shared/services/language-preservation.service';

@Component({
  selector: 'app-error404',
  templateUrl: './error404.component.html',
  styleUrls: ['./error404.component.scss']
})
export class Error404Component implements OnInit {

  @Select(UserProfileState.selectStateUserProfile) userProfile$: Observable<UserProfileModel>;

  constructor(
    private router: Router,
    private languageUrlService: LanguageUrlService,
    private languagePreservation: LanguagePreservationService
  ) { }

  ngOnInit(): void {
    // Redirection automatique après 3 secondes
    setTimeout(() => {
      this.redirectToAppropriateHome();
    }, 3000);
  }

  /**
   * Redirige vers la page appropriée selon l'état de connexion
   */
  redirectToAppropriateHome(): void {
    this.userProfile$.pipe(take(1)).subscribe(user => {
      const currentLang = this.languageUrlService.getCurrentLanguage();
      
      if (user) {
        // Utilisateur connecté : rediriger vers l'accueil des propriétés
        this.router.navigate([`/${currentLang}/app/properties/home`]);
      } else {
        // Utilisateur non connecté : rediriger vers l'authentification
        this.languagePreservation.redirectToLogin();
      }
    });
  }

  /**
   * Méthode appelée par le bouton "Back to Home"
   */
  goHome(): void {
    this.redirectToAppropriateHome();
  }
}
