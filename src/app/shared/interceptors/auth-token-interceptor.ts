import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse, HttpEvent } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";
import { AuthTokenAction, AuthTokenState, GlobalAction } from "../store";
import { Store } from "@ngxs/store";
import { catchError, filter, switchMap, take, timeout } from "rxjs/operators";
import { Router } from "@angular/router";
import { BehaviorSubject, Observable, of, throwError, timer } from "rxjs";
import { ToastrService } from "ngx-toastr";
import { RefreshTokenService } from "../store/auth-token/refresh-token.service";
import { UserActivityService } from "../store/auth-token/user-activity.service";
import { TranslateService } from "@ngx-translate/core";
import { LanguagePreservationService } from "../services/language-preservation.service";
import { ErrorLogService } from "../services/error-log.service";
import { LogoutFlagService } from "../services/logout-flag.service";
import { isSilentHttpError } from "../http/http-error-context";
import { AppLoadingPhaseService } from "../services/app-loading-phase.service";

@Injectable()
export class AuthTokenInterceptor implements HttpInterceptor, OnDestroy {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 seconde

  constructor(
    private _store: Store,
    private _router: Router,
    private _toastrService: ToastrService,
    private refreshTokenService: RefreshTokenService,
    private userActivityService: UserActivityService,
    private translate: TranslateService,
    private languagePreservation: LanguagePreservationService,
    private errorLog: ErrorLogService,
    private loadingPhase: AppLoadingPhaseService,
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Logout volontaire en cours : laisser passer sans token ni gestion d'erreur 401
    if (LogoutFlagService.isLoggingOut()) {
      return next.handle(req).pipe(catchError(() => of(null as any)));
    }

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
      catchError((error: HttpErrorResponse) => this.handleHttpError(error, req, next, 0))
    );
  }

  /**
   * Gère les requêtes sans token (pages publiques : landing, recherche, paiement).
   *
   * Pas de refresh possible ici : on se contente de journaliser l'échec et
   * d'appliquer la même règle d'affichage que pour les requêtes authentifiées.
   * Sans ce journal, la télémétrie des pages publiques était totalement absente.
   */
  private handleRequestWithoutToken(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Si pas de token et qu'on essaie d'accéder à une route protégée, rediriger vers login
    if (!req.url.includes('user/auth/login') && !req.url.includes('user/auth/register') && !req.url.includes('prospection')) {
      return next.handle(req).pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401) {
            this.redirectToLogin();
          } else {
            this.reportFailure(error, req);
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
      return this.addToken(req, token.refreshToken);
    } else if (token.accessToken) {
      return this.addToken(req, token.accessToken);
    }
    return req;
  }

  /**
   * Gère les erreurs HTTP avec retry, feedback réseau et logging
   */
  private handleHttpError(error: HttpErrorResponse, originalRequest: HttpRequest<any>, next: HttpHandler, retryCount: number): Observable<HttpEvent<any>> {
    // Filet de sécurité anti-boucle. En pratique `next.handle()` court-circuite
    // le reste de la chaîne d'intercepteurs, donc la requête retentée ne
    // repasse pas ici : ce cas est traité plus bas par le retry lui-même.
    if (originalRequest.headers.has('X-Retry-Request')) {
      this.reportFailure(error, originalRequest);
      return throwError(() => error);
    }

    // Gestion spécifique des erreurs 401
    if (error.status === 401 && !originalRequest.url.includes('user/auth/refresh') && !originalRequest.url.includes('user/auth/login')) {
      return this.handle401Error(originalRequest, next);
    }

    // Retry pour erreurs réseau (status 0) ou serveur (5xx)
    if (this.shouldRetry(error, retryCount)) {
      const delayMs = this.retryDelay * Math.pow(2, retryCount);
      return timer(delayMs).pipe(
        switchMap(() => {
          const retriedReq = originalRequest.clone({ setHeaders: { 'X-Retry-Request': 'true' } });
          return next.handle(retriedReq);
        }),
        // L'échec de la tentative retentée ne repasse pas par le `catchError()`
        // de ce même intercepteur : sans ce bloc, un 5xx persistant après
        // épuisement des retries n'était ni journalisé ni affiché.
        catchError((retryError: HttpErrorResponse) => {
          this.reportFailure(retryError, originalRequest);
          return throwError(() => retryError);
        })
      );
    }

    // Statut 0 : bascule l'état "hors ligne" et affiche un bandeau persistant
    // tant que la connexion n'est pas revenue. Sinon, on applique la règle
    // d'affichage (action utilisateur vs chargement de fond).
    this.reportFailure(error, originalRequest);

    return throwError(() => error);
  }

  /**
   * Traitement commun d'un échec HTTP : mise à jour de l'état réseau,
   * affichage selon `shouldDisplayError()`, puis journalisation.
   *
   * La journalisation est inconditionnelle : même une requête déclarée
   * silencieuse doit rester visible dans les logs de l'application.
   */
  private reportFailure(error: HttpErrorResponse, request: HttpRequest<any>): void {
    if (error.status === 0) {
      this._store.dispatch(new GlobalAction.SetConnexionInternetState(false));
      if (this.isBrowser() && !navigator.onLine) {
        this.showOfflineNotice();
      }
    } else if (this.shouldDisplayError(request)) {
      this.showErrorMessage(error);
    }

    this.errorLog.log({
      type: 'http',
      message: this.sanitizeMessage(error?.error?.message),
      statusCode: error.status,
      url: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Détermine si une requête doit être retentée (exponentielle backoff)
   */
  private shouldRetry(error: HttpErrorResponse, retryCount: number): boolean {
    if (error.status === 401 || error.status === 403) {
      return false;
    }
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
    if (this.userActivityService.isUserCriticallyInactive()) {
      const criticalMessage = this.translate.instant('NOTIFICATIONS.SESSION_EXPIRED');
      this.forceLogoutWithRedirect(criticalMessage);
      return throwError(() => new Error('User critically inactive'));
    }

    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.refreshTokenService.refreshAccessToken().pipe(
        timeout(10000),
        switchMap((newToken: string) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(newToken);
          return next.handle(this.addToken(request, newToken));
        }),
        catchError((err) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(null);

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
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        timeout(15000),
        switchMap(newToken => {
          return next.handle(this.addToken(request, newToken));
        }),
        catchError(error => {
          // Si le timeout est atteint, forcer une déconnexion
          if (error.name === 'TimeoutError') {
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

  ngOnDestroy(): void {
    // Nettoyage des ressources à la destruction du service
    this.refreshTokenSubject.complete();
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
    if (!token) return request;
    return request.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  /**
   * Décide si l'intercepteur doit signaler l'échec à l'utilisateur.
   *
   * Trois filtres, dans cet ordre :
   *  1. la requête s'est déclarée silencieuse (`silentHttp()`) : l'appelant
   *     affiche son propre message ou l'échec est attendu ;
   *  2. la requête est une lecture (GET/HEAD/OPTIONS) émise pendant un
   *     chargement de page : l'erreur appartient au `DataDrivenLoaderService`,
   *     qui affiche un état d'erreur avec une action « Réessayer ». Sans ce
   *     filtre, un simple rechargement de page suffisait à faire apparaître des
   *     toasts d'erreur alors que l'utilisateur n'avait rien demandé ;
   *  3. quelques endpoints où l'échec est attendu par nature.
   *
   * Les requêtes mutantes (POST/PUT/PATCH/DELETE) ne sont jamais filtrées par
   * les points 1 et 2 : elles sont toujours issues d'une action utilisateur.
   */
  private shouldDisplayError(request: HttpRequest<any>): boolean {
    if (isSilentHttpError(request.context)) return false;
    if (this.loadingPhase.shouldSuppress(request.method)) return false;

    // Ignorer les erreurs 404 pour la vérification de liens de paiement existants
    if (request.url.includes('/payment-link/existing/')) return false;

    // Ignorer les erreurs 404 pour d'autres endpoints où c'est normal
    const skipUrls = [
      '/auth/refresh', // Ne pas afficher d'erreur pour les échecs de refresh token
      '/health',       // Ne pas afficher d'erreur pour les checks de santé
      '/favicon.ico',  // Ne pas afficher d'erreur pour les favicons manquants
    ];

    return !skipUrls.some(skipUrl => request.url.includes(skipUrl));
  }

  /**
   * Bandeau « hors ligne ». Persistant (`timeOut: 0`) mais affiché une seule fois :
   * une rafale d'échecs réseau ne doit pas empiler le même message.
   */
  private offlineNoticeShown = false;

  /** L'intercepteur s'exécute aussi pendant le rendu SSR, où `window` n'existe pas. */
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof navigator !== 'undefined';
  }

  private showOfflineNotice(): void {
    if (this.offlineNoticeShown || !this.isBrowser()) return;
    this.offlineNoticeShown = true;
    this._toastrService.warning(
      this.translate.instant('NOTIFICATIONS.NETWORK_ERROR') || 'Aucune connexion internet. Vérifiez votre réseau.',
      'Ndewa360°',
      { timeOut: 0, extendedTimeOut: 0, closeButton: true }
    );
    // Réarmement dès que la connexion revient.
    const rearm = () => {
      if (navigator.onLine) {
        this.offlineNoticeShown = false;
        window.removeEventListener('online', rearm);
      }
    };
    window.addEventListener('online', rearm);
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
    // Erreurs techniques paiement
    /ECONNREFUSED/i,
    /ETIMEDOUT/i,
    /ENOTFOUND/i,
    /parsePhoneNumber/i,
    /Cannot read propert/i,
    /Échec de l'initiation/i,
    /socket hang up/i,
    /getaddrinfo/i,
  ];

  private sanitizeMessage(message: any): string {
    const msg = Array.isArray(message) ? message[0] : (message || '');
    if (typeof msg === 'string' && this.TECHNICAL_PATTERNS.some(r => r.test(msg))) {
      return this.translate.instant('NOTIFICATIONS.GENERIC_ERROR') || 'Une erreur est survenue. Veuillez réessayer.';
    }
    return msg || this.translate.instant('NOTIFICATIONS.GENERIC_ERROR');
  }

  /**
   * Affiche l'échec d'une requête. Le status 0 est traité en amont par
   * `showOfflineNotice()` (bandeau persistant) et ne produit pas de second toast.
   *
   * La branche `isLoginProcess` qui existait auparavant n'était jamais appelée
   * (le message 406 de connexion est géré par `auth-login.component.ts`) :
   * elle est supprimée pour éviter deux chemins divergents.
   */
  showErrorMessage(error: HttpErrorResponse) {
    if (error?.status === 0) {
      this._store.dispatch(new GlobalAction.SetConnexionInternetState(false));
      return;
    }
    this._toastrService.error(this.sanitizeMessage(error?.error?.message), 'Ndewa360°');
  }
}