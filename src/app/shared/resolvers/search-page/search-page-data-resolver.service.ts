import { Injectable } from "@angular/core";
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { Store } from "@ngxs/store";
import { Observable, of } from "rxjs";
import { CountryAction, CityAction } from "../../store";


@Injectable({
    providedIn:"root"
})
export class SearchPageDataResolver implements Resolve<any>
{
    constructor(private _store: Store) {}

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any>
    {
        // Charger pays ET villes avant d'afficher la page de recherche
        this._store.dispatch([
            new CountryAction.FetchCountries(),
            new CityAction.LoadAllCities()
        ]);

        return of(true);
    }
}
