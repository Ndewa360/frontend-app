import { Action, Selector, State, StateContext, createSelector } from "@ngxs/store";
import { UserProfileModel } from "./user-profile.model";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { UserProfileAction } from "./user-profile.actions";
import { UserProfileService } from "./user-profile.service";
// import { ToastrService } from "ngx-toastr";
import { of,  throwError } from "rxjs";
import { AuthService } from "./auth.service";
import { tap,catchError } from "rxjs/operators";
import { NotificationService } from "carbon-components-angular";
import { AuthTokenAction } from "../auth-token";
import { Navigate } from '@ngxs/router-plugin';
import { ToastrService } from "ngx-toastr";
import { DisconnexionService } from "./disconnection.service";

export class UserProfileStateModel {
    userProfile:UserProfileModel;
    initLoadingState:'NO_LOADED'|'LOADING'|'LOADED';
    loadingUserProfile:boolean
    waitingForUserProfilSaved:boolean
}


@State<UserProfileStateModel>({
    name: "userprofile",
    defaults:{
    initLoadingState:'NO_LOADED',
    loadingUserProfile:false,
    waitingForUserProfilSaved:false,
    userProfile:null
    }
})
@Injectable()
export class UserProfileState{
    constructor(
        private _userProfilesService:UserProfileService,
        private _toastrService:ToastrService,
        private _authService:AuthService,
        private _router:Router,
        private disconnetionService:DisconnexionService
            //   private notificationService: NotificationService,
    ){}

    @Selector()
    static selectStateLoading(state:UserProfileStateModel)
    {
        return state.loadingUserProfile
    }

    @Selector()
    static selectStateSavedLoading(state:UserProfileStateModel)
    {
        return state.waitingForUserProfilSaved
    }

    @Selector()
    static selectStateUserProfile(state:UserProfileStateModel)
    {
        return state.userProfile
    }

    @Action(UserProfileAction.SetUserProfile)
    setUserProfileState(ctx:StateContext<UserProfileStateModel>,{user}:UserProfileAction.SetUserProfile)
    {
        ctx.patchState({loadingUserProfile:false,userProfile:user.toJSON()})
    }

    @Action(UserProfileAction.LoginUserProfile)
    loginUserProfileState(ctx:StateContext<UserProfileStateModel>,{email,password}:UserProfileAction.LoginUserProfile)
    {
        const state = ctx.getState();
        ctx.patchState({
            loadingUserProfile: true
        })
        return this._authService.login(email,password).pipe(
            tap(
                (result)=>{
                    ctx.patchState({
                        loadingUserProfile:false,
                        userProfile:result.data.user
                    })     
                    console.log("Result Data ",result.data)
                    
                        ctx.dispatch(new AuthTokenAction.SetToken(result.data.access_token,result.data.refresh_token));          
                    this._toastrService.success(`Bienvenue sur Ndewa360°! `, 'Ndewa360°');
                }
            ),
            catchError((error) => {               
                // this._toastrService.error(error?.error?.message, 'Erreur');
                ctx.patchState({
                    loadingUserProfile: false
                })
                return throwError(error);
                
            })
        )
    }

    @Action(UserProfileAction.LogoutUserProfile)
    logoutUserProfileState(ctx:StateContext<UserProfileStateModel>)
    {
        this.disconnetionService.logout()
        this._toastrService.success("Deconnexion avec success! ","Ndewa360°")
        return of(true)
    }

