import { Injectable } from "@angular/core";
import { environment } from 'src/environments/environment';
import { CountryModel } from "./country.model";
import { HttpClient } from "@angular/common/http";
import { Observable, combineLatest, of, } from "rxjs";
import { ApiResultFormat } from "../global";
import { switchMap } from "rxjs/operators";

@Injectable({
    providedIn:'root'
})
export class CountryService
{
    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient
    )
    {}

    /**
     * Create country
     */
    createCountry(country:CountryModel): Observable<ApiResultFormat<CountryModel>>
    {
        return this._httpClient.post<ApiResultFormat<CountryModel>>(`${environment.apiUrl}/localisation/country`, country)
    }

    getCountry(countryId):Observable<ApiResultFormat<CountryModel>>
    {
        return this._httpClient.get<ApiResultFormat<CountryModel>>(`${environment.apiUrl}/localisation/country/${countryId}`)

    }

    getCountries():Observable<ApiResultFormat<CountryModel[]>>
    {       
        return this._httpClient.get<ApiResultFormat<CountryModel[]>>(`${environment.apiUrl}/localisation/country`)
    }
}