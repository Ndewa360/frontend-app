import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

// Models
import { AdminGeographyStateModel, AdminCountry, AdminCity, AdminCurrency, GeographyStats } from './admin-geography.model';

// Actions
import { AdminGeographyAction } from './admin-geography.actions';

// Services
import { AdminGeographyService } from '../../services/admin-geography.service';

@State<AdminGeographyStateModel>({
  name: 'adminGeography',
  defaults: {
    countries: [],
    cities: [],
    currencies: [],
    stats: null,
    filters: {
      page: 1,
      limit: 20,
      sortBy: 'name',
      sortOrder: 'asc'
    },
    pagination: {
      countries: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      },
      cities: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      }
    },
    loading: false,
    error: null,
    lastUpdated: null
  }
})
@Injectable()
export class AdminGeographyState {

  constructor(private adminGeographyService: AdminGeographyService) {}

  // Selectors
  @Selector()
  static selectCountries(state: AdminGeographyStateModel): AdminCountry[] {
    return state.countries;
  }

  @Selector()
  static selectCities(state: AdminGeographyStateModel): AdminCity[] {
    return state.cities;
  }

  @Selector()
  static selectCurrencies(state: AdminGeographyStateModel): AdminCurrency[] {
    return state.currencies;
  }

  @Selector()
  static selectStats(state: AdminGeographyStateModel): GeographyStats | null {
    return state.stats;
  }

  @Selector()
  static selectFilters(state: AdminGeographyStateModel) {
    return state.filters;
  }

  @Selector()
  static selectPagination(state: AdminGeographyStateModel) {
    return state.pagination;
  }

  @Selector()
  static selectIsLoading(state: AdminGeographyStateModel): boolean {
    return state.loading;
  }

  @Selector()
  static selectError(state: AdminGeographyStateModel): any {
    return state.error;
  }

  @Selector()
  static selectLastUpdated(state: AdminGeographyStateModel): Date | null {
    return state.lastUpdated;
  }

  // Actions

  @Action(AdminGeographyAction.LoadCountries)
  loadCountries(ctx: StateContext<AdminGeographyStateModel>, action: AdminGeographyAction.LoadCountries) {
    ctx.patchState({ loading: true, error: null });

    return this.adminGeographyService.getCountries(action.filters).pipe(
      tap(response => {
        console.log('🌍 Réponse backend countries:', response);
        console.log('🌍 Type de response:', typeof response);
        console.log('🌍 Clés de response:', Object.keys(response || {}));

        // Vérifier si response.countries existe
        if (response && response.countries) {
          console.log('✅ response.countries trouvé:', response.countries.length, 'pays');
          ctx.dispatch(new AdminGeographyAction.LoadCountriesSuccess(response.countries, response.total || response.countries.length));
        } else if (Array.isArray(response)) {
          console.log('✅ Response est un array direct:', response.length, 'pays');
          ctx.dispatch(new AdminGeographyAction.LoadCountriesSuccess(response, response.length));
        } else {
          console.log('❌ Structure de response inattendue:', response);
          ctx.dispatch(new AdminGeographyAction.LoadCountriesSuccess([], 0));
        }
      }),
      catchError(error => {
        console.error('❌ Erreur chargement countries:', error);
        ctx.dispatch(new AdminGeographyAction.LoadCountriesFailure(error));
        return throwError(error);
      })
    );
  }

  @Action(AdminGeographyAction.LoadCountriesSuccess)
  loadCountriesSuccess(ctx: StateContext<AdminGeographyStateModel>, action: AdminGeographyAction.LoadCountriesSuccess) {
    ctx.patchState({
      countries: action.countries,
      pagination: {
        ...ctx.getState().pagination,
        countries: {
          ...ctx.getState().pagination.countries,
          total: action.total
        }
      },
      loading: false,
      error: null,
      lastUpdated: new Date()
    });
  }

  @Action(AdminGeographyAction.LoadCountriesFailure)
  loadCountriesFailure(ctx: StateContext<AdminGeographyStateModel>, action: AdminGeographyAction.LoadCountriesFailure) {
    ctx.patchState({
      loading: false,
      error: action.error
    });
  }

  @Action(AdminGeographyAction.LoadCities)
  loadCities(ctx: StateContext<AdminGeographyStateModel>, action: AdminGeographyAction.LoadCities) {
    ctx.patchState({ loading: true, error: null });

    return this.adminGeographyService.getCities(action.filters).pipe(
      tap(response => {
        console.log('🏙️ Réponse backend cities:', response);
        console.log('🏙️ Type de response:', typeof response);
        console.log('🏙️ Clés de response:', Object.keys(response || {}));

        // Vérifier si response.cities existe
        if (response && response.cities) {
          console.log('✅ response.cities trouvé:', response.cities.length, 'villes');
          ctx.dispatch(new AdminGeographyAction.LoadCitiesSuccess(response.cities, response.total || response.cities.length));
        } else if (Array.isArray(response)) {
          console.log('✅ Response est un array direct:', response.length, 'villes');
          ctx.dispatch(new AdminGeographyAction.LoadCitiesSuccess(response, response.length));
        } else {
          console.log('❌ Structure de response inattendue:', response);
          ctx.dispatch(new AdminGeographyAction.LoadCitiesSuccess([], 0));
        }
      }),
      catchError(error => {
        console.error('❌ Erreur chargement cities:', error);
        ctx.dispatch(new AdminGeographyAction.LoadCitiesFailure(error));
        return throwError(error);
      })
    );
  }

