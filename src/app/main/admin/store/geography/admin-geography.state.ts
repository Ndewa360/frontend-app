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

  // Sélecteurs spécifiques pour les opérations
  @Selector()
  static isLoading(state: AdminGeographyStateModel): boolean {
    return state.loading;
  }

  @Selector()
  static isDeleting(state: AdminGeographyStateModel): boolean {
    return state.loading; // On utilise le même état de loading pour la suppression
  }

  @Selector()
  static getError(state: AdminGeographyStateModel): any {
    return state.error;
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

  // === ACTIONS CRUD PAYS ===

  @Action(AdminGeographyAction.DeleteCountry)
  deleteCountry(ctx: StateContext<AdminGeographyStateModel>, action: AdminGeographyAction.DeleteCountry) {
    ctx.patchState({ loading: true, error: null });

    return this.adminGeographyService.deleteCountry(action.countryId).pipe(
      tap(() => {
        ctx.dispatch(new AdminGeographyAction.DeleteCountrySuccess(action.countryId));
      }),
      catchError(error => {
        ctx.dispatch(new AdminGeographyAction.DeleteCountryFailure(error));
        return throwError(error);
      })
    );
  }

  @Action(AdminGeographyAction.DeleteCountrySuccess)
  deleteCountrySuccess(ctx: StateContext<AdminGeographyStateModel>, action: AdminGeographyAction.DeleteCountrySuccess) {
    const state = ctx.getState();
    const updatedCountries = state.countries.filter(country => country._id !== action.countryId);

    ctx.patchState({
      countries: updatedCountries,
      loading: false,
      error: null,
      lastUpdated: new Date()
    });

    // Recharger les statistiques
    ctx.dispatch(new AdminGeographyAction.LoadGeographyStats());
  }

  @Action(AdminGeographyAction.DeleteCountryFailure)
  deleteCountryFailure(ctx: StateContext<AdminGeographyStateModel>, action: AdminGeographyAction.DeleteCountryFailure) {
    ctx.patchState({
      loading: false,
      error: action.error
    });
  }

  // === ACTIONS CRUD VILLES ===

  @Action(AdminGeographyAction.CreateCity)
  createCity(ctx: StateContext<AdminGeographyStateModel>, action: AdminGeographyAction.CreateCity) {
    ctx.patchState({ loading: true, error: null });

    return this.adminGeographyService.createCity(action.cityData).pipe(
      tap((city) => {
        ctx.dispatch(new AdminGeographyAction.CreateCitySuccess(city));
      }),
      catchError(error => {
        ctx.dispatch(new AdminGeographyAction.CreateCityFailure(error));
        return throwError(error);
      })
    );
  }

  @Action(AdminGeographyAction.CreateCitySuccess)
  createCitySuccess(ctx: StateContext<AdminGeographyStateModel>, action: AdminGeographyAction.CreateCitySuccess) {
    const state = ctx.getState();
    const updatedCities = [...state.cities, action.city];

    ctx.patchState({
      cities: updatedCities,
      loading: false,
      error: null,
      lastUpdated: new Date()
    });

    // Recharger les statistiques
    ctx.dispatch(new AdminGeographyAction.LoadGeographyStats());
  }

  @Action(AdminGeographyAction.CreateCityFailure)
  createCityFailure(ctx: StateContext<AdminGeographyStateModel>, action: AdminGeographyAction.CreateCityFailure) {
    ctx.patchState({
      loading: false,
      error: action.error
    });
  }

  // === ACTIONS MISE À JOUR VILLE ===

  @Action(AdminGeographyAction.UpdateCity)
  updateCity(ctx: StateContext<AdminGeographyStateModel>, action: AdminGeographyAction.UpdateCity) {
    ctx.patchState({ loading: true, error: null });

    return this.adminGeographyService.updateCity(action.cityId, action.cityData).pipe(
      tap((city) => {
        ctx.dispatch(new AdminGeographyAction.UpdateCitySuccess(city));
      }),
      catchError(error => {
        ctx.dispatch(new AdminGeographyAction.UpdateCityFailure(error));
        return throwError(error);
      })
    );
  }

  @Action(AdminGeographyAction.UpdateCitySuccess)
  updateCitySuccess(ctx: StateContext<AdminGeographyStateModel>, action: AdminGeographyAction.UpdateCitySuccess) {
    const state = ctx.getState();
    const updatedCities = state.cities.map(city =>
      city._id === action.city._id ? action.city : city
    );

    ctx.patchState({
      cities: updatedCities,
      loading: false,
      error: null,
      lastUpdated: new Date()
    });

    // Recharger les statistiques
    ctx.dispatch(new AdminGeographyAction.LoadGeographyStats());
  }

  @Action(AdminGeographyAction.UpdateCityFailure)
  updateCityFailure(ctx: StateContext<AdminGeographyStateModel>, action: AdminGeographyAction.UpdateCityFailure) {
    ctx.patchState({
      loading: false,
      error: action.error
    });
  }

  // === ACTIONS SUPPRESSION VILLE ===

  @Action(AdminGeographyAction.DeleteCity)
  deleteCity(ctx: StateContext<AdminGeographyStateModel>, action: AdminGeographyAction.DeleteCity) {
    ctx.patchState({ loading: true, error: null });

    return this.adminGeographyService.deleteCity(action.cityId).pipe(
      tap(() => {
        ctx.dispatch(new AdminGeographyAction.DeleteCitySuccess(action.cityId));
      }),
      catchError(error => {
        ctx.dispatch(new AdminGeographyAction.DeleteCityFailure(error));
        return throwError(error);
      })
    );
  }

  @Action(AdminGeographyAction.DeleteCitySuccess)
  deleteCitySuccess(ctx: StateContext<AdminGeographyStateModel>, action: AdminGeographyAction.DeleteCitySuccess) {
    const state = ctx.getState();
    const updatedCities = state.cities.filter(city => city._id !== action.cityId);

    ctx.patchState({
      cities: updatedCities,
      loading: false,
      error: null,
      lastUpdated: new Date()
    });

    // Recharger les statistiques
    ctx.dispatch(new AdminGeographyAction.LoadGeographyStats());
  }

  @Action(AdminGeographyAction.DeleteCityFailure)
  deleteCityFailure(ctx: StateContext<AdminGeographyStateModel>, action: AdminGeographyAction.DeleteCityFailure) {
    ctx.patchState({
      loading: false,
      error: action.error
    });
  }

  // === ACTIONS GEONAMES ===

  @Action(AdminGeographyAction.LoadCountryCitiesFromGeonames)
  loadCountryCitiesFromGeonames(ctx: StateContext<AdminGeographyStateModel>, action: AdminGeographyAction.LoadCountryCitiesFromGeonames) {
    ctx.patchState({ loading: true, error: null });

    return this.adminGeographyService.loadCountryCities(action.countryId).pipe(
      tap(result => {
        ctx.dispatch(new AdminGeographyAction.LoadCountryCitiesFromGeonamesSuccess(result));
      }),
      catchError(error => {
        ctx.dispatch(new AdminGeographyAction.LoadCountryCitiesFromGeonamesFailure(error));
        return throwError(error);
      })
    );
  }

  @Action(AdminGeographyAction.LoadCountryCitiesFromGeonamesSuccess)
  loadCountryCitiesFromGeonamesSuccess(ctx: StateContext<AdminGeographyStateModel>, action: AdminGeographyAction.LoadCountryCitiesFromGeonamesSuccess) {
    ctx.patchState({
      loading: false,
      error: null,
      lastUpdated: new Date()
    });

    // Recharger les villes et statistiques
    ctx.dispatch([
      new AdminGeographyAction.LoadCities(),
      new AdminGeographyAction.LoadGeographyStats()
    ]);
  }

  @Action(AdminGeographyAction.LoadCountryCitiesFromGeonamesFailure)
  loadCountryCitiesFromGeonamesFailure(ctx: StateContext<AdminGeographyStateModel>, action: AdminGeographyAction.LoadCountryCitiesFromGeonamesFailure) {
    ctx.patchState({
      loading: false,
      error: action.error
    });
  }

  @Action(AdminGeographyAction.ToggleCity)
  toggleCity(ctx: StateContext<AdminGeographyStateModel>, action: AdminGeographyAction.ToggleCity) {
    ctx.patchState({ loading: true, error: null });

    return this.adminGeographyService.toggleCity(action.cityId, action.isActive).pipe(
      tap(city => {
        ctx.dispatch(new AdminGeographyAction.ToggleCitySuccess(city));
      }),
      catchError(error => {
        ctx.dispatch(new AdminGeographyAction.ToggleCityFailure(error));
        return throwError(error);
      })
    );
  }

  @Action(AdminGeographyAction.ToggleCitySuccess)
  toggleCitySuccess(ctx: StateContext<AdminGeographyStateModel>, action: AdminGeographyAction.ToggleCitySuccess) {
    const state = ctx.getState();
    const updatedCities = state.cities.map(city =>
      city._id === action.city._id ? action.city : city
    );

    ctx.patchState({
      cities: updatedCities,
      loading: false,
      error: null,
      lastUpdated: new Date()
    });
  }

  @Action(AdminGeographyAction.ToggleCityFailure)
  toggleCityFailure(ctx: StateContext<AdminGeographyStateModel>, action: AdminGeographyAction.ToggleCityFailure) {
    ctx.patchState({
      loading: false,
      error: action.error
    });
  }
}
