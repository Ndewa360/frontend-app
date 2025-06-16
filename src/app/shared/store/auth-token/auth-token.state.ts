import { Action, Selector, State, StateContext, createSelector } from "@ngxs/store";
import { Injectable } from "@angular/core";
import { AuthTokenAction } from "./auth-token.actions";
import { of, throwError } from "rxjs";
import { tap, catchError } from "rxjs/operators";
import { NotificationService } from "carbon-components-angular";
import { ToastrService } from "ngx-toastr";

export class AuthTokenStateModel {
    authToken: string;
    refreshToken: string;
    tokenExpiration: number; // Timestamp d'expiration du token
}

@State<AuthTokenStateModel>({
    name: "ndewa360_auth_token",
    defaults: {
        authToken: null,
        refreshToken: null,
        tokenExpiration: null
    }
})
@Injectable()
export class AuthTokenState {
    constructor(private _toastrService: ToastrService) {}

    @Selector()
    static selectStateToken(state: AuthTokenStateModel) {
        return { accessToken: state.authToken, refreshToken: state.refreshToken };
    }

    @Selector()
    static selectStateAuthToken(state: AuthTokenStateModel) {
        return state.authToken;
    }

    @Selector()
    static selectStateRefreshToken(state: AuthTokenStateModel) {
        return state.refreshToken;
    }

    @Selector()
    static selectStateUserIsLogin(state: AuthTokenStateModel) {
        return state.authToken != null;
    }

    @Selector()
    static selectTokenExpiration(state: AuthTokenStateModel) {
        return state.tokenExpiration;
    }

    @Action(AuthTokenAction.SetAuthToken)
    setAuthToken(ctx: StateContext<AuthTokenStateModel>, { token }: AuthTokenAction.SetAuthToken) {
        const expiration = this.getTokenExpiration(token);
        ctx.patchState({ 
            authToken: token,
            tokenExpiration: expiration
        });
        return of(true);
    }

    @Action(AuthTokenAction.SetRefreshToken)
    setRefreshToken(ctx: StateContext<AuthTokenStateModel>, { token }: AuthTokenAction.SetRefreshToken) {
        ctx.patchState({ refreshToken: token });
        return of(true);
    }

    @Action(AuthTokenAction.SetToken)
    setToken(ctx: StateContext<AuthTokenStateModel>, { authToken, refreshToken }: AuthTokenAction.SetToken) {
        const expiration = this.getTokenExpiration(authToken);
        ctx.patchState({ 
            authToken, 
            refreshToken,
            tokenExpiration: expiration
        });
        return of(true);
    }

    @Action(AuthTokenAction.Logout)
    logout(ctx: StateContext<AuthTokenStateModel>) {
        ctx.setState({
            authToken: null,
            refreshToken: null,
            tokenExpiration: null
        });
        return of(true);
    }

    // Fonction utilitaire pour extraire la date d'expiration du token JWT
    private getTokenExpiration(token: string): number {
        if (!token) return null;
        
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            
            const { exp } = JSON.parse(jsonPayload);
            return exp;
        } catch (e) {
            this._toastrService.error("Erreur lors du décodage du token", "Ndewa360°");
            return null;
        }
    }
}