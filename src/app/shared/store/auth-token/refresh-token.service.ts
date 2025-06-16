import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, switchMap, tap } from 'rxjs/operators';
import { ApiResultFormat } from '../global';
import { environment } from 'src/environments/environment';
import { AuthTokenAction } from './auth-token.actions';
import { ToastrService } from 'ngx-toastr';
import { AuthTokenState } from './auth-token.state';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class RefreshTokenService {
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);
  private refreshInProgress = false;

  constructor(
    private http: HttpClient,
    private store: Store,
    private toastrService: ToastrService,
    private router: Router
  ) {}

  /**
   * Rafraîchit le token d'accès
   */
  refreshAccessToken(): Observable<string> {
    // Si un rafraîchissement est déjà en cours, retourner le subject
    if (this.refreshInProgress) {
      return this.refreshTokenSubject.asObservable();
    }

    this.refreshInProgress = true;

    return this.http.get<ApiResultFormat<{ access_token: string, refresh_token: string }>>(`${environment.apiUrl}/user/auth/refresh`)
      .pipe(
        switchMap((response) => {
          if (!response || !response.data || !response.data.access_token) {
            this.refreshInProgress = false;
            this.store.dispatch(new AuthTokenAction.Logout());
            this.router.navigateByUrl('/auth/signin');
            return throwError(() => new Error('Invalid token response'));
          }

          // Mettre à jour les tokens dans le store
          this.store.dispatch(new AuthTokenAction.SetToken(response.data.access_token, response.data.refresh_token));
          
          // Notifier les observateurs que le token a été rafraîchi
          this.refreshTokenSubject.next(response.data.access_token);
          this.refreshInProgress = false;
          
          return of(response.data.access_token);
        }),
        catchError((err) => {
          this.refreshInProgress = false;
          this.refreshTokenSubject.next(null);
          
          // En cas d'échec, déconnecter l'utilisateur si l'erreur est 401
          if (err.status === 401) {
            this.store.dispatch(new AuthTokenAction.Logout());
            this.router.navigateByUrl('/auth/signin');
            this.toastrService.warning('Votre session a expiré. Veuillez vous reconnecter.', 'Ndewa360°');
          }
          
          return throwError(() => err);
        }),
        finalize(() => {
          this.refreshInProgress = false;
        })
      );
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
      
      // Si le token expire dans moins de 5 minutes (300 secondes)
      if (tokenData.exp && tokenData.exp - currentTime < 300) {
        return this.refreshAccessToken();
      }
      
      return of(token.accessToken);
    } catch (e) {
      console.error('Erreur lors de la vérification du token', e);
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
