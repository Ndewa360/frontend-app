import { Injectable } from "@angular/core";
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { Store } from "@ngxs/store";
import { Observable, combineLatest, of } from "rxjs";
import { map, skipWhile, tap, catchError, switchMap, timeout } from "rxjs/operators";
import { PropertyAction, RoomAction, UserProfileAction, CountryAction, StatisticAction } from "../../store";

@Injectable({
    providedIn: "root"
})
export class InitialLoadingDataResolver implements Resolve<any> {

    /**
     * Constructor
     */
    constructor(private _store: Store) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Use this resolver to resolve initial data for the application
     * Charge les données essentielles de base pour toute l'application
     *
     * @param route
     * @param state
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
        console.log("🔄 InitialLoadingDataResolver - Début du chargement des données initiales");
        console.log("📍 Route cible:", state.url);
        console.log("📊 Paramètres de route:", route.params);
        console.log("🕐 Timestamp:", new Date().toISOString());

        return this._store.select((state) => state.ndewa360_auth_token.authToken)
            .pipe(
                switchMap((token) => {
                    if (!token) {
                        console.log("❌ Pas de token d'authentification - chargement minimal");
                        // Charger uniquement les données publiques de base
                        this._store.dispatch([
                            new CountryAction.FetchCountries(),
                        ]);
                        return of(true);
                    }

                    console.log("✅ Token trouvé, chargement des données de base...");

                    // Dispatcher les actions de base
                    this._store.dispatch([
                        new UserProfileAction.FetchUserProfile(),
                        new PropertyAction.FetchProperties(),
                        new CountryAction.FetchCountries(),
                        new StatisticAction.FetchStatisticPaymentRecapitulationAccountOfAllPropertyByYear(new Date().getFullYear()),
                    ]);

                    // Attendre que toutes les données de base soient chargées avec timeout
                    return combineLatest([
                        this._store.select((state) => state.userprofile.initLoadingState).pipe(
                            skipWhile((state) => state !== "LOADED"),
                            tap(() => console.log("✅ Profil utilisateur chargé")),
                            catchError(() => {
                                console.warn("⚠️ Timeout profil utilisateur - continuation");
                                return of("LOADED");
                            })
                        ),
                        this._store.select((state) => state.properties.initLoadingState).pipe(
                            skipWhile((state) => state !== "LOADED"),
                            tap(() => console.log("✅ Propriétés chargées")),
                            catchError(() => {
                                console.warn("⚠️ Timeout propriétés - continuation");
                                return of("LOADED");
                            })
                        ),
                        this._store.select((state) => state.countries.initLoadingState).pipe(
                            skipWhile((state) => state !== "LOADED"),
                            tap(() => console.log("✅ Pays chargés")),
                            catchError(() => {
                                console.warn("⚠️ Timeout pays - continuation");
                                return of("LOADED");
                            })
                        ),
                        this._store.select((state) => state.statistics.paymentRecapitulationLoading).pipe(
                            skipWhile((loading) => loading === true),
                            tap(() => console.log("✅ Statistiques chargées")),
                            catchError(() => {
                                console.warn("⚠️ Timeout statistiques - continuation");
                                return of(false);
                            })
                        )
                    ]).pipe(
                        // Ajouter un timeout global de 10 secondes
                        timeout(10000),
                        map(() => {
                            console.log("🎉 Toutes les données initiales sont chargées");
                            return true;
                        }),
                        catchError((error) => {
                            if (error.name === 'TimeoutError') {
                                console.warn("⏰ Timeout du resolver après 10 secondes - continuation forcée");
                            } else {
                                console.error("❌ Erreur lors du chargement des données initiales:", error);
                            }
                            console.log("🔄 Continuation malgré l'erreur pour éviter le blocage");
                            return of(true); // Continuer malgré l'erreur
                        })
                    );
                }),
                catchError((error) => {
                    console.error("❌ Erreur dans InitialLoadingDataResolver:", error);
                    return of(false);
                })
            );
    }
}
