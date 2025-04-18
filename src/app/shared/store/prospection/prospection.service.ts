import { Injectable } from "@angular/core";
import { environment } from 'src/environments/environment';
import { ProspectionModel } from "./prospection.model";
import { HttpClient } from "@angular/common/http";
import { Observable, combineLatest, of, } from "rxjs";
import { ApiResultFormat } from "../global";
import { switchMap } from "rxjs/operators";

@Injectable({
    providedIn:'root'
})
export class ProspectionService
{
    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient
    )
    {}
   

    addNewProspection(prospectionModel:ProspectionModel):Observable<ApiResultFormat<null>> //ApiResultFormat<ProspectionModel>
    {
        return this._httpClient.post<ApiResultFormat<null>>(`${environment.apiUrl}/prospection/new-contact`,prospectionModel)

    }
}