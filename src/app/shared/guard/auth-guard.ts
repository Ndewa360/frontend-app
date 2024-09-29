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
        if(authToken) return true;
        this._toastrService.warning("Veuillez vous authentifier", "Ndiye");
        return this.router.parseUrl(`/auth/signin?returnUrl=${state.url}`)
      })
    )    
    
  }
}