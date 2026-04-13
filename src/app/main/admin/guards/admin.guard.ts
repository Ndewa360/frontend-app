import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { UserProfileState } from '../../../shared/store/user-profile/user-profile.state';
import { LanguageUrlService } from '../../../shared/services/language-url.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {

  constructor(
    private store: Store,
    private router: Router,
    private languageUrlService: LanguageUrlService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const userProfile = this.store.selectSnapshot(UserProfileState.selectStateUserProfile);

    if (!userProfile) {
      const lang = this.languageUrlService.getCurrentLanguage();
      this.router.navigate([`/${lang}/auth/signin`]);
      return false;
    }

    if (!this.checkIfUserHasAdminRole(userProfile)) {
      const lang = this.languageUrlService.getCurrentLanguage();
      this.router.navigate([`/${lang}/app/properties/home`]);
      return false;
    }

    return true;
  }

  private checkIfUserHasAdminRole(userProfile: any): boolean {
    if (!userProfile.roles || !Array.isArray(userProfile.roles)) return false;
    return userProfile.roles.some((role: any) => {
      const roleName = typeof role === 'string' ? role : role.name;
      return roleName === 'admin' || roleName === 'super-admin';
    });
  }
}
