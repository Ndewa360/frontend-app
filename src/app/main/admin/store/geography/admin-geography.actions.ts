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
}
