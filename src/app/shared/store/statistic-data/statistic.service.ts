import { Injectable } from "@angular/core";
import { environment } from 'src/environments/environment';
import { HttpClient } from "@angular/common/http";
import { Observable, combineLatest, of, } from "rxjs";
import { ApiResultFormat } from "../global";
import { switchMap, tap, catchError } from "rxjs/operators";
import { StatisticAllPaymentLocataireYearModel, StatisticLocataireYearModel, StatisticPaymentOfAllPropertyByYear, StatisticRoomYearModel, EnrichedStatisticResponse, PropertyMetrics, ComprehensiveReport } from "./statistic.model";

@Injectable({
    providedIn:'root'
})
export class StatisticService
{
    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient
    )
    {}

   

    getStatisticPropertyDataByYear(propertyID:string,year:string|number):Observable<ApiResultFormat<EnrichedStatisticResponse>>
    {
        const url = `${environment.apiUrl}/statistic-location-payment/statistic-payement-by-property/${propertyID}/${year}/`;
        return this._httpClient.get<ApiResultFormat<EnrichedStatisticResponse>>(url).pipe(
            catchError(error => {
                console.error('❌ API Error:', {
                    status: error.status,
                    statusText: error.statusText,
                    message: error.message,
                    url: url,
                    error: error.error
                });
                throw error;
            })
        )
    }

    getStatisticLocataireDataByYear(propertyID:string,year:string|number):Observable<ApiResultFormat<StatisticLocataireYearModel[]>>
    {    
        return this._httpClient.get<ApiResultFormat<StatisticLocataireYearModel[]>>(`${environment.apiUrl}/statistic-location-payment/statistic-payement-by-locataire/${propertyID}/${year}/`)
    }

    getAllPaymentLocataireStatisticDataByYear(propertyID:string,year:string|number):Observable<ApiResultFormat<StatisticAllPaymentLocataireYearModel[]>>
    {    
        return this._httpClient.get<ApiResultFormat<StatisticAllPaymentLocataireYearModel[]>>(`${environment.apiUrl}/statistic-location-payment/statistic-payement-all-inyear/${propertyID}/${year}/`)
    }

    
    getPaymentRecapitulationAccountOfAllPropertyByYear(year:string|number):Observable<ApiResultFormat<StatisticPaymentOfAllPropertyByYear>>
    {    
        return this._httpClient.get<ApiResultFormat<StatisticPaymentOfAllPropertyByYear>>(`${environment.apiUrl}/statistic-location-payment/statistic-payement-recapitulation-inyear/${year}/`)
    }
}