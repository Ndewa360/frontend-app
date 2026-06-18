import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Store } from '@ngxs/store';
import { AuthTokenState } from '../store/auth-token';
import { map } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { LanguageUrlService } from '../services/language-url.service';
import { LanguagePreservationService } from '../services/language-preservation.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private _toastrService: ToastrService,
    private _store: Store,
    private router: Router,
    private languageUrlService: LanguageUrlService,
    private languagePreservation: LanguagePreservationService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this._store.select(AuthTokenState.selectStateAuthToken).pipe(
      map((authToken) => {
        if (authToken) return true;
        const currentLang = this.languagePreservation.getCurrentOrPreservedLanguage();
        if (state.url.includes('/auth/signin') || state.url.includes('/auth/signup')) {
          return this.router.parseUrl(`/${currentLang}/auth/signin`);
        }
        this._toastrService.warning(
          this.languagePreservation.getLocalizedMessage('NOTIFICATIONS.AUTH_REQUIRED') || 'Veuillez vous connecter.',
          'Ndewa360°'
        );
        return this.router.parseUrl(`/${currentLang}/auth/signin?returnUrl=${encodeURIComponent(state.url)}`);
      })
    );
  }
}
