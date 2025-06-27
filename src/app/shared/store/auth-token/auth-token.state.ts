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
    isActivityMonitoring: boolean; // État de la surveillance d'activité
    activityState: string; // État d'activité utilisateur (ACTIVE, INACTIVE, CRITICAL_INACTIVE)
    lastRefreshAttempt: number; // Timestamp de la dernière tentative de refresh
    refreshInProgress: boolean; // Indique si un refresh est en cours
}

@State<AuthTokenStateModel>({
    name: "ndewa360_auth_token",
    defaults: {
        authToken: null,
        refreshToken: null,
        tokenExpiration: null,
        isActivityMonitoring: false,
        activityState: 'ACTIVE',
        lastRefreshAttempt: null,
        refreshInProgress: false
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

    @Selector()
    static selectStateActivityMonitoring(state: AuthTokenStateModel) {
        return state.isActivityMonitoring;
    }

    @Selector()
    static selectStateActivityState(state: AuthTokenStateModel) {
        return state.activityState;
    }

    @Selector()
    static selectStateRefreshInProgress(state: AuthTokenStateModel) {
        return state.refreshInProgress;
    }

    @Selector()
    static selectStateLastRefreshAttempt(state: AuthTokenStateModel) {
        return state.lastRefreshAttempt;
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
        console.log('🔍 Setting tokens in state:');
        console.log('  - Access token length:', authToken?.length);
        console.log('  - Refresh token length:', refreshToken?.length);
        console.log('  - Access token preview:', authToken?.substring(0, 50) + '...');
        console.log('  - Refresh token preview:', refreshToken?.substring(0, 50) + '...');

        const expiration = this.getTokenExpiration(authToken);
        ctx.patchState({
            authToken,
            refreshToken,
            tokenExpiration: expiration
        });
        return of(true);
    }

    @Action(AuthTokenAction.Logout)
    logout(ctx: StateContext<AuthTokenStateModel>, { reason }: AuthTokenAction.Logout) {
        ctx.setState({
            authToken: null,
            refreshToken: null,
            tokenExpiration: null,
            isActivityMonitoring: false,
            activityState: 'ACTIVE',
            lastRefreshAttempt: null,
            refreshInProgress: false
        });

        if (reason) {
            console.log(`🔴 Déconnexion: ${reason}`);
        }

        return of(true);
    }

    @Action(AuthTokenAction.StartActivityMonitoring)
    startActivityMonitoring(ctx: StateContext<AuthTokenStateModel>) {
        ctx.patchState({ isActivityMonitoring: true });
        return of(true);
    }

    @Action(AuthTokenAction.StopActivityMonitoring)
    stopActivityMonitoring(ctx: StateContext<AuthTokenStateModel>) {
        ctx.patchState({
            isActivityMonitoring: false,
            activityState: 'ACTIVE'
        });
        return of(true);
    }

    @Action(AuthTokenAction.UpdateActivityState)
    updateActivityState(ctx: StateContext<AuthTokenStateModel>, { activityState }: AuthTokenAction.UpdateActivityState) {
        ctx.patchState({ activityState });
        return of(true);
    }

    @Action(AuthTokenAction.RefreshTokenSuccess)
    refreshTokenSuccess(ctx: StateContext<AuthTokenStateModel>, { accessToken, refreshToken }: AuthTokenAction.RefreshTokenSuccess) {
        const expiration = this.getTokenExpiration(accessToken);
        ctx.patchState({
            authToken: accessToken,
            refreshToken,
            tokenExpiration: expiration,
            refreshInProgress: false,
            lastRefreshAttempt: Date.now()
        });
        return of(true);
    }

    @Action(AuthTokenAction.RefreshTokenFailure)
    refreshTokenFailure(ctx: StateContext<AuthTokenStateModel>, { error }: AuthTokenAction.RefreshTokenFailure) {
        ctx.patchState({
            refreshInProgress: false,
            lastRefreshAttempt: Date.now()
        });

        console.error('❌ Échec du refresh token:', error);
        return of(false);
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