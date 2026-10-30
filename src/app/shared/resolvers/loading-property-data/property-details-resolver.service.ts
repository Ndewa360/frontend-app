import { Injectable } from "@angular/core";
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { Store } from "@ngxs/store";
import { Observable, of } from "rxjs";
import { map, catchError } from "rxjs/operators";
import { PropertyDetailsAction } from "../../store";

@Injectable({
    providedIn: "root"
})
export class PropertyDetailsResolver implements Resolve<any> {

    constructor(private _store: Store) {}

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
        const propertyId = route.paramMap.get('id');

        if (!propertyId) {
            return of(false);
        }

        // Une seule requête (GET /property/:id/details) remplit les états du
        // bien, des unités, des locataires, des baux, des paiements et de
        // l'historique ; toujours rechargée pour afficher des données à jour.
        return this._store.dispatch(new PropertyDetailsAction.Fetch(propertyId)).pipe(
            map(() => ({
                propertyId,
                dataLoaded: true,
                timestamp: new Date()
            })),
            catchError((error) => {
                return of({ propertyId, dataLoaded: false, error: error.message, timestamp: new Date() });
            })
        );
    }
}
