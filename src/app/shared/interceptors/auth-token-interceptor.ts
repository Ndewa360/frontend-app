import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse, HttpEvent } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AuthTokenAction, AuthTokenState, GlobalAction } from "../store";
import { Store } from "@ngxs/store";
import { catchError, filter, map, mergeMap, switchMap, take, timeout, retry, delay } from "rxjs/operators";
import { Router, RouterStateSnapshot } from "@angular/router";
import { BehaviorSubject, Observable, of, throwError, timer } from "rxjs";
import { ToastrService } from "ngx-toastr";
import { StoreHelper } from "../utils";
import { RefreshTokenService } from "../store/auth-token/refresh-token.service";
import { ApiResultFormat } from "../store";
import { UserActivityService } from "../store/auth-token/user-activity.service";
import { TranslateService } from "@ngx-translate/core";
import { LanguagePreservationService } from "../services/language-preservation.service";


@Injectable()
export class AuthTokenInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  private refreshTokenTimeout: any;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 seconde

  constructor(
    private _store: Store,
    private _router: Router,
    private _toastrService: ToastrService,
    private refreshTokenService: RefreshTokenService,
    private userActivityService: UserActivityService,
    private translate: TranslateService,
    private languagePreservation: LanguagePreservationService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Ignorer les requêtes vers des assets ou des ressources statiques
    if (req.url.includes('.svg') || req.url.includes('.png') || req.url.includes('.jpg') || req.url.includes('.jpeg') || req.url.includes('.gif')) {
      return next.handle(req);
    }

    const token = this._store.selectSnapshot(AuthTokenState.selectStateToken);

    // Vérifier si le token existe avant de l'utiliser
    if (!token) {
      return this.handleRequestWithoutToken(req, next);
    }

    // Préparer la requête avec le token approprié
    const clonedReq = this.prepareRequestWithToken(req, token);

    // Exécuter la requête avec gestion d'erreur améliorée
    return next.handle(clonedReq).pipe(
      catchError((error: HttpErrorResponse) => this.handleHttpError(error, req, next))
    );
  }

  /**
   * Gère les requêtes sans token
   */
  private handleRequestWithoutToken(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Si pas de token et qu'on essaie d'accéder à une route protégée, rediriger vers login
    if (!req.url.includes('user/auth/login') && !req.url.includes('user/auth/register') && !req.url.includes('prospection')) {
      return next.handle(req).pipe(
        catchError((error) => {
          if (error instanceof HttpErrorResponse && error.status === 401) {
            this.redirectToLogin();
          }
          return throwError(() => error);
        })
      );
    }
    return next.handle(req);
  }

  /**
   * Prépare la requête avec le token approprié
   */
  private prepareRequestWithToken(req: HttpRequest<any>, token: any): HttpRequest<any> {
    if (req.url.includes('user/auth/refresh')) {
      console.log('🔍 Preparing refresh request with token:', token.refreshToken?.substring(0, 50) + '...');
      return this.addToken(req, token.refreshToken);
    } else if (token.accessToken) {
      return this.addToken(req, token.accessToken);
    }
    return req;
  }

  /**
   * Gère les erreurs HTTP avec logique améliorée
   */
  private handleHttpError(error: HttpErrorResponse, originalRequest: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Éviter les boucles infinies en marquant les requêtes déjà traitées
    if (originalRequest.headers.has('X-Retry-Request')) {
      console.error('🔴 Erreur après retry, arrêt du processus:', error);
      this._store.dispatch(new AuthTokenAction.Logout());
      return throwError(() => error);
    }

    // Gestion spécifique des erreurs 401
    if (error.status === 401 && !originalRequest.url.includes('user/auth/refresh') && !originalRequest.url.includes('user/auth/login')) {
      return this.handle401Error(originalRequest, next);
    }

    // Gestion des erreurs de réseau (laisser NetworkStatusService gérer l'affichage persistant)
    if (error.status === 0) {
      console.error('🔴 Erreur de réseau:', error);
      // Ne pas afficher de toast ici pour éviter le spam. Le NetworkStatusService affiche un message persistant unique.
      this._store.dispatch(new GlobalAction.SetConnexionInternetState(false));
    } else if (!this.shouldSkipErrorDisplay(error, originalRequest)) {
      // Ne pas afficher l'erreur si elle doit être ignorée
      this.showErrorMessage(error);
    }

    return throwError(() => error);
  }

  /**
   * Détermine si une requête doit être retentée
   */
  private shouldRetry(error: HttpErrorResponse, retryCount: number): boolean {
    // Ne pas retry les erreurs d'authentification
    if (error.status === 401 || error.status === 403) {
      return false;
    }

    // Retry seulement les erreurs de réseau ou serveur temporaires
    return (error.status === 0 || error.status >= 500) && retryCount < this.maxRetries;
  }

  /**
   * Redirige vers la page de connexion avec returnUrl sécurisé
   */
  private redirectToLogin(): void {
    const currentUrl = this._router.url;
    this.languagePreservation.redirectToLogin(currentUrl);
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Vérifier l'état d'activité de l'utilisateur avant de tenter un refresh
    if (this.userActivityService.isUserCriticallyInactive()) {
      console.log('🔴 Utilisateur en inactivité critique - déconnexion forcée');
      const criticalMessage = this.translate.instant('NOTIFICATIONS.SESSION_EXPIRED');
      this.forceLogoutWithRedirect(criticalMessage);
      return throwError(() => new Error('User critically inactive'));
    }

    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      console.log('🔄 Tentative de rafraîchissement du token suite à une erreur 401');

      return this.refreshTokenService.refreshAccessToken().pipe(
        timeout(10000), // 10 secondes maximum pour le refresh
        switchMap((newToken: string) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(newToken);

          console.log('✅ Token rafraîchi avec succès - retry de la requête');
          return next.handle(this.addToken(request, newToken));
        }),
        catchError((err) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(null);

          console.error('❌ Échec du rafraîchissement du token:', err);

          // Gestion différenciée selon le type d'erreur avec messages traduits
          if (err.message?.includes('User inactive')) {
            const inactiveMessage = this.translate.instant('NOTIFICATIONS.SESSION_EXPIRED');
            const inactiveTitle = `Ndewa360° - ${this.translate.instant('COMMON.INFO')}`;
            this._toastrService.info(inactiveMessage, inactiveTitle, { timeOut: 8000, extendedTimeOut: 3000 });
          } else if (err.message?.includes('critically inactive')) {
            const criticalMessage = this.translate.instant('NOTIFICATIONS.SESSION_EXPIRED');
            const securityTitle = `Ndewa360° - ${this.translate.instant('COMMON.WARNING')}`;
            this._toastrService.warning(criticalMessage, securityTitle, { timeOut: 10000, extendedTimeOut: 5000 });
          } else {
            const expiredMessage = this.translate.instant('NOTIFICATIONS.SESSION_EXPIRED');
            const authTitle = `Ndewa360° - ${this.translate.instant('COMMON.INFO')}`;
            this._toastrService.warning(expiredMessage, authTitle, { timeOut: 8000, extendedTimeOut: 3000 });
          }

          this.forceLogoutWithRedirect();
          return throwError(() => err);
        })
      );
    } else {
      // Attendre que le token soit rafraîchi avec un timeout
      console.log('⏳ Attente du rafraîchissement en cours...');
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        timeout(15000), // 15 secondes maximum d'attente
        switchMap(newToken => {
          console.log('✅ Token reçu - retry de la requête');
          return next.handle(this.addToken(request, newToken));
        }),
        catchError(error => {
          // Si le timeout est atteint, forcer une déconnexion
          if (error.name === 'TimeoutError') {
            console.error('⏰ Timeout lors de l\'attente du rafraîchissement');
            const timeoutMessage = this.translate.instant('NOTIFICATIONS.NETWORK_ERROR');
            const connectionTitle = `Ndewa360° - ${this.translate.instant('COMMON.WARNING')}`;
            this._toastrService.warning(timeoutMessage, connectionTitle, { timeOut: 10000, extendedTimeOut: 5000 });
          }
          this.forceLogoutWithRedirect();
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
            this.languagePreservation.redirectToLogin();
          }
        });
      }
    }, tokenDuration);
  }

  /**
   * Force la déconnexion avec redirection
   */
  private forceLogoutWithRedirect(message?: string): void {
    this.languagePreservation.preserveCurrentLanguage();
    this._store.dispatch(new AuthTokenAction.Logout());
    this.refreshTokenService.stopActivityMonitoring();
    this.redirectToLogin();

    if (message) {
      this._toastrService.warning(message, "Ndewa360°");
    }
  }

  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {

    if (!token) {
      console.error('❌ Token is null or undefined');
      return request;
    }

    return request.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  /**
   * Détermine si l'affichage d'erreur doit être ignoré pour certaines requêtes
   */
  private shouldSkipErrorDisplay(error: HttpErrorResponse, request: HttpRequest<any>): boolean {
    // Ignorer les erreurs 404 pour la vérification de liens de paiement existants
    if (error.status === 404 && request.url.includes('/payment-link/existing/')) {
      console.log('ℹ️ Erreur 404 ignorée pour vérification de lien de paiement:', request.url);
      return true;
    }

    // Ignorer les erreurs 404 pour d'autres endpoints où c'est normal
    const skipUrls = [
      '/auth/refresh', // Ne pas afficher d'erreur pour les échecs de refresh token
      '/health',       // Ne pas afficher d'erreur pour les checks de santé
      '/favicon.ico',  // Ne pas afficher d'erreur pour les favicons manquants
    ];

    if (error.status === 404 && skipUrls.some(skipUrl => request.url.includes(skipUrl))) {
      return true;
    }

    return false;
  }

  // Messages techniques à ne jamais afficher à l'utilisateur
  private readonly TECHNICAL_PATTERNS = [
    /nested bson depth/i,
    /bson/i,
    /document exceeds maximum/i,
    /MongoServerError/i,
    /MongoError/i,
    /CastError/i,
    /ValidationError/i,
    /buffering timed out/i,
    /topology/i,
  ];

  private sanitizeMessage(message: any): string {
    const msg = Array.isArray(message) ? message[0] : (message || '');
    if (typeof msg === 'string' && this.TECHNICAL_PATTERNS.some(r => r.test(msg))) {
      return this.translate.instant('NOTIFICATIONS.GENERIC_ERROR') || 'Une erreur est survenue. Veuillez réessayer.';
    }
    return msg || this.translate.instant('NOTIFICATIONS.GENERIC_ERROR');
  }

  showErrorMessage(error: any, isLoginProcess=false) {
    if(isLoginProcess) {
      switch(error.status) {
          case 401:
              const invalidCredentials = this.translate.instant('NOTIFICATIONS.UNAUTHORIZED');
              this._toastrService.error(invalidCredentials, 'Ndewa360°');
              break;

          case 406:
              const accountInactive = this.translate.instant('NOTIFICATIONS.ACCOUNT_NOT_FOUND');
              this._toastrService.warning(accountInactive, 'Ndewa360°');
              break;
          default:
              const msg1 = this.sanitizeMessage(error?.error?.message);
              this._toastrService.error(msg1, 'Ndewa360°');
      }
    } else {
      switch(error.status) {
          case 0:
              this._store.dispatch(new GlobalAction.SetConnexionInternetState(false));
              break;

          default:
              const msg2 = this.sanitizeMessage(error?.error?.message);
              this._toastrService.error(msg2, 'Ndewa360°');
      }
    }
  }

}