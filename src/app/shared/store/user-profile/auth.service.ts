import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { UserProfileModel } from './user-profile.model';
import { ApiResultFormat } from '../global';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  public _uid = new BehaviorSubject<any>(null);
  currentUser: any;
  currentUserSubject:BehaviorSubject<any>=new BehaviorSubject(null)

  constructor(
    private _httpClient: HttpClient
  ) { }

  login(email: string, password: string): Observable<ApiResultFormat<{access_token:string,refresh_token:string,user:UserProfileModel}>> 
  {
    return this._httpClient.post<ApiResultFormat<{access_token:string,refresh_token:string,user:UserProfileModel}>>(`${environment.apiUrl}/user/auth/login`,{email, password});
  }


  register(email: string, password: string,username:string, phoneNumber:string):Observable<ApiResultFormat<UserProfileModel>> {
    return this._httpClient.post<ApiResultFormat<UserProfileModel>>(`${environment.apiUrl}/user/auth/register`,{email,password,name:username,phoneNumber});

  }

  resetPassword(password: string,token:string) {
    return this._httpClient.put<ApiResultFormat<null>>(`${environment.apiUrl}/user/auth/reset-password`,{password},{headers:{ Authorization: `Bearer ${token}`} });
  }

  resendEmailLinkForActiveAccound(email:string)
  {
    return this._httpClient.post<ApiResultFormat<null>>(`${environment.apiUrl}/email/send-confirmation`,{email});
  }

  logout(): Observable<ApiResultFormat<null>> {
    return this._httpClient.post<ApiResultFormat<null>>(`${environment.apiUrl}/user/auth/logout`, {});
  }

  resendEmailLinkForResetPassword(email:string)
  {
    return this._httpClient.post<ApiResultFormat<null>>(`${environment.apiUrl}/user/auth/reset-password-link`,{email});
  }

  validateEmailWithToken(token:string):Observable<ApiResultFormat<null>> {
    return this._httpClient.post<ApiResultFormat<null>>(`${environment.apiUrl}/email/confirm`,{},{headers:{ Authorization: `Bearer ${token}`} });
  }


  
}