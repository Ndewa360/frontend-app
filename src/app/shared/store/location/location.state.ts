import { Action, Selector, State, StateContext, createSelector } from "@ngxs/store";
import { LocationModel } from "./location.model";
import { Injectable } from "@angular/core";
import { LocationAction } from "./location.actions";
import { LocationService } from "./location.service";
// import { ToastrService } from "ngx-toastr";
import { of, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { NotificationService } from "carbon-components-angular";
import { ToastrService } from "ngx-toastr";
import { RoomAction } from "../rooms";
import { LocataireAction } from "../locataire";

export class LocationStateModel {
    locations:LocationModel[]
    loadingLocation:boolean
    initLoadingState:'NO_LOADED'|'LOADING'|'LOADED';
}


@State<LocationStateModel>({
    name: "locationlist",
    defaults:{
        loadingLocation:false,
        locations:[],
        initLoadingState:'NO_LOADED',
    }
})
@Injectable()
export class LocationState{
    constructor(
        private _locationsService:LocationService,
        private _toastrService:ToastrService
        // private notificationService: NotificationService,

    ){}

    @Selector()
    static selectStateLoading(state:LocationStateModel)
    {
        return state.loadingLocation
    }

    @Selector()
    static selectStateInitLoading(state:LocationStateModel)
    {
        return state.initLoadingState
    }

    @Selector() 
    static setlectStateLocations(state:LocationStateModel)
    {
        return state.locations
    }

    static selectStateLocation(locationId)
    {
        return createSelector([LocationState],(state)=>{
            let data=state.locations.find((u)=>u._id==locationId)
            if(data) return data
            return null;
        })
    }

    static selectStateLocationByRoomAndLocataireId(locataireId:string,roomId)
    {
        return createSelector([LocationState],(state)=>{
            let data=state.locations.find((u)=>u.locataire==locataireId && u.room==roomId)
            if(data) return data
            return null;
        })
    }
    
    

    static selectStateLocationByLocataireId(locataireId:string)
    {
        return createSelector([LocationState],(state)=> state.locations.filter((location)=>location.locataire==locataireId))
    }

    static selectStateLocationByPropertyId(propertyID)
    {
        return createSelector([LocationState],(state)=> state.locations.filter((location)=>location.property==propertyID))
    }

    @Action(LocationAction.UpdateLocation)
    updateLocation(ctx:StateContext<LocationStateModel>, {location,id}:LocationAction.UpdateLocation)
    {
        const state = ctx.getState();
        ctx.patchState({
            loadingLocation: true
        })

        return this._locationsService.updateLocation(location,id).pipe(
            tap(
                (result)=>{
                    const data = [...state.locations]
                    let index = data.findIndex((u)=>u._id==id);
                    if(index>-1) data[index]=result.data;
                    ctx.patchState({
                        loadingLocation:false,
                        locations:data
                    })
                    // this._toastrService.success(`Profil utilisateur modifié avec success`, 'Location');
                }
            ),
            catchError((error) => {
                // this._toastrService.error(error?.error?.message, 'Erreur');
                ctx.patchState({
                    loadingLocation: false
                })
                return throwError(error);
                
            })
        )
    }

    
    @Action(LocationAction.updateLoadingLocationState)
    updateLoadingLocationState(ctx:StateContext<LocationStateModel>,{status}:LocationAction.updateLoadingLocationState)
    {
        const state = ctx.getState();
        ctx.patchState(
            {
                loadingLocation:status
            }
        )
        return of(true)
    }

   

    @Action(LocationAction.FetchLocationsByLocataireId)
    fetchLocationByLocataireID(ctx:StateContext<LocationStateModel>,{locataireId}:LocationAction.FetchLocationsByLocataireId)
    {
        const state = ctx.getState();
        let index = state.locations.findIndex((u)=>u.locataire==locataireId);

        if(index>-1) return of(true);

        ctx.patchState({
            loadingLocation:true
        })
        return this._locationsService.getLocationByLocataireId(locataireId).pipe(
            tap(
                result => {
                    ctx.patchState({
                        loadingLocation:false,
                        locations:[...state.locations, ...result.data]
                    })
                }
            )
        )
    }

    @Action(LocationAction.ResetAllState)
    resetAllLocation(ctx:StateContext<LocationStateModel>)
    {
        ctx.setState({
            loadingLocation:false,
            locations:[],
            initLoadingState:'NO_LOADED',
        })
    }

    @Action(LocationAction.FetchLocation)
    fetchLocation(ctx:StateContext<LocationStateModel>,{locationId}:LocationAction.FetchLocation)
    {
        const state = ctx.getState();
        let index = state.locations.findIndex((u)=>u._id==locationId);

        if(index>-1) return of(true);

        ctx.patchState({
            loadingLocation:true
        })
        return this._locationsService.getLocation(locationId).pipe(
            tap(
                result => {
                    ctx.patchState({
                        loadingLocation:false,
                        locations:[...state.locations, result.data]
                    })
                }
            )
        )
    }

    @Action(LocationAction.CreateLocation)
    createLocation(ctx:StateContext<LocationStateModel>,{location}:LocationAction.CreateLocation)
    {
        const state = ctx.getState();

        ctx.patchState({
            loadingLocation:true
        })
        return this._locationsService.createLocation(location).pipe(
            tap(
                result => {
                    console.log("Location Created ",result);
                    ctx.patchState({
                        loadingLocation:false,
                        locations:[...state.locations, result.data]
                    })
                    this._toastrService.success(`Location ajouté avec success!`, 'Ndewa360°');
                    ctx.dispatch(new RoomAction.ChangeStatusRoom(result.data.room,false,result.data.locataire))
                    ctx.dispatch(new LocataireAction.UpdateLocataireRoom(result.data.locataire,result.data.room))
                }
            ),
            catchError((error)=>{
                ctx.patchState({
                    loadingLocation: false
                })
                let message = error?.error?.message;
                if(!message) message = "Une erreur c'est produite! Réessayez plus tard"
                this._toastrService.error(message, 'Ndewa360°');
                return throwError(error);
            })
        )
    }

    @Action(LocationAction.RemoveAssignationLocation)
    removeAssignationLocation(ctx:StateContext<LocationStateModel>,{locationId,description}:LocationAction.RemoveAssignationLocation)
    {
        const state = ctx.getState();
        ctx.patchState({
            loadingLocation:true
        })
        return this._locationsService.removeAssignationLocation(locationId,description).pipe(
            tap(
                result => {
                    const data = [...state.locations]
                    let index = data.findIndex((u)=>u._id==locationId);
                    if(index>-1) data.splice(index,1)
                    ctx.patchState({
                        loadingLocation:false,
                        locations:data
                    })
                    this._toastrService.success(`Location retiré avec success!`, 'Ndewa360°');
                    ctx.dispatch(new RoomAction.ChangeStatusRoom(result.data.room,true,null))
                    ctx.dispatch(new LocataireAction.UpdateLocataireRoom(result.data.locataire,null))
                }
            ),
            catchError((error)=>{
                ctx.patchState({
                    loadingLocation: false
                })
                let message = error?.error?.message;
                if(!message) message = "Une erreur c'est produite! Réessayez plus tard"
                this._toastrService.error(message, 'Ndewa360°');
                return throwError(error);
            })
        )
    }


    @Action(LocationAction.FetchLocationsByPropertyId)
    fetchLocationsByPropertyId(ctx:StateContext<LocationStateModel>,{propertyId}:LocationAction.FetchLocationsByPropertyId)
    {
        const state = ctx.getState();
        if(state.locations.findIndex((u)=>u.property==propertyId)>-1) return of(true);

        ctx.patchState({
            loadingLocation:true,
            initLoadingState:"LOADING"
        })
        return this._locationsService.getLocations(propertyId).pipe(
            tap(
                result => {
                    console.log("Fetch Locations ",result)
                    ctx.patchState({
                        loadingLocation:false,
                        locations:[...result.data],
                        initLoadingState:"LOADED"
                    })
                }
            ),
            catchError((error)=>{
                ctx.patchState({
                    loadingLocation: false
                })
                let message = error?.error?.message;
                if(!message) message = "Une erreur c'est produite! Réessayez plus tard"
                this._toastrService.error(message, 'Ndewa360°');
                return throwError(error);
            })
        )
    }
}