    @Action(UserProfileAction.SignupSimpleUserProfile)
    signupSimpleUserProfileState(ctx:StateContext<UserProfileStateModel>,{email,password,username,phoneNumber}:UserProfileAction.SignupSimpleUserProfile)
    {
        const state = ctx.getState();
        ctx.patchState({
            loadingUserProfile: true
        })

        return this._authService.register(email,password,username,phoneNumber).pipe(
            tap(
                (result)=>{
                    ctx.patchState({
                        loadingUserProfile:false,
                        userProfile:result.data
                    })
                    this._toastrService.success("Compte créé avec success! ","Ndewa360°")
                }
            ),
            catchError((error) => {
                ctx.patchState({
                    loadingUserProfile: false
                })
                // switch(error.status)
                // {
                //     case 409:
                //         this._toastrService.error("Ce compete existe déjà! ","Ndewa360°");
                //         break;
                //     case 400:
                //         this._toastrService.error("Format de mot de passe incorrect! ","Ndewa360°");
                //         break;
                //     default:
                //         let message = error?.error?.message;
                //         if(!message) message = "Une erreur c'est produite! Réessayez plus tard"
                //         this._toastrService.error(message, 'Ndewa360°');
                // }
                
                return throwError(error);
                
            })
        )
    }

    @Action(UserProfileAction.ValidateUserProfileWithToken)
    validateUserProfileWithTokenState(ctx:StateContext<UserProfileStateModel>,{token}:UserProfileAction.ValidateUserProfileWithToken)
    {
        // ctx.dispatch(new AuthTokenAction.SetAuthToken(token));
        return this._authService.validateEmailWithToken(token).pipe(
            tap(
                (result)=>{   
                        // ctx.dispatch(new AuthTokenAction.SetAuthToken(null));          
                    this._toastrService.success(`Email activé avec succés°! `, 'Ndewa360°');
                }
            ),
            catchError((error) => {
                switch(error.status)
                {
                    case 404:
                        this._toastrService.error(`Compte introuvable! `, 'Ndewa360°');
                        break;
                    case 403:
                        this._toastrService.warning(`Compte déjà activé!! `, 'Ndewa360°');
                        break;
                    default:
                        this._toastrService.error(`Une erreur c'est produite! `, 'Ndewa360°');
                }
                // ctx.dispatch(new AuthTokenAction.SetAuthToken(null))
                return throwError(error);
                
            })
        )
    }

    @Action(UserProfileAction.ResentLinkForUserProfilePassWord)
    resendEmailLinkForActivateUserProfile(ctx:StateContext<UserProfileStateModel>,{email}:UserProfileAction.ResentLinkForUserProfilePassWord)
    {
        return this._authService.resendEmailLinkForActiveAccound(email).pipe(
            tap(
                (result)=>{   
                    this._toastrService.success(`Email envoyé avec succés! `, 'Ndewa360°');
                }
            ),
            catchError((error) => {
                switch(error.status)
                {
                    case 404:
                        this._toastrService.error(`Compte introuvable! `, 'Ndewa360°');
                        break;
                    case 403:
                        this._toastrService.warning(`Compte déjà activé!! `, 'Ndewa360°');
                        break;
                    default:
                        let message = error?.error?.message;
                        if(!message) message = "Une erreur c'est produite! Réessayez plus tard"
                        this._toastrService.error(message, 'Ndewa360°');
                }
                return throwError(error);
                
            })
        )
    }

    @Action(UserProfileAction.Logout)
    logout(ctx:StateContext<UserProfileStateModel>)
    {
        ctx.setState({
            initLoadingState:'NO_LOADED',
            loadingUserProfile:false,
            waitingForUserProfilSaved:false,
            userProfile:null
        })
    }

    @Action(UserProfileAction.ResetPasswordForUserProfile)
    resetPasswordForUserProfile(ctx:StateContext<UserProfileStateModel>,{password,token}:UserProfileAction.ResetPasswordForUserProfile)
    {
        // ctx.dispatch(new AuthTokenAction.SetAuthToken(token))
        return this._authService.resetPassword(password,token).pipe(
            tap(
                (result)=>{   
                    this._toastrService.success(`Mot de passe modifié avec succés! `, 'Ndewa360°');
                    // ctx.dispatch(new AuthTokenAction.SetAuthToken(null))
                }
            ),
            catchError((error) => {
                switch(error.status)
                {
                    case 404:
                        this._toastrService.error(`Compte introuvable! `, 'Ndewa360°');
                        break;
                    case 403:
                        this._toastrService.warning(`Token invalide! `, 'Ndewa360°');
                        break;
                    default:
                        let message = error?.error?.message;
                        if(!message) message = "Une erreur c'est produite! Réessayez plus tard"
                        this._toastrService.error(message, 'Ndewa360°');
                }
                // ctx.dispatch(new AuthTokenAction.SetAuthToken(null))
                return throwError(error);
                
            })
        )
    }

