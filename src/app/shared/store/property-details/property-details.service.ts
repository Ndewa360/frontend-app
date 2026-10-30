import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from 'src/environments/environment';
import { ApiResultFormat } from "../global";
import { PropertyDetailsModel } from "./property-details.model";

@Injectable({
    providedIn:'root'
})
export class PropertyDetailsService
{
    constructor(private _httpClient: HttpClient) {}

    getPropertyDetails(propertyId: string): Observable<ApiResultFormat<PropertyDetailsModel>>
    {
        return this._httpClient.get<ApiResultFormat<PropertyDetailsModel>>(`${environment.apiUrl}/property/${propertyId}/details`)
    }
}
