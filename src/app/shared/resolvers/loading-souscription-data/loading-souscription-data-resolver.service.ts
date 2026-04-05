import { Injectable } from "@angular/core";
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { Store } from "@ngxs/store";
import { Observable, of } from "rxjs";
import { switchMap, take, filter } from "rxjs/operators";
import { SouscriptionAction, UserProfileState } from "../../store";

@Injectable({
    providedIn:"root"
})
export class LoadingSouscriptionDataResolver implements Resolve<any>
{
    constructor(private _store: Store) {}

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any>
    {
        return this._store.select(UserProfileState.selectStateUserProfile).pipe(
            filter(profile => !!profile?._id),
            take(1),
            switchMap(profile => {
                this._store.dispatch(new SouscriptionAction.FetchSouscriptionsByUserId(profile._id));
                // Attendre que le chargement soit terminé
                return this._store.select((state: any) => state.souscriptionlist.initLoadingState).pipe(
                    filter(s => s === 'LOADED'),
                    take(1)
                );
            })
        );
    }
}
