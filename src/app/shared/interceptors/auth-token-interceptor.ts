import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AuthTokenAction, AuthTokenState } from "../store";
import { Store } from "@ngxs/store";
import { catchError, map, mergeMap, switchMap, take } from "rxjs/operators";
import { Router, RouterStateSnapshot } from "@angular/router";
import { of, throwError } from "rxjs";
import { ToastrService } from "ngx-toastr";


@Injectable()
export class AuthTokenInterceptor implements HttpInterceptor {

  constructor(
    private _store:Store,
    private _router:Router,
    private _toastrService:ToastrService,
    // private state: RouterStateSnapshot
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    // Get the auth token from the service.
    return this._store.select(AuthTokenState.selectStateAuthToken)
    .pipe(
        take(1),
        mergeMap((token)=> {
            if(token) return next.handle(req.clone({
                setHeaders: { Authorization: `Bearer ${token}`}
              }))
            return next.handle(req);
        }),
    )
    .pipe(
      catchError((err: any) => {
        console.log("Erreur ",err)
        if (err instanceof HttpErrorResponse) {
          // Handle HTTP errors
          if (err.status === 401) {
            this._store.dispatch(new AuthTokenAction.SetAuthToken(null));
            // this._router.navigate(["/auth/login"]);
            // this._toastrService.error("Session expiré", "Oups! Vous devez vous reconnecter vous actualiser votre session");
            this._store.dispatch(new AuthTokenAction.SetAuthToken(null));
            this._router.parseUrl(`/auth/signin?returnUrl=${this._router.url}`)

          } else {
            // Handle other HTTP error codes
            console.error('HTTP error:', err);
          }
        } else {
          // Handle non-HTTP errors
          console.error('An error occurred:', err);
        }
  
        // Re-throw the error to propagate it further
        return throwError(() => err); 
      })
    );

  }
}