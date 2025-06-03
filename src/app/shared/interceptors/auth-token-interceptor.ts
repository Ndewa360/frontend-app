import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse, HttpEvent } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AuthTokenAction, AuthTokenState, GlobalAction } from "../store";
import { Store } from "@ngxs/store";
import { catchError, filter, map, mergeMap, switchMap, take } from "rxjs/operators";
import { Router, RouterStateSnapshot } from "@angular/router";
import { BehaviorSubject, Observable, of, throwError } from "rxjs";
import { ToastrService } from "ngx-toastr";
import { StoreHelper } from "../utils";
import { RefreshTokenService } from "../store/auth-token/refresh-token.service";
import { ApiResultFormat } from "../store";


@Injectable()
export class AuthTokenInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  constructor(
    private _store: Store,
    private _router: Router,
    private _toastrService: ToastrService,
    private refreshTokenService: RefreshTokenService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let token = this._store.selectSnapshot(AuthTokenState.selectStateToken);
    
    let clonedReq = req;
    if (req.url.includes('user/auth/refresh'))  clonedReq = this.addToken(clonedReq,token.refreshToken)
    else if(token.accessToken)  clonedReq = this.addToken(clonedReq,token.accessToken)
   
    return next.handle(clonedReq).pipe(
      catchError((error: any) => {
        if (error instanceof HttpErrorResponse && error.status === 401 && !req.url.includes('user/auth/refresh') && !req.url.includes('user/auth/login') ){
          return this.handle401Error(req, next);
        } else {
          // if(error.status==0) this.showErrorMessage()
          // else 
          this.showErrorMessage(error);
          return throwError(() => error);
        }
      })
    );
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // console.log("Nombre de fois",request.url,this.isRefreshing)

    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.refreshTokenService.refreshAccessToken().pipe(
        switchMap((newToken: string) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(newToken);
          return next.handle(this.addToken(request, newToken));
        }),
        catchError((err) => {
          this.isRefreshing = false;
          this._store.dispatch(new AuthTokenAction.Logout());
          this._router.navigateByUrl(`/auth/signin?returnUrl=${this._router.url}`);
          this._toastrService.warning("Veuillez vous authentifier", "Ndewa360°");
          return throwError(() => err);
        })
      );
    } else {
      // Toutes les requêtes doivent attendre que le token soit rafraîchi
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(newToken =>  next.handle(this.addToken(request, newToken)) )
      );
    }
  }

  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
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
      switch(error.status)
      {
          case 0:
              this._toastrService.error(`Aucun connexion internet activé. Vérifiez votre connexion internet et réessayez! `, 'Ndewa360°');
              this._store.dispatch(new GlobalAction.SetConnexionInternetState(false))
              break;
              
          default:
              let message = error?.error?.message;
              if(!message) message = "Une erreur c'est produite! Réessayez plus tard"
              this._toastrService.error(message, 'Ndewa360°');
      }
    }
    
  }

}