import { Injectable } from "@angular/core";
import { LocataireModel } from "./locataire.model";
import { HttpClient } from "@angular/common/http";
import { Observable, combineLatest, of, } from "rxjs";
import { ApiResultFormat } from "../global";
import { switchMap } from "rxjs/operators";
import { environment } from "src/environments/environment";

@Injectable({
    providedIn:'root'
})
export class LocataireService
{
    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient
    )
    {}

    /**
     * Create locataire
     */
    createLocataire(locataire:LocataireModel): Observable<ApiResultFormat<LocataireModel>>
    {
        return this._httpClient.post<ApiResultFormat<LocataireModel>>(`${environment.apiUrl}/locataire`, locataire)
    }

    /**
     * Update locataire
     */
    updateLocataire(locataire:LocataireModel,id:string): Observable<ApiResultFormat<LocataireModel>>
    {
        return this._httpClient.put<ApiResultFormat<LocataireModel>>(`${environment.apiUrl}/locataire/${id}`, locataire)
    }

    getLocataire(locataireId):Observable<ApiResultFormat<LocataireModel>>
    {
        return this._httpClient.get<ApiResultFormat<LocataireModel>>(`${environment.apiUrl}/locataire/${locataireId}`)

    }

    getLocataires(propertyId:string):Observable<ApiResultFormat<LocataireModel[]>>
    {
        return this._httpClient.get<ApiResultFormat<LocataireModel[]>>(`${environment.apiUrl}/locataire/property/${propertyId}`)
    }

    /**
     * Supprimer un locataire
     */
    deleteLocataire(locataireId: string): Observable<ApiResultFormat<any>>
    {
        return this._httpClient.delete<ApiResultFormat<any>>(`${environment.apiUrl}/locataire/${locataireId}`)
    }
}