import { Injectable } from "@angular/core";
import { SouscriptionPeriodModel } from "./souscription-period.model";
import { HttpClient } from "@angular/common/http";
import { Observable, combineLatest, of, } from "rxjs";
import { ApiResultFormat } from "../global";
import { switchMap } from "rxjs/operators";
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

    /**
     * Create souscriptionPeriod
     */
    createDefaultSouscriptionPeriod(): Observable<ApiResultFormat<SouscriptionPeriodModel>>
    {
        return this._httpClient.post<ApiResultFormat<SouscriptionPeriodModel>>(`${environment.apiUrl}/souscription-period/default`, {})
    }

    getSouscriptionPeriod(souscriptionPeriodId):Observable<ApiResultFormat<SouscriptionPeriodModel>>
    {
        return this._httpClient.get<ApiResultFormat<SouscriptionPeriodModel>>(`${environment.apiUrl}/souscription-period/${souscriptionPeriodId}`)

    }

    removeAssignationSouscriptionPeriod(souscriptionPeriodId: string) {
        return this._httpClient.delete<ApiResultFormat<SouscriptionPeriodModel[]>>(`${environment.apiUrl}/souscription-period/${souscriptionPeriodId}`)
    }
}