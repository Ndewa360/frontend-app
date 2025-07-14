import { Injectable } from "@angular/core";
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { Store } from "@ngxs/store";
import { Observable, of } from "rxjs";
import { map, catchError } from "rxjs/operators";
import { CountryAction } from "../../store";

@Injectable({
    providedIn: "root"
})
export class PublicDataResolver implements Resolve<any> {

    /**
     * Constructor
     */
    constructor(private _store: Store) {}

    /**
     * Resolver pour les pages publiques (sans authentification)
     * Charge uniquement les données nécessaires pour les pages publiques
     *
     * @param route
     * @param state
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
        console.log("🌐 PublicDataResolver - Chargement des données publiques");

        try {
            // Charger uniquement les données publiques nécessaires
            this._store.dispatch([
                new CountryAction.FetchCountries(), // Pour les formulaires de recherche
            ]);

            console.log("✅ Données publiques chargées avec succès");
            return of(true);
        } catch (error) {
            console.error("❌ Erreur lors du chargement des données publiques:", error);
            // Ne pas bloquer même en cas d'erreur
            return of(true);
        }
    }
}
