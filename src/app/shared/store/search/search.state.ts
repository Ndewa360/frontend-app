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

export class SearchStateModel {
    searchProperties:SearchPropertyModel[]
    loadingSearch:boolean
    initLoadingState:'NO_LOADED'|'LOADING'|'LOADED';
}


@State<SearchStateModel>({
    name: "searchlist",
    defaults:{
        loadingSearch:false,
        searchProperties:[],
        initLoadingState:'NO_LOADED',
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


    @Action(SearchAction.FetchSearch)
    fetchSearch(ctx:StateContext<SearchStateModel>,{city}:SearchAction.FetchSearch)
    {
        const state = ctx.getState();

        let searchProperties = state.searchProperties.findIndex((prop)=>prop.geolocationCity.fullName==city);
        if(searchProperties>-1) return of(true);

        ctx.patchState({
            loadingSearch:true
        })
        return this._searchPropertiesService.getSearch(city).pipe(
            tap(
                result => {
                    ctx.patchState({
                        loadingSearch:false,
                        searchProperties:[...state.searchProperties, result.data]
                    })

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