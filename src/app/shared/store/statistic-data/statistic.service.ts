import { Injectable } from "@angular/core";
import { environment } from 'src/environments/environment';
import { HttpClient } from "@angular/common/http";
import { Observable, combineLatest, of, } from "rxjs";
import { ApiResultFormat } from "../global";
import { switchMap } from "rxjs/operators";
import { StatisticAllPaymentLocataireYearModel, StatisticLocataireYearModel, StatisticPaymentOfAllPropertyByYear, StatisticRoomYearModel } from "./statistic.model";

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

   

    getStatisticRoomDataByYear(propertyID:string,year:string|number):Observable<ApiResultFormat<StatisticRoomYearModel[]>>
    {
        return this._httpClient.get<ApiResultFormat<StatisticRoomYearModel[]>>(`${environment.apiUrl}/statistic-location-payment/statistic-payement-by-room/${propertyID}/${year}/`)
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