    @Action(UserProfileAction.ForgotPasswordUserProfile)
    resendEmailLinkForResetPasswordUserProfile(ctx:StateContext<UserProfileStateModel>,{email}:UserProfileAction.ForgotPasswordUserProfile)
    {
        return this._authService.resendEmailLinkForResetPassword(email).pipe(
            tap(
                (result)=>{   
                    this._toastrService.success(`Email envoyé avec succés! `, 'Ndewa360°');
                }
            ),
            catchError((error) => {
                switch(error.status)
                {
                    case 404:
                        this._toastrService.error(`Compte introuvable! `, 'Ndewa360°');
                        break;
                    default:
                        let message = error?.error?.message;
                        if(!message) message = "Une erreur c'est produite! Réessayez plus tard"
                        this._toastrService.error(message, 'Ndewa360°');
                }
                return throwError(error);
                
            })
        )
    }

    @Action(UserProfileAction.UpdateUserProfile)
    updateUserProfile(ctx:StateContext<UserProfileStateModel>, {userProfile,id}:UserProfileAction.UpdateUserProfile)
    {
        const state = ctx.getState();
        ctx.patchState({
            waitingForUserProfilSaved: true
        })

        return this._userProfilesService.updateUserProfile(userProfile,id).pipe(
            tap(
                (result)=>{
                    ctx.patchState({
                        waitingForUserProfilSaved:false,
                        userProfile,
                    })
                    this._toastrService.success(`Profil utilisateur modifié avec success`, 'UserProfile');
                }
            ),
            catchError((error) => {
                // this._toastrService.error(error?.error?.message, 'Erreur');
                ctx.patchState({
                    waitingForUserProfilSaved: false
                })
                let message = error?.error?.message;
                if(!message) message = "Une erreur c'est produite! Réessayez plus tard"
                this._toastrService.error(message, 'Ndewa360°');
                return throwError(error);
                
            })
        )
    }

    
    @Action(UserProfileAction.updateLoadingUserProfileState)
    updateLoadingUserProfileState(ctx:StateContext<UserProfileStateModel>,{status}:UserProfileAction.updateLoadingUserProfileState)
    {
        const state = ctx.getState();
        ctx.patchState(
            {
                loadingUserProfile:status
            }
        )
        return of(true)
    }

   

    @Action(UserProfileAction.FetchUserProfile)
    fetchUserProfile(ctx:StateContext<UserProfileStateModel>)
    {
        if(ctx.getState().initLoadingState=="LOADED") return of(true);
        
        const state = ctx.getState();

        
        ctx.patchState({
            loadingUserProfile:true,
            initLoadingState:"LOADING"
        })
        return this._userProfilesService.getUserProfile().pipe(
            tap(
                result => {
                    //console.log("Result ",result)
                    ctx.patchState({
                        loadingUserProfile:false,
                        userProfile:result.data,
                        initLoadingState:'LOADED'
                    })
                }
            ),
            catchError((error) => {
                ctx.patchState({
                    loadingUserProfile: false,
                    initLoadingState:"NO_LOADED"
                })
                let message = error?.error?.message;
                if(!message) message = "Une erreur c'est produite! Réessayez plus tard"
                this._toastrService.error(message, 'Ndewa360°');
                return throwError(error);
                
            })
        )
    }
}