import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Store } from '@ngxs/store';
import { Observable, of, combineLatest } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { AuthTokenState, UserProfileState } from '../store';
import { RefreshTokenService } from '../store/auth-token/refresh-token.service';
import { UserActivityService, UserActivityState } from '../store/auth-token/user-activity.service';

export interface SessionCheckResult {
  canActivate: boolean;
  redirectUrl?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdvancedAuthGuard implements CanActivate {
  
  constructor(
    private store: Store,
    private router: Router,
    private toastrService: ToastrService,
    private refreshTokenService: RefreshTokenService,
    private userActivityService: UserActivityService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    return this.checkSessionValidity(state).pipe(
      map(result => {
        if (result.canActivate) {
          return true;
        }
        
        if (result.message) {
          this.toastrService.warning(result.message, 'Ndewa360°');
        }
        
        // Éviter la redirection infinie si on est déjà sur la page d'auth
        const redirectUrl = this.getSafeRedirectUrl(state.url);
        return this.router.parseUrl(result.redirectUrl || redirectUrl);
      }),
      catchError(error => {
        console.error('❌ Erreur lors de la vérification de session:', error);
        this.toastrService.error('Erreur de vérification de session', 'Ndewa360°');
        const redirectUrl = this.getSafeRedirectUrl(state.url);
        return of(this.router.parseUrl(redirectUrl));
      })
    );
  }

  /**
   * Vérifie la validité complète de la session
   */
  private checkSessionValidity(state: RouterStateSnapshot): Observable<SessionCheckResult> {
    return combineLatest([
      this.store.select(AuthTokenState.selectStateToken),
      this.store.select(UserProfileState.selectStateUserProfile),
      this.userActivityService.getActivityState()
    ]).pipe(
      switchMap(([token, userProfile, activityState]) => {
        // 1. Vérifier si l'utilisateur a un token
        if (!token || !token.accessToken) {
          return of({
            canActivate: false,
            redirectUrl: this.getSafeRedirectUrl(state.url),
            message: '🔑 Authentification requise pour accéder à cette section de Ndewa360°'
          });
        }

        // 2. Vérifier l'état d'activité critique
        if (activityState === UserActivityState.CRITICAL_INACTIVE) {
          return of({
            canActivate: false,
            redirectUrl: `/auth/signin?returnUrl=${encodeURIComponent(state.url)}&reason=critical_inactive`,
            message: '🔒 Session fermée automatiquement après 30 minutes d\'inactivité pour protéger vos données'
          });
        }

        // 3. Vérifier si l'utilisateur est inactif
        if (activityState === UserActivityState.INACTIVE) {
          return this.handleInactiveUser(state.url);
        }

        // 4. Vérifier l'expiration du token
        return this.checkTokenExpiration(state.url);
      })
    );
  }

  /**
   * Gère le cas d'un utilisateur inactif
   */
  private handleInactiveUser(currentUrl: string): Observable<SessionCheckResult> {
    return of({
      canActivate: false,
      redirectUrl: `/auth/signin?returnUrl=${encodeURIComponent(currentUrl)}&reason=inactive`,
      message: '⏰ Session suspendue pour inactivité. Reconnectez-vous pour reprendre là où vous vous êtes arrêté.'
    });
  }

  /**
   * Vérifie l'expiration du token et tente un refresh si nécessaire
   */
  private checkTokenExpiration(currentUrl: string): Observable<SessionCheckResult> {
    return this.refreshTokenService.checkTokenExpiration().pipe(
      map(result => {
        if (result) {
          // Token valide ou rafraîchi avec succès
          return { canActivate: true };
        } else {
          // Échec de la vérification/refresh du token
          return {
            canActivate: false,
            redirectUrl: this.getSafeRedirectUrl(currentUrl),
            message: 'Votre session a expiré. Veuillez vous reconnecter.'
          };
        }
      }),
      catchError(error => {
        console.error('❌ Erreur lors de la vérification du token:', error);
        
        // Gestion différenciée selon le type d'erreur
        let message = 'Erreur de session. Veuillez vous reconnecter.';
        if (error.message?.includes('User inactive')) {
          message = 'Veuillez vous reconnecter pour continuer.';
        } else if (error.message?.includes('critically inactive')) {
          message = 'Session expirée pour cause d\'inactivité prolongée.';
        }
        
        return of({
          canActivate: false,
          redirectUrl: this.getSafeRedirectUrl(currentUrl),
          message
        });
      })
    );
  }

  /**
   * Vérifie si l'utilisateur peut accéder à une route spécifique
   * (peut être étendu pour des vérifications de rôles/permissions)
   */
  private checkRoutePermissions(route: ActivatedRouteSnapshot, userProfile: any): boolean {
    // Vérifications de base
    if (!userProfile) {
      return false;
    }

    // Ici, on peut ajouter des vérifications de rôles/permissions
    // Par exemple :
    // const requiredRoles = route.data?.['roles'] as string[];
    // if (requiredRoles && !this.hasRequiredRoles(userProfile.roles, requiredRoles)) {
    //   return false;
    // }

    return true;
  }

  /**
   * Vérifie si l'utilisateur a les rôles requis
   */
  private hasRequiredRoles(userRoles: string[], requiredRoles: string[]): boolean {
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    
    if (!userRoles || userRoles.length === 0) {
      return false;
    }
    
    return requiredRoles.some(role => userRoles.includes(role));
  }

  /**
   * Démarre la surveillance d'activité si elle n'est pas déjà active
   */
  private ensureActivityMonitoring(): void {
    if (!this.userActivityService.isUserActive() &&
        !this.userActivityService.isUserInactive() &&
        !this.userActivityService.isUserCriticallyInactive()) {
      this.userActivityService.startMonitoring();
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
