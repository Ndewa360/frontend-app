import { Injectable } from "@angular/core";
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { Actions, Store } from "@ngxs/store";
import { Observable, combineLatest, of} from "rxjs";
import { mergeMap, skipWhile, tap } from "rxjs/operators";
import { PropertyAction, SouscriptionAction, UserProfileAction } from "../../store";


@Injectable({
    providedIn:"root"
})
export class LoadingSouscriptionDataResolver implements Resolve<any>
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
            this._store.select((state)=>state.userprofile.userProfile)
            .pipe(
                skipWhile((x)=>x==null),
                tap((value)=>{
                    if(!value) return null;
                    return this._store.dispatch([
                        new SouscriptionAction.FetchSouscriptionsByUserId(value._id)
                    ])}
                ),
            ),
            this._store.select((state)=>state.souscriptionlist.initLoadingState).pipe(skipWhile((initLoadingState)=>initLoadingState!="LOADED")),
        ).pipe(
            tap((error)=> of(true))
        ).subscribe((error)=>{
            //console.log("Error ",error)
        })

        return of(true);

        
    }
}
