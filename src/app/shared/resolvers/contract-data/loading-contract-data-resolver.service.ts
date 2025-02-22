import { Injectable } from "@angular/core";
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { Store } from "@ngxs/store";
import { combineLatest, Observable, of, skipWhile, tap} from "rxjs";
import { ContractAction, LocataireAction } from "../../store";


@Injectable({
    providedIn:"root"
})
export class LoadingContractDataResolver implements Resolve<any>
{
    
    /**
     * Constructor
     */
    constructor(private _store:Store){}

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Use this resolver to resolve initial mock-api for the application
     *
     * @param route
     * @param state
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any>
    {
        let locationId:any= route.paramMap.get("locationID")
        // let locataireID:any= 
        console.log("locationId ", locationId, "locataireID ",route.params )
        this._store.dispatch([
            new ContractAction.FetchContract(locationId),
            new LocataireAction.FetchLocataire(route.params["locataireID"])
        ])


        // combineLatest(
        //     this._store.dispatch([
        //         new UserAction.FetchAllUsers(),
        //         new CountryAction.FetchCountries()
        //     ]),
        //     this._store.select((state)=>state.userlist.initLoadingState).pipe(skipWhile((initLoadingState)=>initLoadingState!="LOADED")),
        // ).pipe(
        //     tap((error)=> of(true))
        // ).subscribe((error)=>{
        //     console.log("Error ",error)
        // })

        return of(true);

        
    }
}
