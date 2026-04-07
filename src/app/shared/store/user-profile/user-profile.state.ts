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
import { TranslateService } from "@ngx-translate/core";
import { LanguageUrlService } from "../../services/language-url.service";
import { LanguagePreservationService } from "../../services/language-preservation.service";
import { PropertyManagerAction } from '../property-manager/property-manager.actions';

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
        private refreshTokenService: RefreshTokenService,
        private _translateService: TranslateService,
        private _languageUrlService: LanguageUrlService,
        private _languagePreservation: LanguagePreservationService
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

                // Charger les biens gérés si présents dans la réponse
                if (result.data.managedProperties && result.data.managedProperties.length > 0) {
                    ctx.dispatch(new PropertyManagerAction.SetManagedProperties(result.data.managedProperties));
                }

                // Démarrer la surveillance d'activité
                ctx.dispatch(new AuthTokenAction.StartActivityMonitoring());
                this.refreshTokenService.startActivityMonitoring();

                this._toastrService.success(this._translateService.instant('NOTIFICATIONS.WELCOME_LOGIN'), 'Ndewa360°');
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
        this._toastrService.success(this._translateService.instant('NOTIFICATIONS.LOGOUT_SUCCESS'), "Ndewa360°");
        return of(true);
    }

    @Action(UserProfileAction.SignupSimpleUserProfile)
    signupSimpleUserProfileState(ctx: StateContext<UserProfileStateModel>, { email, password, username, phoneNumber, userType, businessName }: UserProfileAction.SignupSimpleUserProfile) {
        ctx.patchState({
            loadingUserProfile: true,
            lastError: null
        });

        return this._authService.register(email, password, username, phoneNumber, userType, businessName).pipe(
            tap((result) => {
                ctx.patchState({
                    loadingUserProfile: false,
                    userProfile: result.data
                });
                
                const accountType = userType === 'AGENT' ? 'agent' : 'propriétaire';
                this._toastrService.success(this._translateService.instant('NOTIFICATIONS.ACCOUNT_CREATED_SUCCESS', { type: accountType }), "Ndewa360°");
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
                this._toastrService.success(this._translateService.instant('NOTIFICATIONS.EMAIL_ACTIVATED_SUCCESS'), 'Ndewa360°');
            }),
            catchError((error) => {
                switch (error.status) {
                    case 404:
                        this._toastrService.error(this._translateService.instant('NOTIFICATIONS.ACCOUNT_NOT_FOUND'), 'Ndewa360°');
                        break;
                    case 403:
                        this._toastrService.warning(this._translateService.instant('NOTIFICATIONS.ACCOUNT_ALREADY_ACTIVATED'), 'Ndewa360°');
                        break;
                    default:
                        this._toastrService.error(this._translateService.instant('NOTIFICATIONS.GENERIC_ERROR'), 'Ndewa360°');
                }
                return throwError(() => error);
            })
        );
    }

    @Action(UserProfileAction.ResentLinkForUserProfilePassWord)
    resendEmailLinkForActivateUserProfile(ctx: StateContext<UserProfileStateModel>, { email }: UserProfileAction.ResentLinkForUserProfilePassWord) {
        return this._authService.resendEmailLinkForActiveAccound(email).pipe(
            tap((result) => {
                this._toastrService.success(this._translateService.instant('NOTIFICATIONS.EMAIL_SENT_SUCCESS'), 'Ndewa360°');
            }),
            catchError((error) => {
                switch (error.status) {
                    case 404:
                        this._toastrService.error(this._translateService.instant('NOTIFICATIONS.ACCOUNT_NOT_FOUND'), 'Ndewa360°');
                        break;
                    case 403:
                        this._toastrService.warning(this._translateService.instant('NOTIFICATIONS.ACCOUNT_ALREADY_ACTIVATED'), 'Ndewa360°');
                        break;
                    default:
                        let message = error?.error?.message;
                        if (!message) message = this._translateService.instant('NOTIFICATIONS.GENERIC_ERROR_RETRY');
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
                this._toastrService.success(this._translateService.instant('NOTIFICATIONS.PASSWORD_RESET_SUCCESS'), 'Ndewa360°');
            }),
            catchError((error) => {
                switch (error.status) {
                    case 404:
                        this._toastrService.error(this._translateService.instant('NOTIFICATIONS.ACCOUNT_NOT_FOUND'), 'Ndewa360°');
                        break;
                    case 403:
                        this._toastrService.warning(this._translateService.instant('NOTIFICATIONS.TOKEN_INVALID_WARNING'), 'Ndewa360°');
                        break;
                    default:
                        let message = error?.error?.message;
                        if (!message) message = this._translateService.instant('NOTIFICATIONS.GENERIC_ERROR_RETRY');
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
                this._toastrService.success(this._translateService.instant('NOTIFICATIONS.EMAIL_SENT_SUCCESS'), 'Ndewa360°');
            }),
            catchError((error) => {
                switch (error.status) {
                    case 404:
                        this._toastrService.error(this._translateService.instant('NOTIFICATIONS.ACCOUNT_NOT_FOUND'), 'Ndewa360°');
                        break;
                    default:
                        let message = error?.error?.message;
                        if (!message) message = this._translateService.instant('NOTIFICATIONS.GENERIC_ERROR_RETRY');
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
                this._toastrService.success(this._translateService.instant('NOTIFICATIONS.PROFILE_UPDATED_SUCCESS'), 'Ndewa360°');
            }),
            catchError((error) => {
                ctx.patchState({
                    waitingForUserProfilSaved: false,
                    lastError: error?.error?.message || "Erreur lors de la mise à jour du profil"
                });
                let message = error?.error?.message;
                if (!message) message = this._translateService.instant('NOTIFICATIONS.GENERIC_ERROR_RETRY');
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
                
                // Si erreur 401, rediriger vers la page de connexion avec langue
                if (error.status === 401) {
                    this._store.dispatch(new AuthTokenAction.Logout());
                    this._languagePreservation.redirectToLogin();
                    this._toastrService.warning(this._translateService.instant('NOTIFICATIONS.SESSION_EXPIRED_RECONNECT'), 'Ndewa360°');
                } else {
                    let message = error?.error?.message;
                    if (!message) message = this._translateService.instant('NOTIFICATIONS.GENERIC_ERROR_RETRY');
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

    @Action(UserProfileAction.UpdateUserLanguagePreference)
    updateUserLanguagePreference(ctx: StateContext<UserProfileStateModel>, { languageCode }: UserProfileAction.UpdateUserLanguagePreference) {
        const state = ctx.getState();
        const currentUserProfile = state.userProfile;

        if (!currentUserProfile) {
            console.warn('Aucun profil utilisateur trouvé pour mettre à jour la préférence de langue');
            return of(null);
        }

        const updatedProfile = {
            ...currentUserProfile,
            preferredLanguage: languageCode
        };

        ctx.patchState({
            waitingForUserProfilSaved: true
        });

        return this._userProfilesService.updateUserProfile(updatedProfile, currentUserProfile._id).pipe(
            tap((result) => {
                ctx.patchState({
                    waitingForUserProfilSaved: false,
                    userProfile: updatedProfile,
                });
                this._toastrService.success(this._translateService.instant('NOTIFICATIONS.LANGUAGE_UPDATED_SUCCESS'), 'Ndewa360°');
            }),
            catchError((error) => {
                ctx.patchState({
                    waitingForUserProfilSaved: false,
                    lastError: error?.error?.message || "Erreur lors de la mise à jour de la langue"
                });
                this._toastrService.error(this._translateService.instant('NOTIFICATIONS.LANGUAGE_UPDATE_ERROR'), 'Ndewa360°');
                return throwError(() => error);
            })
        );
    }

    @Action(UserProfileAction.UpdateUserCurrencyPreference)
    updateUserCurrencyPreference(ctx: StateContext<UserProfileStateModel>, { currencyCode }: UserProfileAction.UpdateUserCurrencyPreference) {
        const state = ctx.getState();
        const currentUserProfile = state.userProfile;

        if (!currentUserProfile) {
            console.warn('Aucun profil utilisateur trouvé pour mettre à jour la préférence de devise');
            return of(null);
        }

        const updatedProfile = {
            ...currentUserProfile,
            preferredCurrency: currencyCode
        };

        ctx.patchState({
            waitingForUserProfilSaved: true
        });

        return this._userProfilesService.updateUserProfile(updatedProfile, currentUserProfile._id).pipe(
            tap((result) => {
                ctx.patchState({
                    waitingForUserProfilSaved: false,
                    userProfile: updatedProfile,
                });
                this._toastrService.success(this._translateService.instant('NOTIFICATIONS.CURRENCY_UPDATED_SUCCESS'), 'Ndewa360°');
            }),
            catchError((error) => {
                ctx.patchState({
                    waitingForUserProfilSaved: false,
                    lastError: error?.error?.message || "Erreur lors de la mise à jour de la devise"
                });
                this._toastrService.error(this._translateService.instant('NOTIFICATIONS.CURRENCY_UPDATE_ERROR'), 'Ndewa360°');
                return throwError(() => error);
            })
        );
    }

    @Action(UserProfileAction.UpdateUserLocalizationPreferences)
    updateUserLocalizationPreferences(ctx: StateContext<UserProfileStateModel>, { preferences }: UserProfileAction.UpdateUserLocalizationPreferences) {
        const state = ctx.getState();
        const currentUserProfile = state.userProfile;

        if (!currentUserProfile) {
            console.warn('Aucun profil utilisateur trouvé pour mettre à jour les préférences de localisation');
            return of(null);
        }

        const updatedProfile = {
            ...currentUserProfile,
            ...preferences
        };

        ctx.patchState({
            waitingForUserProfilSaved: true
        });

        return this._userProfilesService.updateUserProfile(updatedProfile, currentUserProfile._id).pipe(
            tap((result) => {
                ctx.patchState({
                    waitingForUserProfilSaved: false,
                    userProfile: updatedProfile,
                });
                this._toastrService.success(this._translateService.instant('NOTIFICATIONS.LOCALIZATION_UPDATED_SUCCESS'), 'Ndewa360°');
            }),
            catchError((error) => {
                ctx.patchState({
                    waitingForUserProfilSaved: false,
                    lastError: error?.error?.message || "Erreur lors de la mise à jour des préférences"
                });
                this._toastrService.error(this._translateService.instant('NOTIFICATIONS.LOCALIZATION_UPDATE_ERROR'), 'Ndewa360°');
                return throwError(() => error);
            })
        );
    }

    @Action(UserProfileAction.FetchUserProfileConditional)
    fetchUserProfileConditional(ctx: StateContext<UserProfileStateModel>, { forceRedirectOnError }: UserProfileAction.FetchUserProfileConditional) {
        // Si déjà chargé, ne pas recharger
        if (ctx.getState().initLoadingState === "LOADED" && ctx.getState().userProfile) {
            return of(true);
        }

        // Vérifier d'abord si l'utilisateur est connecté
        const authState = this._store.selectSnapshot(state => state.authtoken);
        if (!authState?.token) {
            // Pas de token, utilisateur non connecté - ne pas essayer de charger le profil
            console.log('👤 Utilisateur non connecté, profil non chargé');
            ctx.patchState({
                loadingUserProfile: false,
                initLoadingState: "NO_LOADED",
                userProfile: null,
                lastError: null
            });
            return of(false);
        }

        ctx.patchState({
            loadingUserProfile: true,
            initLoadingState: "LOADING",
            lastError: null
        });

        return this._userProfilesService.getUserProfile().pipe(
            // Réessayer 1 fois seulement pour éviter les boucles
            retry({ count: 1, delay: 1000 }),
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

                // Redirection conditionnelle selon le paramètre
                if (error.status === 401) {
                    if (forceRedirectOnError) {
                        this._store.dispatch(new AuthTokenAction.Logout());
                        this._languagePreservation.redirectToLogin();
                        this._toastrService.warning(this._translateService.instant('NOTIFICATIONS.SESSION_EXPIRED_RECONNECT'), 'Ndewa360°');
                    } else {
                        console.log('👤 Token invalide sur page publique, nettoyage silencieux');
                        this._store.dispatch(new AuthTokenAction.Logout());
                    }
                } else if (forceRedirectOnError) {
                    let message = error?.error?.message;
                    if (!message) message = this._translateService.instant('NOTIFICATIONS.GENERIC_ERROR_RETRY');
                    this._toastrService.error(message, 'Ndewa360°');
                }

                // Ne pas propager l'erreur pour éviter les problèmes sur les pages publiques
                return of(false);
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