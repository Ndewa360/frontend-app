import { Action, Selector, State, StateContext, createSelector } from "@ngxs/store";
import { UserProfileModel } from "./user-profile.model";
import { Injectable } from "@angular/core";
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

export class UserProfileStateModel {
    userProfile:UserProfileModel;
    initLoadingState:'NO_LOADED'|'LOADING'|'LOADED';
    loadingUserProfile:boolean
}


@State<UserProfileStateModel>({
    name: "userprofile",
    defaults:{
    initLoadingState:'NO_LOADED',
    loadingUserProfile:false,
    userProfile:null
    }
})
@Injectable()
export class UserProfileState{
    constructor(
        private _userProfilesService:UserProfileService,
        private _toastrService:ToastrService,
        private _authService:AuthService,
            //   private notificationService: NotificationService,
    ){}

    @Selector()
    static selectStateLoading(state:UserProfileStateModel)
    {
        return state.loadingUserProfile
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
                        ctx.dispatch(new AuthTokenAction.SetAuthToken(result.data.access_token));          
                    this._toastrService.success(`Bienvenue sur Ndiye! `, 'Ndiye');
                }
            ),
            catchError((error) => {
                switch(error.status)
                {
                    case 401:
                        this._toastrService.error(`Email ou mot de passe incorrect! `, 'Ndiye');
                        break;
                    case 406:
                        this._toastrService.warning(`Compte innactivé! Veuillez valider ce compte a partir du lien fourni par mail! `, 'Ndiye');
                        break;
                    default:
                        this._toastrService.error(`Une erreur c'est produite! `, 'Ndiye');
                }
                
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
        ctx.dispatch(new Navigate(['/auth/signin']))
        this._toastrService.success("Deconnexion avec success! ","Ndiye")
        ctx.dispatch(new AuthTokenAction.SetAuthToken(null));  
    }

    @Action(UserProfileAction.SignupSimpleUserProfile)
    signupSimpleUserProfileState(ctx:StateContext<UserProfileStateModel>,{email,password,username}:UserProfileAction.SignupSimpleUserProfile)
    {
        const state = ctx.getState();
        ctx.patchState({
            loadingUserProfile: true
        })

        return this._authService.register(email,password,username).pipe(
            tap(
                (result)=>{
                    ctx.patchState({
                        loadingUserProfile:false,
                        userProfile:result.data
                    })
                    this._toastrService.success("Compte créé avec success! ","Ndiye")
                }
            ),
            catchError((error) => {
                ctx.patchState({
                    loadingUserProfile: false
                })
                switch(error.status)
                {
                    case 409:
                        this._toastrService.error("Ce compete existe déjà! ","Ndiye");
                        break;
                    case 400:
                        this._toastrService.error("Format de mot de passe incorrect! ","Ndiye");
                        break;
                    default:
                        this._toastrService.error("Une erreur c'est produite! ","Ndiye");
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
            loadingUserProfile: true
        })

        return this._userProfilesService.updateUserProfile(userProfile,id).pipe(
            tap(
                (result)=>{
                    ctx.patchState({
                        loadingUserProfile:false,
                        userProfile,
                    })
                    // this._toastrService.success(`Profil utilisateur modifié avec success`, 'UserProfile');
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
        const state = ctx.getState();
        if(state.userProfile) return of(true);

        ctx.patchState({
            loadingUserProfile:true
        })
        return this._userProfilesService.getUserProfile().pipe(
            tap(
                result => {
                    console.log("Result ",result)
                    ctx.setState({
                        loadingUserProfile:false,
                        userProfile:result.data,
                        initLoadingState:'LOADED'
                    })
                }
            ),
            catchError((error) => {
                ctx.patchState({
                    loadingUserProfile: false,
                    initLoadingState:"LOADED"
                })
                return throwError(error);
                
            })
        )
    }
}