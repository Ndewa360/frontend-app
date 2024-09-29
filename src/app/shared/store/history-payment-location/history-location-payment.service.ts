import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, combineLatest, of, } from "rxjs";
import { ApiResultFormat } from "../global";
import { switchMap } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { HistoryLocationPaymentModel } from "./history-location-payment.model";

@Injectable({
    providedIn:'root'
})
export class HistoryLocationPaymentService
{
    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient
    )
    {}

    getHistoryLocationPayments(locataireID:string):Observable<ApiResultFormat<HistoryLocationPaymentModel[]>>
    {       
        return this._httpClient.get<ApiResultFormat<HistoryLocationPaymentModel[]>>(`${environment.apiUrl}/history-location-payment/${locataireID}`)
    }
}