  @Action(AdminGeographyAction.LoadCitiesSuccess)
  loadCitiesSuccess(ctx: StateContext<AdminGeographyStateModel>, action: AdminGeographyAction.LoadCitiesSuccess) {
    ctx.patchState({
      cities: action.cities,
      pagination: {
        ...ctx.getState().pagination,
        cities: {
          ...ctx.getState().pagination.cities,
          total: action.total
        }
      },
      loading: false,
      error: null,
      lastUpdated: new Date()
    });
  }

  @Action(AdminGeographyAction.LoadCitiesFailure)
  loadCitiesFailure(ctx: StateContext<AdminGeographyStateModel>, action: AdminGeographyAction.LoadCitiesFailure) {
    ctx.patchState({
      loading: false,
      error: action.error
    });
  }

  @Action(AdminGeographyAction.LoadCurrencies)
  loadCurrencies(ctx: StateContext<AdminGeographyStateModel>) {
    ctx.patchState({ loading: true, error: null });
    
    return this.adminGeographyService.getCurrencies().pipe(
      tap(currencies => {
        ctx.dispatch(new AdminGeographyAction.LoadCurrenciesSuccess(currencies));
      }),
      catchError(error => {
        ctx.dispatch(new AdminGeographyAction.LoadCurrenciesFailure(error));
        return throwError(error);
      })
    );
  }

  @Action(AdminGeographyAction.LoadCurrenciesSuccess)
  loadCurrenciesSuccess(ctx: StateContext<AdminGeographyStateModel>, action: AdminGeographyAction.LoadCurrenciesSuccess) {
    ctx.patchState({
      currencies: action.currencies,
      loading: false,
      error: null
    });
  }

  @Action(AdminGeographyAction.LoadCurrenciesFailure)
  loadCurrenciesFailure(ctx: StateContext<AdminGeographyStateModel>, action: AdminGeographyAction.LoadCurrenciesFailure) {
    ctx.patchState({
      loading: false,
      error: action.error
    });
  }

  @Action(AdminGeographyAction.LoadGeographyStats)
  loadGeographyStats(ctx: StateContext<AdminGeographyStateModel>) {
    ctx.patchState({ loading: true, error: null });
    
    return this.adminGeographyService.getGeographyStats().pipe(
      tap(stats => {
        ctx.dispatch(new AdminGeographyAction.LoadGeographyStatsSuccess(stats));
      }),
      catchError(error => {
        ctx.dispatch(new AdminGeographyAction.LoadGeographyStatsFailure(error));
        return throwError(error);
      })
    );
  }

  @Action(AdminGeographyAction.LoadGeographyStatsSuccess)
  loadGeographyStatsSuccess(ctx: StateContext<AdminGeographyStateModel>, action: AdminGeographyAction.LoadGeographyStatsSuccess) {
    ctx.patchState({
      stats: action.stats,
      loading: false,
      error: null
    });
  }

  @Action(AdminGeographyAction.LoadGeographyStatsFailure)
  loadGeographyStatsFailure(ctx: StateContext<AdminGeographyStateModel>, action: AdminGeographyAction.LoadGeographyStatsFailure) {
    ctx.patchState({
      loading: false,
      error: action.error
    });
  }

  @Action(AdminGeographyAction.SetLoading)
  setLoading(ctx: StateContext<AdminGeographyStateModel>, action: AdminGeographyAction.SetLoading) {
    ctx.patchState({ loading: action.loading });
  }

  @Action(AdminGeographyAction.ClearState)
  clearState(ctx: StateContext<AdminGeographyStateModel>) {
    ctx.patchState({
      countries: [],
      cities: [],
      currencies: [],
      stats: null,
      error: null,
      lastUpdated: null
    });
  }

  @Action(AdminGeographyAction.RefreshData)
  refreshData(ctx: StateContext<AdminGeographyStateModel>) {
    const state = ctx.getState();
    ctx.dispatch([
      new AdminGeographyAction.LoadCountries(state.filters),
      new AdminGeographyAction.LoadCities(state.filters),
      new AdminGeographyAction.LoadCurrencies(),
      new AdminGeographyAction.LoadGeographyStats()
    ]);
  }
}
