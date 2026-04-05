import { Injectable } from "@angular/core";
import { SouscriptionPeriodModel } from "./souscription-period.model";
import { HttpClient } from "@angular/common/http";
import { Observable, combineLatest, of, } from "rxjs";
import { ApiResultFormat } from "../global";
import { switchMap, tap, catchError } from "rxjs/operators";
import { environment } from "src/environments/environment";

@Injectable({
    providedIn:'root'
})
export class SouscriptionPeriodService
{
   
    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient
    )
    {}

    getSouscriptionPeriod(souscriptionPeriodId):Observable<ApiResultFormat<SouscriptionPeriodModel>>
    {
        return this._httpClient.get<ApiResultFormat<SouscriptionPeriodModel>>(`${environment.apiUrl}/souscription-period/${souscriptionPeriodId}`)
    }

    /**
     * Récupère la période actuelle avec les détails des unités
     */
    getCurrentPeriodWithDetails(): Observable<ApiResultFormat<SouscriptionPeriodModel>>
    {
        return this._httpClient.get<ApiResultFormat<SouscriptionPeriodModel>>(`${environment.apiUrl}/souscription-period/current-with-details`);
    }

    /**
     * Active/désactive une unité pour la souscription
     */
    toggleUnitStatus(roomId: string, isActive: boolean): Observable<ApiResultFormat<any>>
    {
        return this._httpClient.put<ApiResultFormat<any>>(`${environment.apiUrl}/souscription-period/toggle-unit-status/${roomId}`, {
            isActive: isActive
        })
    }
}