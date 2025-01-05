import { Injectable } from "@angular/core";
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { Store } from "@ngxs/store";
import { combineLatest, Observable, of, skipWhile, tap} from "rxjs";
import { CountryAction, UserAction } from "../../store";


@Injectable({
    providedIn:"root"
})
export class SearchPageDataResolver implements Resolve<any>
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

        combineLatest(
            this._store.dispatch([
                new CountryAction.FetchCountries()
            ]),
        ).pipe(
            tap((error)=> of(true))
        ).subscribe((error)=>{})

        return of(true);

        
    }
}
