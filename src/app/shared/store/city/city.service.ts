import { Injectable } from "@angular/core";
import { CityModel } from "./city.model";
import { HttpClient } from "@angular/common/http";
import { Observable, combineLatest, of, } from "rxjs";
import { ApiResultFormat } from "../global";
import { switchMap } from "rxjs/operators";
import { environment } from "src/environments/environment";

@Injectable({
    providedIn:'root'
})
export class CityService
{
    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient
    )
    {}

    /**
     * Create city
     */
    createCity(city:CityModel): Observable<ApiResultFormat<CityModel>>
    {
        return this._httpClient.post<ApiResultFormat<CityModel>>(`${environment.apiUrl}/localisation/city`, city)
    }

    /**
     * Update city
     */
    updateCity(city:CityModel,id:string): Observable<ApiResultFormat<CityModel>>
    {
        return this._httpClient.put<ApiResultFormat<CityModel>>(`${environment.apiUrl}/localisation/city/${id}`, city)
    }

    getCity(cityId):Observable<ApiResultFormat<CityModel>>
    {
        return this._httpClient.get<ApiResultFormat<CityModel>>(`${environment.apiUrl}/localisation/city/${cityId}`)

    }
}