import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { ApiResultFormat } from '../global';
import { environment } from 'src/environments/environment';
import { AuthTokenAction } from './auth-token.actions';
import { ToastrService } from 'ngx-toastr';


@Injectable({
    providedIn: 'root'
  })
export class RefreshTokenService {
    private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  constructor(private http: HttpClient, private _store: Store,private _toastrService:ToastrService) {}

  refreshAccessToken(accessToken,refreshToken): Observable<any> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
    console.log("Token ",accessToken,refreshToken)

      // Envoyer la requête pour rafraîchir le token
      return new Observable(observer => {
        this.http.get<ApiResultFormat<{access_token:string, refresh_token:string}>>(`${environment.apiUrl}/user/auth/refresh`).subscribe({
          next: (response) => {
            console.log("Response ",response)
            this._store.dispatch(new AuthTokenAction.SetAuthToken(response.data.access_token));
            this._store.dispatch(new AuthTokenAction.SetRefreshToken(response.data.refresh_token));

            this.refreshTokenSubject.next(response.data.access_token);
            this.isRefreshing = false;
            observer.next(response.data.access_token);
            observer.complete();
          },
          error: (err) => {
            console.log("Error Token ",err)
            this._store.dispatch(new AuthTokenAction.SetAuthToken(null));
            this._store.dispatch(new AuthTokenAction.SetRefreshToken(null));
            this.isRefreshing = false;
            this.refreshTokenSubject.next(null);
            observer.error(err);
            return throwError(() => err);

          }
        });
      });
    } else {
      // Retourne un observable qui attend que le token soit mis à jour
      return new Observable(observer => {
        this.refreshTokenSubject.subscribe({
          next: (token) => {
            if (token) {
              observer.next(token);
              observer.complete();
            }
          },
          error: (err) => observer.error(err)
        });
      });
    }
  }
}