import { UserModel } from "../user/user.model";


export enum INITIAL_LOCATION_FINANCIAL_STATE {
    INITIAL = "initial",
    EN_AVANCE = "en_avance",
    AVEC_ARRIERE = "avec_arriere"
}

export interface LocationModel {
    _id?: string;

    locataire?: string;

    isRunning?:boolean

    room?: string;

    property?:string;

    startedAt?:Date;
    
    endedAt?:Date;

    locationPriceUnit?:number;

    isKnowExactDateEntry?;

    removeReason?:string;
    
    createdAt?:Date
}