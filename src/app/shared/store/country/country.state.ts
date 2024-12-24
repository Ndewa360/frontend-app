import { Action, Selector, State, StateContext, createSelector } from "@ngxs/store";
import { CountryModel } from "./country.model";
import { Injectable } from "@angular/core";
import { CountryAction } from "./country.actions";
import { CountryService } from "./country.service";
// import { ToastrService } from "ngx-toastr";
import { of, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { NotificationService } from "carbon-components-angular";
import { ToastrService } from "ngx-toastr";
import { CityAction } from "../city";

export class CountryStateModel {
    countries:CountryModel[]
    loadingCountry:boolean
    initLoadingState:'NO_LOADED'|'LOADING'|'LOADED';
}


@State<CountryStateModel>({
    name: "countries",
    defaults:{
        loadingCountry:false,
        countries:[],
        initLoadingState:'NO_LOADED',
    }
})
@Injectable()
export class CountryState{
    constructor(
        private _countrysService:CountryService,
        private _toastrService:ToastrService
    ){}

    @Selector()
    static selectStateLoading(state:CountryStateModel)
    {
        return state.loadingCountry
    }
    @Selector() 
    static selectStateCountries(state:CountryStateModel)
    {
        return state.countries
    }

    @Selector() 
    static selectStateInitLoading(state:CountryStateModel)
    {
        return state.initLoadingState
    }

    static selectStateCountry(countryId)
    {
        return createSelector([CountryState],(state)=>{
            let data=state.countries.find((u)=>u._id==countryId)
            if(data) return data
            return null;
        })
    
    }

    static selectStateCountryByCountryName(name=null)
    {
        return createSelector([CountryState],(state)=> state.countrys.filter((country)=>{
                if(name==null) return country;
                if(country.name.indexOf(name)) return country;
            }))
    
    }

    @Action(CountryAction.UpdateCountry)
    updateCountry(ctx:StateContext<CountryStateModel>, {country,id}:CountryAction.UpdateCountry)
    {
        const state = ctx.getState();
        ctx.patchState({
            loadingCountry: true
        })

        return this._countrysService.updateCountry(country,id).pipe(
            tap(
                (result)=>{
                    const data = [...state.countries]
                    let index = data.findIndex((u)=>u._id==id);
                    if(index>-1) data[index]=result.data;
                    ctx.patchState({
                        loadingCountry:false,
                        countries:data
                    })
                    this._toastrService.success(`Pays mise à jour avec success!`, 'Ndewa360°');
                }
            ),
            catchError((error) => {
                ctx.patchState({
                    loadingCountry: false
                })
                let message = error?.error?.message;
                if(!message) message = "Une erreur c'est produite! Réessayez plus tard"
                this._toastrService.error(message, 'Ndewa360°');
                return throwError(error);
                
            })
        )
    }

    @Action(CountryAction.AddCity)
    updateCityCountry(ctx:StateContext<CountryStateModel>, {city,countryID}:CountryAction.AddCity)
    {
        const state = ctx.getState();

        const data = [...state.countries]
        let index = data.findIndex((u)=>u._id==countryID);
        if(index>-1) data[index]={...data[index],cities:[...data[index].cities,city]};
        ctx.patchState({
            countries:data
        })
    }

    @Action(CountryAction.ResetAllState)
    resetAllState(ctx:StateContext<CountryStateModel>)
    {
        ctx.setState({
            loadingCountry:false,
            countries:[],
            initLoadingState:'NO_LOADED',
        })
    }

    
    @Action(CountryAction.updateLoadingCountryState)
    updateLoadingCountryState(ctx:StateContext<CountryStateModel>,{status}:CountryAction.updateLoadingCountryState)
    {
        const state = ctx.getState();
        ctx.patchState(
            {
                loadingCountry:status
            }
        )
        return of(true)
    }

   

    @Action(CountryAction.FetchCountry)
    fetchCountry(ctx:StateContext<CountryStateModel>,{countryId}:CountryAction.FetchCountry)
    {
        const state = ctx.getState();
        let index = state.countries.findIndex((u)=>u._id==countryId);

        if(index>-1) return of(true);

        ctx.patchState({
            loadingCountry:true
        })
        return this._countrysService.getCountry(countryId).pipe(
            tap(
                result => {                    
                    ctx.patchState({
                        loadingCountry:false,
                        countries:[...state.countries, {...result.data,cities:[]}]
                    })
                    ctx.dispatch(new CityAction.AddCityFromLoadedCountry([...result.data.cities]))
                    
                }
            )
        )
    }

    @Action(CountryAction.CreateCountry)
    createCountry(ctx:StateContext<CountryStateModel>,{country}:CountryAction.CreateCountry)
    {
        const state = ctx.getState();

        ctx.patchState({
            loadingCountry:true
        })
        return this._countrysService.createCountry(country).pipe(
            tap(
                result => {
                    ctx.patchState({
                        loadingCountry:false,
                        countries:[...state.countries, result.data]
                    });       
                    this._toastrService.success(`Pays crée avec success!`, 'Ndewa360°');
                }
            ),
            catchError((error)=>{
                ctx.patchState({
                    loadingCountry: false
                })
                let message = error?.error?.message;
                if(!message) message = "Une erreur c'est produite! Réessayez plus tard"
                this._toastrService.error(message, 'Ndewa360°');
                return throwError(error);
            })
        )
    }

    @Action(CountryAction.FetchCountries)
    fetchCountries(ctx:StateContext<CountryStateModel>)
    {
        const state = ctx.getState();
        
        ctx.patchState({
            loadingCountry:true,
            initLoadingState:"LOADING"
        })
        return this._countrysService.getCountries().pipe(
            tap(
                result => {
                    console.log("Fetch Country Result ",result )
                    let cities = result.data.map((r)=>r.cities).reduce((acc,curr)=>[...acc,...curr],[])                    
                    if(cities.length>0)  ctx.dispatch(new CityAction.AddCityFromLoadedCountry(cities))
                        
                    if(state.initLoadingState!="LOADED") ctx.patchState({initLoadingState:'LOADED'})
                    ctx.patchState({
                        loadingCountry:false,
                        countries:[...result.data],
                    })
                }
            )
        )
    }
}