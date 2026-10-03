import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Store } from '@ngxs/store';
import { AuthTokenState } from '../store/auth-token';
import { map } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { LanguagePreservationService } from '../services/language-preservation.service';

export const AuthGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const store = inject(Store);
  const router = inject(Router);
  const toastr = inject(ToastrService);
  const languagePreservation = inject(LanguagePreservationService);

  return store.select(AuthTokenState.selectStateAuthToken).pipe(
    map((authToken) => {
      if (authToken) return true;
      const currentLang = languagePreservation.getCurrentOrPreservedLanguage();
      if (state.url.includes('/auth/')) {
        return router.parseUrl(`/${currentLang}/auth/signin`);
      }
      toastr.warning(
        languagePreservation.getLocalizedMessage('NOTIFICATIONS.AUTH_REQUIRED') || 'Veuillez vous connecter.',
        'Ndewa360°'
      );
      return router.createUrlTree([`/${currentLang}/auth/signin`], { queryParams: { returnUrl: state.url } });
    })
  );
};
