import { Injectable } from "@angular/core";
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { Actions, Store } from "@ngxs/store";
import { Observable, combineLatest, of} from "rxjs";
import { mergeMap, skipWhile, tap } from "rxjs/operators";
import { LocataireAction, LocationAction, LocationPaymentAction, PropertyAction, RoomAction, StatisticAction, UserProfileAction } from "../../store";
import { HistoryLocationPaymentAction } from "../../store/history-payment-location";


@Injectable({
    providedIn:"root"
})
export class LoadingPropertyDataResolver implements Resolve<any>
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
        let propertyId:any= route.paramMap.get("id")
        this._store.dispatch([
            new LocataireAction.FetchLocatairesByPropertyId(propertyId),
            new RoomAction.FetchRoomsByPropertyID(propertyId),
            new LocationAction.FetchLocationsByPropertyId(propertyId),
            new LocationPaymentAction.FetchLocationPaymentsByPropertyId(propertyId),
            new HistoryLocationPaymentAction.FetchHistoryLocationPaymentsByPropertyId(propertyId),
            // new StatisticAction.FetchStaticRoomDataByPropertyIdAndYear(propertyId,`${new Date().getFullYear()}`),
            new StatisticAction.FetchStaticLocataireDataByPropertyIdAndYear(propertyId,`${new Date().getFullYear()}`),
            new StatisticAction.FetchStaticAllPaymentLocataireDataByPropertyIdAndYear(propertyId,`${new Date().getFullYear()}`)
        ])

        // combineLatest(
        //     this._store.select((state)=>state.auth_token.authToken)
        //     .pipe(
        //         skipWhile((x)=>x==null),
        //         tap((value)=>this._store.dispatch([
        //                 new UserProfileAction.FetchUserProfile(),
        //                 new PropertyAction.FetchProperties()
        //             ])
        //         ),
        //     ),
        //     this._store.select((state)=>state.userprofile.initLoadingState).pipe(skipWhile((initLoadingState)=>initLoadingState!="LOADED")),
        // ).pipe(
        //     tap((error)=> of(true))
        // ).subscribe((error)=>{
        //     console.log("Error ",error)
        // })

        return of(true);

        
    }
}
