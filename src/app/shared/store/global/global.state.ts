import { Action, Selector, State, StateContext } from "@ngxs/store";
import { GlobalModel } from "./global.model";
import { Injectable } from "@angular/core";
import { GlobalAction } from "./global.actions";
import { of } from "rxjs";

@State<GlobalModel>({
    name: "globals",
    defaults:{
        isLoading:false,
        isConnectedToWhatsapp:false,
        notifications:[],
        hasInternetConnexion:true
    }
})
@Injectable()
export class GlobalState{

    @Action(GlobalAction.ChangeLoading)
    setGlobalLoading(ctx:StateContext<GlobalModel>,action:GlobalAction.ChangeLoading)
    {
        ctx.patchState({isLoading:action.isLoading});
        return of(true)
    }

    @Selector()
    static selectStateConnectedWhatsApp(state:GlobalModel)
    {
        return state.isConnectedToWhatsapp
    }

    @Selector()
    static selectStateHasConnexionInternet(state:GlobalModel)
    {
        return state.hasInternetConnexion
    }


    @Action(GlobalAction.AddNotification)
    addNewGlobalNotification(ctx:StateContext<GlobalModel>,action:GlobalAction.AddNotification)
    {
        const state = ctx.getState()
        const notifs = [...state.notifications,action.notification];
        const pos = notifs.length-1;
        ctx.patchState({notifications:notifs});
        setTimeout(()=>{
            notifs.splice(pos,1);
            ctx.patchState({notifications:notifs})
        },10000);
    }

    @Action(GlobalAction.SetConnexionInternetState)
    setInternetConnexionState(ctx:StateContext<GlobalModel>,{isConnected}:GlobalAction.SetConnexionInternetState)
    {
        ctx.patchState({hasInternetConnexion:isConnected});
    }
  

    @Action(GlobalAction.StartLoadData)
    loadDataConnectedAppStatus(ctx:StateContext<GlobalModel>,)
    {
        return ;
    }

    @Action(GlobalAction.ChangeWhatsAppConnectedStatus)
    updateWhatsConnectedAppStatus(ctx:StateContext<GlobalModel>,{status}:GlobalAction.ChangeWhatsAppConnectedStatus)
    {
        ctx.patchState({isConnectedToWhatsapp:status});
        return of(true);
    }
}