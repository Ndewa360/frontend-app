import { Injectable } from "@angular/core";
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { Store } from "@ngxs/store";
import { Observable, combineLatest, of } from "rxjs";
import { map, skipWhile, catchError, switchMap, timeout } from "rxjs/operators";
import { PropertyAction, UserProfileAction, CountryAction, StatisticAction } from "../../store";

@Injectable({ providedIn: "root" })
export class InitialLoadingDataResolver implements Resolve<any> {

  constructor(private _store: Store) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
    return this._store.select((s) => s.ndewa360_auth_token.authToken).pipe(
      switchMap((token) => {
        if (!token) {
          this._store.dispatch([new CountryAction.FetchCountries()]);
          return of(true);
        }

        this._store.dispatch([
          new UserProfileAction.FetchUserProfile(),
          new PropertyAction.FetchProperties(),
          new CountryAction.FetchCountries(),
          new StatisticAction.FetchStatisticPaymentRecapitulationAccountOfAllPropertyByYear(new Date().getFullYear()),
        ]);

        return combineLatest([
          this._store.select((s) => s.userprofile.initLoadingState).pipe(
            skipWhile((s) => s !== "LOADED"),
            catchError(() => of("LOADED"))
          ),
          this._store.select((s) => s.properties.initLoadingState).pipe(
            skipWhile((s) => s !== "LOADED"),
            catchError(() => of("LOADED"))
          ),
          this._store.select((s) => s.countries.initLoadingState).pipe(
            skipWhile((s) => s !== "LOADED"),
            catchError(() => of("LOADED"))
          ),
          this._store.select((s) => s.statistics.paymentRecapitulationLoading).pipe(
            skipWhile((loading) => loading === true),
            catchError(() => of(false))
          ),
        ]).pipe(
          // timeout(10000),
          map(() => true),
          catchError(() => of(true))
        );
      }),
      catchError(() => of(false))
    );
  }
}
