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

    /**
     * Get cities by country
     */
    getCitiesByCountry(countryId: string): Observable<ApiResultFormat<CityModel[]>>
    {
        return this._httpClient.get<ApiResultFormat<CityModel[]>>(`${environment.apiUrl}/localisation/city/country/${countryId}`)
    }

    /**
     * Get all cities (for search purposes)
     * First get countries, find Cameroon, then get its cities
     */
    getAllCities(): Observable<ApiResultFormat<CityModel[]>>
    {
        // D'abord récupérer la liste des pays pour trouver l'ID du Cameroun
        return this._httpClient.get<any>(`${environment.apiUrl}/localisation/country`).pipe(
            switchMap((countriesResponse) => {
                // Trouver le Cameroun dans la liste des pays
                const cameroon = countriesResponse.data?.find((country: any) =>
                    country.fullName?.toLowerCase().includes('cameroun') ||
                    country.fullName?.toLowerCase().includes('cameroon')
                );

                if (cameroon) {
                    // Si on trouve le Cameroun, récupérer ses villes
                    return of({data: cameroon.cities, statusCode: 200, message: 'No cities found'} as ApiResultFormat<CityModel[]>);
                } else {
                    // Si pas de Cameroun trouvé, retourner une liste vide
                    return of({ data: [], statusCode: 200, message: 'No cities found' } as ApiResultFormat<CityModel[]>);
                }
            })
        );
    }
}