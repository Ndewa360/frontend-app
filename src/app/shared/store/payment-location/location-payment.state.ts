import { Action, Selector, State, StateContext, createSelector } from "@ngxs/store";
import { PropertyDetailsAction } from "../property-details/property-details.actions";
import { propertyPayments } from "../property-details/property-details.model";
import { LocationPaymentModel, LocationPaymentType } from "./location-payment.model";
import { Injectable } from "@angular/core";
import { LocationPaymentAction } from "./location-payment.actions";
import { LocationPaymentService } from "./location-payment.service";
// import { ToastrService } from "ngx-toastr";
import { of, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { NotificationService } from "carbon-components-angular";
import { ToastrService } from "ngx-toastr";
import { TranslateService } from "@ngx-translate/core";
import { RoomAction } from "../rooms";
import { LocataireAction } from "../locataire";
import { HistoryLocationPaymentAction } from "../history-payment-location";
import { StatisticAction } from "../statistic-data";
import { refreshPropertyScreen } from "../property-details/property-refresh";
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
        private _toastrService:ToastrService,
        private _translateService: TranslateService
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
    /** Écran du bien chargé (GET /property/:id/details) : paiements du bien remplacés. */
    @Action(PropertyDetailsAction.Loaded)
    propertyDetailsLoaded(ctx:StateContext<LocationPaymentStateModel>,{propertyId,details}:PropertyDetailsAction.Loaded)
    {
        const payments = propertyPayments(details);
        const ids = new Set(payments.map((payment) => payment._id));
        const others = ctx.getState().locationPayments.filter((payment) => payment.property != propertyId && !ids.has(payment._id));
        ctx.patchState({ loadingLocationPayment:false, locationPayments:[...others, ...payments], initLoadingState:"LOADED" })
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
                    const data = [...ctx.getState().locationPayments]
                    let index = data.findIndex((u)=>u._id==locationPaymentId);
                    const deletedProperty = index > -1 ? data[index].property : null;
                    if(index>-1) data.splice(index,1);
                    ctx.patchState({
                        loadingLocationPayment:false,
                        locationPayments:data
                    })
                    this._toastrService.success(this._translateService.instant('NOTIFICATIONS.PAYMENT_DELETED_SUCCESS'), 'Ndewa360°');

                    // Mise à jour de l'historique
                    if (locataireId) {
                        ctx.dispatch(new HistoryLocationPaymentAction.DeleteHistoryLocationPaymentTransaction(locationPaymentId, locataireId));
                    } else {
                    }

                    // Liste, totaux et statistiques du bien rechargés aussitôt.
                    refreshPropertyScreen(ctx, propertyID || deletedProperty);
                }
            ),
            catchError((error) => {
                ctx.patchState({
                    loadingLocationPayment: false
                })
                this._toastrService.error(this._translateService.instant('NOTIFICATIONS.PAYMENT_DELETE_ERROR'), 'Ndewa360°');
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
                    const data = [...ctx.getState().locationPayments]
                    let index = data.findIndex((u)=>u._id==id);
                    const previousProperty = index > -1 ? data[index].property : null;
                    if(index>-1) data[index]=result.data;
                    ctx.patchState({
                        loadingLocationPayment:false,
                        locationPayments:data
                    })
                    this._toastrService.success(this._translateService.instant('NOTIFICATIONS.PAYMENT_UPDATED_SUCCESS'), 'Ndewa360°');

                    // Mise à jour de l'historique
                    if (locataireID) {
                        ctx.dispatch(new HistoryLocationPaymentAction.UpdateHistoryLocationPaymentTransaction(id, locataireID, result.data));
                    } else {
                    }

                    // Liste, totaux et statistiques du bien rechargés aussitôt.
                    refreshPropertyScreen(ctx, locationPayment.propertyId || locationPayment.property || result.data?.property || previousProperty);
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
                    // Le serveur renvoie soit le paiement créé, soit, quand le
                    // montant est réparti entre caution et loyer, un récapitulatif
                    // { totalAmount, paymentsCreated: [...] }. Ce récapitulatif
                    // était ajouté tel quel à la liste : le paiement n'apparaissait
                    // qu'après actualisation.
                    const body: any = result.data;
                    const created: LocationPaymentModel[] = Array.isArray(body?.paymentsCreated)
                        ? body.paymentsCreated
                        : (body ? [body] : []);
                    const known = new Set(ctx.getState().locationPayments.map((p) => p._id));
                    ctx.patchState({
                        loadingLocationPayment:false,
                        locationPayments:[...ctx.getState().locationPayments, ...created.filter((p) => !known.has(p._id))]
                    })
                    // Mise à jour de l'historique
                    const tenantId = locationPayment.locataireId || locationPayment.locataire;
                    if (tenantId) {
                        created.forEach((payment) => ctx.dispatch(new HistoryLocationPaymentAction.AddHistoryLocationPaymentTransaction(tenantId, payment)));
                    }

                    // Liste, totaux et statistiques du bien rechargés aussitôt.
                    refreshPropertyScreen(ctx, locationPayment.propertyId || locationPayment.property || created[0]?.property);
                    this._toastrService.success(this._translateService.instant('NOTIFICATIONS.PAYMENT_CREATED_SUCCESS'), 'Ndewa360°');

                }
            ),
            catchError((error)=>{
                ctx.patchState({
                    loadingLocationPayment: false
                })
                this._toastrService.error(this._translateService.instant('NOTIFICATIONS.PAYMENT_CREATE_ERROR'), 'Ndewa360°');
                return throwError(error);
            })
        )
    }


    @Action(LocationPaymentAction.FetchLocationPaymentsByPropertyId)
    fetchLocationPaymentsByPropertyId(ctx:StateContext<LocationPaymentStateModel>,{propertyId}:LocationPaymentAction.FetchLocationPaymentsByPropertyId)
    {
        // Rechargement systématique : la requête était ignorée dès qu'un paiement
        // du bien était connu, si bien que les nouveaux paiements (paiements
        // initiaux d'une attribution notamment) n'apparaissaient jamais.
        ctx.patchState({
            loadingLocationPayment:true,
            initLoadingState:"LOADING"
        })
        return this._locationPaymentsService.getLocationPayments(propertyId).pipe(
            tap(
                result => {
                    //console.log("Fetch LocationPayments ",result)
                    const others = ctx.getState().locationPayments.filter((u)=>u.property!=propertyId);
                    ctx.patchState({
                        loadingLocationPayment:false,
                        locationPayments:[...others,...result.data],
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