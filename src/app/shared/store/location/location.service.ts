import { Injectable } from "@angular/core";
import { LocationModel } from "./location.model";
import { HttpClient } from "@angular/common/http";
import { Observable, combineLatest, of, } from "rxjs";
import { ApiResultFormat } from "../global";
import { switchMap } from "rxjs/operators";
import { environment } from "src/environments/environment";

@Injectable({
    providedIn:'root'
})
export class LocationService
{
    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient
    )
    {}

    /**
     * Create location
     */
    createLocation(location:LocationModel): Observable<ApiResultFormat<LocationModel>>
    {
        return this._httpClient.post<ApiResultFormat<LocationModel>>(`${environment.apiUrl}/location`, location)
    }

    /**
     * Update location
     */
    updateLocation(location:LocationModel,id:string): Observable<ApiResultFormat<LocationModel>>
    {
        return this._httpClient.put<ApiResultFormat<LocationModel>>(`${environment.apiUrl}/location/${id}`, location)
    }

    getLocation(locationId):Observable<ApiResultFormat<LocationModel>>
    {
        return this._httpClient.get<ApiResultFormat<LocationModel>>(`${environment.apiUrl}/location/${locationId}`)

    }

    getLocations(propertyId:string):Observable<ApiResultFormat<LocationModel[]>>
    {       
        return this._httpClient.get<ApiResultFormat<LocationModel[]>>(`${environment.apiUrl}/location/property/${propertyId}`)
    }
}