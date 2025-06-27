import { Action, Selector, State, StateContext, Store, createSelector } from "@ngxs/store";
import { UserProfileModel } from "./user-profile.model";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { UserProfileAction } from "./user-profile.actions";
import { UserProfileService } from "./user-profile.service";
import { of, throwError, timer } from "rxjs";
import { AuthService } from "./auth.service";
import { tap, catchError, switchMap, retry, finalize } from "rxjs/operators";
import { NotificationService } from "carbon-components-angular";
import { AuthTokenAction } from "../auth-token";
import { Navigate } from '@ngxs/router-plugin';
import { ToastrService } from "ngx-toastr";
import { DisconnexionService } from "./disconnection.service";
import { RefreshTokenService } from "../auth-token/refresh-token.service";

export class UserProfileStateModel {
    userProfile: UserProfileModel;
    initLoadingState: 'NO_LOADED' | 'LOADING' | 'LOADED' | 'ERROR';
    loadingUserProfile: boolean;
    waitingForUserProfilSaved: boolean;
    lastError: string;
}

@State<UserProfileStateModel>({
    name: "userprofile",
    defaults: {
        initLoadingState: 'NO_LOADED',
        loadingUserProfile: false,
        waitingForUserProfilSaved: false,
        userProfile: null,
        lastError: null
    }
})
@Injectable()
export class UserProfileState {
    constructor(
        private _userProfilesService: UserProfileService,
        private _toastrService: ToastrService,
        private _authService: AuthService,
        private _router: Router,
        private _store:Store,
        private disconnetionService: DisconnexionService,
        private refreshTokenService: RefreshTokenService
    ) {}

    @Selector()
    static selectStateLoading(state: UserProfileStateModel) {
        return state.loadingUserProfile;
    }

    @Selector()
    static selectStateSavedLoading(state: UserProfileStateModel) {
        return state.waitingForUserProfilSaved;
    }

    @Selector()
    static selectStateUserProfile(state: UserProfileStateModel) {
        return state.userProfile;
    }

    @Selector()
    static selectStateInitLoadingState(state: UserProfileStateModel) {
        return state.initLoadingState;
    }

    @Selector()
    static selectStateLastError(state: UserProfileStateModel) {
        return state.lastError;
    }

    @Action(UserProfileAction.SetUserProfile)
    setUserProfileState(ctx: StateContext<UserProfileStateModel>, { user }: UserProfileAction.SetUserProfile) {
        ctx.patchState({
            loadingUserProfile: false,
            userProfile: user.toJSON ? user.toJSON() : user,
            lastError: null
        });
    }

    @Action(UserProfileAction.LoginUserProfile)
    loginUserProfileState(ctx: StateContext<UserProfileStateModel>, { email, password }: UserProfileAction.LoginUserProfile) {
        ctx.patchState({
            loadingUserProfile: true,
            lastError: null
        });

        return this._authService.login(email, password).pipe(
            tap((result) => {
                if (!result || !result.data || !result.data.user) {
                    throw new Error("Réponse de connexion invalide");
                }

                ctx.patchState({
                    loadingUserProfile: false,
                    userProfile: result.data.user,
                    initLoadingState: 'LOADED'
                });

                // Stocker les tokens
                ctx.dispatch(new AuthTokenAction.SetToken(result.data.access_token, result.data.refresh_token));

                // Démarrer la surveillance d'activité
                ctx.dispatch(new AuthTokenAction.StartActivityMonitoring());
                this.refreshTokenService.startActivityMonitoring();

                this._toastrService.success(`Bienvenue sur Ndewa360°! `, 'Ndewa360°');
            }),
            catchError((error) => {
                ctx.patchState({
                    loadingUserProfile: false,
                    lastError: error?.error?.message || "Erreur de connexion"
                });
                return throwError(() => error);
            })
        );
    }

    @Action(UserProfileAction.LogoutUserProfile)
    logoutUserProfileState(ctx: StateContext<UserProfileStateModel>) {
        // Arrêter la surveillance d'activité
        ctx.dispatch(new AuthTokenAction.StopActivityMonitoring());
        this.refreshTokenService.stopActivityMonitoring();

        // Nettoyer les ressources du service de refresh
        this.refreshTokenService.cleanup();

        this.disconnetionService.logout();
        this._toastrService.success("Déconnexion avec succès! ", "Ndewa360°");
        return of(true);
    }

