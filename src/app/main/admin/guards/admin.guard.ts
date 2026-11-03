import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Store } from '@ngxs/store';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { UserProfileState } from '../../../shared/store/user-profile/user-profile.state';
import { UserProfileAction } from '../../../shared/store/user-profile/user-profile.actions';
import { UserProfileService } from '../../../shared/store/user-profile/user-profile.service';
import { LanguageUrlService } from '../../../shared/services/language-url.service';

const ADMIN_ROLES = ['admin', 'super-admin', 'super_admin'];

/**
 * Accès à l'espace d'administration : rôle admin ou super-admin.
 * Le serveur reste seul juge (AdminPermissionGuard) ; ce garde évite seulement
 * d'afficher l'admin à un compte qui n'y a pas droit.
 *
 * Les rôles du profil en mémoire peuvent n'être que des identifiants (réponse
 * de connexion) : le profil est alors rechargé (rôles avec leur nom) au lieu
 * de renvoyer un administrateur vers l'accueil après un rafraîchissement.
 */
@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {

  constructor(
    private store: Store,
    private router: Router,
    private languageUrlService: LanguageUrlService,
    private userProfileService: UserProfileService,
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | boolean | UrlTree {
    const lang = this.languageUrlService.getCurrentLanguage();
    const profile = this.store.selectSnapshot(UserProfileState.selectStateUserProfile);

    if (profile && this.rolesResolved(profile)) {
      return this.isAdmin(profile) || this.router.parseUrl(`/${lang}/app/properties/home`);
    }

    return this.userProfileService.getUserProfile().pipe(
      map((result) => {
        const fresh: any = result?.data;
        if (!fresh) return this.router.parseUrl(`/${lang}/auth/signin`);
        this.store.dispatch(new UserProfileAction.SetUserProfile(fresh));
        return this.isAdmin(fresh) || this.router.parseUrl(`/${lang}/app/properties/home`);
      }),
      catchError(() => of(this.router.parseUrl(profile ? `/${lang}/app/properties/home` : `/${lang}/auth/signin`))),
    );
  }

  /** Les rôles sont chargés avec leur nom (et non de simples identifiants). */
  private rolesResolved(profile: any): boolean {
    const roles = profile?.roles;
    if (!Array.isArray(roles)) return false;
    return roles.every((role: any) => typeof role === 'object' ? !!role?.name : !/^[0-9a-f]{24}$/i.test(String(role)));
  }

  private isAdmin(profile: any): boolean {
    return (profile?.roles || []).some((role: any) => ADMIN_ROLES.includes(typeof role === 'string' ? role : role?.name));
  }
}
