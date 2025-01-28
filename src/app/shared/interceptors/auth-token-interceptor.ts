import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AuthTokenAction, AuthTokenState } from "../store";
import { Store } from "@ngxs/store";
import { catchError, map, mergeMap, switchMap, take } from "rxjs/operators";
import { Router, RouterStateSnapshot } from "@angular/router";
import { of, throwError } from "rxjs";
import { ToastrService } from "ngx-toastr";
import { StoreHelper } from "../utils";
import { RefreshTokenService } from "../store/auth-token/refresh-token.service";


@Injectable()
export class AuthTokenInterceptor implements HttpInterceptor {

  constructor(
    private _store:Store,
    private _router:Router,
    private _toastrService:ToastrService,
    private refreshTokenService:RefreshTokenService
    // private state: RouterStateSnapshot
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    // Get the auth token from the service.
    let tokenFounded = null;
    return this._store.select(AuthTokenState.selectStateToken)
    .pipe(
        take(1),
        mergeMap(({accessToken,refreshToken})=> {
          tokenFounded = {accessToken,refreshToken};

          if (req.url.includes('user/auth/refresh')) {
            if(!refreshToken) return next.handle(req);
            return next.handle(req.clone({
              setHeaders: { Authorization: `Bearer ${refreshToken}`}
            }));
          }
          if(accessToken) return next.handle(req.clone({
              setHeaders: { Authorization: `Bearer ${accessToken}`}
            }))
          return next.handle(req);
        }),
    )
    .pipe(
      catchError((err: any) => {

        if (err instanceof HttpErrorResponse) {
          if(req.url.includes('user/auth/login')) this.showErrorMessage(err,true);
          // Handle HTTP errors
          else if (err.status === 401 && !req.url.includes('user/auth/refresh')) {
            
            return this.refreshTokenService.refreshAccessToken(tokenFounded.accessToken,tokenFounded.refreshToken).pipe(
              switchMap((newToken: string) => {
                console.log("New Token ",newToken)
                req = req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${newToken}`
                  }
                });
                return next.handle(req);
              }),
              catchError((err) => {
                console.log("Auth interceptor ",err)
                // En cas d'erreur de rafraîchissement, rediriger l'utilisateur
                this._store.dispatch(new AuthTokenAction.SetAuthToken(null));
                this._store.dispatch(new AuthTokenAction.SetRefreshToken(null));
                StoreHelper.resetAllState(this._store);
                this._router.navigateByUrl(`/auth/signin?returnUrl=${this._router.url}`)
                this._toastrService.warning("Veuillez vous authentifier", "Ndewa360°");
                return throwError(() => err);
                // return of(true)
              })
            )

          }              
          else  this.showErrorMessage(err);
          
          return throwError(() => err); 

          
        } else {
          // Handle non-HTTP errors
          this.showErrorMessage(err);
          return throwError(() => err); 
        } 
      })
    );

  }

  showErrorMessage(error: any, isLoginProcess=false) {
    if(isLoginProcess) 
    {
      switch(error.status)
      {
          case 401:
              this._toastrService.error(`Email ou mot de passe incorrect! `, 'Ndewa360°');
              break;
          case 406:
              this._toastrService.warning(`Compte innactivé! Veuillez valider ce compte a partir du lien fourni par mail! `, 'Ndewa360°');
              break;
          default:
              let message = error?.error?.message;
              if(!message) message = "Une erreur c'est produite! Réessayez plus tard"
              this._toastrService.error(message, 'Ndewa360°');
      }
    }
    else 
    {
      let message = error?.error?.message;
      if(!message) message = "Une erreur c'est produite! Réessayez plus tard"
      this._toastrService.error(message, 'Ndewa360°');
    }
    
  }

  private getTokenDecode(token): any | null {
    if (!token) return null;
    const base64Payload = token.split('.')[1];
    const payload = this.base64UrlDecode(base64Payload);
    return JSON.parse(payload);
  }

  private isTokenExpired(tokenF): boolean {
    const token = this.getTokenDecode(tokenF);
    if (!token) return false;

    // On regarde si le token est expiré et s'il s'est ecouler moins de 15min apres son expiration, alors on retourne `true`
    return (((token.exp * 1000) <= Date.now()) && ((Date.now() - token.exp * 1000) < (15 * 60 * 1000))) ? true : false;
  }


  private base64UrlDecode(base64Url: string): string {
    base64Url = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64Url.length % 4) {
      base64Url += '=';
    }
    return atob(base64Url);
  }
}