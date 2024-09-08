import { Action, Selector, State, StateContext, createSelector } from "@ngxs/store";
import { LocataireModel } from "./locataire.model";
import { Injectable } from "@angular/core";
import { LocataireAction } from "./locataire.actions";
import { LocataireService } from "./locataire.service";
// import { ToastrService } from "ngx-toastr";
import { of, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { NotificationService } from "carbon-components-angular";

export class LocataireStateModel {
    locataires:LocataireModel[]
    loadingLocataire:boolean
    initLoadingState:'NO_LOADED'|'LOADING'|'LOADED';
}


@State<LocataireStateModel>({
    name: "locatairelist",
    defaults:{
        loadingLocataire:false,
        locataires:[],
        initLoadingState:'NO_LOADED',
    }
})
@Injectable()
export class LocataireState{
    constructor(
        private _locatairesService:LocataireService,
        // private notificationService: NotificationService,

    ){}

    @Selector()
    static selectStateLoading(state:LocataireStateModel)
    {
        return state.loadingLocataire
    }
    @Selector() 
    static setlectStateLocataires(state:LocataireStateModel)
    {
        return state.locataires
    }

    static selectStateLocataire(locataireId)
    {
        return createSelector([LocataireState],(state)=>{
            let data=state.locataires.find((u)=>u.id==locataireId)
            if(data) return data
            return null;
        })
    
    }

    static selectStateLocataireByPropertyId(propertyID)
    {
        return createSelector([LocataireState],(state)=> state.locataires.filter((locataire)=>locataire.property==propertyID))
    }

    @Action(LocataireAction.UpdateLocataire)
    updateLocataire(ctx:StateContext<LocataireStateModel>, {locataire,id}:LocataireAction.UpdateLocataire)
    {
        const state = ctx.getState();
        ctx.patchState({
            loadingLocataire: true
        })

        return this._locatairesService.updateLocataire(locataire,id).pipe(
            tap(
                (result)=>{
                    const data = [...state.locataires]
                    let index = data.findIndex((u)=>u._id==id);
                    if(index>-1) data[index]=result.data;
                    ctx.patchState({
                        loadingLocataire:false,
                        locataires:data
                    })
                    // this._toastrService.success(`Profil utilisateur modifié avec success`, 'Locataire');
                }
            ),
            catchError((error) => {
                // this._toastrService.error(error?.error?.message, 'Erreur');
                ctx.patchState({
                    loadingLocataire: false
                })
                return throwError(error);
                
            })
        )
    }

    
    @Action(LocataireAction.updateLoadingLocataireState)
    updateLoadingLocataireState(ctx:StateContext<LocataireStateModel>,{status}:LocataireAction.updateLoadingLocataireState)
    {
        const state = ctx.getState();
        ctx.patchState(
            {
                loadingLocataire:status
            }
        )
        return of(true)
    }

   

    @Action(LocataireAction.FetchLocataire)
    fetchLocataire(ctx:StateContext<LocataireStateModel>,{locataireId}:LocataireAction.FetchLocataire)
    {
        const state = ctx.getState();
        let index = state.locataires.findIndex((u)=>u._id==locataireId);

        if(index>-1) return of(true);

        ctx.patchState({
            loadingLocataire:true
        })
        return this._locatairesService.getLocataire(locataireId).pipe(
            tap(
                result => {
                    ctx.patchState({
                        loadingLocataire:false,
                        locataires:[...state.locataires, result.data]
                    })
                }
            )
        )
    }

    @Action(LocataireAction.CreateLocataire)
    createLocataire(ctx:StateContext<LocataireStateModel>,{locataire}:LocataireAction.CreateLocataire)
    {
        const state = ctx.getState();

        ctx.patchState({
            loadingLocataire:true
        })
        return this._locatairesService.createLocataire(locataire).pipe(
            tap(
                result => {
                    // this.notificationService.showToast({
                    //     type: "success",
                    //     title: "Locataire",
                    //     subtitle: "Locataire ajouté avec success!",
                    //     target: "#notificationHolder",
                    //     message: "message",
                    //     duration: 20000,
                    //   })
                    ctx.patchState({
                        loadingLocataire:false,
                        locataires:[...state.locataires, result.data]
                    })
                }
            ),
            catchError((error)=>{
                // this.notificationService.showToast({
                //     type: "error",
                //     title: "Locataire",
                //     subtitle: "Une erreur c'est produite ",
                //     target: "#notificationHolder",
                //     message: "message",
                //     duration: 20000,
                //   });
                  return throwError(error);
            })
        )
    }

    @Action(LocataireAction.FetchLocatairesByPropertyId)
    fetchLocatairesByPropertyId(ctx:StateContext<LocataireStateModel>,{propertyId}:LocataireAction.FetchLocatairesByPropertyId)
    {
        const state = ctx.getState();
        if(state.locataires.findIndex((u)=>u.property==propertyId)>-1) return of(true);

        ctx.patchState({
            loadingLocataire:true,
            initLoadingState:"LOADING"
        })
        return this._locatairesService.getLocataires(propertyId).pipe(
            tap(
                result => {
                    console.log("Fetch Locataire ",result)
                    ctx.patchState({
                        loadingLocataire:false,
                        locataires:[...state.locataires,...result.data],
                        initLoadingState:"LOADED"
                    })
                }
            )
        )
    }
}