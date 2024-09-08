import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AuthTokenAction, AuthTokenState } from "../store";
import { Store } from "@ngxs/store";
import { catchError, map, mergeMap, switchMap, take } from "rxjs/operators";
import { Router } from "@angular/router";
import { NotificationService } from "carbon-components-angular";
import { of, throwError } from "rxjs";


@Injectable()
export class AuthTokenInterceptor implements HttpInterceptor {

  constructor(
    private _store:Store,
    private _router:Router,
    private notificationService: NotificationService,

  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    // Get the auth token from the service.
    return this._store.select(AuthTokenState.selectStateAuthToken)
    .pipe(
        take(1),
        mergeMap((token)=> {
          console.log("Token ",token)
            if(token) return next.handle(req.clone({
                setHeaders: { Authorization: `Bearer ${token}`}
              }))
            return next.handle(req);
        }),
    )
    .pipe(
      catchError((err: any) => {
        console.log("Error ",err)
        if (err instanceof HttpErrorResponse) {
          // Handle HTTP errors
          if (err.status === 401) {
            this._router.navigate(["/auth/login"]);
            this._store.dispatch(new AuthTokenAction.SetAuthToken(null));
            this.notificationService.showToast({
              type: "error",
              title: "Session expiré",
              subtitle: "Oups! Vous devez vous reconnecter vous actualiser votre session",
              target: "#notificationHolder",
              message: "message",
              duration: 2000,
            })
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