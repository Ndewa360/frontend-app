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
                    console.log("Result ",result)
                    const data = [...state.properties]
                    let index = data.findIndex((u)=>u._id==id);
                    if(index>-1) data[index]=result.data;
                    ctx.patchState({
                        loadingProperty:false,
                        properties:data
                    })
                    this._toastrService.success(`Propriété mise à jour avec success!`, 'Ndiye');
                }
            ),
            catchError((error) => {
                ctx.patchState({
                    loadingProperty: false
                })
                let message = error?.error?.message;
                if(!message) message = "Une erreur c'est produite! Réessayez plus tard"
                this._toastrService.error(message, 'Ndiye');
                return throwError(error);
                
            })
        )
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
                    ctx.patchState({
                        loadingProperty:false,
                        properties:[...state.properties, result.data]
                    })
                }
            )
        )
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
                    // this.notificationService.showToast({
                    //     type: "success",
                    //     title: "Biens Immobilier",
                    //     subtitle: "Bien crée avec success!",
                    //     target: "#notificationHolder",
                    //     message: "message",
                    //     duration: 2000,
                    // })
                }
            ),
            catchError((error)=>{
                // this.notificationService.showToast({
                //     type: "error",
                //     title: "Biens Immobilier",
                //     subtitle: "Une erreur c'est produite ",
                //     target: "#notificationHolder",
                //     message: "message",
                //     duration: 2000,
                //   });
                  return error;
            })
        )
    }

    @Action(PropertyAction.FetchProperties)
    fetchProperties(ctx:StateContext<PropertyStateModel>)
    {
        const state = ctx.getState();
        
        
        ctx.patchState({
            loadingProperty:true,
            initLoadingState:"LOADING"
        })
        return this._propertysService.getProperties().pipe(
            tap(
                result => {
                    console.log("Result Property ",result)
                    if(state.initLoadingState!="LOADED") ctx.patchState({initLoadingState:'LOADING'})
                    ctx.patchState({
                        loadingProperty:false,
                        properties:[...state.properties,...result.data],
                    })
                }
            )
        )
    }
}