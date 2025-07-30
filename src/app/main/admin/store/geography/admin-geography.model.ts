export interface AdminCountry {
  _id: string;
  name: string;
  code: string;
  flag?: string;
  currency: string;
  timezone: string;
  isActive: boolean;
  cityCount: number;
  userCount: number;
  propertyCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminCity {
  _id: string;
  name: string;
  country: AdminCountry;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  timezone?: string;
  isActive: boolean;
  userCount: number;
  propertyCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminCurrency {
  _id: string;
  name: string;
  code: string;
  symbol: string;
  rate: number;
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeographyStats {
  countries: {
    total: number;
    active: number;
    inactive: number;
    withUsers: number;
    withProperties: number;
    topByUsers: CountryUsage[];
    topByProperties: CountryUsage[];
  };
  cities: {
    total: number;
    active: number;
    inactive: number;
    withUsers: number;
    withProperties: number;
    topByUsers: CityUsage[];
    topByProperties: CityUsage[];
  };
  currencies: {
    total: number;
    active: number;
    inactive: number;
    defaultCurrency: string;
  };
  distribution: {
    usersByCountry: DistributionData[];
    propertiesByCountry: DistributionData[];
    usersByCity: DistributionData[];
    propertiesByCity: DistributionData[];
  };
}

export interface CountryUsage {
  countryId: string;
  countryName: string;
  countryCode: string;
  count: number;
  percentage: number;
}

export interface CityUsage {
  cityId: string;
  cityName: string;
  countryName: string;
  count: number;
  percentage: number;
}

export interface DistributionData {
  name: string;
  value: number;
  percentage: number;
  color?: string;
}

export interface CreateCountryDto {
  name: string;
  code: string;
  flag?: string;
  currency: string;
  timezone: string;
  isActive?: boolean;
}

export interface UpdateCountryDto {
  name?: string;
  code?: string;
  flag?: string;
  currency?: string;
  timezone?: string;
  isActive?: boolean;
}

export interface CreateCityDto {
  name: string;
  countryId: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  timezone?: string;
  isActive?: boolean;
}

export interface UpdateCityDto {
  name?: string;
  countryId?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  timezone?: string;
  isActive?: boolean;
}

export interface GeographyFilters {
  search?: string;
  countryId?: string;
  isActive?: boolean;
  hasUsers?: boolean;
  hasProperties?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AdminGeographyStateModel {
  countries: AdminCountry[];
  cities: AdminCity[];
  currencies: AdminCurrency[];
  stats: GeographyStats | null;
  filters: GeographyFilters;
  pagination: {
    countries: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    cities: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  loading: boolean;
  error: any;
  lastUpdated: Date | null;
}
