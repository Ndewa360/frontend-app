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
        private _toastrService:ToastrService
    ){}

    @Selector()
    static selectStateLoading(state:PropertyStateModel)
    {
        return state.loadingProperty
    }
    @Selector() 
    static setlectStateProperties(state:PropertyStateModel)
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

    static selectStatePropertyByPropertyName(name=null)
    {
        return createSelector([PropertyState],(state)=> state.propertys.filter((property)=>{
                if(name==null) return property;
                if(property.name.indexOf(name)) return property;
            }))
    
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
                    this._toastrService.success(`Propriété mise à jour avec success!`, 'Ndewa360°');
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
    fetchProperty(ctx:StateContext<PropertyStateModel>,{propertyId}:PropertyAction.FetchProperty)
    {
        const state = ctx.getState();
        let index = state.properties.findIndex((u)=>u._id==propertyId);

        if(index>-1) return of(true);

        ctx.patchState({
            loadingProperty:true
        })
        return this._propertysService.getProperty(propertyId).pipe(
            tap(
                result => {
                    console.warn("Property Found ",result)
                    ctx.patchState({
                        loadingProperty:false,
                        properties:[...state.properties, result.data]
                    })
                }
            )
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
                    this._toastrService.success(`Propriété ajouté avec success!`, 'Ndewa360°');

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
    fetchProperties(ctx:StateContext<PropertyStateModel>)
    {
        if(ctx.getState().initLoadingState=="LOADED") return of(true);

        const state = ctx.getState();
        ctx.patchState({
            loadingProperty:true,
            initLoadingState:"LOADING"
        })
        return this._propertysService.getProperties().pipe(
            tap(
                result => {
                    console.log("Fetch Properties ",result)
                    if(state.initLoadingState!="LOADED") ctx.patchState({initLoadingState:'LOADED'})
                    ctx.patchState({
                        loadingProperty:false,
                        properties:[...result.data],
                    })
                }
            )
        )
    }
}