    @Action(UserProfileAction.SignupSimpleUserProfile)
    signupSimpleUserProfileState(ctx: StateContext<UserProfileStateModel>, { email, password, username, phoneNumber }: UserProfileAction.SignupSimpleUserProfile) {
        ctx.patchState({
            loadingUserProfile: true,
            lastError: null
        });

        return this._authService.register(email, password, username, phoneNumber).pipe(
            tap((result) => {
                ctx.patchState({
                    loadingUserProfile: false,
                    userProfile: result.data
                });
                this._toastrService.success("Compte créé avec succès! ", "Ndewa360°");
            }),
            catchError((error) => {
                ctx.patchState({
                    loadingUserProfile: false,
                    lastError: error?.error?.message || "Erreur lors de la création du compte"
                });
                return throwError(() => error);
            })
        );
    }

    @Action(UserProfileAction.ValidateUserProfileWithToken)
    validateUserProfileWithTokenState(ctx: StateContext<UserProfileStateModel>, { token }: UserProfileAction.ValidateUserProfileWithToken) {
        return this._authService.validateEmailWithToken(token).pipe(
            tap((result) => {
                this._toastrService.success(`Email activé avec succès! `, 'Ndewa360°');
            }),
            catchError((error) => {
                switch (error.status) {
                    case 404:
                        this._toastrService.error(`Compte introuvable! `, 'Ndewa360°');
                        break;
                    case 403:
                        this._toastrService.warning(`Compte déjà activé! `, 'Ndewa360°');
                        break;
                    default:
                        this._toastrService.error(`Une erreur s'est produite! `, 'Ndewa360°');
                }
                return throwError(() => error);
            })
        );
    }

    @Action(UserProfileAction.ResentLinkForUserProfilePassWord)
    resendEmailLinkForActivateUserProfile(ctx: StateContext<UserProfileStateModel>, { email }: UserProfileAction.ResentLinkForUserProfilePassWord) {
        return this._authService.resendEmailLinkForActiveAccound(email).pipe(
            tap((result) => {
                this._toastrService.success(`Email envoyé avec succès! `, 'Ndewa360°');
            }),
            catchError((error) => {
                switch (error.status) {
                    case 404:
                        this._toastrService.error(`Compte introuvable! `, 'Ndewa360°');
                        break;
                    case 403:
                        this._toastrService.warning(`Compte déjà activé! `, 'Ndewa360°');
                        break;
                    default:
                        let message = error?.error?.message;
                        if (!message) message = "Une erreur s'est produite! Réessayez plus tard";
                        this._toastrService.error(message, 'Ndewa360°');
                }
                return throwError(() => error);
            })
        );
    }

    @Action(UserProfileAction.Logout)
    logout(ctx: StateContext<UserProfileStateModel>) {
        ctx.setState({
            initLoadingState: 'NO_LOADED',
            loadingUserProfile: false,
            waitingForUserProfilSaved: false,
            userProfile: null,
            lastError: null
        });
        return of(true);
    }

    @Action(UserProfileAction.ResetPasswordForUserProfile)
    resetPasswordForUserProfile(ctx: StateContext<UserProfileStateModel>, { password, token }: UserProfileAction.ResetPasswordForUserProfile) {
        return this._authService.resetPassword(password, token).pipe(
            tap((result) => {
                this._toastrService.success(`Mot de passe modifié avec succès! `, 'Ndewa360°');
            }),
            catchError((error) => {
                switch (error.status) {
                    case 404:
                        this._toastrService.error(`Compte introuvable! `, 'Ndewa360°');
                        break;
                    case 403:
                        this._toastrService.warning(`Token invalide! `, 'Ndewa360°');
                        break;
                    default:
                        let message = error?.error?.message;
                        if (!message) message = "Une erreur s'est produite! Réessayez plus tard";
                        this._toastrService.error(message, 'Ndewa360°');
                }
                return throwError(() => error);
            })
        );
    }

