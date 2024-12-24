import { Injectable } from "@angular/core";
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { Store } from "@ngxs/store";
import { combineLatest, Observable, of, skipWhile, tap} from "rxjs";
import { CountryAction, UserAction } from "../../store";


@Injectable({
    providedIn:"root"
})
export class LoadingAdminDataResolver implements Resolve<any>
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
        // let locataireID:any= route.paramMap.get("locataireID")
        // this._store.dispatch([
        //     new LocataireAction.FetchLocataire(locataireID),
        //     new HistoryLocationPaymentAction.FetchHistoryLocationByLocataireId(locataireID)
        // ])


        combineLatest(
            this._store.dispatch([
                new UserAction.FetchAllUsers(),
                new CountryAction.FetchCountries()
            ]),
            this._store.select((state)=>state.userlist.initLoadingState).pipe(skipWhile((initLoadingState)=>initLoadingState!="LOADED")),
        ).pipe(
            tap((error)=> of(true))
        ).subscribe((error)=>{
            console.log("Error ",error)
        })

        return of(true);

        
    }
}
