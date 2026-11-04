import { Injectable } from "@angular/core";
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { Store } from "@ngxs/store";
import { Observable, of } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { SearchAction } from "../../store";


@Injectable({
    providedIn:"root"
})
export class SearchRoomDataResolver implements Resolve<any>
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
        const roomID = route.paramMap.get('roomID');
        if (!roomID) return of(false);
        // La page s'affiche une fois le logement chargé (ou introuvable) :
        // la requête était lancée sans être attendue.
        return this._store.dispatch(new SearchAction.FetchSearchByIdRoom(roomID)).pipe(
            map(() => true),
            catchError(() => of(true)),
        );
    }
}
