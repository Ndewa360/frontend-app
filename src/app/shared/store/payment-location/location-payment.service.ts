import { Injectable } from "@angular/core";
import { LocationPaymentModel } from "./location-payment.model";
import { HttpClient } from "@angular/common/http";
import { Observable, combineLatest, of, } from "rxjs";
import { ApiResultFormat } from "../global";
import { switchMap } from "rxjs/operators";
import { environment } from "src/environments/environment";

@Injectable({
    providedIn:'root'
})
export class LocationPaymentService
{
    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient
    )
    {}

    /**
     * Create locationPayment
     */
    createLocationPayment(locationPayment:LocationPaymentModel): Observable<ApiResultFormat<LocationPaymentModel>>
    {
        return this._httpClient.post<ApiResultFormat<LocationPaymentModel>>(`${environment.apiUrl}/location-payment`, locationPayment)
    }

    deleteLocationPayment(locationPaymentID:string): Observable<ApiResultFormat<LocationPaymentModel>>
    {
        return this._httpClient.delete<ApiResultFormat<LocationPaymentModel>>(`${environment.apiUrl}/location-payment/${locationPaymentID}`,)
    }

    /**
     * Update locationPayment
     */
    updateLocationPayment(locationPayment:LocationPaymentModel,id:string): Observable<ApiResultFormat<LocationPaymentModel>>
    {
        return this._httpClient.put<ApiResultFormat<LocationPaymentModel>>(`${environment.apiUrl}/location-payment/${id}`, locationPayment)
    }

    getLocationPayment(locationPaymentId):Observable<ApiResultFormat<LocationPaymentModel>>
    {
        return this._httpClient.get<ApiResultFormat<LocationPaymentModel>>(`${environment.apiUrl}/location-payment/${locationPaymentId}`)

    }


    getLocationPayments(propertyId:string):Observable<ApiResultFormat<LocationPaymentModel[]>>
    {       
        return this._httpClient.get<ApiResultFormat<LocationPaymentModel[]>>(`${environment.apiUrl}/location-payment/property/${propertyId}`)
    }

    downloadReceipt(paymentId: string): Observable<Blob> {
        return this._httpClient.get(
            `${environment.apiUrl}/location-payment/${paymentId}/receipt/download`,
            { responseType: 'blob' }
        );
    }
}