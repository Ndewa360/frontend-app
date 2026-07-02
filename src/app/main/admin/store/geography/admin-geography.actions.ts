export namespace AdminGeographyAction {
  
  // Countries
  export class LoadCountries {
    static readonly type = '[Admin Geography] Load Countries';
    constructor(public filters?: any) {}
  }

  export class LoadCountriesSuccess {
    static readonly type = '[Admin Geography] Load Countries Success';
    constructor(public countries: any[], public total: number) {}
  }

  export class LoadCountriesFailure {
    static readonly type = '[Admin Geography] Load Countries Failure';
    constructor(public error: any) {}
  }

  export class CreateCountry {
    static readonly type = '[Admin Geography] Create Country';
    constructor(public countryData: any) {}
  }

  export class CreateCountrySuccess {
    static readonly type = '[Admin Geography] Create Country Success';
    constructor(public country: any) {}
  }

  export class CreateCountryFailure {
    static readonly type = '[Admin Geography] Create Country Failure';
    constructor(public error: any) {}
  }

  export class UpdateCountry {
    static readonly type = '[Admin Geography] Update Country';
    constructor(public countryId: string, public countryData: any) {}
  }

  export class UpdateCountrySuccess {
    static readonly type = '[Admin Geography] Update Country Success';
    constructor(public country: any) {}
  }

  export class UpdateCountryFailure {
    static readonly type = '[Admin Geography] Update Country Failure';
    constructor(public error: any) {}
  }

  export class DeleteCountry {
    static readonly type = '[Admin Geography] Delete Country';
    constructor(public countryId: string) {}
  }

  export class DeleteCountrySuccess {
    static readonly type = '[Admin Geography] Delete Country Success';
    constructor(public countryId: string) {}
  }

  export class DeleteCountryFailure {
    static readonly type = '[Admin Geography] Delete Country Failure';
    constructor(public error: any) {}
  }

  // Cities
  export class LoadCities {
    static readonly type = '[Admin Geography] Load Cities';
    constructor(public filters?: any) {}
  }

  export class LoadCitiesSuccess {
    static readonly type = '[Admin Geography] Load Cities Success';
    constructor(public cities: any[], public total: number) {}
  }

  export class LoadCitiesFailure {
    static readonly type = '[Admin Geography] Load Cities Failure';
    constructor(public error: any) {}
  }

  export class CreateCity {
    static readonly type = '[Admin Geography] Create City';
    constructor(public cityData: any) {}
  }

  export class CreateCitySuccess {
    static readonly type = '[Admin Geography] Create City Success';
    constructor(public city: any) {}
  }

  export class CreateCityFailure {
    static readonly type = '[Admin Geography] Create City Failure';
    constructor(public error: any) {}
  }

  export class UpdateCity {
    static readonly type = '[Admin Geography] Update City';
    constructor(public cityId: string, public cityData: any) {}
  }

  export class UpdateCitySuccess {
    static readonly type = '[Admin Geography] Update City Success';
    constructor(public city: any) {}
  }

  export class UpdateCityFailure {
    static readonly type = '[Admin Geography] Update City Failure';
    constructor(public error: any) {}
  }

  export class DeleteCity {
    static readonly type = '[Admin Geography] Delete City';
    constructor(public cityId: string) {}
  }

  export class DeleteCitySuccess {
    static readonly type = '[Admin Geography] Delete City Success';
    constructor(public cityId: string) {}
  }

  export class DeleteCityFailure {
    static readonly type = '[Admin Geography] Delete City Failure';
    constructor(public error: any) {}
  }

  // Currencies
  export class LoadCurrencies {
    static readonly type = '[Admin Geography] Load Currencies';
  }

  export class LoadCurrenciesSuccess {
    static readonly type = '[Admin Geography] Load Currencies Success';
    constructor(public currencies: any[]) {}
  }

  export class LoadCurrenciesFailure {
    static readonly type = '[Admin Geography] Load Currencies Failure';
    constructor(public error: any) {}
  }

  export class CreateCurrency {
    static readonly type = '[Admin Geography] Create Currency';
    constructor(public currencyData: any) {}
  }

  export class CreateCurrencySuccess {
    static readonly type = '[Admin Geography] Create Currency Success';
    constructor(public currency: any) {}
  }

  export class CreateCurrencyFailure {
    static readonly type = '[Admin Geography] Create Currency Failure';
    constructor(public error: any) {}
  }

  export class UpdateCurrency {
    static readonly type = '[Admin Geography] Update Currency';
    constructor(public currencyId: string, public currencyData: any) {}
  }

  export class UpdateCurrencySuccess {
    static readonly type = '[Admin Geography] Update Currency Success';
    constructor(public currency: any) {}
  }

  export class UpdateCurrencyFailure {
    static readonly type = '[Admin Geography] Update Currency Failure';
    constructor(public error: any) {}
  }

  export class DeleteCurrency {
    static readonly type = '[Admin Geography] Delete Currency';
    constructor(public currencyId: string) {}
  }

  export class DeleteCurrencySuccess {
    static readonly type = '[Admin Geography] Delete Currency Success';
    constructor(public currencyId: string) {}
  }

  export class DeleteCurrencyFailure {
    static readonly type = '[Admin Geography] Delete Currency Failure';
    constructor(public error: any) {}
  }

  export class SetDefaultCurrency {
    static readonly type = '[Admin Geography] Set Default Currency';
    constructor(public currencyId: string) {}
  }

  export class SetDefaultCurrencySuccess {
    static readonly type = '[Admin Geography] Set Default Currency Success';
    constructor(public currency: any) {}
  }

  export class SetDefaultCurrencyFailure {
    static readonly type = '[Admin Geography] Set Default Currency Failure';
    constructor(public error: any) {}
  }

  // Stats
  export class LoadGeographyStats {
    static readonly type = '[Admin Geography] Load Geography Stats';
  }

  export class LoadGeographyStatsSuccess {
    static readonly type = '[Admin Geography] Load Geography Stats Success';
    constructor(public stats: any) {}
  }

  export class LoadGeographyStatsFailure {
    static readonly type = '[Admin Geography] Load Geography Stats Failure';
    constructor(public error: any) {}
  }

  // Set Loading
  export class SetLoading {
    static readonly type = '[Admin Geography] Set Loading';
    constructor(public loading: boolean) {}
  }

  // Clear State
  export class ClearState {
    static readonly type = '[Admin Geography] Clear State';
  }

  // Refresh Data
  export class RefreshData {
    static readonly type = '[Admin Geography] Refresh Data';
  }

  // === ACTIONS GEONAMES ===

  // Load Country Cities from GeoNames
  export class LoadCountryCitiesFromGeonames {
    static readonly type = '[Admin Geography] Load Country Cities From GeoNames';
    constructor(public countryId: string) {}
  }

  export class LoadCountryCitiesFromGeonamesSuccess {
    static readonly type = '[Admin Geography] Load Country Cities From GeoNames Success';
    constructor(public result: any) {}
  }

  export class LoadCountryCitiesFromGeonamesFailure {
    static readonly type = '[Admin Geography] Load Country Cities From GeoNames Failure';
    constructor(public error: any) {}
  }

  // Get Cities from GeoNames
  export class GetCitiesFromGeonames {
    static readonly type = '[Admin Geography] Get Cities From GeoNames';
    constructor(public countryCode: string, public maxRows?: number) {}
  }

  export class GetCitiesFromGeonamesSuccess {
    static readonly type = '[Admin Geography] Get Cities From GeoNames Success';
    constructor(public cities: any[]) {}
  }

  export class GetCitiesFromGeonamesFailure {
    static readonly type = '[Admin Geography] Get Cities From GeoNames Failure';
    constructor(public error: any) {}
  }

  // Search Cities from GeoNames
  export class SearchCitiesFromGeonames {
    static readonly type = '[Admin Geography] Search Cities From GeoNames';
    constructor(public name: string, public country?: string, public maxRows?: number) {}
  }

  export class SearchCitiesFromGeonamesSuccess {
    static readonly type = '[Admin Geography] Search Cities From GeoNames Success';
    constructor(public cities: any[]) {}
  }

  export class SearchCitiesFromGeonamesFailure {
    static readonly type = '[Admin Geography] Search Cities From GeoNames Failure';
    constructor(public error: any) {}
  }

  // Toggle City Status
  export class ToggleCity {
    static readonly type = '[Admin Geography] Toggle City';
    constructor(public cityId: string, public isActive: boolean) {}
  }

  export class ToggleCitySuccess {
    static readonly type = '[Admin Geography] Toggle City Success';
    constructor(public city: any) {}
  }

  export class ToggleCityFailure {
    static readonly type = '[Admin Geography] Toggle City Failure';
    constructor(public error: any) {}
  }
}
