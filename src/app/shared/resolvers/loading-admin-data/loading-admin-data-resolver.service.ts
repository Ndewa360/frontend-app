import { Injectable } from "@angular/core";
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { Store } from "@ngxs/store";
import { combineLatest, Observable, of, skipWhile, map, catchError, timeout } from "rxjs";
import { CountryAction, UserAction, UserProfileAction } from "../../store";

@Injectable({ providedIn: "root" })
export class LoadingAdminDataResolver implements Resolve<any> {

    constructor(private _store: Store) {}

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
        return combineLatest([
            this._store.dispatch([
                new UserAction.FetchAllUsers(),
                new CountryAction.FetchCountries(),
                new UserProfileAction.FetchUserProfile()
            ]),
            this._store.select((state) => state.userlist?.initLoadingState || 'LOADED').pipe(
                skipWhile((s) => s !== "LOADED"),
                timeout(10000),
                catchError(() => of('LOADED'))
            )
        ]).pipe(
            map(() => true),
            catchError(() => of(true))
        );
    }
}
