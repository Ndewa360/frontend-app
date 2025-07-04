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
    loadingSearchItem:boolean
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
        loadingSearchItem:true,
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
        if(prop.property.hasKitchen==filter.specifity?.hasKitchen) priority++;
        if(prop.property.hasParking==filter.specifity?.hasParking) priority++;
        if(prop.property.isInternalKitchen==filter.specifity?.isInternalKitchen) priority++;
        if(prop.property.isInternalShower==filter.specifity?.isInternalShower) priority++;
        if(prop.property.numberOfBathroom==filter.specifity?.numberOfBathroom) priority++;
        if(prop.property.numberOfLivingRoom==filter.specifity?.numberOfLivingRoom) priority++;
        if(prop.property.numberOfShower==filter.specifity?.isInternalKitchen) priority++;
        //console.log("Prop => priority ", prop,priority)
        return priority;
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
        console.log("Filter ",filter,isNewLocation)
        if(!isNewLocation)
        {
            if(!filter.ville) {
                dataRooms= dataRooms.filter((room)=> (
                    room.price>=filter.minPrice && 
                    room.price<=filter.maxPrice 
                ));    
            }
            else dataRooms= dataRooms.filter((room)=> (
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
        console.log("Data Room ",dataRooms)
    }


    @Action(SearchAction.FetchSearch)
    fetchSearch(ctx:StateContext<SearchStateModel>,{city, page = 1, pageSize = 12}:SearchAction.FetchSearch)
    {
        const state = ctx.getState();

        let searchProperties = state.searchProperties.findIndex((prop)=>prop.property.geolocationCity?._id==city);
        if(searchProperties>-1 && page === 1) return of(true);

        ctx.patchState({
            loadingSearch:true
        })
        return this._searchPropertiesService.getSearch(city, page, pageSize).pipe(
            tap(
                result => {
                    ctx.patchState({
                        loadingSearch:false,
                        loadingSearchItem:false,
                        searchProperties:[...state.searchProperties, ...(Array.isArray(result.data?.data) ? result.data.data : Array.isArray(result.data) ? result.data : [])]
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
                    loadingSearch: false,
                    loadingSearchItem:false
                })
                return throwError(error);
            })
        )
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
                return throwError(error);
            })
        )
    }

}