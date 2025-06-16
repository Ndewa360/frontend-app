import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse, HttpEvent } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AuthTokenAction, AuthTokenState, GlobalAction } from "../store";
import { Store } from "@ngxs/store";
import { catchError, filter, map, mergeMap, switchMap, take, timeout } from "rxjs/operators";
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
  private refreshTokenTimeout: any;

  constructor(
    private _store: Store,
    private _router: Router,
    private _toastrService: ToastrService,
    private refreshTokenService: RefreshTokenService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Ignorer les requêtes vers des assets ou des ressources statiques
    if (req.url.includes('.svg') || req.url.includes('.png') || req.url.includes('.jpg') || req.url.includes('.jpeg') || req.url.includes('.gif')) {
      return next.handle(req);
    }

    let token = this._store.selectSnapshot(AuthTokenState.selectStateToken);
    
    // Vérifier si le token existe avant de l'utiliser
    if (!token) {
      // Si pas de token et qu'on essaie d'accéder à une route protégée, rediriger vers login
      if (!req.url.includes('user/auth/login') && !req.url.includes('user/auth/register')) {
        return next.handle(req).pipe(
          catchError((error) => {
            if (error instanceof HttpErrorResponse && error.status === 401) {
              this._router.navigateByUrl(`/auth/signin`);
            }
            return throwError(() => error);
          })
        );
      }
      return next.handle(req);
    }
    
    let clonedReq = req;
    if (req.url.includes('user/auth/refresh')) {
      clonedReq = this.addToken(clonedReq, token.refreshToken);
    } else if (token.accessToken) {
      clonedReq = this.addToken(clonedReq, token.accessToken);
    }
   
    return next.handle(clonedReq).pipe(
      catchError((error: any) => {
        if (error instanceof HttpErrorResponse && error.status === 401 && 
            !req.url.includes('user/auth/refresh') && 
            !req.url.includes('user/auth/login')) {
          return this.handle401Error(req, next);
        } else {
          this.showErrorMessage(error);
          return throwError(() => error);
        }
      })
    );
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      // Ajouter un timeout pour éviter les blocages infinis
      return this.refreshTokenService.refreshAccessToken().pipe(
        timeout(10000), // 10 secondes maximum pour le refresh
        switchMap((newToken: string) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(newToken);
          
          // Planifier le prochain rafraîchissement avant expiration
          this.setupRefreshTokenTimer();
          
          return next.handle(this.addToken(request, newToken));
        }),
        catchError((err) => {
          this.isRefreshing = false;
          this._store.dispatch(new AuthTokenAction.Logout());
          this._router.navigateByUrl(`/auth/signin?returnUrl=${this._router.url}`);
          this._toastrService.warning("Votre session a expiré. Veuillez vous authentifier à nouveau", "Ndewa360°");
          return throwError(() => err);
        })
      );
    } else {
      // Attendre que le token soit rafraîchi avec un timeout
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        timeout(15000), // 15 secondes maximum d'attente
        switchMap(newToken => next.handle(this.addToken(request, newToken))),
        catchError(error => {
          // Si le timeout est atteint, forcer une déconnexion
          if (error.name === 'TimeoutError') {
            this._store.dispatch(new AuthTokenAction.Logout());
            this._router.navigateByUrl(`/auth/signin?returnUrl=${this._router.url}`);
            this._toastrService.warning("Délai d'attente dépassé. Veuillez vous reconnecter", "Ndewa360°");
          }
          return throwError(() => error);
        })
      );
    }
  }

  // Configurer un timer pour rafraîchir le token avant son expiration
  private setupRefreshTokenTimer() {
    // Nettoyer tout timer existant
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }

    // Rafraîchir le token 1 minute avant son expiration (supposons que le token dure 1 heure)
    // Vous devriez ajuster cette valeur en fonction de la durée réelle de votre token
    const tokenDuration = 55 * 60 * 1000; // 55 minutes en millisecondes
    
    this.refreshTokenTimeout = setTimeout(() => {
      if (this._store.selectSnapshot(AuthTokenState.selectStateUserIsLogin)) {
        this.refreshTokenService.refreshAccessToken().subscribe({
          next: () => {
            // Token rafraîchi avec succès
          },
          error: () => {
            // Échec du rafraîchissement, déconnexion
            this._store.dispatch(new AuthTokenAction.Logout());
            this._router.navigateByUrl('/auth/signin');
          }
        });
      }
    }, tokenDuration);
  }

  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  showErrorMessage(error: any, isLoginProcess=false) {
    if(isLoginProcess) {
      switch(error.status) {
          case 401:
              this._toastrService.error(`Email ou mot de passe incorrect! `, 'Ndewa360°');
              break;
              
          case 406:
              this._toastrService.warning(`Compte inactivé! Veuillez valider ce compte à partir du lien fourni par mail! `, 'Ndewa360°');
              break;
          default:
              let message = error?.error?.message;
              if(!message) message = "Une erreur s'est produite! Réessayez plus tard"
              this._toastrService.error(message, 'Ndewa360°');
      }
    } else {
      switch(error.status) {
          case 0:
              this._toastrService.error(`Aucune connexion internet activée. Vérifiez votre connexion internet et réessayez! `, 'Ndewa360°');
              this._store.dispatch(new GlobalAction.SetConnexionInternetState(false))
              break;
              
          default:
              let message = error?.error?.message;
              if(!message) message = "Une erreur s'est produite! Réessayez plus tard"
              this._toastrService.error(message, 'Ndewa360°');
      }
    }
  }
}