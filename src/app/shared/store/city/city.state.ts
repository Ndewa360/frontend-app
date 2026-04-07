import { Action, Selector, State, StateContext, createSelector } from "@ngxs/store";
import { CityModel } from "./city.model";
import { Injectable } from "@angular/core";
import { CityAction } from "./city.actions";
import { CityService } from "./city.service";
import { CountryAction } from "../country/country.actions"
import { of, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { ToastrService } from "ngx-toastr";
import { DefaultCoordCity } from "../../utils";
import { SearchAction } from "../search";
import { TranslateService } from "@ngx-translate/core";

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
        private _toastrService:ToastrService,
        private _translateService: TranslateService
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
    static selectStateCities(state:CityStateModel)
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

    @Action(CityAction.Logout)
    logout(ctx:StateContext<CityStateModel>)
    {
        ctx.setState({
            loadingCity:false,
            cities:[],
            initLoadingState:'NO_LOADED',
        })
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
                    this._toastrService.success(this._translateService.instant('NOTIFICATIONS.CITY_UPDATED_SUCCESS'), 'Ndewa360°');
                }
            ),
            catchError((error) => {               
                ctx.patchState({
                    loadingCity: false
                })                
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
            cities.forEach((city)=>{
              if(city.lat== DefaultCoordCity.latitude && city.long== DefaultCoordCity.longitude) 
              {
                ctx.dispatch(new SearchAction.FetchSearch(city._id))
              }
            })
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
                    this._toastrService.success(this._translateService.instant('NOTIFICATIONS.CITY_CREATED_SUCCESS'), 'Ndewa360°');
                    ctx.dispatch(new CountryAction.AddCity(result.data, result.data.country))
                }
            ),
            catchError((error)=>{
                ctx.patchState({
                    loadingCity: false
                })
                return throwError(error);
            })
        )
    }

    @Action(CityAction.LoadAllCities)
    loadAllCities(ctx: StateContext<CityStateModel>)
    {
        ctx.patchState({
            loadingCity: true
        });

        return this._citiesService.getAllCities().pipe(
            tap((result: any) => {
                console.warn("All cities loaded ",result.data)
                ctx.patchState({
                    cities: result.data || [],
                    loadingCity: false,
                    initLoadingState: 'LOADED'
                });
            }),
            catchError((error) => {
                ctx.patchState({
                    loadingCity: false
                });
                this._toastrService.error(this._translateService.instant('NOTIFICATIONS.CITY_LOAD_ERROR'), 'Ndewa360°');
                return throwError(error);
            })
        );
    }

    @Action(CityAction.LoadCitiesByCountry)
    loadCitiesByCountry(ctx: StateContext<CityStateModel>, {countryId}: CityAction.LoadCitiesByCountry)
    {
        ctx.patchState({
            loadingCity: true
        });

        return this._citiesService.getCitiesByCountry(countryId).pipe(
            tap((result: any) => {
                ctx.patchState({
                    cities: result.data || [],
                    loadingCity: false,
                    initLoadingState: 'LOADED'
                });
            }),
            catchError((error) => {
                ctx.patchState({
                    loadingCity: false
                });
                this._toastrService.error(this._translateService.instant('NOTIFICATIONS.CITY_LOAD_ERROR'), 'Ndewa360°');
                return throwError(error);
            })
        );
    }

}