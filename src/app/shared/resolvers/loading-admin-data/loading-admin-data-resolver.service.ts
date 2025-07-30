import { Injectable } from "@angular/core";
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { Store } from "@ngxs/store";
import { combineLatest, Observable, of, skipWhile, map, catchError, timeout} from "rxjs";
import { CountryAction, UserAction, UserProfileAction } from "../../store";


@Injectable({
    providedIn:"root"
})
export class LoadingAdminDataResolver implements Resolve<any>
{
    
    /**
     * Constructor
     */
    constructor(private _store:Store){}

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Use this resolver to resolve initial mock-api for the application
     *
     * @param route
     * @param state
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any>
    {
        // Charger les données nécessaires pour l'administration
        return combineLatest([
            this._store.dispatch([
                new UserAction.FetchAllUsers(),
                new CountryAction.FetchCountries(),
                new UserProfileAction.FetchUserProfile()
            ]),
            // Vérifier que les données sont chargées avec timeout et gestion d'erreur
            this._store.select((state) => state.userlist?.initLoadingState || 'LOADED')
              .pipe(
                skipWhile((initLoadingState) => initLoadingState !== "LOADED"),
                timeout(10000), // Timeout de 10 secondes
                catchError(() => of('LOADED')) // En cas d'erreur, continuer
              )
        ]).pipe(
            map(() => true),
            catchError((error) => {
                console.warn('LoadingAdminDataResolver error:', error);
                return of(true); // Continuer même en cas d'erreur
            })
        );
    }
}
