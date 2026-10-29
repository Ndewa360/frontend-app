import { Action, Selector, State, StateContext, createSelector } from "@ngxs/store";
import { UserModel } from "./user.model";
import { Injectable } from "@angular/core";
import { UserAction } from "./user.actions";
// import { ToastrService } from "ngx-toastr";
import { of, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { ToastrService } from "ngx-toastr";
import { TranslateService } from "@ngx-translate/core";

export class UserStateModel {
    users:UserModel[]
    loadingUser:boolean
    initLoadingState:'NO_LOADED'|'LOADING'|'LOADED';
}


@State<UserStateModel>({
    name: "userlist",
    defaults:{
        loadingUser:false,
        users:[],
        initLoadingState:'NO_LOADED',
    }
})
@Injectable()
export class UserState{
    constructor(
        private _toastrService:ToastrService,
        private _translateService: TranslateService
    ){}

    @Selector()
    static selectStateLoading(state:UserStateModel)
    {
        return state.loadingUser
    }
    @Selector() 
    static selectStateUsers(state:UserStateModel)
    {
        return state.users
    }

    static selectStateUser(userId)
    {
        return createSelector([UserState],(state)=>{
            let data=state.users.find((u)=>u.id==userId)
            if(data) return data
            return null;
        })
    
    }

    static selectStateUserByUserName(name=null)
    {
        return createSelector([UserState],(state)=> state.users.filter((user)=>{
                if(name==null) return user;
                if(user.name.indexOf(name)) return user;
            }))
    
    }

    
    @Action(UserAction.updateLoadingUserState)
    updateLoadingUserState(ctx:StateContext<UserStateModel>,{status}:UserAction.updateLoadingUserState)
    {
        const state = ctx.getState();
        ctx.patchState(
            {
                loadingUser:status
            }
        )
        return of(true)
    }

   

    @Action(UserAction.ResetAllState)
    resetAllState(ctx:StateContext<UserStateModel>)
    {
        ctx.setState({
            loadingUser:false,
            users:[],
            initLoadingState:'NO_LOADED',
        })
    }

    @Action(UserAction.Logout)
    logout(ctx:StateContext<UserStateModel>)
    {
        ctx.setState({
            loadingUser:false,
            users:[],
            initLoadingState:'NO_LOADED',
        })
    }

}
