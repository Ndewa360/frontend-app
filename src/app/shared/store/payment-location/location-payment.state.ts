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
    static setlectStateLocationPayments(state:LocationPaymentStateModel)
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

    @Action(LocationPaymentAction.DeletehLocationPayment)
    deleteLocationPayment(ctx:StateContext<LocationPaymentStateModel>, {locationPaymentId,locataireId}:LocationPaymentAction.DeletehLocationPayment)
    {
        const state = ctx.getState();
        ctx.patchState({
            loadingLocationPayment: true
        })


        return this._locationPaymentsService.deleteLocationPayment(locationPaymentId).pipe(
            tap(
                (result)=>{
                    console.log("Result update location payment ",result)
                    const data = [...state.locationPayments]
                    let index = data.findIndex((u)=>u._id==locationPaymentId);
                    if(index>-1) data.splice(index,1);
                    ctx.patchState({
                        loadingLocationPayment:false,
                        locationPayments:data
                    })
                    this._toastrService.success(`Paiement supprimer avec success!`, 'Ndewa360°');

                    ctx.dispatch(new HistoryLocationPaymentAction.DeleteHistoryLocationPaymentTransaction(locationPaymentId,locataireId))
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
                    console.log("Result update location payment ",result)
                    const data = [...state.locationPayments]
                    let index = data.findIndex((u)=>u._id==id);
                    if(index>-1) data[index]=result.data;
                    ctx.patchState({
                        loadingLocationPayment:false,
                        locationPayments:data
                    })
                    this._toastrService.success(`Paiement mise à jour avec success!`, 'Ndewa360°');

                    ctx.dispatch(new HistoryLocationPaymentAction.UpdateHistoryLocationPaymentTransaction(id,locataireID,result.data))
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

    @Action(LocationPaymentAction.CreateLocationPayment)
    createLocationPayment(ctx:StateContext<LocationPaymentStateModel>,{locationPayment}:LocationPaymentAction.CreateLocationPayment)
    {
        const state = ctx.getState();

        ctx.patchState({
            loadingLocationPayment:true
        })
        return this._locationPaymentsService.createLocationPayment(locationPayment).pipe(
            tap(
                result => {
                    //console.log("LocationPayment Created ",result);
                    ctx.patchState({
                        loadingLocationPayment:false,
                        locationPayments:[...state.locationPayments, result.data]
                    })
                    this._toastrService.success(`Paiement ajouté avec success!`, 'Ndewa360°');
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