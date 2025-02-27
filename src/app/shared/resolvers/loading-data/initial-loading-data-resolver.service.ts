import { Injectable } from "@angular/core";
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { Actions, Store } from "@ngxs/store";
import { Observable, combineLatest, of} from "rxjs";
import { map, mergeMap, skipWhile, tap } from "rxjs/operators";
import { LocataireAction, LocationAction, LocationPaymentAction, PropertyAction, RoomAction, UserProfileAction,CountryAction } from "../../store";


@Injectable({
    providedIn:"root"
})
export class InitialLoadingDataResolver implements Resolve<any>
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
            this._store.select((state)=>state.auth_token.authToken)
            .pipe(
                skipWhile((x)=>x==null),
                map((value)=>{
                    if(!value) return null;
                    return this._store.dispatch([
                        new UserProfileAction.FetchUserProfile(),
                        new PropertyAction.FetchProperties(),
                        new CountryAction.FetchCountries()                        
                    ])}
                ),
            ),
            this._store.select((state)=>state.userprofile.initLoadingState).pipe(skipWhile((initLoadingState)=>initLoadingState!="LOADED")),
            this._store.select((state)=>state.properties.initLoadingState).pipe(skipWhile((initLoadingState)=>initLoadingState!="LOADED")),
        ).pipe(
            mergeMap((value)=> this._store.select((state)=>state.properties.properties) ),
            map((value)=>this._store.dispatch(value.map((prop)=>[
                new LocataireAction.FetchLocatairesByPropertyId(prop._id),
                new RoomAction.FetchRoomsByPropertyID(prop._id),
                new LocationAction.FetchLocationsByPropertyId(prop._id),
                new LocationPaymentAction.FetchLocationPaymentsByPropertyId(prop._id),
            ]).reduce((acc,curr)=>[...acc,...curr],[]))),
        ).subscribe((value)=>{
            console.log("Value in init resolver",value)
        })

        return of(true);

        
    }
}
