import { Action, Selector, State, StateContext, createSelector } from "@ngxs/store";
import { Injectable } from "@angular/core";
import { HistoryLocationPaymentAction } from "./history-location-payment.actions";
import { HistoryLocationPaymentService } from "./history-location-payment.service";
 import { ToastrService } from "ngx-toastr";
import { of, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { HistoryLocationPaymentModel } from "./history-location-payment.model";
import { LocationPaymentAction } from "../payment-location";

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
        return createSelector([HistoryLocationPaymentState],(state)=> state.historyLocationPayments.filter((historyLocationPayment)=>{
            //console.log("History ",historyLocationPayment,historyLocationPayment.property._id,propertyID)
            return historyLocationPayment.property._id==propertyID
        }))
    }

    static selectStateHistoryLocationPaymentByRoomId(roomID)
    {
        return createSelector([HistoryLocationPaymentState],(state)=> state.historyLocationPayments.filter((historyLocationPayment)=>{
            //console.log("History ",historyLocationPayment,historyLocationPayment.property._id,propertyID)
            return historyLocationPayment.room._id==roomID
        }))
    }

   
    static selectStateHistoryLocationPaymentByLocataireId(locataireID)
    {
        return createSelector([HistoryLocationPaymentState],(state)=> state.historyLocationPayments.filter((historyLocationPayment)=>historyLocationPayment.locataire._id==locataireID))
    }   

   
    @Action(HistoryLocationPaymentAction.ResetAllState)
    resetAllState(ctx:StateContext<HistoryLocationPaymentStateModel>)
    {
        ctx.setState({
            loadingHistoryLocationPayment:false,
            initLoadingState:"NO_LOADED",
            historyLocationPayments:[]
        })
    }

    @Action(HistoryLocationPaymentAction.Logout)
    logout(ctx:StateContext<HistoryLocationPaymentStateModel>)
    {
        ctx.setState({
            loadingHistoryLocationPayment:false,
            initLoadingState:"NO_LOADED",
            historyLocationPayments:[]
        })
    }

    @Action(HistoryLocationPaymentAction.UpdateHistoryLocationPaymentTransaction)
    updateHistoryLocationPayementTransaction(ctx:StateContext<HistoryLocationPaymentStateModel>,{transactionId,locataireID,transactionModel}:HistoryLocationPaymentAction.UpdateHistoryLocationPaymentTransaction)
    {
        const state = ctx.getState();
        let historyLocationPayments = JSON.parse(JSON.stringify([...state.historyLocationPayments]));

        let historyLocationPaymentIndex = -1, transactionIndex = -1;

        for(let index =0; index<historyLocationPayments.length;index++)
        {
            let historyLocationPayment = historyLocationPayments[index];
            if(historyLocationPayment.locataire._id==locataireID)
            {
                let indexTransaction = historyLocationPayment.transactions.findIndex((u)=>u._id==transactionId);
                if(indexTransaction>-1)
                {
                    historyLocationPaymentIndex = index;
                    transactionIndex = indexTransaction;
                    break;
                }
            }
        }
        
        if(historyLocationPaymentIndex<0 || transactionIndex<0) return of(true)
        
        let historyFoud = {...historyLocationPayments[historyLocationPaymentIndex]};
 
        historyFoud.transactions = [...historyFoud.transactions];
        historyFoud.transactions[transactionIndex] = transactionModel;
        historyLocationPayments[historyLocationPaymentIndex] = historyFoud;
        ctx.patchState({
            historyLocationPayments:historyLocationPayments
        })
        return of(true)
    }

    @Action(HistoryLocationPaymentAction.DeleteHistoryLocationPaymentTransaction)
    deleteHistoryLocationPayementTransaction(ctx:StateContext<HistoryLocationPaymentStateModel>,{transactionId,locataireID}:HistoryLocationPaymentAction.DeleteHistoryLocationPaymentTransaction)
    {
        const state = ctx.getState();
        let historyLocationPayments = JSON.parse(JSON.stringify([...state.historyLocationPayments]));

        let historyLocationPaymentIndex = -1, transactionIndex = -1;

        for(let index =0; index<historyLocationPayments.length;index++)
        {
            let historyLocationPayment = historyLocationPayments[index];
            if(historyLocationPayment.locataire._id==locataireID)
            {
                let indexTransaction = historyLocationPayment.transactions.findIndex((u)=>u._id==transactionId);
                if(indexTransaction>-1)
                {
                    historyLocationPaymentIndex = index;
                    transactionIndex = indexTransaction;
                    break;
                }
            }
        }
        
        if(historyLocationPaymentIndex<0 || transactionIndex<0) return of(true)
        
        let historyFoud = {...state.historyLocationPayments[historyLocationPaymentIndex]};

        historyFoud.transactions = [...historyFoud.transactions];
        historyFoud.transactions.splice(transactionIndex, 1);
        historyLocationPayments[historyLocationPaymentIndex] = historyFoud;
        ctx.patchState({
            historyLocationPayments:historyLocationPayments
        })
        return of(true)
    }

    @Action(HistoryLocationPaymentAction.AddHistoryLocationPaymentTransaction)
    addHistoryLocationPayementTransaction(ctx:StateContext<HistoryLocationPaymentStateModel>,{locataireID,transactionData}:HistoryLocationPaymentAction.AddHistoryLocationPaymentTransaction)
    {
        const state = ctx.getState();
        let historyLocationPayments = JSON.parse(JSON.stringify([...state.historyLocationPayments]));

        let historyLocationPaymentIndex = historyLocationPayments.findIndex((u)=>u.locataire._id==locataireID);
        if(historyLocationPaymentIndex<0) return of(true)
        
        let historyFoud = {...state.historyLocationPayments[historyLocationPaymentIndex]};
        
        historyFoud.transactions = [...historyFoud.transactions,transactionData];
        historyLocationPayments[historyLocationPaymentIndex] = historyFoud;
        
        console.log("History ",transactionData)
        ctx.patchState({
            historyLocationPayments:historyLocationPayments
        })
        return of(true)
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
        return this._historyLocationPaymentsService.getHistoryLocationPaymentsByLocataire(locataireID).pipe(
            tap(
                result => {
                    let stateCopy = [...state.historyLocationPayments];
                    // result.data.forEach(element => {
                    //     if(stateCopy.findIndex((item)=>item._id==element._id)==-1) stateCopy.push(element)
                    // });
                    ctx.patchState({
                        loadingHistoryLocationPayment:false,
                        historyLocationPayments:stateCopy,
                        initLoadingState:"LOADED"
                    })
                    ctx.dispatch(new LocationPaymentAction.SetLocationPayments(result.data.map((data)=>data.transactions).reduce((acc,curr)=>([...acc,...curr]),[])))
                }
            ),
            catchError((error)=>{
                ctx.patchState({
                    loadingHistoryLocationPayment: false
                })
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
        return this._historyLocationPaymentsService.getHistoryLocationPaymentsByProperty(propertyId).pipe(
            tap(
                result => {
                    console.log("History ",result.data)
                    let stateCopy = [...state.historyLocationPayments,...result.data];
                    ctx.patchState({
                        loadingHistoryLocationPayment:false,
                        historyLocationPayments:stateCopy,
                        initLoadingState:"LOADED"
                    })
                }
            ),
            catchError((error)=>{
                ctx.patchState({
                    loadingHistoryLocationPayment: false
                })
                return throwError(error);
            })
        )
    }

}