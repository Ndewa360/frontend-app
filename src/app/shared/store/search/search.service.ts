import { Injectable } from "@angular/core";
import { SearchPropertyModel } from "./search.model";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable, combineLatest, of, } from "rxjs";
import { ApiResultFormat } from "../global";
import { switchMap } from "rxjs/operators";
import { environment } from "src/environments/environment";

// Interface pour les filtres de recherche avancée
export interface AdvancedSearchFilters {
    city?: string;
    district?: string;
    propertyType?: string;
    priceMin?: number;
    priceMax?: number;
    roomType?: string;
    minArea?: number;

    // Spécificités de la chambre (RoomSpecificity)
    hasKitchen?: boolean;
    isInternalKitchen?: boolean;
    isInternalShower?: boolean;
    numberOfBathroom?: string;
    numberOfShower?: string;
    numberOfLivingRoom?: string;

    // Équipements de la propriété existants
    hasPrivateShower?: boolean; // Gardé pour compatibilité
    hasParking?: boolean;
    hasClosure?: boolean;

    // Nouveaux équipements de propriété
    hasElevator?: boolean;
    hasGarden?: boolean;
    hasPool?: boolean;
    hasGym?: boolean;
    hasSecurity?: boolean;
    hasGenerator?: boolean;
    hasWater?: boolean;
    hasInternet?: boolean;
    condition?: 'NEW' | 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
    furnishingStatus?: 'FURNISHED' | 'SEMI_FURNISHED' | 'UNFURNISHED';
    buildingYearMin?: number;
    buildingYearMax?: number;
    totalSurfaceMin?: number;
    totalSurfaceMax?: number;

    // Pagination et tri
    page?: number;
    limit?: number;
    sortBy?: 'price' | 'createdAt' | 'area' | 'totalSurface' | 'buildingYear';
    sortOrder?: 'asc' | 'desc';
}

// Interface pour la réponse paginée
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
    providedIn:'root'
})
export class SearchService
{
    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient
    )
    {}
   

    /**
     * Recherche simple par ville avec pagination
     */
    getSearch(city:string, page:number = 1, pageSize:number = 12):Observable<ApiResultFormat<PaginatedSearchResponse>>
    {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('limit', pageSize.toString());
        return this._httpClient.get<ApiResultFormat<PaginatedSearchResponse>>(
            `${environment.apiUrl}/search/by-city/${city}`,
            { params }
        );
    }

    /**
     * Recherche avancée avec filtres multiples
     */
    advancedSearch(filters: AdvancedSearchFilters): Observable<ApiResultFormat<PaginatedSearchResponse>>
    {
        let params = new HttpParams();

        // Ajouter tous les filtres non vides aux paramètres
        Object.keys(filters).forEach(key => {
            const value = filters[key as keyof AdvancedSearchFilters];
            if (value !== undefined && value !== null && value !== '') {
                params = params.set(key, value.toString());
            }
        });

        return this._httpClient.get<ApiResultFormat<PaginatedSearchResponse>>(
            `${environment.apiUrl}/search/advanced`,
            { params }
        );
    }

    /**
     * Recherche par ID de chambre
     */
    getSearchByIdRoom(idRoom:string):Observable<ApiResultFormat<SearchPropertyModel>>
    {
        return this._httpClient.get<ApiResultFormat<SearchPropertyModel>>(`${environment.apiUrl}/search/by-idroom/${idRoom}`)
    }

    /**
     * Obtenir les statistiques de recherche pour les filtres
     */
    getSearchStats(city?: string): Observable<ApiResultFormat<any>>
    {
        let params = new HttpParams();
        if (city) {
            params = params.set('city', city);
        }

        return this._httpClient.get<ApiResultFormat<any>>(
            `${environment.apiUrl}/search/stats`,
            { params }
        );
    }

    /**
     * Obtenir les recherches populaires
     */
    getPopularSearches(limit?: number): Observable<ApiResultFormat<any>>
    {
        let params = new HttpParams();
        if (limit) {
            params = params.set('limit', limit.toString());
        }

        return this._httpClient.get<ApiResultFormat<any>>(
            `${environment.apiUrl}/search-stats/popular`,
            { params }
        );
    }

    /**
     * Obtenir les recherches populaires par ville
     */
    getPopularSearchesByCity(cityId: string, limit?: number): Observable<ApiResultFormat<any>>
    {
        let params = new HttpParams().set('cityId', cityId);
        if (limit) {
            params = params.set('limit', limit.toString());
        }

        return this._httpClient.get<ApiResultFormat<any>>(
            `${environment.apiUrl}/search-stats/popular-by-city`,
            { params }
        );
    }

    /**
     * Obtenir les villes les plus recherchées
     */
    getTopSearchedCities(limit?: number): Observable<ApiResultFormat<any>>
    {
        let params = new HttpParams();
        if (limit) {
            params = params.set('limit', limit.toString());
        }

        return this._httpClient.get<ApiResultFormat<any>>(
            `${environment.apiUrl}/search-stats/top-cities`,
            { params }
        );
    }

}