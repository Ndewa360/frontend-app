import { RoomModel } from "./room.model";

export namespace RoomAction
{
    //Create
    export class UpdateRoom
    {
        static readonly type = '[Room] Update Room';
        constructor(public room:RoomModel, public id:string){}
    }

    export class ResetAllState
    {
        static readonly type = '[Room] Reset All State';
    }

    //Fetch  Room profil
    export class FetchRoom
    {
        static readonly type = '[Room] Fectch Room'
        constructor(public roomId:string){}
    }

    export class RemoveImageRoom
    {
        static readonly type = '[Room] Update Image Room'
        constructor(public fileUrl:string, public roomId:string){}
    }

    //Fetch  Room profil
    export class FetchRooms
    {
        static readonly type = '[Room] Fectch Rooms'
        constructor(public roomsID:string[]=[]){}
    }

    export class FetchRoomsByPropertyID
    {
        static readonly type = '[Room] Fectch Rooms By PropertyID'
        constructor(public propertyID:string){}
    }

    export class FetchRoomsByLocataireID
    {
        static readonly type = '[Room] Fectch Rooms By LocataireID'
        constructor(public locataireID:string){}
    }

   
    //Set room profil
    export class SetRoom
    {
        static readonly type = '[Room] Set Room'
        constructor(public room:any){}
    }

    //Create room
    export class CreateRoom
    {
        static readonly type = '[Room] Create Room'
        constructor(public room:any,public propertyId:string,public locataireId:string=null){}
    }

    //Change Room usable
    export class ChangeStatusRoom
    {
        static readonly type = '[Room] Change Room Status'
        constructor(public roomId:string,public status:boolean,public locataire:string=null){}
    }

    export class ChangeStatusActivatedForSouscriptionRoom
    {
        static readonly type = '[Room] Change Room Status for souscription'
        constructor(public roomId:any,public isActiveForSouscription:boolean){}
    }

    //Change loading state
    export class updateLoadingRoomState
    {
        static readonly type = '[Room] Loading state Room'
        constructor(public status:boolean){}
    }
}
