import { Injectable } from "@angular/core";
// import { environment } from "environments/environment";
import { UserModel } from "./user.model";
import { HttpClient } from "@angular/common/http";
import { Observable, combineLatest, of, } from "rxjs";
import { ApiResultFormat } from "../global";
import { environment } from "src/environments/environment";

@Injectable({
    providedIn:'root'
})
export class UserService
{
    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient
    )
    {}


    /**
     * Update contact
     */
    updateUser(contact:UserModel,id:string): Observable<ApiResultFormat<UserModel>>
    {
        return this._httpClient.post<ApiResultFormat<UserModel>>(`${environment.apiUrl}/users/`, {})
    }

    getAllUsers(): Observable<ApiResultFormat<UserModel[]>>
    {
        return this._httpClient.get<ApiResultFormat<UserModel[]>>(`${environment.apiUrl}/users/`, {})
    }

    getUser(userId):Observable<ApiResultFormat<UserModel[]>>
    {
        return null;
        // return this.api.collectionDataQuery( 'user', this.api.whereQuery('uid', '==', userId))
        // .pipe( switchMap(data => of({statusCode:200,data})));
    }

    getUsers(userId:string[]):Observable<ApiResultFormat<UserModel[]>>
    {
        return null;
        // //console.log("User ID ", userId)
        // if(userId.length===0)
        // {
        //     return this.api.collectionDataQuery( 'user', )
        //     .pipe( switchMap(data => {
        //         //console.log("Data ",data)
        //         return of({statusCode:200,data})
        //     }));
        // }
        // else 
        // {
        //     return combineLatest( userId.map(id => this.getUser(id)) )
        //     .pipe(
        //         switchMap((result)=>{
        //         return of({
        //             statusCode:200,
        //             data: result.map(r=>r.data).reduce((acc, val)=> ([...acc,...val]), [])
        //         })
        //     }))
        // }
        
        
    }
}