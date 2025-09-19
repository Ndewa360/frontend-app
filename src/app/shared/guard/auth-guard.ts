import { Injectable } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Store } from '@ngxs/store';

import { AuthTokenState } from '../store/auth-token';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
              
  constructor(
    // private notificationService: NotificationService,
    private _toastrService:ToastrService,
    private _store:Store, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot){
    return this._store.select(AuthTokenState.selectStateAuthToken).pipe(
      map((authToken)=>{
        console.warn("Auth Token ",authToken)
        if(authToken) return true;

        // Éviter la redirection infinie si on est déjà sur la page d'auth
        if (state.url.includes('/auth/signin') || state.url.includes('/auth/signup')) {
          return this.router.parseUrl('/auth/signin');
        }

        this._toastrService.warning("Veuillez vous authentifier", "Ndewa360°");
        return this.router.parseUrl(`/auth/signin?returnUrl=${encodeURIComponent(state.url)}`)
      })
    )

  }
}