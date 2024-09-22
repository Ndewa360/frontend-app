import { UserModel } from "../user/user.model";

export interface LocationModel {
    _id?: string;

    locataire?: string;

    isRunning?:boolean

    room?: string;

    property?:string;

    startedAt?:Date;
    
    endedAt?:Date;

    locationPriceUnit?:number

    createdAt?:Date
}