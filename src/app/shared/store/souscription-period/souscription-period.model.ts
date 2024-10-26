import { SouscriptionPayementState } from "../souscription/souscription.model";

export interface SouscriptionPeriodModel {
    billingRef:string;
    
    _id?: string;

    startedAt:Date;

    endedAt:Date;

    state:SouscriptionPayementState;

    soucription:string;
    
    createdAt?:Date
}