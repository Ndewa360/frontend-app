import { Injectable } from "@angular/core";
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { Store } from "@ngxs/store";
import { Observable, of } from "rxjs";
import { CountryAction } from "../../store";

@Injectable({ providedIn: "root" })
export class PublicDataResolver implements Resolve<any> {

    constructor(private _store: Store) {}

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
        try {
            this._store.dispatch([new CountryAction.FetchCountries()]);
            return of(true);
        } catch (error) {
            return of(true);
        }
    }
}
