import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { UserProfileState } from '../../../shared/store/user-profile/user-profile.state';

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
  ): Observable<boolean> | Promise<boolean> | boolean {
    
    return this.store.select(UserProfileState.selectStateUserProfile).pipe(
      take(1),
      map(userProfile => {
        // if (!userProfile) {
        //   this.router.navigate(['/auth/login']);
        //   return false;
        // }

        // // Vérifier si l'utilisateur a un rôle admin
        // const hasAdminRole = (userProfile as any)?.roles?.some((role: any) =>
        //   role.name === 'admin' || 
        //   role.name === 'super-admin' || 
        //   role.name === 'super_admin'
        // );

        // if (!hasAdminRole) {
        //   this.router.navigate(['/app']);
        //   return false;
        // }

        return true;
      })
    );
  }
}
