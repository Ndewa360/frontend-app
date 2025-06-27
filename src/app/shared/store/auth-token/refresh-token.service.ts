import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { BehaviorSubject, Observable, of, throwError, fromEvent, merge, timer, Subject } from 'rxjs';
import { catchError, finalize, map, switchMap, tap, debounceTime, takeUntil } from 'rxjs/operators';
import { ApiResultFormat } from '../global';
import { environment } from 'src/environments/environment';
import { AuthTokenAction } from './auth-token.actions';
import { ToastrService } from 'ngx-toastr';
import { AuthTokenState } from './auth-token.state';
import { Router } from '@angular/router';
import { UserActivityService, UserActivityState } from './user-activity.service';

@Injectable({
  providedIn: 'root'
})
export class RefreshTokenService {
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);
  private refreshInProgress = false;
  private refreshTimer?: any;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private store: Store,
    private toastrService: ToastrService,
    private router: Router,
    private userActivityService: UserActivityService
  ) {
    this.initializeActivityBasedRefresh();
  }

  /**
   * Initialise la surveillance de l'activité utilisateur pour le refresh automatique
   */
  private initializeActivityBasedRefresh(): void {
    // Démarrer la surveillance d'activité avec une configuration personnalisée
    this.userActivityService.startMonitoring({
      inactivityTimeout: 15 * 60 * 1000, // 15 minutes d'inactivité
      criticalInactivityTimeout: 30 * 60 * 1000, // 30 minutes pour déconnexion forcée
      checkInterval: 60 * 1000, // Vérification chaque minute
      debounceTime: 1000 // 1 seconde de debounce
    });

    // Écouter les changements d'état d'activité
    this.userActivityService.getActivityState()
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.handleActivityStateChange(state);
      });
  }

  /**
   * Gère les changements d'état d'activité utilisateur
   */
  private handleActivityStateChange(state: UserActivityState): void {
    const token = this.store.selectSnapshot(AuthTokenState.selectStateToken);

    if (!token || !token.accessToken) {
      return;
    }

    switch (state) {
      case UserActivityState.ACTIVE:
        // Utilisateur actif : vérifier si le token doit être rafraîchi
        this.checkTokenExpiration().subscribe();
        break;

      case UserActivityState.INACTIVE:
        // Utilisateur inactif : ne pas rafraîchir automatiquement
        console.log('🟡 Utilisateur inactif - refresh automatique suspendu');
        break;

      case UserActivityState.CRITICAL_INACTIVE:
        // Inactivité critique : forcer la déconnexion
        console.log('🔴 Inactivité critique - déconnexion forcée');
        this.forceLogout('🔒 Session expirée pour inactivité prolongée. Vos données sont protégées. Reconnectez-vous pour continuer.');
        break;
    }
  }

  /**
   * Force la déconnexion avec un message personnalisé
   */
  private forceLogout(message: string): void {
    this.store.dispatch(new AuthTokenAction.Logout());
    this.userActivityService.stopMonitoring();
    const currentUrl = this.router.url;
    this.router.navigateByUrl(`/auth/signin?returnUrl=${encodeURIComponent(currentUrl)}`);
    this.toastrService.warning(message, 'Ndewa360°');
  }

  /**
   * Démarre la surveillance d'activité (appelé après connexion)
   */
  startActivityMonitoring(): void {
    this.userActivityService.startMonitoring();
  }

  /**
   * Arrête la surveillance d'activité (appelé après déconnexion)
   */
  stopActivityMonitoring(): void {
    this.userActivityService.stopMonitoring();
  }

  /**
   * Rafraîchit le token d'accès avec gestion de l'activité utilisateur
   */
  refreshAccessToken(): Observable<string> {
    // Vérifier si l'utilisateur est dans un état critique d'inactivité
    if (this.userActivityService.isUserCriticallyInactive()) {
      this.forceLogout('Session expirée pour cause d\'inactivité prolongée');
      return throwError(() => new Error('User critically inactive'));
    }

    // Si un rafraîchissement est déjà en cours, retourner le subject
    if (this.refreshInProgress) {
      return this.refreshTokenSubject.asObservable();
    }

    // Si l'utilisateur est inactif, demander une reconnexion
    if (this.userActivityService.isUserInactive()) {
      this.handleInactiveUserRefresh();
      return throwError(() => new Error('User inactive - reconnection required'));
    }

    this.refreshInProgress = true;
    console.log('🔄 Rafraîchissement du token en cours...');

    // Vérifier le token avant de l'envoyer
    const token = this.store.selectSnapshot(AuthTokenState.selectStateToken);
    console.log('🔍 Token state before refresh:', {
      hasAccessToken: !!token?.accessToken,
      hasRefreshToken: !!token?.refreshToken,
      accessTokenLength: token?.accessToken?.length,
      refreshTokenLength: token?.refreshToken?.length,
      refreshTokenPreview: token?.refreshToken?.substring(0, 50) + '...'
    });

    return this.http.get<ApiResultFormat<{ access_token: string, refresh_token: string }>>(`${environment.apiUrl}/user/auth/refresh`)
      .pipe(
        switchMap((response) => {
          if (!response || !response.data || !response.data.access_token) {
            this.refreshInProgress = false;
            this.handleRefreshFailure('Réponse invalide du serveur');
            return throwError(() => new Error('Invalid token response'));
          }

          // Mettre à jour les tokens dans le store
          this.store.dispatch(new AuthTokenAction.SetToken(response.data.access_token, response.data.refresh_token));

          // Enregistrer l'activité de refresh réussi
          this.userActivityService.recordActivity();

          // Notifier les observateurs que le token a été rafraîchi
          this.refreshTokenSubject.next(response.data.access_token);
          this.refreshInProgress = false;

          console.log('✅ Token rafraîchi avec succès');
          return of(response.data.access_token);
        }),
        catchError((err) => {
          this.refreshInProgress = false;
          this.refreshTokenSubject.next(null);

          console.error('❌ Échec du rafraîchissement du token:', err);

          // Gestion des différents types d'erreurs
          if (err.status === 401 || err.status === 403) {
            this.handleRefreshFailure('Votre session a expiré. Veuillez vous reconnecter.');
          } else if (err.status === 0) {
            this.handleRefreshFailure('Problème de connexion. Vérifiez votre connexion internet.');
          } else {
            this.handleRefreshFailure('Erreur lors du rafraîchissement de la session.');
          }

          return throwError(() => err);
        }),
        finalize(() => {
          this.refreshInProgress = false;
        })
      );
  }

  /**
   * Gère le cas où l'utilisateur est inactif et nécessite une reconnexion
   */
  private handleInactiveUserRefresh(): void {
    const currentUrl = this.router.url;
    this.store.dispatch(new AuthTokenAction.Logout());
    this.userActivityService.stopMonitoring();
    this.router.navigateByUrl(`/auth/signin?returnUrl=${encodeURIComponent(currentUrl)}&reason=inactive`);
    this.toastrService.info(
      '⏰ Session suspendue pour inactivité. Reconnectez-vous pour reprendre là où vous vous êtes arrêté.',
      'Ndewa360° - Sécurité',
      { timeOut: 8000, extendedTimeOut: 3000 }
    );
  }

  /**
   * Gère les échecs de rafraîchissement de token
   */
  private handleRefreshFailure(message: string): void {
    const currentUrl = this.router.url;
    this.store.dispatch(new AuthTokenAction.Logout());
    this.userActivityService.stopMonitoring();
    this.router.navigateByUrl(`/auth/signin?returnUrl=${encodeURIComponent(currentUrl)}&reason=token_expired`);

    // Message personnalisé selon le type d'erreur
    let userMessage = message;
    let title = 'Ndewa360° - Authentification';

    if (message.includes('Réponse invalide')) {
      userMessage = '🔧 Problème technique temporaire. Reconnectez-vous pour continuer.';
      title = 'Ndewa360° - Maintenance';
    } else if (message.includes('connexion')) {
      userMessage = '🌐 Problème de connexion réseau. Vérifiez votre connexion et reconnectez-vous.';
      title = 'Ndewa360° - Connexion';
    } else if (message.includes('session')) {
      userMessage = '🔒 Votre session a expiré pour votre sécurité. Reconnectez-vous pour continuer.';
    }

    this.toastrService.warning(userMessage, title, {
      timeOut: 10000,
      extendedTimeOut: 5000,
      closeButton: true
    });
  }

  /**
   * Vérifie si le token est sur le point d'expirer et le rafraîchit si nécessaire
   */
  checkTokenExpiration(): Observable<string | null> {
    const token = this.store.selectSnapshot(AuthTokenState.selectStateToken);

    if (!token || !token.accessToken) {
      return of(null);
    }

    try {
      const tokenData = this.parseJwt(token.accessToken);
      const currentTime = Math.floor(Date.now() / 1000);

      // Vérifier si le token est déjà expiré
      if (tokenData.exp && tokenData.exp <= currentTime) {
        console.log('🔴 Token expiré - tentative de rafraîchissement');
        return this.refreshAccessToken();
      }

      // Si le token expire dans moins de 5 minutes (300 secondes) et que l'utilisateur est actif
      if (tokenData.exp && tokenData.exp - currentTime < 300) {
        if (this.userActivityService.isUserActive()) {
          console.log('🟡 Token proche de l\'expiration - rafraîchissement préventif');
          return this.refreshAccessToken();
        } else {
          console.log('🟡 Token proche de l\'expiration mais utilisateur inactif - pas de rafraîchissement');
          return of(token.accessToken);
        }
      }

      return of(token.accessToken);
    } catch (e) {
      console.error('❌ Erreur lors de la vérification du token:', e);
      // En cas d'erreur de parsing, considérer le token comme invalide
      this.handleRefreshFailure('Token invalide détecté');
      return of(null);
    }
  }

  /**
   * Récupère la date d'expiration du token actuel
   */
  getTokenExpiration(): number | null {
    const token = this.store.selectSnapshot(AuthTokenState.selectStateToken);
    
    if (!token || !token.accessToken) {
      return null;
    }
    
    try {
      const tokenData = this.parseJwt(token.accessToken);
      return tokenData.exp || null;
    } catch (e) {
      console.error('Erreur lors de la récupération de l\'expiration du token', e);
      return null;
    }
  }

  /**
   * Nettoie les ressources du service
   */
  cleanup(): void {
    this.stopActivityMonitoring();
    this.clearRefreshTimer();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Nettoie le timer de rafraîchissement
   */
  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }

  /**
   * Décode un token JWT
   */
  private parseJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }
}
