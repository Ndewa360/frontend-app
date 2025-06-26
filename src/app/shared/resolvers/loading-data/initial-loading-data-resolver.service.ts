import { Injectable } from "@angular/core";
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { Store } from "@ngxs/store";
import { Observable, combineLatest, of } from "rxjs";
import { map, skipWhile, tap, catchError, switchMap } from "rxjs/operators";
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

        return this._store.select((state) => state.ndewa360_auth_token.authToken)
            .pipe(
                skipWhile((token) => token == null || token == undefined),
                switchMap((token) => {
                    if (!token) {
                        console.log("❌ Pas de token d'authentification");
                        return of(false);
                    }

                    console.log("✅ Token trouvé, chargement des données de base...");

                    // Dispatcher les actions de base
                    this._store.dispatch([
                        new UserProfileAction.FetchUserProfile(),
                        new PropertyAction.FetchProperties(),
                        new CountryAction.FetchCountries(),
                        new StatisticAction.FetchStatisticPaymentRecapitulationAccountOfAllPropertyByYear(new Date().getFullYear()),
                    ]);

                    // Attendre que toutes les données de base soient chargées
                    return combineLatest([
                        this._store.select((state) => state.userprofile.initLoadingState).pipe(
                            skipWhile((state) => state !== "LOADED"),
                            tap(() => console.log("✅ Profil utilisateur chargé"))
                        ),
                        this._store.select((state) => state.properties.initLoadingState).pipe(
                            skipWhile((state) => state !== "LOADED"),
                            tap(() => console.log("✅ Propriétés chargées"))
                        ),
                        this._store.select((state) => state.countries.initLoadingState).pipe(
                            skipWhile((state) => state !== "LOADED"),
                            tap(() => console.log("✅ Pays chargés"))
                        ),
                        this._store.select((state) => state.statistics.paymentRecapitulationLoading).pipe(
                            skipWhile((loading) => loading === true),
                            tap(() => console.log("✅ Statistiques chargées"))
                        )
                    ]).pipe(
                        map(() => {
                            console.log("🎉 Toutes les données initiales sont chargées");
                            return true;
                        }),
                        catchError((error) => {
                            console.error("❌ Erreur lors du chargement des données initiales:", error);
                            return of(false);
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
