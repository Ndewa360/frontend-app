import { Action, Selector, State, StateContext, createSelector } from "@ngxs/store";
import { PropertyModel } from "./property.model";
import { Injectable } from "@angular/core";
import { PropertyAction } from "./property.actions";
import { PropertyService } from "./property.service";
// import { ToastrService } from "ngx-toastr";
import { of, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { NotificationService } from "carbon-components-angular";
import { ToastrService } from "ngx-toastr";
import { TranslateService } from "@ngx-translate/core";

export class PropertyStateModel {
    properties:PropertyModel[]
    loadingProperty:boolean
    initLoadingState:'NO_LOADED'|'LOADING'|'LOADED';
}


@State<PropertyStateModel>({
    name: "properties",
    defaults:{
        loadingProperty:false,
        properties:[],
        initLoadingState:'NO_LOADED',
    }
})
@Injectable()
export class PropertyState{
    constructor(
        private _propertysService:PropertyService,
        private _toastrService:ToastrService,
        private _translateService: TranslateService
    ){}

    @Selector()
    static selectStateLoading(state:PropertyStateModel)
    {
        return state.loadingProperty
    }
    @Selector()
    static selectStateProperties(state:PropertyStateModel)
    {
        return state.properties
    }

    @Selector() 
    static selectStateInitLoading(state:PropertyStateModel)
    {
        return state.initLoadingState
    }

    static selectStateProperty(propertyId)
    {
        return createSelector([PropertyState],(state)=>{
            let data=state.properties.find((u)=>u._id==propertyId)
            if(data) return data
            return null;
        })
    
    }

    static selectStatePropertyByPropertyName(name: string = null)
    {
        return createSelector([PropertyState], (state: PropertyStateModel) => state.properties.filter((property) => {
            if (name == null) return true;
            return property.name.toLowerCase().includes(name.toLowerCase());
        }));
    }

    @Action(PropertyAction.UpdateProperty)
    updateProperty(ctx:StateContext<PropertyStateModel>, {property,id}:PropertyAction.UpdateProperty)
    {
        const state = ctx.getState();
        ctx.patchState({
            loadingProperty: true
        })
        return this._propertysService.updateProperty(property,id).pipe(
            tap(
                (result)=>{
                    const data = [...state.properties]
                    let index = data.findIndex((u)=>u._id==id);
                    if(index>-1) data[index]=result.data;
                    ctx.patchState({
                        loadingProperty:false,
                        properties:data
                    })
                    
                    this._toastrService.success(this._translateService.instant('NOTIFICATIONS.PROPERTY_UPDATED_SUCCESS'), 'Ndewa360°');
                }
            ),
            catchError((error) => {
                ctx.patchState({
                    loadingProperty: false
                })
                return throwError(error);
                
            })
        )
    }

    @Action(PropertyAction.ResetAllState)
    resetAllState(ctx:StateContext<PropertyStateModel>)
    {
        ctx.setState({
            loadingProperty:false,
            properties:[],
            initLoadingState:'NO_LOADED',
        })
    }

    @Action(PropertyAction.Logout)
    logout(ctx:StateContext<PropertyStateModel>)
    {
        ctx.setState({
            loadingProperty:false,
            properties:[],
            initLoadingState:'NO_LOADED',
        })
    }

    @Action(PropertyAction.ChangePropertyRoomLength)
    changePropertyRoomLength(ctx:StateContext<PropertyStateModel>, {propertyID}:PropertyAction.ChangePropertyRoomLength)
    {
        const state = ctx.getState();
        const data = [...state.properties]
        let index = data.findIndex((u)=>u._id==propertyID);
        if(index>-1) {
            let property = {...data[index]};
            property.roomLength--;
            data[index]=property;
            ctx.patchState({
                properties:data
            })
        }
    }
    @Action(PropertyAction.updateLoadingPropertyState)
    updateLoadingPropertyState(ctx:StateContext<PropertyStateModel>,{status}:PropertyAction.updateLoadingPropertyState)
    {
        const state = ctx.getState();
        ctx.patchState(
            {
                loadingProperty:status
            }
        )
        return of(true)
    }

    @Action(PropertyAction.SetProperty)
    uploadLocalRoomState(ctx:StateContext<PropertyStateModel>, {property}:PropertyAction.SetProperty) 
    {
        const state = ctx.getState();

        const data = [...state.properties]
        let index = data.findIndex((u)=>u._id==property._id);
        if(index>-1) data[index]=property;
        ctx.patchState({
            properties:data
        })
    }
   

    @Action(PropertyAction.FetchProperty)
    fetchProperty(ctx: StateContext<PropertyStateModel>, { propertyId }: PropertyAction.FetchProperty)
    {
        const state = ctx.getState();
        const index = state.properties.findIndex((u) => u._id == propertyId);
        if (index > -1) return of(true);

        ctx.patchState({ loadingProperty: true });
        return this._propertysService.getProperty(propertyId).pipe(
            tap(result => {
                ctx.patchState({
                    loadingProperty: false,
                    properties: [...ctx.getState().properties, result.data]
                });
            }),
            catchError((error) => {
                ctx.patchState({ loadingProperty: false });
                this._toastrService.error(
                    this._translateService.instant('NOTIFICATIONS.GENERIC_ERROR_RETRY'),
                    'Ndewa360°'
                );
                return throwError(error);
            })
        );
    }

    @Action(PropertyAction.FetchPropertyForced)
    fetchPropertyForced(ctx:StateContext<PropertyStateModel>,{propertyId}:PropertyAction.FetchPropertyForced)
    {
        const state = ctx.getState();
        ctx.patchState({ loadingProperty:true })
        return this._propertysService.getProperty(propertyId).pipe(
            tap(result => {
                if (!result?.data) return;
                const existing = state.properties.filter(p => p._id !== propertyId);
                ctx.patchState({
                    loadingProperty: false,
                    properties: [...existing, result.data]
                });
            }),
            catchError(error => {
                ctx.patchState({ loadingProperty: false });
                return throwError(error);
            })
        )
    }


    @Action(PropertyAction.RemoveFile)
    removeRoomImageState(ctx:StateContext<PropertyStateModel>, {fileUrl,propertyID}:PropertyAction.RemoveFile) 
    {
        const state = ctx.getState();

        const data = [...state.properties]
        let index = data.findIndex((u)=>u._id==propertyID);
        if(index>-1) {
            let property = {...data[index]};
            let indexFile = property.medias.findIndex((u)=>u==fileUrl);

            if(indexFile>-1) {
                let medias = [...property.medias]
                medias.splice(indexFile,1)
                property.medias=[...medias];
            }
            data[index]=property;
            ctx.patchState({
                properties:data
            })
        }
    }


    @Action(PropertyAction.CreateProperty)
    createProperty(ctx:StateContext<PropertyStateModel>,{property}:PropertyAction.CreateProperty)
    {
        const state = ctx.getState();

        ctx.patchState({
            loadingProperty:true
        })
        return this._propertysService.createProperty(property).pipe(
            tap(
                result => {
                    ctx.patchState({
                        loadingProperty:false,
                        properties:[...state.properties, result.data]
                    });                    
                    this._toastrService.success(this._translateService.instant('NOTIFICATIONS.PROPERTY_CREATED_SUCCESS'), 'Ndewa360°');

                }
            ),
            catchError((error)=>{
                ctx.patchState({
                    loadingProperty: false
                })
                return throwError(error);
            })
        )
    }

    @Action(PropertyAction.FetchProperties)
    fetchProperties(ctx: StateContext<PropertyStateModel>)
    {
        // Si déjà chargé, recharger en arrière-plan sans vider les données existantes
        // Cela évite le flash de 0 lors du retour sur la page
        const alreadyLoaded = ctx.getState().initLoadingState === 'LOADED';

        if (!alreadyLoaded) {
            ctx.patchState({ loadingProperty: true, initLoadingState: 'LOADING' });
        }

        return this._propertysService.getProperties().pipe(
            tap(result => {
                ctx.patchState({
                    loadingProperty: false,
                    initLoadingState: 'LOADED',
                    properties: [...result.data]
                });
            }),
            catchError((error) => {
                ctx.patchState({ loadingProperty: false, initLoadingState: 'NO_LOADED' });
                this._toastrService.error(
                    this._translateService.instant('NOTIFICATIONS.GENERIC_ERROR_RETRY'),
                    'Ndewa360°'
                );
                return throwError(error);
            })
        );
    }
}