import { Injectable } from "@angular/core";
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { Store } from "@ngxs/store";
import { Observable, combineLatest, of } from "rxjs";
import { map, skipWhile, tap, catchError, switchMap, take } from "rxjs/operators";
import { 
    PropertyAction, 
    RoomAction, 
    LocataireAction, 
    LocationAction, 
    LocationPaymentAction,
    HistoryLocationPaymentAction,
    PropertyState
} from "../../store";

@Injectable({
    providedIn: "root"
})
export class PropertyDetailsResolver implements Resolve<any> {
    
    constructor(private _store: Store) {}

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
        const propertyId = route.paramMap.get('id');
        
        if (!propertyId) {
            console.error("❌ PropertyDetailsResolver: Aucun ID de propriété fourni");
            return of(false);
        }

        console.log(`🔄 PropertyDetailsResolver - Chargement des données pour la propriété ${propertyId}`);

        // Toujours forcer le chargement de la propriété (gère aussi les biens gérés)
        this._store.dispatch(new PropertyAction.FetchPropertyForced(propertyId));

        // Dispatcher toutes les actions nécessaires
        this._store.dispatch([
            new RoomAction.FetchRoomsByPropertyID(propertyId),
            new LocataireAction.FetchLocatairesByPropertyId(propertyId),
            new LocationAction.FetchLocationsByPropertyId(propertyId),
            new LocationPaymentAction.FetchLocationPaymentsByPropertyId(propertyId),
            new HistoryLocationPaymentAction.FetchHistoryLocationPaymentsByPropertyId(propertyId)
        ]);

        return combineLatest([
            this._store.select((state) => state.rooms.initLoadingState).pipe(
                skipWhile((state) => state === "LOADING"),
                tap(() => console.log("✅ Chambres chargées"))
            ),
            this._store.select((state) => state.locataires.initLoadingState).pipe(
                skipWhile((state) => state === "LOADING"),
                tap(() => console.log("✅ Locataires chargés"))
            ),
            this._store.select((state) => state.locations.initLoadingState).pipe(
                skipWhile((state) => state === "LOADING"),
                tap(() => console.log("✅ Locations chargées"))
            ),
            this._store.select((state) => state.locationPayments.initLoadingState).pipe(
                skipWhile((state) => state === "LOADING"),
                tap(() => console.log("✅ Paiements de location chargés"))
            ),
            this._store.select((state) => state.historyLocationPayments.initLoadingState).pipe(
                skipWhile((state) => state === "LOADING"),
                tap(() => console.log("✅ Historique des paiements chargé"))
            )
        ]).pipe(
            take(1),
            map(() => ({
                propertyId,
                dataLoaded: true,
                timestamp: new Date()
            })),
            catchError((error) => {
                console.error(`❌ Erreur lors du chargement des données de la propriété ${propertyId}:`, error);
                return of({ propertyId, dataLoaded: false, error: error.message, timestamp: new Date() });
            })
        );
    }
}
