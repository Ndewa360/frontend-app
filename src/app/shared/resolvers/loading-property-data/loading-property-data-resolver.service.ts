import { Injectable } from "@angular/core";
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { Store } from "@ngxs/store";
import { Observable, combineLatest, of } from "rxjs";
import { map, skipWhile, tap, catchError, take } from "rxjs/operators";
import { LocataireAction, LocationAction, LocationPaymentAction, RoomAction, StatisticAction } from "../../store";
import { HistoryLocationPaymentAction } from "../../store/history-payment-location";

@Injectable({
    providedIn: "root"
})
export class LoadingPropertyDataResolver implements Resolve<any> {

    /**
     * Constructor
     */
    constructor(private _store: Store) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Charge toutes les données nécessaires pour une propriété spécifique
     * Inclut : locataires, chambres, locations, paiements, historique et statistiques
     *
     * @param route
     * @param state
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
        const propertyId: string = route.paramMap.get("id");

        if (!propertyId) {
            console.error("❌ LoadingPropertyDataReso Revenus Totaux 2025lver: Aucun ID de propriété fourni");
            return of(false);
        }

        console.log(`🔄 LoadingPropertyDataResolver - Chargement des données pour la propriété ${propertyId}`);

        const currentYear = new Date().getFullYear();

        // Dispatcher toutes les actions nécessaires, y compris les données financières
        this._store.dispatch([
            new LocataireAction.FetchLocatairesByPropertyId(propertyId),
            new RoomAction.FetchRoomsByPropertyID(propertyId),
            new LocationAction.FetchLocationsByPropertyId(propertyId),
            new LocationPaymentAction.FetchLocationPaymentsByPropertyId(propertyId),
            new HistoryLocationPaymentAction.FetchHistoryLocationPaymentsByPropertyId(propertyId),

            // Données financières pour l'année courante
            new StatisticAction.FetchStaticRoomDataByPropertyIdAndYear(propertyId, currentYear.toString()),
            new StatisticAction.FetchStaticLocataireDataByPropertyIdAndYear(propertyId, currentYear),
            new StatisticAction.FetchStaticAllPaymentLocataireDataByPropertyIdAndYear(propertyId, currentYear),
            new StatisticAction.FetchStatisticPaymentRecapitulationAccountOfAllPropertyByYear(currentYear),
        ]);

        // Attendre que toutes les données critiques soient chargées, y compris les données financières
        return combineLatest([
            this._store.select((state) => state.locataires.initLoadingState).pipe(
                skipWhile((state) => state === "LOADING"),
                tap(() => console.log("✅ Locataires chargés"))
            ),
            this._store.select((state) => state.rooms.initLoadingState).pipe(
                skipWhile((state) => state === "LOADING"),
                tap(() => console.log("✅ Chambres chargées"))
            ),
            this._store.select((state) => state.locations.initLoadingState).pipe(
                skipWhile((state) => state === "LOADING"),
                tap(() => console.log("✅ Locations chargées"))
            ),
            this._store.select((state) => state.locationPayments.initLoadingState).pipe(
                skipWhile((state) => state === "LOADING"),
                tap(() => console.log("✅ Paiements chargés"))
            ),
            this._store.select((state) => state.historyLocationPayments.initLoadingState).pipe(
                skipWhile((state) => state === "LOADING"),
                tap(() => console.log("✅ Historique des paiements chargé"))
            ),
            // Données financières
            this._store.select((state) => state.statisticData.loadingRoomStatistic).pipe(
                skipWhile((loading) => loading === true),
                tap(() => console.log("✅ Statistiques des chambres chargées"))
            ),
            this._store.select((state) => state.statisticData.locataireStatisticLoading).pipe(
                skipWhile((loading) => loading === true),
                tap(() => console.log("✅ Statistiques des locataires chargées"))
            ),
            this._store.select((state) => state.statisticData.allLocatairePayementByYearLoading).pipe(
                skipWhile((loading) => loading === true),
                tap(() => console.log("✅ Statistiques des paiements chargées"))
            ),
            this._store.select((state) => state.statisticData.loadingStatisticRecaptilationLoading).pipe(
                skipWhile((loading) => loading === true),
                tap(() => console.log("✅ Récapitulatif des paiements chargé"))
            )
        ]).pipe(
            take(1),
            map(() => {
                console.log(`🎉 Toutes les données de la propriété ${propertyId} sont chargées`);
                return {
                    propertyId,
                    dataLoaded: true,
                    timestamp: new Date()
                };
            }),
            catchError((error) => {
                console.error(`❌ Erreur lors du chargement des données de la propriété ${propertyId}:`, error);
                return of({
                    propertyId,
                    dataLoaded: false,
                    error: error.message,
                    timestamp: new Date()
                });
            })
        );
    }
}
