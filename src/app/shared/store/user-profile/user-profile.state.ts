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
        // private _toastrService:ToastrService,
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

        console.log("Login ")

        return this._authService.login(email,password).pipe(
            tap(
                (result)=>{
                    console.log("Result ",result)
                    ctx.patchState({
                        loadingUserProfile:false,
                        userProfile:result.data.user
                    })
                    // this.notificationService.showToast({
                    //     type: "success",
                    //     title: "Ndiye",
                    //     subtitle: "Bienvenue sur Ndiye! ",
                    //     target: "#notificationHolder",
                    //     message: "message",
                    //     duration: 2000,
                    //   })        
                        ctx.dispatch(new AuthTokenAction.SetAuthToken(result.data.access_token));          
                    // this._toastrService.success(`Profil utilisateur modifié avec success`, 'UserProfile');
                }
            ),
            catchError((error) => {
                switch(error.status)
                {
                    case 401:
                        // this.notificationService.showToast({
                        //     type: "error",
                        //     title: "Connexion",
                        //     subtitle: "Email ou mot de passe incorrect",
                        //     target: "#notificationHolder",
                        //     message: "message",
                        //     duration: 10000,
                        //   })
                        break;
                        case 406:
                            // this.notificationService.showToast({
                            //     type: "warning",
                            //     title: "Connexion",
                            //     subtitle: "Compte innactivé! Veuillez valider ce compte a partir du lien fourni par mail",
                            //     target: "#notificationHolder",
                            //     message: "message",
                            //     duration: 10000,
                            //   })
                            break;
                    default:
                        // this.notificationService.showToast({
                        //     type: "error",
                        //     title: "Connexion",
                        //     subtitle: "Une erreur c'est produite ",
                        //     target: "#notificationHolder",
                        //     message: "message",
                        //     duration: 20000,
                        //   })
                }
                
                // this._toastrService.error(error?.error?.message, 'Erreur');
                ctx.patchState({
                    loadingUserProfile: false
                })
                return throwError(error);
                
            })
        )
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
                    // this.notificationService.showToast({
                    //     type: "success",
                    //     title: "Ndiye",
                    //     subtitle: "Compte créé avec success! ",
                    //     target: "#notificationHolder",
                    //     message: "message",
                    //     duration: 2000,
                    //   })       
                      
                    // this._toastrService.success(`Profil utilisateur modifié avec success`, 'UserProfile');
                }
            ),
            catchError((error) => {
                ctx.patchState({
                    loadingUserProfile: false
                })
                switch(error.status)
                {
                    case 409:
                        // this.notificationService.showToast({
                        //     type: "error",
                        //     title: "Création de compte",
                        //     subtitle: "Ce compete existe déjà",
                        //     target: "#notificationHolder",
                        //     message: "message",
                        //     duration: 2000,
                        //   })
                          break;
                    case 400:
                        // this.notificationService.showToast({
                        //     type: "error",
                        //     title: "Création de compte",
                        //     subtitle: "Format de mot de passe incorrect",
                        //     target: "#notificationHolder",
                        //     message: "message",
                        //     duration: 2000,
                        //     })
                            break;
                    default:
                        // this.notificationService.showToast({
                        //     type: "error",
                        //     title: "Création de compte",
                        //     subtitle: "Une erreur c'est produite ",
                        //     target: "#notificationHolder",
                        //     message: "message",
                        //     duration: 2000,
                        //   })
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