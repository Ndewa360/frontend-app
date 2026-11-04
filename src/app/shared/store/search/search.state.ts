import { Action, Selector, State, StateContext, createSelector } from "@ngxs/store";
import { SearchPropertyModel } from "./search.model";
import { Injectable } from "@angular/core";
import { SearchAction } from "./search.actions";
import { SearchService } from "./search.service";

// import { ToastrService } from "ngx-toastr";
import { of, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { NotificationService } from "carbon-components-angular";
import { ToastrService } from "ngx-toastr";
import { TranslateService } from "@ngx-translate/core";

export class SearchStateModel {
    searchProperties:SearchPropertyModel[]
    filteredSearchedProperties:SearchPropertyModel[]
    loadingSearch:boolean
    loadingSearchItem:boolean
    initLoadingState:'NO_LOADED'|'LOADING'|'LOADED';
    // Pagination
    currentPage: number;
    totalPages: number;
    totalResults: number;
    pageSize: number;
    criteriaFinder?:{
        specifity?: { 
            hasClosure?: boolean,
            hasKitchen?: boolean,
            hasParking?: boolean,
            isInternalKitchen?: boolean,
            isInternalShower?: boolean,
            numberOfBathroom?: number,
            numberOfLivingRoom?: number,
            numberOfShower?:number,
        },
        type?: string,
        ville?:  string,
        minPrice?:number,
        maxPrice?:number
    }
}


@State<SearchStateModel>({
    name: "searchlist",
    defaults:{
        loadingSearch:true,
        searchProperties:[],
        loadingSearchItem:true,
        filteredSearchedProperties:[],
        initLoadingState:'NO_LOADED',
        currentPage: 1,
        totalPages: 1,
        totalResults: 0,
        pageSize: 10000, // Limite backend élevée
        criteriaFinder:null
    }
})
@Injectable()
export class SearchState{
    
    constructor(
        private _searchPropertiesService:SearchService,
        private _toastrService:ToastrService,
        private _translateService: TranslateService
        // private notificationService: NotificationService,

    ){}

    @Selector()
    static selectStateLoading(state:SearchStateModel)
    {
        return state.loadingSearch
    }

    @Selector()
    static selectStateLoadingItem(state:SearchStateModel)
    {
        return state.loadingSearchItem
    }

    @Selector()
    static selectStateInitLoading(state:SearchStateModel)
    {
        return state.initLoadingState
    }

    @Selector()
    static selectStateSearchs(state:SearchStateModel)
    {
        return state.searchProperties
    }

    @Selector()
    static selectStateFilteredProperty(state:SearchStateModel)
    {
        return state.filteredSearchedProperties
    }

    @Selector()
    static selectStatePagination(state:SearchStateModel)
    {
        return {
            currentPage: state.currentPage,
            totalPages: state.totalPages,
            totalResults: state.totalResults,
            pageSize: state.pageSize
        }
    }

    static selectStateSearch(searchID)
    {
        return createSelector([SearchState],(state)=>{
            let data=state.searchProperties.find((u)=>u._id==searchID)
            if(data) return data
            return null;
        })    
    }
    
    static selectStateSearchRelated(filter,propFoundId:string)
    {
        return createSelector([SearchState],(state)=> {
            return state.searchProperties
            .filter((prop:SearchPropertyModel)=>prop._id!=propFoundId)
            .map((prop:SearchPropertyModel)=>({room:prop,priority:this.getPriority(filter,prop,propFoundId)}))
            .sort((prop1,prop2)=>prop1.priority-prop2.priority)
            .slice(0,4)
            .map((prop)=>prop.room)
        })
    } 

    static getPriority(
        filter: {
            property:string,
            type:string
            geolocationCountry:any,
            geolocationCity:any,
            specifity:{ 
                hasClosure?: boolean,
                hasKitchen?: boolean,
                hasParking?: boolean,
                isInternalKitchen?: boolean,
                isInternalShower?: boolean,
                numberOfBathroom?: number,
                numberOfLivingRoom?: number,
                numberOfShower?:number,
            }
        },
        prop:SearchPropertyModel,propFoundId) {
        let priority=0;
        if(prop._id==propFoundId) return priority; 

        if(prop.property._id==filter.property) priority++;
        if(prop.type==filter.type) priority++;
        if(prop.property.geolocationCountry._id==filter.geolocationCountry._id) priority++;
        if(prop.property.geolocationCity._id==filter.geolocationCity._id) priority+=2;

        if(prop.property.hasClosure==filter.specifity?.hasClosure) priority++;
        if(prop.property.hasParking==filter.specifity?.hasParking) priority++;
        if(prop.specifity?.hasKitchen==filter.specifity?.hasKitchen) priority++;
        if(prop.specifity?.isInternalKitchen==filter.specifity?.isInternalKitchen) priority++;
        if(prop.specifity?.isInternalShower==filter.specifity?.isInternalShower) priority++;
        if(prop.specifity?.numberOfBathroom==filter.specifity?.numberOfBathroom) priority++;
        if(prop.specifity?.numberOfLivingRoom==filter.specifity?.numberOfLivingRoom) priority++;
        if(prop.specifity?.numberOfShower==filter.specifity?.numberOfShower) priority++;
        //console.log("Prop => priority ", prop,priority)
        return priority;
    }

    static selectStateSearchByCountryId(countryID)
    {
        return createSelector([SearchState],(state)=> state.searchProperties.filter((city)=>city.country==countryID))
    } 

    @Action(SearchAction.FetchSearchByIdRoom)
    fetchSearchByIdRoom(ctx:StateContext<SearchStateModel>,{idRoom}:SearchAction.FetchSearchByIdRoom)
    {
        const state = ctx.getState();

        let searchProperties = state.searchProperties.findIndex((prop)=>prop._id==idRoom);
        if(searchProperties>-1) return of(true);

        ctx.patchState({
            loadingSearchItem:true
        })
        return this._searchPropertiesService.getSearchByIdRoom(idRoom).pipe(
            tap(
                result => {
                    //console.log("result ",result.data)
                    ctx.patchState({
                        loadingSearchItem:false,
                        searchProperties:[...state.searchProperties, result.data]
                    })
                }
            ),
            catchError((error)=>{
                ctx.patchState({
                    loadingSearchItem: false
                })
                return of(null);
            })
        )
    }

    @Action(SearchAction.AdvancedSearch)
    advancedSearch(ctx: StateContext<SearchStateModel>, { filters, resetResults }: SearchAction.AdvancedSearch) {
        const state = ctx.getState();
        
        // Définir les valeurs par défaut pour la pagination
        const searchFilters = {
            ...filters,
            page: filters.page || 1,
            limit: filters.limit || 20 // le serveur plafonne à 100
        };

        ctx.patchState({
            loadingSearch: true
        });

        return this._searchPropertiesService.advancedSearch(searchFilters).pipe(
            tap(result => {
                const responseData = result.data;
                const properties = responseData?.data || [];
                const pagination = responseData?.pagination;

                // Mettre à jour les résultats selon le mode (reset ou ajout)
                const updatedProperties = resetResults 
                    ? properties 
                    : [...state.filteredSearchedProperties, ...properties];

                ctx.patchState({
                    loadingSearch: false,
                    filteredSearchedProperties: updatedProperties,
                    searchProperties: resetResults ? properties : [...state.searchProperties, ...properties],
                    currentPage: pagination?.page || 1,
                    totalPages: pagination?.totalPages || 1,
                    totalResults: pagination?.total || properties.length,
                    pageSize: pagination?.limit || 20
                });
            }),
            catchError(error => {
                ctx.patchState({
                    loadingSearch: false
                });
                return of(null);
            })
        );
    }

}