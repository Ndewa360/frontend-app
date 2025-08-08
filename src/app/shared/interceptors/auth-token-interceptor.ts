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
    private userActivityService: UserActivityService
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

    // Gestion des erreurs de réseau
    if (error.status === 0) {
      console.error('🔴 Erreur de réseau:', error);
      this._toastrService.warning('Problème de connexion réseau. Vérifiez votre connexion internet.', 'Ndewa360°');
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
    const safeRedirectUrl = this.getSafeRedirectUrl(currentUrl);
    this._router.navigateByUrl(safeRedirectUrl);
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Vérifier l'état d'activité de l'utilisateur avant de tenter un refresh
    if (this.userActivityService.isUserCriticallyInactive()) {
      console.log('🔴 Utilisateur en inactivité critique - déconnexion forcée');
      this.forceLogoutWithRedirect('🔒 Session fermée automatiquement après 30 minutes d\'inactivité pour protéger vos données.');
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

          // Gestion différenciée selon le type d'erreur
          if (err.message?.includes('User inactive')) {
            this._toastrService.info(
              "⏰ Reconnectez-vous pour reprendre votre session là où vous l'avez laissée",
              "Ndewa360° - Session suspendue",
              { timeOut: 8000, extendedTimeOut: 3000 }
            );
          } else if (err.message?.includes('critically inactive')) {
            this._toastrService.warning(
              "🔒 Session fermée pour inactivité prolongée. Vos données sont protégées.",
              "Ndewa360° - Sécurité",
              { timeOut: 10000, extendedTimeOut: 5000 }
            );
          } else {
            this._toastrService.warning(
              "🔑 Session expirée. Reconnectez-vous pour accéder à vos données",
              "Ndewa360° - Authentification",
              { timeOut: 8000, extendedTimeOut: 3000 }
            );
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
            this._toastrService.warning(
              "⏱️ Délai d'attente dépassé lors de la reconnexion automatique. Reconnectez-vous manuellement.",
              "Ndewa360° - Connexion",
              { timeOut: 10000, extendedTimeOut: 5000 }
            );
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
            this._router.navigateByUrl('/auth/signin');
          }
        });
      }
    }, tokenDuration);
  }

  /**
   * Force la déconnexion avec redirection
   */
  private forceLogoutWithRedirect(message?: string): void {
    this._store.dispatch(new AuthTokenAction.Logout());
    this.refreshTokenService.stopActivityMonitoring();
    this.redirectToLogin();

    if (message) {
      this._toastrService.warning(message, "Ndewa360°");
    }
  }

  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    console.log('🔍 Adding token to request:', request.url, 'Token length:', token?.length);
    console.log('🔍 Token preview:', token?.substring(0, 50) + '...');

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

  /**
   * Génère une URL de redirection sécurisée pour éviter les boucles infinies
   */
  private getSafeRedirectUrl(currentUrl: string): string {
    // Si on est déjà sur une page d'auth, ne pas ajouter de returnUrl
    if (currentUrl.includes('/auth/signin') ||
        currentUrl.includes('/auth/signup') ||
        currentUrl.includes('/auth/register') ||
        currentUrl === '/auth' ||
        currentUrl === '/') {
      return '/auth/signin';
    }

    // Nettoyer l'URL pour éviter les paramètres returnUrl imbriqués
    const cleanUrl = this.cleanReturnUrl(currentUrl);
    return `/auth/signin?returnUrl=${encodeURIComponent(cleanUrl)}`;
  }

  /**
   * Nettoie l'URL de retour pour éviter les paramètres returnUrl imbriqués
   */
  private cleanReturnUrl(url: string): string {
    try {
      // Supprimer les paramètres returnUrl existants pour éviter l'imbrication
      const urlObj = new URL(url, window.location.origin);
      urlObj.searchParams.delete('returnUrl');

      // Retourner seulement le pathname et les paramètres nettoyés
      const cleanPath = urlObj.pathname + (urlObj.search ? urlObj.search : '');
      return cleanPath === '/' ? '/dashboard' : cleanPath;
    } catch (error) {
      // En cas d'erreur de parsing, retourner une URL par défaut
      console.warn('Erreur lors du nettoyage de l\'URL:', error);
      return '/dashboard';
    }
  }
}