import { Injectable } from "@angular/core";
import { environment } from 'src/environments/environment';
import { ContractModel } from "./contract.model";
import { HttpClient } from "@angular/common/http";
import { Observable, combineLatest, of, } from "rxjs";
import { ApiResultFormat } from "../global";
import { switchMap } from "rxjs/operators";

@Injectable({
    providedIn:'root'
})
export class ContractService
{
    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient
    )
    {}
   

    getContract(locationId):Observable<ApiResultFormat<string>> //ApiResultFormat<ContractModel>
    {
        return this._httpClient.get<ApiResultFormat<string>>(`${environment.apiUrl}/contract/generate/${locationId}`)

    }
}