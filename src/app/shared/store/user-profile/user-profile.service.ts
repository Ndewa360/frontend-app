import { Injectable } from "@angular/core";
// import { environment } from "environments/environment";
import { UserProfileModel } from "./user-profile.model";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { ApiResultFormat } from "../global";
import { environment } from "src/environments/environment";


// super. maintenant, je veux que tu analyse completement le systéme de traduction. que tu le complete avec toutes les pages, les notifications les boutons. pourque le site intégre completement le 
@Injectable({
    providedIn:'root'
})
export class UserProfileService
{
    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient)
    {}
    /**
     * Get user profile
     */
    getUserProfile(): Observable<ApiResultFormat<UserProfileModel>>
    {
        return this._httpClient.get<ApiResultFormat<UserProfileModel>>(`${environment.apiUrl}/user/profil`)
    }

    /**
     * Update contact
     */
    updateUserProfile(contact:UserProfileModel,id:string): Observable<ApiResultFormat<UserProfileModel>>
    {
        return this._httpClient.put<ApiResultFormat<UserProfileModel>>(`${environment.apiUrl}/user/profil/${id}`, contact)
    }

}