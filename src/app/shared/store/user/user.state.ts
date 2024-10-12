import { Action, Selector, State, StateContext, createSelector } from "@ngxs/store";
import { UserModel } from "./user.model";
import { Injectable } from "@angular/core";
import { UserAction } from "./user.actions";
import { UserService } from "./user.service";
// import { ToastrService } from "ngx-toastr";
import { of, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";

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
        private _usersService:UserService,
    ){}

    @Selector()
    static selectStateLoading(state:UserStateModel)
    {
        return state.loadingUser
    }
    @Selector() 
    static setlectStateUsers(state:UserStateModel)
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

    @Action(UserAction.UpdateUser)
    updateUser(ctx:StateContext<UserStateModel>, {user,id}:UserAction.UpdateUser)
    {
        const state = ctx.getState();
        ctx.patchState({
            loadingUser: true
        })

        return this._usersService.updateUser(user,id).pipe(
            tap(
                (result)=>{
                    const data = [...state.users]
                    let index = data.findIndex((u)=>u._id==id);
                    if(index>-1) data[index]=result.data;
                    ctx.patchState({
                        loadingUser:false,
                        users:data
                    })
                    // this._toastrService.success(`Profil utilisateur modifié avec success`, 'User');
                }
            ),
            catchError((error) => {
                // this._toastrService.error(error?.error?.message, 'Erreur');
                ctx.patchState({
                    loadingUser: false
                })
                return throwError(error);
                
            })
        )
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

   

    @Action(UserAction.FetchUser)
    fetchUser(ctx:StateContext<UserStateModel>,{userId}:UserAction.FetchUser)
    {
        const state = ctx.getState();
        let index = state.users.findIndex((u)=>u._id==userId);

        if(index>-1) return of(true);

        ctx.patchState({
            loadingUser:true
        })
        return this._usersService.getUser(userId).pipe(
            tap(
                result => {
                    ctx.patchState({
                        loadingUser:false,
                        users:[...state.users,...result.data]
                    })
                }
            )
        )
    }

    @Action(UserAction.FetchUsers)
    fetchUsers(ctx:StateContext<UserStateModel>,{usersId}:UserAction.FetchUsers)
    {
        const state = ctx.getState();
        let notFounds = [];
        usersId.forEach((id)=>{
            let index = state.users.findIndex((u)=>u._id==id);
            if(index==-1) notFounds.push(id);
        })
        if(notFounds.length==0 && state.initLoadingState=="LOADED") return of(true);
        
        ctx.patchState({
            loadingUser:true,
            initLoadingState:"LOADING"
        })
        return this._usersService.getUsers(usersId.length>0?notFounds:[]).pipe(
            tap(
                result => {
                    if(state.initLoadingState!="LOADED") ctx.patchState({initLoadingState:'LOADING'})
                    ctx.patchState({
                        loadingUser:false,
                        users:[...result.data],
                    })
                }
            )
        )
    }
}