import { Injectable } from "@angular/core";
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { Store } from "@ngxs/store";
import { combineLatest, Observable, of } from "rxjs";
import { map, filter, take, timeout, catchError } from "rxjs/operators";
import { CountryAction, UserProfileAction } from "../../store";

@Injectable({ providedIn: "root" })
export class LoadingAdminDataResolver implements Resolve<any> {

    constructor(private _store: Store) {}

    /**
     * Charge les données de base de l'administration avant l'affichage.
     *
     * Historique : ce resolver dispatchait aussi `UserAction.FetchAllUsers` et
     * attendait `state.userlist.initLoadingState === 'LOADED'`.
     *  - `userlist` n'est lu nulle part dans l'application (zéro consommateur de
     *    `UserState`) : la réponse était jetée ;
     *  - `initLoadingState` n'a jamais été mis à `'LOADED'` dans `user.state.ts`
     *    (uniquement `'NO_LOADED'`/`'LOADING'`) ;
     *  → `skipWhile` n'émettait jamais et c'était `timeout(10000)` qui
     *  terminait le resolver : **chaque entrée dans `/:lang/admin/*` durait
     *  exactement 10 secondes.**
     *
     * On attend maintenant uniquement ce qu'on dispatche réellement, avec une
     * fin de course correcte (`LOADED` **ou** `ERROR` = état terminal) et un
     * filet de 5 s.
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
        return combineLatest([
            this._store.dispatch([
                new CountryAction.FetchCountries(),
                new UserProfileAction.FetchUserProfile()
            ]),
            this._store.select((s: any) => s.countries?.initLoadingState).pipe(
                filter(s => s === 'LOADED' || s === 'ERROR'),
                take(1),
                timeout(5000),
                catchError(() => of('LOADED'))
            ),
            this._store.select((s: any) => s.userprofile?.initLoadingState).pipe(
                filter(s => s === 'LOADED' || s === 'ERROR'),
                take(1),
                timeout(5000),
                catchError(() => of('LOADED'))
            )
        ]).pipe(
            map(() => true),
            catchError(() => of(true))
        );
    }
}
