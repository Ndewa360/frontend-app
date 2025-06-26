import { Action, Selector, State, StateContext, createSelector } from "@ngxs/store";
import { LocataireModel } from "./locataire.model";
import { Injectable } from "@angular/core";
import { LocataireAction } from "./locataire.actions";
import { LocataireService } from "./locataire.service";
// import { ToastrService } from "ngx-toastr";
import { of, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { NotificationService } from "carbon-components-angular";
import { ToastrService } from "ngx-toastr";

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
        private _toastrService:ToastrService
        // private notificationService: NotificationService,

    ){}

    @Selector()
    static selectStateLoading(state:LocataireStateModel)
    {
        return state.loadingLocataire
    }

    @Selector()
    static selectStateInitLoading(state:LocataireStateModel)
    {
        return state.initLoadingState
    }

    @Selector()
    static selectStateLocataires(state:LocataireStateModel)
    {
        return state.locataires
    }

    static selectStateLocataire(locataireId)
    {
        return createSelector([LocataireState],(state)=>{
            let data=state.locataires.find((u)=>u._id==locataireId)
            if(data) return data
            return null;
        })
    
    }
    
    static selectStateLocatairesByPropertyId(propertyID)
    {
        return createSelector([LocataireState],(state)=> state.locataires.filter((locataire)=>locataire.property==propertyID))
    }

    static selectStateLocataireByPropertyId(propertyID)
    {
        return createSelector([LocataireState],(state)=> state.locataires.filter((locataire)=>locataire.property==propertyID))
    }

    static selectStateLocataireCountByPropertyId(propertyID)
    {
        return createSelector([LocataireState],(state)=> state.locataires.filter((locataire)=>locataire.property==propertyID).length)
    }

    static selectStateFreeLocataireByPropertyId(propertyID: string) {
        return createSelector([LocataireState],(state)=> state.locataires.filter((locataire:LocataireModel)=>locataire.property==propertyID && locataire.room==null))
      }
    
      static selectStateCountLocataireByPropertyId(propertyID:string,year:string|number)
    {
        return createSelector([LocataireState],(state)=> ({
            countLocataireForPropertyId:state.locataires.filter((location)=>location.property==propertyID).length,
            countAllLocataire:state.locataires.length
        }))
    }

    @Action(LocataireAction.ResetAllState)
    resetAllState(ctx:StateContext<LocataireStateModel>)
    {
        ctx.setState({
            loadingLocataire:false,
            locataires:[],
            initLoadingState:'NO_LOADED',
        })
    }

    @Action(LocataireAction.Logout)
    logout(ctx:StateContext<LocataireStateModel>)
    {
        ctx.setState({
            loadingLocataire:false,
            locataires:[],
            initLoadingState:'NO_LOADED',
        })
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
                    this._toastrService.success(`Profil locataire modifié avec success`, 'Ndewa360°');
                }
            ),
            catchError((error) => {               
                ctx.patchState({
                    loadingLocataire: false
                })
                return throwError(error);
                
            })
        )
    }

    @Action(LocataireAction.UpdateLocataireRoom)
    updateLocataireRoom(ctx:StateContext<LocataireStateModel>, {locataireId,roomId}:LocataireAction.UpdateLocataireRoom)
    {
        const state = ctx.getState(); 
        let index = state.locataires.findIndex((u)=>u._id==locataireId);
        if(index>-1) {
            const data = [...state.locataires];
            data[index]={...data[index],room:roomId}
            ctx.patchState({
                locataires:data
            })
        }
        
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
                    ctx.patchState({
                        loadingLocataire:false,
                        locataires:[...state.locataires, result.data]
                    })
                    this._toastrService.success(`Locataire ajouté avec success!`, 'Ndewa360°');

                }
            ),
            catchError((error)=>{
                ctx.patchState({
                    loadingLocataire: false
                })
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
                (result:any) => {
                    let locataireFound=[...state.locataires];
                    result.data.forEach((locataire:LocataireModel)=>{
                        if(locataireFound.findIndex((u)=>u._id==locataire._id)==-1) locataireFound.push(locataire)
                    })
                console.log("Locataire Found ",locataireFound)
                    // let locatiresResult = 
                    ctx.patchState({
                        loadingLocataire:false,
                        locataires:locataireFound,
                        initLoadingState:"LOADED"
                    })
                }
            ),
            catchError((error)=>{
                ctx.patchState({
                    loadingLocataire: false
                })
                return throwError(error);
            })
        )
    }
}