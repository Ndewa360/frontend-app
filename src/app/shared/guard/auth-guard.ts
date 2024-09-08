import { Injectable } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Store } from '@ngxs/store';

import { AuthTokenState } from '../store/auth-token';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { NotificationService } from 'carbon-components-angular';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
              
  constructor(private notificationService: NotificationService,private _store:Store, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot){
    return this._store.select(AuthTokenState.selectStateAuthToken).pipe(
      map((authToken)=>{
        if(authToken) return true;
        this.notificationService.showToast({
          type: "warning",
          title: "Ndiye",
          subtitle: "Veuillez vous authentifier",
          target: "#notificationHolder",
          message: "message",
          duration: 4000,
        })   
        return this.router.parseUrl(`/auth/signin?returnUrl=${state.url}`)
      })
    )    
    
  }
}