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
import { LocationPaymentAction } from "../payment-location";
import { HistoryLocationPaymentAction } from "../history-payment-location";

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
    static selectStateLocations(state:LocationStateModel)
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

    static selectStateCountLocationByPropertyId(propertyID)
    {
        return createSelector([LocationState],(state)=> state.locations.filter((location)=>location.property==propertyID).length)
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
                    this._toastrService.success(`Location modifié avec success`, 'Location');
                }
            ),
            catchError((error) => {
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

    @Action(LocationAction.Logout)
    logout(ctx:StateContext<LocationStateModel>)
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
    createLocation(ctx: StateContext<LocationStateModel>, {location}: LocationAction.CreateLocation) {
        const state = ctx.getState();

        ctx.patchState({
            loadingLocation: true
        });

        return this._locationsService.createLocation(location).pipe(
            tap(result => {
                console.log("✅ Location créée avec succès:", result);

                // Mettre à jour le state avec la nouvelle location
                ctx.patchState({
                    loadingLocation: false,
                    locations: [...state.locations, result.data]
                });

                // Afficher le message de succès
                this._toastrService.success(`Assignation réalisée avec succès!`, 'Ndewa360°');

                // Mettre à jour les informations de la chambre
                if (result.data.room) {
                    ctx.dispatch(new RoomAction.UpdateLocalRoomInfos(
                        result.data.room,
                        {
                            isActiveForSouscription: true,
                            isFree: false,
                            locataire: result.data.locataire
                        }
                    ));
                }

                // Mettre à jour les informations du locataire
                if (result.data.locataire && result.data.room) {
                    ctx.dispatch(new LocataireAction.UpdateLocataireRoom(
                        result.data.locataire,
                        result.data.room
                    ));
                }

                // Rafraîchir les données pour s'assurer de la synchronisation
                setTimeout(() => {
                    // Recharger les locations pour cette propriété
                    if (result.data.property) {
                        ctx.dispatch(new LocationAction.FetchLocationsByPropertyId(result.data.property));
                    }

                    // Recharger les statistiques de paiement
                    ctx.dispatch(new LocationPaymentAction.FetchLocationPaymentsByPropertyId(result.data.property));
                }, 1000);
            }),
            catchError((error) => {
                console.error("❌ Erreur lors de la création de la location:", error);

                ctx.patchState({
                    loadingLocation: false
                });

                // Afficher un message d'erreur plus informatif
                const errorMessage = error?.error?.message?.[0] || error?.message || 'Erreur lors de l\'assignation';
                this._toastrService.error(errorMessage, 'Erreur d\'assignation');

                return throwError(error);
            })
        );
    }

    @Action(LocationAction.CreateAssignationWithAssistant)
    createAssignationWithAssistant(ctx:StateContext<LocationStateModel>,{assignationConfig}:LocationAction.CreateAssignationWithAssistant)
    {
        const state = ctx.getState();

        ctx.patchState({
            loadingLocation:true
        })
        return this._locationsService.createAssignationWithAssistant(assignationConfig).pipe(
            tap(
                result => {
                    console.log("Assignation Created with Assistant ",result);
                    ctx.patchState({
                        loadingLocation:false,
                        locations:[...state.locations, result.data.location]
                    })
                    this._toastrService.success(`Assignation créée avec succès via l'assistant!`, 'Ndewa360°');
                    // Mettre à jour les stores liés
                    if (result.data.location) {
                        ctx.dispatch(new RoomAction.UpdateLocalRoomInfos(result.data.location.room,{isActiveForSouscription:true,isFree:false,locataire:result.data.location.locataire}))
                        ctx.dispatch(new LocataireAction.UpdateLocataireRoom(result.data.location.locataire,result.data.location.room))
                    }
                }
            ),
            catchError((error)=>{
                ctx.patchState({
                    loadingLocation: false
                })
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
                    ctx.dispatch(new RoomAction.UpdateLocalRoomInfos(result.data.room,{isActiveForSouscription:false,isFree:true,locataire:null}))
                    ctx.dispatch(new LocataireAction.UpdateLocataireRoom(result.data.locataire,null))
                }
            ),
            catchError((error)=>{
                ctx.patchState({
                    loadingLocation: false
                })
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
                (result:any) => {
                    let locationFound=[...state.locations];
                    result.data.forEach((location:LocationModel)=>{
                        if(locationFound.findIndex((u)=>u._id==location._id)==-1) locationFound.push(location)
                    })
                    ctx.patchState({
                        loadingLocation:false,
                        locations:locationFound,
                        initLoadingState:"LOADED"
                    })
                }
            ),
            catchError((error)=>{
                ctx.patchState({
                    loadingLocation: false
                })
                return throwError(error);
            })
        )
    }
}