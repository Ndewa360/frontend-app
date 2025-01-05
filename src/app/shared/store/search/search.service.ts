import { Injectable } from "@angular/core";
import { SearchPropertyModel } from "./search.model";
import { HttpClient } from "@angular/common/http";
import { Observable, combineLatest, of, } from "rxjs";
import { ApiResultFormat } from "../global";
import { switchMap } from "rxjs/operators";
import { environment } from "src/environments/environment";

@Injectable({
    providedIn:'root'
})
export class SearchService
{
    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient
    )
    {}
   

    getSearch(city:string):Observable<ApiResultFormat<SearchPropertyModel[]>>
    {
        return this._httpClient.get<ApiResultFormat<SearchPropertyModel[]>>(`${environment.apiUrl}/search/by-city/${city}`)

    }
}