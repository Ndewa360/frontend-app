import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { BehaviorSubject, catchError, Observable, switchMap, tap, throwError } from 'rxjs';
import { ApiResultFormat } from '../global';
import { environment } from 'src/environments/environment';
import { AuthTokenAction } from './auth-token.actions';
import { ToastrService } from 'ngx-toastr';
import { AuthTokenState } from './auth-token.state';


@Injectable({
    providedIn: 'root'
  })
export class RefreshTokenService {
  constructor(private http: HttpClient, private _store: Store) {}

  refreshAccessToken(): Observable<string> {
    return this.http.get<ApiResultFormat<{ access_token: string, refresh_token: string }>>(`${environment.apiUrl}/user/auth/refresh`)
      .pipe(
        switchMap((response) => {
          // console.warn("Token", response.data);
          this._store.dispatch(new AuthTokenAction.SetToken(response.data.access_token, response.data.refresh_token));
          return new Observable<string>(observer => {
            observer.next(response.data.access_token);
            observer.complete();
          });
        }),
        catchError((err) => {
          return throwError(() => err);
        })
      );
  }
}