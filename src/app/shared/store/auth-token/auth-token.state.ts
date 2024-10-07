import { Action, Selector, State, StateContext, createSelector } from "@ngxs/store";
import { Injectable } from "@angular/core";
import { AuthTokenAction } from "./auth-token.actions";
// import { ToastrService } from "ngx-toastr";
import { of,  throwError } from "rxjs";
import { tap,catchError } from "rxjs/operators";
import { NotificationService } from "carbon-components-angular";

export class AuthTokenStateModel {
    authToken:string ;
}


@State<AuthTokenStateModel>({
    name: "auth_token",
    defaults:{
        authToken:null
    }
})
@Injectable()
export class AuthTokenState{
   

    @Selector()
    static selectStateAuthToken(state:AuthTokenStateModel)
    {
        return state.authToken
    }

    
    @Action(AuthTokenAction.SetAuthToken)
    setAuthToken(ctx:StateContext<AuthTokenStateModel>,{token}:AuthTokenAction.SetAuthToken)
    {
        ctx.patchState( { authToken:token } )
        return of(true)
        
    }

   
   

}