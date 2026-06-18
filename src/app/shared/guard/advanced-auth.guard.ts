import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Store } from '@ngxs/store';
import { Observable, of, combineLatest } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { AuthTokenState, UserProfileState } from '../store';
import { RefreshTokenService } from '../store/auth-token/refresh-token.service';
import { UserActivityService, UserActivityState } from '../store/auth-token/user-activity.service';
import { LanguageUrlService } from '../services/language-url.service';
import { LanguagePreservationService } from '../services/language-preservation.service';

export interface SessionCheckResult {
  canActivate: boolean;
  redirectUrl?: string;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class AdvancedAuthGuard implements CanActivate {

  constructor(
    private store: Store,
    private router: Router,
    private toastrService: ToastrService,
    private refreshTokenService: RefreshTokenService,
    private userActivityService: UserActivityService,
    private languageUrlService: LanguageUrlService,
    private languagePreservation: LanguagePreservationService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    return this.checkSessionValidity(state).pipe(
      map(result => {
        if (result.canActivate) return true;
        if (result.message) this.toastrService.warning(result.message, 'Ndewa360°');
        return this.router.parseUrl(result.redirectUrl || this.getSafeRedirectUrl(state.url));
      }),
      catchError(error => {
        this.toastrService.error('Erreur de vérification de session', 'Ndewa360°');
        return of(this.router.parseUrl(this.getSafeRedirectUrl(state.url)));
      })
    );
  }

  private checkSessionValidity(state: RouterStateSnapshot): Observable<SessionCheckResult> {
    return combineLatest([
      this.store.select(AuthTokenState.selectStateToken),
      this.store.select(UserProfileState.selectStateUserProfile),
      this.userActivityService.getActivityState()
    ]).pipe(
      switchMap(([token, userProfile, activityState]) => {
        if (!token || !token.accessToken) {
          const lang = this.languagePreservation.getCurrentOrPreservedLanguage();
          return of({ canActivate: false, redirectUrl: this.getSafeRedirectUrl(state.url, lang), message: '🔑 Authentification requise' });
        }
        if (activityState === UserActivityState.CRITICAL_INACTIVE) {
          const lang = this.languagePreservation.getCurrentOrPreservedLanguage();
          return of({ canActivate: false, redirectUrl: `/${lang}/auth/signin?returnUrl=${encodeURIComponent(state.url)}&reason=critical_inactive`, message: '🔒 Session fermée après inactivité prolongée' });
        }
        if (activityState === UserActivityState.INACTIVE) {
          const lang = this.languagePreservation.getCurrentOrPreservedLanguage();
          return of({ canActivate: false, redirectUrl: `/${lang}/auth/signin?returnUrl=${encodeURIComponent(state.url)}&reason=inactive`, message: '⏰ Session suspendue pour inactivité' });
        }
        return this.checkTokenExpiration(state.url);
      })
    );
  }

  private checkTokenExpiration(currentUrl: string): Observable<SessionCheckResult> {
    return this.refreshTokenService.checkTokenExpiration().pipe(
      map(result => {
        if (result) return { canActivate: true };
        const lang = this.languagePreservation.getCurrentOrPreservedLanguage();
        return { canActivate: false, redirectUrl: this.getSafeRedirectUrl(currentUrl, lang), message: 'Votre session a expiré.' };
      }),
      catchError(() => {
        const lang = this.languagePreservation.getCurrentOrPreservedLanguage();
        return of({ canActivate: false, redirectUrl: this.getSafeRedirectUrl(currentUrl, lang), message: 'Erreur de session.' });
      })
    );
  }

  private getSafeRedirectUrl(currentUrl: string, lang?: string): string {
    const currentLang = lang || this.languagePreservation.getCurrentOrPreservedLanguage();
    if (currentUrl.includes('/auth/')) return `/${currentLang}/auth/signin`;
    return `/${currentLang}/auth/signin?returnUrl=${encodeURIComponent(this.cleanReturnUrl(currentUrl))}`;
  }

  private cleanReturnUrl(url: string): string {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
      const urlObj = new URL(url, origin);
      urlObj.searchParams.delete('returnUrl');
      const clean = urlObj.pathname + (urlObj.search || '');
      const lang = this.languagePreservation.getCurrentOrPreservedLanguage();
      return clean === '/' ? `/${lang}/app/welcome` : clean;
    } catch {
      const lang = this.languagePreservation.getCurrentOrPreservedLanguage();
      return `/${lang}/app/welcome`;
    }
  }
}
