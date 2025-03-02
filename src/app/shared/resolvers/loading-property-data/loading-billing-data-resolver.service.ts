import { Injectable } from "@angular/core";
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { Store } from "@ngxs/store";
import { Observable, of} from "rxjs";
import { LocataireAction } from "../../store";
import { HistoryLocationPaymentAction } from "../../store/history-payment-location";


@Injectable({
    providedIn:"root"
})
export class LoadingBillingDataResolver implements Resolve<any>
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
        let locataireID:any= route.paramMap.get("locataireID")
        this._store.dispatch([
            new LocataireAction.FetchLocataire(locataireID),
            new HistoryLocationPaymentAction.FetchHistoryLocationByLocataireId(locataireID)
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
        //     //console.log("Error ",error)
        // })

        return of(true);

        
    }
}
