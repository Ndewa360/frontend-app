import { Action, Selector, State, StateContext, createSelector } from "@ngxs/store";
import { SearchPropertyModel } from "./search.model";
import { Injectable } from "@angular/core";
import { SearchAction } from "./search.actions";
import { SearchService } from "./search.service";
import { RoomType } from './../rooms';

// import { ToastrService } from "ngx-toastr";
import { of, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { NotificationService } from "carbon-components-angular";
import { ToastrService } from "ngx-toastr";

export class SearchStateModel {
    searchProperties:SearchPropertyModel[]
    filteredSearchedProperties:SearchPropertyModel[]
    loadingSearch:boolean
    initLoadingState:'NO_LOADED'|'LOADING'|'LOADED';
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
        filteredSearchedProperties:[],
        initLoadingState:'NO_LOADED',
        criteriaFinder:null
    }
})
@Injectable()
export class SearchState{
    
    constructor(
        private _searchPropertiesService:SearchService,
        private _toastrService:ToastrService
        // private notificationService: NotificationService,

    ){}

    @Selector()
    static selectStateLoading(state:SearchStateModel)
    {
        return state.loadingSearch
    }

    @Selector()
    static selectStateInitLoading(state:SearchStateModel)
    {
        return state.initLoadingState
    }

    @Selector() 
    static setlectStateSearchs(state:SearchStateModel)
    {
        return state.searchProperties
    }

    @Selector() 
    static setlectStateFilteredProperty(state:SearchStateModel)
    {
        return state.filteredSearchedProperties
    }

    static selectStateSearch(cityId)
    {
        return createSelector([SearchState],(state)=>{
            let data=state.searchProperties.find((u)=>u._id==cityId)
            if(data) return data
            return null;
        })
    
    }
    

    static selectStateSearchByCountryId(countryID)
    {
        return createSelector([SearchState],(state)=> state.searchProperties.filter((city)=>city.country==countryID))
    } 

    @Action(SearchAction.ApplyFilter)
    applyFilter(ctx:StateContext<SearchStateModel>,{filter,isNewLocation}:SearchAction.ApplyFilter)
    {
        let state = ctx.getState();
        let dataRooms = [...state.searchProperties];
        if(!isNewLocation)
        {
            dataRooms= dataRooms.filter((room)=> (
                room.property.geolocationCity?._id==filter.ville &&
                room.price>=filter.minPrice && 
                room.price<=filter.maxPrice 
            ));
            if(filter.specifity?.hasClosure) dataRooms = dataRooms.filter((room)=>filter.specifity.hasClosure==room.property.hasClosure)
            if(filter.specifity?.hasParking) dataRooms = dataRooms.filter((room)=>filter.specifity.hasParking==room.property.hasParking)

            if(filter.type) dataRooms= dataRooms.filter((room)=> room.type==filter.type);

            if(filter.type==RoomType.STUDIO && filter.specifity) dataRooms= dataRooms.filter((room)=> room.specifity.hasKitchen==filter.specifity.hasKitchen && room.specifity.isInternalShower==filter.specifity.isInternalShower);
            
            if(filter.type==RoomType.SIMPLE_APARTMENT && filter.specifity) dataRooms= dataRooms.filter((room)=> (
                room.specifity.hasKitchen==filter.specifity.hasKitchen && 
                room.specifity.isInternalShower==filter.specifity.isInternalShower && 
                room.specifity.numberOfShower>=filter.specifity.numberOfShower &&
                room.specifity.numberOfBathroom>=filter.specifity.numberOfBathroom &&
                room.specifity.numberOfLivingRoom>=filter.specifity.numberOfLivingRoom 
            ));
            ctx.patchState({
                filteredSearchedProperties: [...dataRooms],
            })
        }
        else  ctx.dispatch(new SearchAction.FetchSearch(filter.ville)) 

        ctx.patchState({
            criteriaFinder:{
                ...filter
            },
        })
    }


    @Action(SearchAction.FetchSearch)
    fetchSearch(ctx:StateContext<SearchStateModel>,{city}:SearchAction.FetchSearch)
    {
        const state = ctx.getState();

        let searchProperties = state.searchProperties.findIndex((prop)=>prop.property.geolocationCity?._id==city);
        if(searchProperties>-1) return of(true);

        ctx.patchState({
            loadingSearch:true
        })
        return this._searchPropertiesService.getSearch(city).pipe(
            tap(
                result => {
                    ctx.patchState({
                        loadingSearch:false,
                        searchProperties:[...state.searchProperties, ...result.data]
                    })
                    // this.applyFilter(ctx,{ville:city})
                    if(!state.criteriaFinder) ctx.dispatch(new SearchAction.ApplyFilter({
                            ville:city,
                            maxPrice:100000,
                            minPrice:0,
                        },false))
                    else ctx.dispatch(new SearchAction.ApplyFilter(state.criteriaFinder,false))
                }
            ),
            catchError((error)=>{
                ctx.patchState({
                    loadingSearch: false
                })
                let message = error?.error?.message;
                if(!message) message = "Une erreur c'est produite! Réessayez plus tard"
                this._toastrService.error(message, 'Ndewa360°');
                return throwError(error);
            })
        )
    }

}