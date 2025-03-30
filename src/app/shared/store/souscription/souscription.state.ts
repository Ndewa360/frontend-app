import { Action, Selector, State, StateContext, createSelector } from "@ngxs/store";
import { SouscriptionModel, SouscriptionType } from "./souscription.model";
import { Injectable } from "@angular/core";
import { SouscriptionAction } from "./souscription.actions";
// import { ToastrService } from "ngx-toastr";
import { Observable, of, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { NotificationService } from "carbon-components-angular";
import { ToastrService } from "ngx-toastr";
import { RoomAction } from "../rooms";
import { LocataireAction } from "../locataire";
import { SouscriptionService } from "./souscription.service";
import { ApiResultFormat } from "../global";
import { SouscriptionPeriodAction } from "../souscription-period";

export class SouscriptionStateModel {
    souscription:SouscriptionModel[]
    loadingSouscription:boolean
    initLoadingState:'NO_LOADED'|'LOADING'|'LOADED';
}


@State<SouscriptionStateModel>({
    name: "souscriptionlist",
    defaults:{
        loadingSouscription:false,
        souscription:[],
        initLoadingState:'NO_LOADED',
    }
})
@Injectable()
export class SouscriptionState{
    constructor(
        private _souscriptionService:SouscriptionService,
        private _toastrService:ToastrService
        // private notificationService: NotificationService,

    ){}

    @Selector()
    static selectStateLoading(state:SouscriptionStateModel)
    {
        return state.loadingSouscription
    }

    @Selector()
    static selectStateInitLoading(state:SouscriptionStateModel)
    {
        return state.initLoadingState
    }

    @Selector() 
    static selectStateSouscriptions(state:SouscriptionStateModel)
    {
        return state.souscription
    }

    @Selector()
    static isEndLoadingData(state:SouscriptionStateModel)
    {
        return state.initLoadingState=="LOADED"
    }

    @Selector()
    static selectStatePeriodDefaultWithRunningState(state:SouscriptionStateModel)
    {
        let souscription = state.souscription.find((u)=>u.souscriptionType==SouscriptionType.DEFAULT && u.isRunning==true);
        return souscription ? souscription : null
    }

    static selectStateSouscription(souscriptionId)
    {
        return createSelector([SouscriptionState],(state)=>{
            let data=state.souscription.find((u)=>u._id==souscriptionId)
            if(data) return data
            return null;
        })
    }

    static selectStateSouscriptionByRoomAndLocataireId(locataireId:string,roomId)
    {
        return createSelector([SouscriptionState],(state)=>{
            let data=state.souscription.find((u)=>u.locataire==locataireId && u.room==roomId)
            if(data) return data
            return null;
        })
    }
   
    resetAllState(ctx:StateContext<SouscriptionStateModel>)
    {
        ctx.setState({
            loadingSouscription:false,
            souscription:[],
            initLoadingState:'NO_LOADED',
        })
    }

    @Action(SouscriptionAction.FetchSouscriptionsByUserId)
    fetchSouscriptionByUserID(ctx:StateContext<SouscriptionStateModel>,{userId}:SouscriptionAction.FetchSouscriptionsByUserId)
    {
        const state = ctx.getState();
        let index = state.souscription.findIndex((u)=>u.owner==userId);

        if(index>-1) return of(true);

        ctx.patchState({
            loadingSouscription:true
        })
        return this._souscriptionService.getSouscriptions(userId).pipe(
            tap(
                result => {
                    console.log("Souscription data ",result.data)
                    ctx.patchState({
                        loadingSouscription:false,
                        souscription:[...state.souscription, ...result.data],
                        initLoadingState:"LOADED"
                    })
                    result.data.forEach(element => {
                        element.periods.forEach((u)=>{
                            ctx.dispatch(new SouscriptionPeriodAction.SetSouscriptionPeriod(u))
                        })
                        // ctx.dispatch(new SouscriptionPeriodAction.FetchSouscriptionPeriod(element.currentPeriod));
                    });
                    if(result.data.length==0) ctx.dispatch(new SouscriptionPeriodAction.SetInitLoading("LOADED"))
                }
            )
        )
    }

    @Action(SouscriptionAction.FetchSouscription)
    fetchSouscription(ctx:StateContext<SouscriptionStateModel>,{souscriptionId}:SouscriptionAction.FetchSouscription)
    {
        const state = ctx.getState();
        let index = state.souscription.findIndex((u)=>u._id==souscriptionId);

        if(index>-1) return of(true);

        ctx.patchState({
            loadingSouscription:true
        })
        return this._souscriptionService.getSouscription(souscriptionId).pipe(
            tap(
                result => {
                    ctx.patchState({
                        loadingSouscription:false,
                        souscription:[...state.souscription, result.data]
                    })
                }
            )
        )
    }

    @Action(SouscriptionAction.CreateSouscription)
    createSouscription(ctx:StateContext<SouscriptionStateModel>,{souscriptionType}:SouscriptionAction.CreateSouscription)
    {
        const state = ctx.getState();

        ctx.patchState({
            loadingSouscription:true
        })
        let souscription$ = new Observable<ApiResultFormat<SouscriptionModel>>;
        if(souscriptionType==SouscriptionType.DEFAULT) souscription$ = this._souscriptionService.createDefaultSouscription(); 
        return souscription$.pipe(
            tap(
                result => {
                    let period:any = result.data.periods[0];
                    result.data.periods[0]=period["_id"];
                    ctx.patchState({
                        loadingSouscription:false,
                        souscription:[...state.souscription, result.data]
                    })
                    ctx.dispatch(new SouscriptionPeriodAction.SetSouscriptionPeriod(period))
                    this._toastrService.success(`Souscription confirmer avec success!`, 'Ndewa360°');
                }
            ),
            catchError((error)=>{
                ctx.patchState({
                    loadingSouscription: false
                })
                return throwError(error);
            })
        )
    }

    @Action(SouscriptionAction.DeleteSouscription)
    removeAssignationSouscription(ctx:StateContext<SouscriptionStateModel>,{souscriptionId}:SouscriptionAction.DeleteSouscription)
    {
        const state = ctx.getState();
        ctx.patchState({
            loadingSouscription:true
        })
        return this._souscriptionService.removeAssignationSouscription(souscriptionId).pipe(
            tap(
                result => {
                    const data = [...state.souscription]
                    let index = data.findIndex((u)=>u._id==souscriptionId);
                    if(index>-1) data.splice(index,1)
                    ctx.patchState({
                        loadingSouscription:false,
                        souscription:data
                    })
                    this._toastrService.success(`Souscription retiré avec success!`, 'Ndewa360°');
                }
            ),
            catchError((error)=>{
                ctx.patchState({
                    loadingSouscription: false
                })
                return throwError(error);
            })
        )
    }

}