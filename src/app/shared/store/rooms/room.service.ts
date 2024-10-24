import { Injectable } from "@angular/core";
import { environment } from 'src/environments/environment';
import { RoomModel } from "./room.model";
import { HttpClient } from "@angular/common/http";
import { Observable, combineLatest, of, } from "rxjs";
import { ApiResultFormat } from "../global";
import { switchMap } from "rxjs/operators";

@Injectable({
    providedIn:'root'
})
export class RoomService
{
    /**
     * Constructor
     */
    constructor(
        private _httpClient: HttpClient
    )
    {}

    /**
     * Create room
     */
    createRoom(room:RoomModel): Observable<ApiResultFormat<RoomModel>>
    {
        return this._httpClient.post<ApiResultFormat<RoomModel>>(`${environment.apiUrl}/room`, room)
    }

    /**
     * Update room
     */
    updateActiveForSouscriptionRoom(room:{isActiveForSouscription},id:string): Observable<ApiResultFormat<RoomModel>>
    {
        return this._httpClient.put<ApiResultFormat<RoomModel>>(`${environment.apiUrl}/room/update-souscription/${id}`, room)
    }

    /**
     * Update room
     */
    updateRoom(room:RoomModel,id:string): Observable<ApiResultFormat<RoomModel>>
    {
        return this._httpClient.put<ApiResultFormat<RoomModel>>(`${environment.apiUrl}/room/${id}`, room)
    }

    getRoom(roomId):Observable<ApiResultFormat<RoomModel>>
    {
        return this._httpClient.get<ApiResultFormat<RoomModel>>(`${environment.apiUrl}/room/${roomId}`)

    }

    getRoomsByProprertyID(propertyID):Observable<ApiResultFormat<RoomModel[]>>
    {       
        return this._httpClient.get<ApiResultFormat<RoomModel[]>>(`${environment.apiUrl}/room/property/${propertyID}`)
    }

    getRoomsByLocataireID(locataireID):Observable<ApiResultFormat<RoomModel[]>>
    {       
        return this._httpClient.get<ApiResultFormat<RoomModel[]>>(`${environment.apiUrl}/room/locataire/${locataireID}`)
    }

    getRooms():Observable<ApiResultFormat<RoomModel[]>>
    {       
        return this._httpClient.get<ApiResultFormat<RoomModel[]>>(`${environment.apiUrl}/room`)
    }
}