import { Injectable } from "@angular/core";
import { SouscriptionModel } from "./souscription.model";
import { HttpClient } from "@angular/common/http";
import { Observable, combineLatest, of, } from "rxjs";
import { ApiResultFormat } from "../global";
import { switchMap } from "rxjs/operators";
import { environment } from "src/environments/environment";

@Injectable({
    providedIn:'root'
})
export class SouscriptionService
{
   
    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient
    )
    {}

    /**
     * Create souscription
     */
    createDefaultSouscription(): Observable<ApiResultFormat<SouscriptionModel>>
    {
        return this._httpClient.post<ApiResultFormat<SouscriptionModel>>(`${environment.apiUrl}/souscription/default`, {})
    }

    getSouscriptions(userId:string):Observable<ApiResultFormat<SouscriptionModel[]>>
    {       
        return this._httpClient.get<ApiResultFormat<SouscriptionModel[]>>(`${environment.apiUrl}/souscription/user/${userId}`)
    }

    removeAssignationSouscription(souscriptionId: string) {
        return this._httpClient.delete<ApiResultFormat<SouscriptionModel[]>>(`${environment.apiUrl}/souscription/${souscriptionId}`)
    }

    /**
     * Get current subscription
     */
    getCurrentSubscription(): Observable<ApiResultFormat<SouscriptionModel>>
    {
        return this._httpClient.get<ApiResultFormat<SouscriptionModel>>(`${environment.apiUrl}/souscription/current`)
    }

    /**
     * Get subscription history
     */
    getSubscriptionHistory(): Observable<ApiResultFormat<SouscriptionModel[]>>
    {
        return this._httpClient.get<ApiResultFormat<SouscriptionModel[]>>(`${environment.apiUrl}/souscription/history`)
    }

    /**
     * Start 60-day trial plan
     */
    startTrial(): Observable<ApiResultFormat<SouscriptionModel>>
    {
        return this._httpClient.post<ApiResultFormat<SouscriptionModel>>(`${environment.apiUrl}/souscription/trial`, {})
    }

    /**
     * Get trial status
     */
    getTrialStatus(): Observable<ApiResultFormat<{isTrial: boolean; daysRemaining: number; trialEndDate: Date; isTrialExpired: boolean}>>
    {
        return this._httpClient.get<any>(`${environment.apiUrl}/souscription/trial/status`)
    }
}