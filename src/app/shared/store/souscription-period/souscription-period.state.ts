import { Action, Selector, State, StateContext, createSelector } from "@ngxs/store";
import { SouscriptionPeriodModel } from "./souscription-period.model";
import { Injectable } from "@angular/core";
import { SouscriptionPeriodAction } from "./souscription-period.actions";
// import { ToastrService } from "ngx-toastr";
import { Observable, of, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { NotificationService } from "carbon-components-angular";
import { ToastrService } from "ngx-toastr";
import { RoomAction } from "../rooms";
import { LocataireAction } from "../locataire";
import { SouscriptionPeriodService } from "./souscription-period.service";
import { ApiResultFormat } from "../global";
import { LoaderTypeState } from "../../utils";

export class SouscriptionPeriodStateModel {
    souscriptionPeriod:SouscriptionPeriodModel[]
    loadingSouscriptionPeriod:boolean
    initLoadingState: LoaderTypeState;
}


@State<SouscriptionPeriodStateModel>({
    name: "souscriptionperiodlist",
    defaults:{
        loadingSouscriptionPeriod:false,
        souscriptionPeriod:[],
        initLoadingState:'NO_LOADED',
    }
})
@Injectable()
export class SouscriptionPeriodState{
    constructor(
        private _souscriptionPeriodService:SouscriptionPeriodService,
        private _toastrService:ToastrService
        // private notificationService: NotificationService,

    ){}

    @Selector()
    static selectStateLoading(state:SouscriptionPeriodStateModel)
    {
        return state.loadingSouscriptionPeriod
    }

    @Selector()
    static selectStateInitLoading(state:SouscriptionPeriodStateModel)
    {
        return state.initLoadingState
    }

    @Selector() 
    static setlectStateSouscriptionPeriods(state:SouscriptionPeriodStateModel)
    {
        return state.souscriptionPeriod
    }

    static selectStateSouscriptionPeriod(souscriptionPeriodId)
    {
        return createSelector([SouscriptionPeriodState],(state)=>{
            let data=state.souscriptionPeriod.find((u)=>u._id==souscriptionPeriodId)
            if(data) return data
            return null;
        })
    }

    @Action(SouscriptionPeriodAction.SetSouscriptionPeriod)
    setSouscriptionPeriod(ctx:StateContext<SouscriptionPeriodStateModel>,{souscriptionPeriod}:SouscriptionPeriodAction.SetSouscriptionPeriod)
    {
        const state = ctx.getState();
        let index = state.souscriptionPeriod.findIndex((u)=>u._id==souscriptionPeriod._id);

        if(index>-1) return of(true);

        ctx.patchState({
            souscriptionPeriod:[...state.souscriptionPeriod, souscriptionPeriod]
        })
        return of(true);
    }
    
    @Action(SouscriptionPeriodAction.SetInitLoading)
    setInitLoading(ctx:StateContext<SouscriptionPeriodStateModel>, {stateLoading}:SouscriptionPeriodAction.SetInitLoading)
    {
        ctx.patchState({
            initLoadingState:stateLoading
        })
    }

    @Action(SouscriptionPeriodAction.FetchSouscriptionPeriod)
    fetchSouscriptionPeriod(ctx:StateContext<SouscriptionPeriodStateModel>,{souscriptionPeriodId}:SouscriptionPeriodAction.FetchSouscriptionPeriod)
    {
        const state = ctx.getState();
        let index = state.souscriptionPeriod.findIndex((u)=>u._id==souscriptionPeriodId);

        if(index>-1) return of(true);

        ctx.patchState({
            loadingSouscriptionPeriod:true
        })
        return this._souscriptionPeriodService.getSouscriptionPeriod(souscriptionPeriodId).pipe(
            tap(
                result => {
                    ctx.patchState({
                        loadingSouscriptionPeriod:false,
                        souscriptionPeriod:[...state.souscriptionPeriod, result.data]
                    })
                }
            )
        )
    }
}