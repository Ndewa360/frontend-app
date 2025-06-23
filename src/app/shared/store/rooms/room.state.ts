import { Action, Selector, State, StateContext, createSelector } from "@ngxs/store";
import { RoomModel, RoomType } from "./room.model";
import { Injectable } from "@angular/core";
import { RoomAction } from "./room.actions";
import { RoomService } from "./room.service";
// import { ToastrService } from "ngx-toastr";
import { of, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { UtilsString } from "../../utils";
import { ToastrService } from "ngx-toastr";
import { PropertyAction } from "../properties";

export class RoomStateModel {
    rooms:RoomModel[]
    loadingRoom:boolean
    initLoadingState:'NO_LOADED'|'LOADING'|'LOADED';
}


@State<RoomStateModel>({
    name: "rooms",
    defaults:{
        loadingRoom:false,
        rooms:[],
        initLoadingState:'NO_LOADED',
    }
})
@Injectable()
export class RoomState{
   
    constructor(
        private _roomsService:RoomService,
        private _toastrService:ToastrService,
    ){}

    @Selector()
    static selectStateLoading(state:RoomStateModel)
    {
        return state.loadingRoom
    }

    @Selector()
    static selectStateInitLoading(state:RoomStateModel)
    {
        return state.initLoadingState
    }
    @Selector()
    static selectStateRooms(state:RoomStateModel)
    {
        return state.rooms
    }

     
    static selectStateRoom(roomId)
    {
        return createSelector([RoomState],(state)=>{
            if(!roomId) return null;
            let data=state.rooms.find((u)=>u._id==roomId)
            if(data) return data
            return null;
        })
    }

    static selectStateFreeRoomByPropertyId(propertyId: any) {
        return createSelector([RoomState],(state)=> state.rooms.filter((room)=>room.property==propertyId && room.isFree==true));    
      }

    static selectStateCountRoomWByPropertyId(propertyId: any) {
        return createSelector([RoomState],(state)=> (state.rooms.filter((room)=>room.property==propertyId).length))
    }
    static selectStateCountRoomWithStateByPropertyId(propertyId: any) {
        return createSelector([RoomState],(state)=> ({
            noFreeRoomCount: state.rooms.filter((room)=>room.property==propertyId && room.isFree!=true).length,
            roomCountTotal:state.rooms.length
        }))
    }

    @Selector()
    static selectStateCountRoomActive(state:RoomStateModel) {
        return state.rooms.filter((room)=>room.isActiveForSouscription==true).length
    }

    @Selector()
    static selectStatePriceRoomActive(state:RoomStateModel) {
        let price = state.rooms.filter((room)=>room.isActiveForSouscription==true).map((r)=>r.price).reduce((acc,curr)=>acc+curr,0);
        return Math.floor((price *2) /100)
    }

    static selectStateRoomByRoomName(name=null)
    {
        return createSelector([RoomState],(state)=> state.rooms.filter((room)=>{
                if(name==null) return room;
                if(room.name.indexOf(name)) return room;
            }))
    
    }

    static selectStateRoomByPropertyId(id)
    {
        return createSelector([RoomState],(state)=> state.rooms.filter((room)=>room.property==id));    
    }

    static selectStateNumberOfRoomByPropertyId(id)
    {
        return createSelector([RoomState],(state)=> state.rooms.filter((room)=>room.property==id).length);    
    }

    @Action(RoomAction.SetRoom)
    uploadLocalRoomState(ctx:StateContext<RoomStateModel>, {room}:RoomAction.UpdateRoom) 
    {
        const state = ctx.getState();

        const data = [...state.rooms]
        let index = data.findIndex((u)=>u._id==room._id);
        if(index>-1) data[index]=room;
        ctx.patchState({
            rooms:data
        })
    }

    
    @Action(RoomAction.RemoveImageRoom)
    removeRoomImageState(ctx:StateContext<RoomStateModel>, {fileUrl,roomId}:RoomAction.RemoveImageRoom) 
    {
        const state = ctx.getState();

        const data = [...state.rooms]
        let index = data.findIndex((u)=>u._id==roomId);
        if(index>-1) {
            let room = {...data[index]};
            let indexFile = room.medias.findIndex((u)=>u==fileUrl);
            if(indexFile>-1) {
                let medias = [...room.medias]
                medias.splice(indexFile,1)
                room.medias=[...medias];
            }
            data[index]=room;
            ctx.patchState({
                rooms:data
            })
        }
    }

    @Action(RoomAction.ResetAllState)
    resetAllState(ctx:StateContext<RoomStateModel>)
    {
        ctx.setState({
            loadingRoom:false,
            rooms:[],
            initLoadingState:'NO_LOADED',
        })
    }

    @Action(RoomAction.Logout)
    logout(ctx:StateContext<RoomStateModel>)
    {
        ctx.setState({
            loadingRoom:false,
            rooms:[],
            initLoadingState:'NO_LOADED',
        })
    }

    @Action(RoomAction.UpdateRoom)
    updateRoom(ctx:StateContext<RoomStateModel>, {room,id}:RoomAction.UpdateRoom)
    {
        const state = ctx.getState();
        ctx.patchState({
            loadingRoom: true
        })

        return this._roomsService.updateRoom(room,id).pipe(
            tap(
                (result)=>{
                    const data = [...state.rooms]
                    let index = data.findIndex((u)=>u._id==id);
                    if(index>-1) data[index]=result.data;
                    ctx.patchState({
                        loadingRoom:false,
                        rooms:data
                    })
                    this._toastrService.success(`Bien mise à jour avec success!`, 'Ndewa360°');

                }
            ),
            catchError((error) => {
                // this._toastrService.error(error?.error?.message, 'Erreur');
                ctx.patchState({
                    loadingRoom: false
                })
                return throwError(error);
                
            })
        )
    }

    @Action(RoomAction.UpdateLocalRoomInfos)
    updateRoomStatus(ctx:StateContext<RoomStateModel>, {roomId,data}:RoomAction.UpdateLocalRoomInfos)
    {
        const state = ctx.getState();
        let index = state.rooms.findIndex((u)=>u._id==roomId);
        if(index>-1) {
            const roomData = [...state.rooms];
            roomData[index]={...roomData[index],...data}
            ctx.patchState({
                rooms:roomData
            })
        }
    }

    
    @Action(RoomAction.updateLoadingRoomState)
    updateLoadingRoomState(ctx:StateContext<RoomStateModel>,{status}:RoomAction.updateLoadingRoomState)
    {
        const state = ctx.getState();
        ctx.patchState(
            {
                loadingRoom:status
            }
        )
        return of(true)
    }

   

    @Action(RoomAction.FetchRoom)
    fetchRoom(ctx:StateContext<RoomStateModel>,{roomId}:RoomAction.FetchRoom)
    {
        const state = ctx.getState();
        let index = state.rooms.findIndex((u)=>u._id==roomId);

        if(index>-1) return of(true);
        console.log("Load Room")
        ctx.patchState({
            loadingRoom:true
        })
        return this._roomsService.getRoom(roomId).pipe(
            tap(
                result => {
                    ctx.patchState({
                        loadingRoom:false,
                        rooms:[...state.rooms, result.data]
                    })
                }
            )
        )
    }

    @Action(RoomAction.DeleteRoom)
    deleteRoom(ctx:StateContext<RoomStateModel>,{roomId}:RoomAction.DeleteRoom)
    {
        const state = ctx.getState();
        let index = state.rooms.findIndex((u)=>u._id==roomId);

        if(index<-1) return of(true);

        ctx.patchState({
            loadingRoom:true
        })
        return this._roomsService.deleteRoom(roomId).pipe(
            tap(
                result => {
                    let roomState = [...state.rooms];
                    console.log("Prop ",roomState[index].property)
                    ctx.dispatch(new PropertyAction.ChangePropertyRoomLength(roomState[index].property));
                    roomState.splice(index, 1)
                    this._toastrService.success(`Bien supprimé avec success!`, 'Ndewa360°');
                    ctx.patchState({
                        loadingRoom:false,
                        rooms:roomState
                    })
                }
            )
        )
    }

    @Action(RoomAction.FetchRoomsByPropertyID)
    fetchRoomByPropertyID(ctx:StateContext<RoomStateModel>,{propertyID}:RoomAction.FetchRoomsByPropertyID)
    {
        let index = ctx.getState().rooms.findIndex((u)=>u.property==propertyID);

        if(index>-1) return of(true);
        
        ctx.patchState({
            loadingRoom:true,
            initLoadingState:"LOADING"
        })
        return this._roomsService.getRoomsByProprertyID(propertyID).pipe(
            tap(
                result => {
                    ctx.patchState({
                        loadingRoom:false,
                        rooms:[...ctx.getState().rooms, ...result.data],
                        initLoadingState:"LOADED"
                    })
                }
            )
        )
    }

    @Action(RoomAction.FetchRoomsByLocataireID)
    fetchRoomByLocataireID(ctx:StateContext<RoomStateModel>,{locataireID}:RoomAction.FetchRoomsByLocataireID)
    {
        const state = ctx.getState();
        let index = state.rooms.findIndex((u)=>u.locataire==locataireID);

        if(index>-1) return of(true);
        
        ctx.patchState({
            loadingRoom:true,
            initLoadingState:"LOADING"
        })
        return this._roomsService.getRoomsByLocataireID(locataireID).pipe(
            tap(
                result => {
                    ctx.patchState({
                        loadingRoom:false,
                        rooms:[...state.rooms, ...result.data],
                        initLoadingState:"LOADED"
                    })
                }
            )
        )
    }

    @Action(RoomAction.ChangeStatusActivatedForSouscriptionRoom)
    setRoomActiveForSouscription(ctx:StateContext<RoomStateModel>,{roomId,isActiveForSouscription}:RoomAction.ChangeStatusActivatedForSouscriptionRoom)
    {    
           
        ctx.patchState({
            loadingRoom:true,
            initLoadingState:"LOADING"
        })
        return this._roomsService.updateActiveForSouscriptionRoom({isActiveForSouscription},roomId).pipe(
            tap(
                result => {
                    const state = ctx.getState();
                    let index = state.rooms.findIndex((u)=>u._id==roomId);
                    if(index>-1) {
                        const data = [...state.rooms];
                        data[index]={...data[index],isActiveForSouscription}
                        ctx.patchState({
                            rooms:data
                        })
                    }
                    ctx.patchState({
                        loadingRoom:false,
                        initLoadingState:"LOADED"
                    })
                    let status = isActiveForSouscription?"activé":"désactivé";
                    this._toastrService.success(`La souscription à été ${status} avec success!`, 'Ndewa360°');
                }
            ),
            catchError((error)=>{
                  return error;
            })
        )
    }

    @Action(RoomAction.CreateRoom)
    createRoom(ctx:StateContext<RoomStateModel>,{room,propertyId,locataireId}:RoomAction.CreateRoom,)
    {
        const state = ctx.getState();

        let bodyToSend ={...room,propertyId};
        if(locataireId) bodyToSend["locataireId"]=locataireId

        ctx.patchState({
            loadingRoom:true
        })
        return this._roomsService.createRoom(bodyToSend).pipe(
            tap(
                result => {
                    this._toastrService.success(`${UtilsString.getStringOfRoomType(room.type)} ajouté avec success!`, 'Ndewa360°');
                    ctx.patchState({
                        loadingRoom:false,
                        rooms:[...state.rooms, result.data]
                    })
                }
            ),
            catchError((error)=>{
                  return error;
            })
        )
    }

    @Action(RoomAction.FetchRooms)
    fetchRooms(ctx:StateContext<RoomStateModel>)
    {
        const state = ctx.getState();
        if(state.initLoadingState=="LOADED") return of(true);
        
        ctx.patchState({
            loadingRoom:true,
            initLoadingState:"LOADING"
        })
        return this._roomsService.getRooms().pipe(
            tap(
                result => {
                    if(state.initLoadingState!="LOADED") ctx.patchState({initLoadingState:'LOADING'})
                    ctx.patchState({
                        loadingRoom:false,
                        rooms:[...state.rooms,...result.data],
                    })
                }
            )
        )
    }
}