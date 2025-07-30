import { Action, Selector, State, StateContext, createSelector } from "@ngxs/store";
import { LocationPaymentModel, LocationPaymentType } from "./location-payment.model";
import { Injectable } from "@angular/core";
import { LocationPaymentAction } from "./location-payment.actions";
import { LocationPaymentService } from "./location-payment.service";
// import { ToastrService } from "ngx-toastr";
import { of, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { NotificationService } from "carbon-components-angular";
import { ToastrService } from "ngx-toastr";
import { RoomAction } from "../rooms";
import { LocataireAction } from "../locataire";
import { HistoryLocationPaymentAction } from "../history-payment-location";
import { StatisticAction } from "../statistic-data";
// import { RefreshHistoryLocationPaymentsByPropertyId }

export class LocationPaymentStateModel {
    locationPayments:LocationPaymentModel[]
    loadingLocationPayment:boolean
    initLoadingState:'NO_LOADED'|'LOADING'|'LOADED';
}


@State<LocationPaymentStateModel>({
    name: "locationpayment",
    defaults:{
        loadingLocationPayment:false,
        locationPayments:[],
        initLoadingState:'NO_LOADED',
    }
})
@Injectable()
export class LocationPaymentState{
    constructor(
        private _locationPaymentsService:LocationPaymentService,
        private _toastrService:ToastrService
        // private notificationService: NotificationService,

    ){}

    @Selector()
    static selectStateLoading(state:LocationPaymentStateModel)
    {
        return state.loadingLocationPayment
    }
    @Selector()
    static selectStateLocationPayments(state:LocationPaymentStateModel)
    {
        return state.locationPayments
    }

    static selectStateLocationPayment(locationPaymentId)
    {
        return createSelector([LocationPaymentState],(state)=>{
            let data=state.locationPayments.find((u)=>u._id==locationPaymentId)
            if(data) return data
            return null;
        })
    
    }

    static selectStateLocationPaymentByPropertyId(propertyID)
    {
        return createSelector([LocationPaymentState],(state)=> state.locationPayments.filter((locationPayment)=>locationPayment.property==propertyID))
    }

    static selectStateLocationPaymentByPropertyIdAndPaymentType(propertyID:string,paymentType:LocationPaymentType)
    {
        return createSelector([LocationPaymentState],(state)=> state.locationPayments.filter((locationPayment:LocationPaymentModel)=>locationPayment.property==propertyID && locationPayment.paymentLocationType==paymentType))
    }

    static selectStateLocationPaymentByBillingRef(billingRef)
    {
        return createSelector([LocationPaymentState],(state)=>{
            let data=state.locationPayments.find((u:LocationPaymentModel)=>u.billingRef==billingRef)
            if(data) return data
            return null;
        })
    }
    @Action(LocationPaymentAction.ResetAllState)
    resetAllState(ctx:StateContext<LocationPaymentStateModel>)
    {
        ctx.setState({
            loadingLocationPayment:false,
            locationPayments:[],
            initLoadingState:'NO_LOADED',
        }) 
    }

    @Action(LocationPaymentAction.Logout)
    logout(ctx:StateContext<LocationPaymentStateModel>)
    {
        ctx.setState({
            loadingLocationPayment:false,
            locationPayments:[],
            initLoadingState:'NO_LOADED',
        }) 
    }

    @Action(LocationPaymentAction.SetLocationPayments)
    setLocationPayment(ctx:StateContext<LocationPaymentStateModel>, {payementLocations}:LocationPaymentAction.SetLocationPayments)
    {
        const state = ctx.getState();
        const data = [...state.locationPayments]
        payementLocations.forEach((payement)=>{
            let index = data.findIndex((u)=>u._id==payement._id);
            if(index==-1) data.push(payement);            
        })
        ctx.patchState({
            locationPayments:data
        })
    }

    @Action([LocationPaymentAction.DeleteLocationPayment, LocationPaymentAction.DeletehLocationPayment])
    deleteLocationPayment(ctx:StateContext<LocationPaymentStateModel>, action: LocationPaymentAction.DeleteLocationPayment | LocationPaymentAction.DeletehLocationPayment)
    {
        const state = ctx.getState();
        ctx.patchState({
            loadingLocationPayment: true
        })


        const { locationPaymentId, locataireId, propertyID } = action;

        return this._locationPaymentsService.deleteLocationPayment(locationPaymentId).pipe(
            tap(
                (result)=>{
                    const data = [...state.locationPayments]
                    let index = data.findIndex((u)=>u._id==locationPaymentId);
                    if(index>-1) data.splice(index,1);
                    ctx.patchState({
                        loadingLocationPayment:false,
                        locationPayments:data
                    })
                    this._toastrService.success(`Paiement supprimer avec success!`, 'Ndewa360°');

                    // Mise à jour de l'historique
                    if (locataireId) {
                        ctx.dispatch(new HistoryLocationPaymentAction.DeleteHistoryLocationPaymentTransaction(locationPaymentId, locataireId));
                    } else {
                        console.warn('⚠️ ID de locataire manquant pour la suppression de l\'historique');
                    }

                    // Rafraîchissement des statistiques
                    if (propertyID) {
                        ctx.dispatch(new StatisticAction.RefreshStaticLocataireDataByPropertyIdAndYear(propertyID, `${new Date().getFullYear()}`));
                    } else {
                        console.warn('⚠️ ID de propriété manquant pour le rafraîchissement des statistiques');
                    }
                }
            ),
            catchError((error) => {
                ctx.patchState({
                    loadingLocationPayment: false
                })
                console.error('Erreur lors de la suppression du paiement:', error);
                this._toastrService.error('Erreur lors de la suppression du paiement', 'Erreur');
                return throwError(error);
            })
        )
    }

    @Action(LocationPaymentAction.UpdateLocationPayment)
    updateLocationPayment(ctx:StateContext<LocationPaymentStateModel>, {locationPayment,id,locataireID}:LocationPaymentAction.UpdateLocationPayment)
    {
        const state = ctx.getState();
        ctx.patchState({
            loadingLocationPayment: true
        })


        return this._locationPaymentsService.updateLocationPayment(locationPayment,id).pipe(
            tap(
                (result)=>{
                    const data = [...state.locationPayments]
                    let index = data.findIndex((u)=>u._id==id);
                    if(index>-1) data[index]=result.data;
                    ctx.patchState({
                        loadingLocationPayment:false,
                        locationPayments:data
                    })
                    this._toastrService.success(`Paiement mise à jour avec success!`, 'Ndewa360°');

                    // Mise à jour de l'historique
                    if (locataireID) {
                        ctx.dispatch(new HistoryLocationPaymentAction.UpdateHistoryLocationPaymentTransaction(id, locataireID, result.data));
                    } else {
                        console.warn('⚠️ ID de locataire manquant pour la mise à jour de l\'historique');
                    }

                    // Rafraîchissement des statistiques
                    const propertyId = locationPayment.propertyId || locationPayment.property;
                    if (propertyId) {
                        ctx.dispatch(new StatisticAction.RefreshStaticLocataireDataByPropertyIdAndYear(propertyId, `${new Date().getFullYear()}`));
                    } else {
                        console.warn('⚠️ ID de propriété manquant pour le rafraîchissement des statistiques');
                    }
                }
            ),
            catchError((error) => {
                ctx.patchState({
                    loadingLocationPayment: false
                })
                return throwError(error);
                
            })
        )
    }

    
    @Action(LocationPaymentAction.updateLoadingLocationPaymentState)
    updateLoadingLocationPaymentState(ctx:StateContext<LocationPaymentStateModel>,{status}:LocationPaymentAction.updateLoadingLocationPaymentState)
    {
        const state = ctx.getState();
        ctx.patchState(
            {
                loadingLocationPayment:status
            }
        )
        return of(true)
    }

   

    @Action(LocationPaymentAction.FetchLocationPayment)
    fetchLocationPayment(ctx:StateContext<LocationPaymentStateModel>,{locationPaymentId}:LocationPaymentAction.FetchLocationPayment)
    {
        const state = ctx.getState();
        let index = state.locationPayments.findIndex((u)=>u._id==locationPaymentId);

        if(index>-1) return of(true);

        ctx.patchState({
            loadingLocationPayment:true
        })
        return this._locationPaymentsService.getLocationPayment(locationPaymentId).pipe(
            tap(
                result => {
                    ctx.patchState({
                        loadingLocationPayment:false,
                        locationPayments:[...state.locationPayments, result.data]
                    })
                }
            )
        )
    }

    @Action([LocationPaymentAction.AddLocationPayment, LocationPaymentAction.CreateLocationPayment])
    addLocationPayment(ctx:StateContext<LocationPaymentStateModel>, action: LocationPaymentAction.AddLocationPayment | LocationPaymentAction.CreateLocationPayment)
    {
        const state = ctx.getState();
        const locationPayment = action.locationPayment;

        ctx.patchState({
            loadingLocationPayment:true
        })
        return this._locationPaymentsService.createLocationPayment(locationPayment).pipe(
            tap(
                result => {
                    ctx.patchState({
                        loadingLocationPayment:false,
                        locationPayments:[...state.locationPayments, result.data]
                    })
                    // Mise à jour de l'historique
                    const tenantId = locationPayment.locataireId || locationPayment.locataire;
                    if (tenantId) {
                        ctx.dispatch(new HistoryLocationPaymentAction.AddHistoryLocationPaymentTransaction(tenantId, result.data));
                    } else {
                        console.warn('⚠️ ID de locataire manquant pour la mise à jour de l\'historique');
                    }

                    // Rafraîchissement des statistiques
                    const propertyId = locationPayment.propertyId || locationPayment.property;
                    if (propertyId) {
                        ctx.dispatch(new StatisticAction.RefreshStaticLocataireDataByPropertyIdAndYear(propertyId, `${new Date().getFullYear()}`));
                    } else {
                        console.warn('⚠️ ID de propriété manquant pour le rafraîchissement des statistiques');
                    }
                    this._toastrService.success(`Paiement ajouté avec success!`, 'Ndewa360°');

                }
            ),
            catchError((error)=>{
                ctx.patchState({
                    loadingLocationPayment: false
                })
                console.error('Erreur lors de l\'ajout du paiement:', error);
                this._toastrService.error('Erreur lors de l\'ajout du paiement', 'Erreur');
                return throwError(error);
            })
        )
    }


    @Action(LocationPaymentAction.FetchLocationPaymentsByPropertyId)
    fetchLocationPaymentsByPropertyId(ctx:StateContext<LocationPaymentStateModel>,{propertyId}:LocationPaymentAction.FetchLocationPaymentsByPropertyId)
    {
        const state = ctx.getState();
        if(state.locationPayments.findIndex((u)=>u.property==propertyId)>-1) return of(true);

        ctx.patchState({
            loadingLocationPayment:true,
            initLoadingState:"LOADING"
        })
        return this._locationPaymentsService.getLocationPayments(propertyId).pipe(
            tap(
                result => {
                    //console.log("Fetch LocationPayments ",result)
                    ctx.patchState({
                        loadingLocationPayment:false,
                        locationPayments:[...state.locationPayments,...result.data],
                        initLoadingState:"LOADED"
                    })
                }
            ),
            catchError((error)=>{
                ctx.patchState({
                    loadingLocationPayment: false
                })
                return throwError(error);
            })
        )
    }
}