    @Action(UserProfileAction.ForgotPasswordUserProfile)
    resendEmailLinkForResetPasswordUserProfile(ctx: StateContext<UserProfileStateModel>, { email }: UserProfileAction.ForgotPasswordUserProfile) {
        return this._authService.resendEmailLinkForResetPassword(email).pipe(
            tap((result) => {
                this._toastrService.success(`Email envoyé avec succès! `, 'Ndewa360°');
            }),
            catchError((error) => {
                switch (error.status) {
                    case 404:
                        this._toastrService.error(`Compte introuvable! `, 'Ndewa360°');
                        break;
                    default:
                        let message = error?.error?.message;
                        if (!message) message = "Une erreur s'est produite! Réessayez plus tard";
                        this._toastrService.error(message, 'Ndewa360°');
                }
                return throwError(() => error);
            })
        );
    }

    @Action(UserProfileAction.UpdateUserProfile)
    updateUserProfile(ctx: StateContext<UserProfileStateModel>, { userProfile, id }: UserProfileAction.UpdateUserProfile) {
        ctx.patchState({
            waitingForUserProfilSaved: true,
            lastError: null
        });

        return this._userProfilesService.updateUserProfile(userProfile, id).pipe(
            tap((result) => {
                ctx.patchState({
                    waitingForUserProfilSaved: false,
                    userProfile: userProfile,
                });
                this._toastrService.success(`Profil utilisateur modifié avec succès`, 'Ndewa360°');
            }),
            catchError((error) => {
                ctx.patchState({
                    waitingForUserProfilSaved: false,
                    lastError: error?.error?.message || "Erreur lors de la mise à jour du profil"
                });
                let message = error?.error?.message;
                if (!message) message = "Une erreur s'est produite! Réessayez plus tard";
                this._toastrService.error(message, 'Ndewa360°');
                return throwError(() => error);
            })
        );
    }

    @Action(UserProfileAction.updateLoadingUserProfileState)
    updateLoadingUserProfileState(ctx: StateContext<UserProfileStateModel>, { status }: UserProfileAction.updateLoadingUserProfileState) {
        ctx.patchState({
            loadingUserProfile: status
        });
        return of(true);
    }

    @Action(UserProfileAction.FetchUserProfile)
    fetchUserProfile(ctx: StateContext<UserProfileStateModel>) {
        // Si déjà chargé, ne pas recharger
        if (ctx.getState().initLoadingState === "LOADED" && ctx.getState().userProfile) {
            return of(true);
        }
        
        ctx.patchState({
            loadingUserProfile: true,
            initLoadingState: "LOADING",
            lastError: null
        });

        return this._userProfilesService.getUserProfile().pipe(
            // Réessayer 2 fois avec un délai de 1 seconde entre les tentatives
            retry({ count: 2, delay: 1000 }),
            tap(result => {
                if (!result || !result.data) {
                    throw new Error("Réponse de profil utilisateur invalide");
                }
                
                ctx.patchState({
                    loadingUserProfile: false,
                    userProfile: result.data,
                    initLoadingState: 'LOADED'
                });
            }),
            catchError((error) => {
                ctx.patchState({
                    loadingUserProfile: false,
                    initLoadingState: "ERROR",
                    lastError: error?.error?.message || "Erreur lors du chargement du profil"
                });
                
                // Si erreur 401, rediriger vers la page de connexion
                if (error.status === 401) {
                    this._store.dispatch(new AuthTokenAction.Logout());
                    this._router.navigateByUrl('/auth/signin');
                    this._toastrService.warning("Session expirée. Veuillez vous reconnecter.", 'Ndewa360°');
                } else {
                    let message = error?.error?.message;
                    if (!message) message = "Une erreur s'est produite! Réessayez plus tard";
                    this._toastrService.error(message, 'Ndewa360°');
                }
                
                return throwError(() => error);
            }),
            // S'assurer que l'état de chargement est toujours réinitialisé
            finalize(() => {
                if (ctx.getState().loadingUserProfile) {
                    ctx.patchState({ loadingUserProfile: false });
                }
            })
        );
    }
}