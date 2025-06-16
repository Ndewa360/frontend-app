import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { BehaviorSubject, catchError, Observable, of, switchMap, tap, throwError } from 'rxjs';
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
  private refreshInProgress = false;
  private refreshTokenSubject = new BehaviorSubject<string>(null);

  constructor(
    private http: HttpClient, 
    private _store: Store,
    private _toastrService: ToastrService,
    private _router: Router
  ) {}

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
            // Si la réponse ne contient pas les tokens attendus
            this.refreshInProgress = false;
            this._store.dispatch(new AuthTokenAction.Logout());
            this._router.navigateByUrl('/auth/signin');
            return throwError(() => new Error('Invalid token response'));
          }

          // Mettre à jour les tokens dans le store
          this._store.dispatch(new AuthTokenAction.SetToken(response.data.access_token, response.data.refresh_token));
          
          // Notifier les observateurs que le token a été rafraîchi
          this.refreshTokenSubject.next(response.data.access_token);
          this.refreshInProgress = false;
          
          return of(response.data.access_token);
        }),
        catchError((err) => {
          this.refreshInProgress = false;
          this.refreshTokenSubject.next(null);
          
          // En cas d'échec, déconnecter l'utilisateur
          this._store.dispatch(new AuthTokenAction.Logout());
          
          return throwError(() => err);
        })
      );
  }

  // Vérifier si le token est sur le point d'expirer (à appeler périodiquement)
  checkTokenExpiration(): void {
    const token = this._store.selectSnapshot(AuthTokenState.selectStateToken);
    
    if (!token || !token.accessToken) {
      return;
    }
    
    try {
      // Vérifier si le token est proche de l'expiration
      const tokenData = this.parseJwt(token.accessToken);
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Si le token expire dans moins de 5 minutes (300 secondes)
      if (tokenData.exp && tokenData.exp - currentTime < 300) {
        this.refreshAccessToken().subscribe();
      }
    } catch (e) {
      // En cas d'erreur de parsing du token, on ignore
      console.error('Erreur lors de la vérification du token', e);
    }
  }

  // Fonction utilitaire pour décoder un token JWT
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