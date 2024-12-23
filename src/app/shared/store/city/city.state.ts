import { Action, Selector, State, StateContext, createSelector } from "@ngxs/store";
import { CityModel } from "./city.model";
import { Injectable } from "@angular/core";
import { CityAction } from "./city.actions";
import { CityService } from "./city.service";
// import { ToastrService } from "ngx-toastr";
import { of, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { ToastrService } from "ngx-toastr";

export class CityStateModel {
    cities:CityModel[]
    loadingCity:boolean
    initLoadingState:'NO_LOADED'|'LOADING'|'LOADED';
}


@State<CityStateModel>({
    name: "citylist",
    defaults:{
        loadingCity:false,
        cities:[],
        initLoadingState:'NO_LOADED',
    }
})
@Injectable()
export class CityState{
    
    constructor(
        private _citiesService:CityService,
        private _toastrService:ToastrService
        // private notificationService: NotificationService,

    ){}

    @Selector()
    static selectStateLoading(state:CityStateModel)
    {
        return state.loadingCity
    }

    @Selector()
    static selectStateInitLoading(state:CityStateModel)
    {
        return state.initLoadingState
    }

    @Selector() 
    static setlectStateCitys(state:CityStateModel)
    {
        return state.cities
    }

    static selectStateCity(cityId)
    {
        return createSelector([CityState],(state)=>{
            let data=state.cities.find((u)=>u._id==cityId)
            if(data) return data
            return null;
        })
    
    }
    

    static selectStateCityByCountryId(countryID)
    {
        return createSelector([CityState],(state)=> state.cities.filter((city)=>city.country==countryID))
    }

    

    @Action(CityAction.ResetAllState)
    resetAllState(ctx:StateContext<CityStateModel>)
    {
        ctx.setState({
            loadingCity:false,
            cities:[],
            initLoadingState:'NO_LOADED',
        })
    }


    @Action(CityAction.UpdateCity)
    updateCity(ctx:StateContext<CityStateModel>, {city,id}:CityAction.UpdateCity)
    {
        const state = ctx.getState();
        ctx.patchState({
            loadingCity: true
        })

        return this._citiesService.updateCity(city,id).pipe(
            tap(
                (result)=>{
                    const data = [...state.cities]
                    let index = data.findIndex((u)=>u._id==id);
                    if(index>-1) data[index]=result.data;
                    ctx.patchState({
                        loadingCity:false,
                        cities:data
                    })
                    this._toastrService.success(`Profil city modifié avec success`, 'Ndewa360°');
                }
            ),
            catchError((error) => {               
                ctx.patchState({
                    loadingCity: false
                })
                let message = error?.error?.message;
                if(!message) message = "Une erreur c'est produite! Réessayez plus tard"
                this._toastrService.error(message, 'Ndewa360°');
                return throwError(error);
                
            })
        )
    }


    
    @Action(CityAction.updateLoadingCityState)
    updateLoadingCityState(ctx:StateContext<CityStateModel>,{status}:CityAction.updateLoadingCityState)
    {
        const state = ctx.getState();
        ctx.patchState(
            {
                loadingCity:status
            }
        )
        return of(true)
    }

    @Action(CityAction.AddCityFromLoadedCountry)
    addCityState(ctx:StateContext<CityStateModel>,{cities}:CityAction.AddCityFromLoadedCountry)
    {
        const state = ctx.getState();
        ctx.patchState(
            {
                cities:[...state.cities,...cities]
            }
        )
        return of(true)
    }

   


    @Action(CityAction.CreateCity)
    createCity(ctx:StateContext<CityStateModel>,{city}:CityAction.CreateCity)
    {
        const state = ctx.getState();

        ctx.patchState({
            loadingCity:true
        })
        return this._citiesService.createCity(city).pipe(
            tap(
                result => {
                    ctx.patchState({
                        loadingCity:false,
                        cities:[...state.cities, result.data]
                    })
                    this._toastrService.success(`City ajouté avec success!`, 'Ndewa360°');

                }
            ),
            catchError((error)=>{
                ctx.patchState({
                    loadingCity: false
                })
                let message = error?.error?.message;
                if(!message) message = "Une erreur c'est produite! Réessayez plus tard"
                this._toastrService.error(message, 'Ndewa360°');
                return throwError(error);
            })
        )
    }

}