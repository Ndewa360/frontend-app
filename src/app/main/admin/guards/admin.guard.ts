import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take, filter, timeout, catchError } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { UserProfileState } from '../../../shared/store/user-profile/user-profile.state';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(
    private store: Store,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // Vérification synchrone du profil utilisateur
    const userProfile = this.store.selectSnapshot(UserProfileState.selectStateUserProfile);
    
    if (!userProfile) {
      console.log('❌ AdminGuard - No user profile found, redirecting to login');
      this.router.navigate(['/auth/signin']);
      return false;
    }

    // Vérifier si l'utilisateur a un rôle admin ou super-admin
    const hasAdminRole = this.checkIfUserHasAdminRole(userProfile);

    if (!hasAdminRole) {
      console.log('❌ AdminGuard - User does not have admin role, redirecting to app');
      this.router.navigate(['/app']);
      return false;
    }

    console.log('✅ AdminGuard - Admin access granted');
    return true;
  }

  /**
   * Vérifier si l'utilisateur a un rôle admin ou super-admin
   */
  private checkIfUserHasAdminRole(userProfile: any): boolean {
    if (!userProfile.roles || !Array.isArray(userProfile.roles)) {
      console.log('❌ AdminGuard - No roles found for user:', userProfile.email);
      return false;
    }

    const hasAdminRole = userProfile.roles.some((role: any) => {
      const roleName = typeof role === 'string' ? role : role.name;
      return roleName === 'admin' || roleName === 'super-admin'
    });

    console.log('🔍 AdminGuard - Role check for user:', {
      email: userProfile.email,
      roles: userProfile.roles.map((role: any) => typeof role === 'string' ? role : role.name),
      hasAdminRole
    });

    return hasAdminRole;
  }
}
