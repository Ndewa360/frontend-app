import { Action, Selector, State, StateContext, createSelector } from "@ngxs/store";
import { Injectable } from "@angular/core";
import { HistoryLocationPaymentAction } from "./history-location-payment.actions";
import { HistoryLocationPaymentService } from "./history-location-payment.service";
 import { ToastrService } from "ngx-toastr";
import { of, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { HistoryLocationPaymentModel } from "./history-location-payment.model";

export class HistoryLocationPaymentStateModel {
    historyLocationPayments:HistoryLocationPaymentModel[]
    loadingHistoryLocationPayment:boolean
    initLoadingState:'NO_LOADED'|'LOADING'|'LOADED';
}


@State<HistoryLocationPaymentStateModel>({
    name: "historylocationpayment",
    defaults:{
        loadingHistoryLocationPayment:false,
        historyLocationPayments:[],
        initLoadingState:'NO_LOADED',
    }
})
@Injectable()
export class HistoryLocationPaymentState{
    constructor(
        private _historyLocationPaymentsService:HistoryLocationPaymentService,
        private _toastrService:ToastrService
        // private notificationService: NotificationService,

    ){}

    @Selector()
    static selectStateLoading(state:HistoryLocationPaymentStateModel)
    {
        return state.loadingHistoryLocationPayment
    }
    @Selector() 
    static setlectStateHistoryLocationPayments(state:HistoryLocationPaymentStateModel)
    {
        return state.historyLocationPayments
    }

    static selectStateHistoryLocationPayment(historyLocationPaymentId)
    {
        return createSelector([HistoryLocationPaymentState],(state)=>{
            let data=state.historyLocationPayments.find((u)=>u._id==historyLocationPaymentId)
            if(data) return data
            return null;
        })
    
    }

    static selectStateHistoryLocationPaymentByPropertyId(propertyID)
    {
        return createSelector([HistoryLocationPaymentState],(state)=> state.historyLocationPayments.filter((historyLocationPayment)=>historyLocationPayment.property._id==propertyID))
    }

   
    static selectStateHistoryLocationPaymentByLocataireId(locataireID)
    {
        return createSelector([HistoryLocationPaymentState],(state)=> state.historyLocationPayments.filter((historyLocationPayment)=>historyLocationPayment.location.locataire==locataireID))
    }   

    @Action(HistoryLocationPaymentAction.FetchHistoryLocationPayment)
    fetchHistoryLocationPayment(ctx:StateContext<HistoryLocationPaymentStateModel>,{historyLocationPaymentId}:HistoryLocationPaymentAction.FetchHistoryLocationPayment)
    {
        const state = ctx.getState();
        let index = state.historyLocationPayments.findIndex((u)=>u._id==historyLocationPaymentId);

        if(index>-1) return of(true);

        ctx.patchState({
            loadingHistoryLocationPayment:true
        })
        return this._historyLocationPaymentsService.getHistoryLocationPayments(historyLocationPaymentId).pipe(
            tap(
                result => {
                    ctx.patchState({
                        loadingHistoryLocationPayment:false,
                        historyLocationPayments:[...state.historyLocationPayments, ...result.data]
                    })
                }
            )
        )
    }

    @Action(HistoryLocationPaymentAction.FetchHistoryLocationByLocataireId)
    fetchHistoryLocationPaymentsByLocataireId(ctx:StateContext<HistoryLocationPaymentStateModel>,{locataireID}:HistoryLocationPaymentAction.FetchHistoryLocationByLocataireId)
    {
        const state = ctx.getState();
        if(state.historyLocationPayments.findIndex((u)=>u.locataire._id==locataireID)>-1) return of(true);

        ctx.patchState({
            loadingHistoryLocationPayment:true,
            initLoadingState:"LOADING"
        })
        return this._historyLocationPaymentsService.getHistoryLocationPayments(locataireID).pipe(
            tap(
                result => {
                    console.log("Fetch HistoryLocationPayments ",result)
                    ctx.patchState({
                        loadingHistoryLocationPayment:false,
                        historyLocationPayments:[...state.historyLocationPayments,...result.data],
                        initLoadingState:"LOADED"
                    })
                }
            ),
            catchError((error)=>{
                ctx.patchState({
                    loadingHistoryLocationPayment: false
                })
                let message = error?.error?.message;
                if(!message) message = "Une erreur c'est produite! Réessayez plus tard"
                this._toastrService.error(message, 'Ndiye');
                return throwError(error);
            })
        )
    }

    @Action(HistoryLocationPaymentAction.FetchHistoryLocationPaymentsByPropertyId)
    fetchHistoryLocationPaymentsByPropertyId(ctx:StateContext<HistoryLocationPaymentStateModel>,{propertyId}:HistoryLocationPaymentAction.FetchHistoryLocationPaymentsByPropertyId)
    {
        const state = ctx.getState();
        if(state.historyLocationPayments.findIndex((u)=>u.property._id==propertyId)>-1) return of(true);

        ctx.patchState({
            loadingHistoryLocationPayment:true,
            initLoadingState:"LOADING"
        })
        return this._historyLocationPaymentsService.getHistoryLocationPayments(propertyId).pipe(
            tap(
                result => {
                    console.log("Fetch HistoryLocationPayments ",result)
                    ctx.patchState({
                        loadingHistoryLocationPayment:false,
                        historyLocationPayments:[...state.historyLocationPayments,...result.data],
                        initLoadingState:"LOADED"
                    })
                }
            ),
            catchError((error)=>{
                ctx.patchState({
                    loadingHistoryLocationPayment: false
                })
                let message = error?.error?.message;
                if(!message) message = "Une erreur c'est produite! Réessayez plus tard"
                this._toastrService.error(message, 'Ndiye');
                return throwError(error);
            })
        )
    }
}