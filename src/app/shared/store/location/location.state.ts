import { Action, Selector, State, StateContext, createSelector } from "@ngxs/store";
import { LocationModel } from "./location.model";
import { Injectable } from "@angular/core";
import { LocationAction } from "./location.actions";
import { LocationService } from "./location.service";
import { of, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { NotificationService } from "carbon-components-angular";
import { ToastrService } from "ngx-toastr";
import { TranslateService } from "@ngx-translate/core";
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
        private _toastrService:ToastrService,
        private _translateService:TranslateService
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
                    this._toastrService.success(this._translateService.instant('NOTIFICATIONS.LOCATION_UPDATED_SUCCESS'), 'Ndewa360°');
                }
            ),
            catchError((error) => {
                ctx.patchState({
                    loadingLocation: false
                })
                return of(null);
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
            ),
            catchError((error) => {
                ctx.patchState({ loadingLocation: false });
                return throwError(error);
            })
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
            ),
            catchError((error) => {
                ctx.patchState({ loadingLocation: false });
                return throwError(error);
            })
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
                // Mettre à jour le state avec la nouvelle location
                ctx.patchState({
                    loadingLocation: false,
                    locations: [...state.locations, result.data]
                });

                // Afficher le message de succès
                this._toastrService.success(this._translateService.instant('NOTIFICATIONS.LOCATION_CREATED_SUCCESS'), 'Ndewa360°');

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
                ctx.patchState({
                    loadingLocation: false
                });
                return of(null);
            })
        );
    }

    @Action(LocationAction.CreateAssignationWithAssistant)
    createAssignationWithAssistant(ctx:StateContext<LocationStateModel>,{assignationConfig}:LocationAction.CreateAssignationWithAssistant)
    {
        const state = ctx.getState();
        ctx.patchState({ loadingLocation: true })
        return this._locationsService.createAssignationWithAssistant(assignationConfig).pipe(
            tap(result => {
                ctx.patchState({
                    loadingLocation: false,
                    locations: [...state.locations, result.data.location]
                })
                this._toastrService.success(this._translateService.instant('NOTIFICATIONS.LOCATION_ASSISTANT_SUCCESS'), 'Ndewa360°');
                if (result.data.location) {
                    ctx.dispatch(new RoomAction.UpdateLocalRoomInfos(result.data.location.room, { isActiveForSouscription: true, isFree: false, locataire: result.data.location.locataire }))
                    ctx.dispatch(new LocataireAction.UpdateLocataireRoom(result.data.location.locataire, result.data.location.room))
                    // Correction #8 : invalider le cache en forçant le rechargement des locations
                    // pour cette propriété (le cache FetchLocationsByPropertyId bloque sinon la MAJ)
                    if (result.data.location.property) {
                        ctx.dispatch(new LocationPaymentAction.FetchLocationPaymentsByPropertyId(result.data.location.property));
                    }
                }
            }),
            catchError((error) => {
                ctx.patchState({ loadingLocation: false })
                return of(null);
            })
        )
    }

    @Action(LocationAction.RemoveAssignationLocation)
    removeAssignationLocation(ctx:StateContext<LocationStateModel>,{locationId,description,terminationDate}:LocationAction.RemoveAssignationLocation)
    {
        const state = ctx.getState();
        ctx.patchState({
            loadingLocation:true
        })
        return this._locationsService.removeAssignationLocation(locationId, description, terminationDate).pipe(
            tap(
                result => {
                    const data = [...state.locations]
                    let index = data.findIndex((u)=>u._id==locationId);
                    if(index>-1) data.splice(index,1)
                    ctx.patchState({
                        loadingLocation:false,
                        locations:data
                    })
                    this._toastrService.success(this._translateService.instant('NOTIFICATIONS.LOCATION_REMOVED_SUCCESS'), 'Ndewa360°');
                    ctx.dispatch(new RoomAction.UpdateLocalRoomInfos(result.data.room,{isActiveForSouscription:false,isFree:true,locataire:null}))
                    ctx.dispatch(new LocataireAction.UpdateLocataireRoom(result.data.locataire,null))
                }
            ),
            catchError((error)=>{
                ctx.patchState({
                    loadingLocation: false
                })
                return of(null);
            })
        )
    }


    @Action(LocationAction.FetchLocationsByPropertyId)
    fetchLocationsByPropertyId(ctx:StateContext<LocationStateModel>,{propertyId}:LocationAction.FetchLocationsByPropertyId)
    {
        const state = ctx.getState();
        // Correction #8 : ne pas court-circuiter si une location existe déjà —
        // le cache était trop agressif et empêchait l'affichage des nouvelles assignations.
        // On recharge toujours depuis le backend pour garantir la fraîcheur des données.
        ctx.patchState({ loadingLocation: true, initLoadingState: 'LOADING' })
        return this._locationsService.getLocations(propertyId).pipe(
            tap((result: any) => {
                // Fusionner en évitant les doublons (autres propriétés déjà en cache)
                const otherLocations = state.locations.filter(l => l.property !== propertyId);
                ctx.patchState({
                    loadingLocation: false,
                    locations: [...otherLocations, ...result.data],
                    initLoadingState: 'LOADED'
                })
            }),
            catchError((error) => {
                ctx.patchState({ loadingLocation: false })
                return of(null);
            })
        )
    }
}