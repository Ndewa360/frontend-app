import { Action, Selector, State, StateContext, createSelector } from "@ngxs/store";
import { Injectable } from "@angular/core";
import { StatisticAction } from "./statistic.actions";
import { StatisticService } from "./statistic.service";
// import { ToastrService } from "ngx-toastr";
import { of, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { UtilsString } from "../../utils";
import { ToastrService } from "ngx-toastr";
import { StatisticAllPaymentLocataireYearModel, StatisticLocataireYearModel, StatisticRoomYearModel } from "./statistic.model";

export class StatisticStateModel {
    roomStatistic:StatisticRoomYearModel[] //statistic de chambre
    locataireStatistic:StatisticLocataireYearModel[] //statistic de locataire
    allLocatairePayementByYear:StatisticAllPaymentLocataireYearModel[] //statistique de paiement

    loadingStatistic:boolean
    loadingRoomStatistic:boolean
    locataireStatisticLoading:boolean
    allLocatairePayementByYearLoading:boolean
}


@State<StatisticStateModel>({
    name: "statistics",
    defaults:{
        loadingStatistic:false,
        loadingRoomStatistic:false,
        locataireStatisticLoading:false,
        allLocatairePayementByYearLoading:false,
        roomStatistic:[],
        locataireStatistic:[],
        allLocatairePayementByYear:[]
        // initLoadingState:'NO_LOADED',
    }
})
@Injectable()
export class StatisticState{
   
    constructor(
        private _statisticsService:StatisticService,
        private _toastrService:ToastrService,
    ){}

    @Selector()
    static selectStateLoading(state:StatisticStateModel)
    {
        return state.loadingStatistic
    }

    @Selector()
    static selectStateLocataireStatisticLoading(state:StatisticStateModel)
    {
        return state.locataireStatisticLoading
    }

    @Selector()
    static selectStateLocatairePaymentStatisticLoading(state:StatisticStateModel)
    {
        return state.allLocatairePayementByYearLoading
    }


    @Selector()
    static selectStateRoomStatisticLoading(state:StatisticStateModel)
    {
        return state.loadingRoomStatistic
    }
   

    static selectStateStatisticByRoom(roomId)
    {
        return createSelector([StatisticState],(state)=>{
            if(!roomId) return null;
            let data=state.roomStatistic.find((u)=>u.room._id==roomId)
            if(data) return data
            return null;
        })
    }

    static selectStateStatisticLocataireByPropertyIdAndYear(propertyID,year:number=new Date().getFullYear())
    {
        return createSelector([StatisticState],(state)=> {
            //console.log("Locataire Statistic Found",state.locataireStatistic)
            return state.locataireStatistic.filter((u)=>u.locataire.property==propertyID && u.year==year)
        })    
    }

    static selectStateStatisticAllPaymentLocataireByPropertyIdAndYear(propertyID,year:number|string=new Date().getFullYear())
    {
        return createSelector([StatisticState],(state)=> state.allLocatairePayementByYear.filter((u)=>u.locataire.property==propertyID && u.year==year))    
    }

    @Action(StatisticAction.FetchStaticRoomDataByPropertyIdAndYear)
    fetchRoomStatisticByPropertyAndYear(ctx:StateContext<StatisticStateModel>,{propertyID,year}:StatisticAction.FetchStaticRoomDataByPropertyIdAndYear)
    {
        const state = ctx.getState();
        let index = state.roomStatistic.findIndex((u)=>u.room.property==propertyID && year==u.year);
        // //console.log("Index Static", index,propertyID,state.roomStatistic)
        if(index>-1) return of(true);

        ctx.patchState({
            loadingStatistic:true,
            loadingRoomStatistic:true
        })
        return this._statisticsService.getStatisticRoomDataByYear(propertyID,year).pipe(
            tap(
                result => {
                    ctx.patchState({
                        loadingStatistic:false,
                        loadingRoomStatistic:false,
                        roomStatistic:[...state.roomStatistic, ...result.data]
                    })
                }
            )
        )
    }

    @Action(StatisticAction.ResetAllState)
    resetAllState(ctx:StateContext<StatisticStateModel>)
    {
        ctx.patchState({
            loadingStatistic:false,
            loadingRoomStatistic:false,
            locataireStatisticLoading:false,
            allLocatairePayementByYearLoading:false,
            roomStatistic:[],
            locataireStatistic:[],
            allLocatairePayementByYear:[]
            // initLoadingState:'NO_LOADED',
        })
    }

    @Action(StatisticAction.FetchStaticLocataireDataByPropertyIdAndYear)
    fetchLocataireStatisticByPropertyAndYear(ctx:StateContext<StatisticStateModel>,{propertyID,year}:StatisticAction.FetchStaticLocataireDataByPropertyIdAndYear)
    {
        const state = ctx.getState();
        let index = state.locataireStatistic.findIndex((u)=>u.locataire.property==propertyID && u.year==year);
        // //console.log("Index Static", index,propertyID,state.roomStatistic)
        if(index>-1) return of(true);

        ctx.patchState({
            loadingStatistic:true,
            locataireStatisticLoading:true
        })
        return this._statisticsService.getStatisticLocataireDataByYear(propertyID,year).pipe(
            tap(
                result => {
                    //console.log("Result Locataire data",result)
                    ctx.patchState({
                        loadingStatistic:false,
                        locataireStatisticLoading:false,
                        locataireStatistic:[...state.locataireStatistic, ...result.data]
                    })
                }
            )
        )
    }

    @Action(StatisticAction.FetchStaticAllPaymentLocataireDataByPropertyIdAndYear)
    fetchAllPayementLocataireStatisticByPropertyAndYear(ctx:StateContext<StatisticStateModel>,{propertyID,year}:StatisticAction.FetchStaticAllPaymentLocataireDataByPropertyIdAndYear)
    {
        const state = ctx.getState();
        let index = state.allLocatairePayementByYear.findIndex((u)=>u.locataire.property==propertyID && year==u.year);
        // //console.log("Index Static", index,propertyID,state.roomStatistic)
        if(index>-1) return of(true);

        ctx.patchState({
            loadingStatistic:true,
            allLocatairePayementByYearLoading:true
            
        })
        return this._statisticsService.getAllPaymentLocataireStatisticDataByYear(propertyID,year).pipe(
            tap(
                result => {
                    //console.log("Result Locataire Statistic",result)
                    ctx.patchState({
                        loadingStatistic:false,
                        allLocatairePayementByYearLoading:false,
                        allLocatairePayementByYear:[...state.allLocatairePayementByYear, ...result.data]
                    })
                }
            )
        )
    }   
}