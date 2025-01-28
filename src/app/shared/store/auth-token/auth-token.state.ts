import { Action, Selector, State, StateContext, createSelector } from "@ngxs/store";
import { Injectable } from "@angular/core";
import { AuthTokenAction } from "./auth-token.actions";
// import { ToastrService } from "ngx-toastr";
import { of,  throwError } from "rxjs";
import { tap,catchError } from "rxjs/operators";
import { NotificationService } from "carbon-components-angular";

export class AuthTokenStateModel {
    authToken:string ;
    refreshToken:string;
}


@State<AuthTokenStateModel>({
    name: "auth_token",
    defaults:{
        authToken:null,
        refreshToken:null
    }
})
@Injectable()
export class AuthTokenState{
   
    @Selector()
    static selectStateToken(state:AuthTokenStateModel)
    {
        return {accessToken:state.authToken,refreshToken:state.refreshToken}
    }

    @Selector()
    static selectStateAuthToken(state:AuthTokenStateModel)
    {
        return state.authToken
    }

    @Selector()
    static selectStateRefreshToken(state:AuthTokenStateModel)
    {
        return state.refreshToken
    }

    @Selector()
    static selectStateUserIsLogin(state:AuthTokenStateModel)
    {
        return state.authToken!=null;
    }

    
    @Action(AuthTokenAction.SetAuthToken)
    setAuthToken(ctx:StateContext<AuthTokenStateModel>,{token}:AuthTokenAction.SetAuthToken)
    {
        ctx.patchState( { authToken:token } )
        return of(true)
    }

    @Action(AuthTokenAction.SetRefreshToken)
    setRefreshToken(ctx:StateContext<AuthTokenStateModel>,{token}:AuthTokenAction.SetRefreshToken)
    {
        ctx.patchState( { refreshToken:token } )
        return of(true)
    }  

}