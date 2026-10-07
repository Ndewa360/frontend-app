import { Injectable } from "@angular/core";
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { Store } from "@ngxs/store";
import { Observable, of } from "rxjs";
import { switchMap, take, filter, timeout, catchError } from "rxjs/operators";
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
                // Attendre que le chargement soit terminé — avec un filet :
                // une erreur HTTP laisse `initLoadingState` à 'NO_LOADED',
                // `filter(=== 'LOADED')` ne passe jamais et la navigation
                // restait bloquée à jamais (aucun timeout ici).
                return this._store.select((state: any) => state.souscriptionlist?.initLoadingState).pipe(
                    filter(s => s === 'LOADED'),
                    take(1),
                    timeout(5000),
                    catchError(() => of('LOADED'))
                );
            }),
            // Filet absolu : si le profil n'arrive jamais, la route doit quand
            // même se terminer (6000 ms = budget total de l'overlay).
            timeout(6000),
            catchError(() => of(true))
        );
    }
}
