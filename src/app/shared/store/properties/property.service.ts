import { Injectable } from "@angular/core";
import { environment } from 'src/environments/environment';
import { PropertyModel } from "./property.model";
import { HttpClient } from "@angular/common/http";
import { Observable, combineLatest, of, } from "rxjs";
import { ApiResultFormat } from "../global";
import { switchMap } from "rxjs/operators";

@Injectable({
    providedIn:'root'
})
export class PropertyService
{
    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient
    )
    {}

    /**
     * Create property
     */
    createProperty(property:PropertyModel): Observable<ApiResultFormat<PropertyModel>>
    {
        return this._httpClient.post<ApiResultFormat<PropertyModel>>(`${environment.apiUrl}/property`, property)
    }

    /**
     * Update property
     */
    updateProperty(property:PropertyModel,id:string): Observable<ApiResultFormat<PropertyModel>>
    {
        return this._httpClient.put<ApiResultFormat<PropertyModel>>(`${environment.apiUrl}/property/${id}`, property)
    }

    getProperty(propertyId):Observable<ApiResultFormat<PropertyModel>>
    {
        return this._httpClient.get<ApiResultFormat<PropertyModel>>(`${environment.apiUrl}/property/${propertyId}`)

    }

    getProperties():Observable<ApiResultFormat<PropertyModel[]>>
    {       
        return this._httpClient.get<ApiResultFormat<PropertyModel[]>>(`${environment.apiUrl}/property`)
    }
}