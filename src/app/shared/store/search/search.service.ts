import { Injectable } from "@angular/core";
import { SearchPropertyModel } from "./search.model";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { ApiResultFormat } from "../global";
import { environment } from "src/environments/environment";

export interface AdvancedSearchFilters {
    city?: string;
    district?: string;
    propertyType?: string;
    priceMin?: number;
    priceMax?: number;
    roomType?: string;
    // minArea est le nom du formulaire, envoyé tel quel au backend
    minArea?: number;
    totalSurfaceMin?: number;
    totalSurfaceMax?: number;

    // Spécificités de la chambre (RoomSpecificity)
    hasKitchen?: boolean;
    isInternalKitchen?: boolean;
    isInternalShower?: boolean;
    numberOfBathroom?: string | number;
    numberOfShower?: string | number;
    numberOfLivingRoom?: string | number;

    // Équipements de la propriété
    hasPrivateShower?: boolean;
    hasParking?: boolean;
    hasClosure?: boolean;
    hasElevator?: boolean;
    hasGarden?: boolean;
    hasPool?: boolean;
    hasGym?: boolean;
    hasSecurity?: boolean;
    hasGenerator?: boolean;
    hasWater?: boolean;
    hasInternet?: boolean;
    condition?: 'NEW' | 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
    // furnished (boolean du formulaire) ET furnishingStatus (string enum) — les deux supportés
    furnished?: boolean;
    furnishingStatus?: 'FURNISHED' | 'SEMI_FURNISHED' | 'UNFURNISHED';
    buildingYearMin?: number;
    buildingYearMax?: number;

    // Pagination et tri
    page?: number;
    limit?: number;
    sortBy?: 'price' | 'createdAt' | 'area' | 'totalSurface' | 'buildingYear';
    sortOrder?: 'asc' | 'desc';
}

export interface PaginatedSearchResponse {
    data: SearchPropertyModel[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    filters?: AdvancedSearchFilters;
}

@Injectable({
    providedIn: 'root'
})
export class SearchService {
    constructor(private _httpClient: HttpClient) {}

    getSearch(city: string, page: number = 1, pageSize: number = 10000): Observable<ApiResultFormat<PaginatedSearchResponse>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('limit', pageSize.toString());
        return this._httpClient.get<ApiResultFormat<PaginatedSearchResponse>>(
            `${environment.apiUrl}/search/by-city/${city}`,
            { params }
        );
    }

    advancedSearch(filters: AdvancedSearchFilters): Observable<ApiResultFormat<PaginatedSearchResponse>> {
        let params = new HttpParams();

        Object.keys(filters).forEach(key => {
            const value = (filters as any)[key];
            if (value === undefined || value === null) return;

            if (typeof value === 'boolean') {
                // Envoyer seulement si true — false = pas de restriction
                if (value === true) params = params.set(key, 'true');
            } else if (typeof value === 'number') {
                if (key === 'priceMin' && value > 0) {
                    params = params.set(key, value.toString());
                } else if (key === 'priceMax' && value > 0) {
                    params = params.set(key, value.toString());
                } else if (key === 'minArea' && value > 0) {
                    params = params.set(key, value.toString());
                } else if (key !== 'priceMin' && key !== 'priceMax' && key !== 'minArea') {
                    params = params.set(key, value.toString());
                }
            } else if (typeof value === 'string' && value !== '') {
                params = params.set(key, value);
            }
        });

        return this._httpClient.get<ApiResultFormat<PaginatedSearchResponse>>(
            `${environment.apiUrl}/search/advanced`,
            { params }
        );
    }

    getSearchByIdRoom(idRoom: string): Observable<ApiResultFormat<SearchPropertyModel>> {
        return this._httpClient.get<ApiResultFormat<SearchPropertyModel>>(
            `${environment.apiUrl}/search/by-idroom/${idRoom}`
        );
    }

    getSearchStats(city?: string): Observable<ApiResultFormat<any>> {
        let params = new HttpParams();
        if (city) params = params.set('city', city);
        return this._httpClient.get<ApiResultFormat<any>>(`${environment.apiUrl}/search/stats`, { params });
    }

    getPopularSearches(limit?: number): Observable<ApiResultFormat<any>> {
        let params = new HttpParams();
        if (limit) params = params.set('limit', limit.toString());
        return this._httpClient.get<ApiResultFormat<any>>(`${environment.apiUrl}/search-stats/popular`, { params });
    }

    getPopularSearchesByCity(cityId: string, limit?: number): Observable<ApiResultFormat<any>> {
        let params = new HttpParams().set('cityId', cityId);
        if (limit) params = params.set('limit', limit.toString());
        return this._httpClient.get<ApiResultFormat<any>>(`${environment.apiUrl}/search-stats/popular-by-city`, { params });
    }

    getTopSearchedCities(limit?: number): Observable<ApiResultFormat<any>> {
        let params = new HttpParams();
        if (limit) params = params.set('limit', limit.toString());
        return this._httpClient.get<ApiResultFormat<any>>(`${environment.apiUrl}/search-stats/top-cities`, { params });
    }
}
