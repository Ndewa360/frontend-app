import { SouscriptionPeriodModel } from "../souscription-period";

export enum SouscriptionPayementState 
{
    WAITING="waiting",
    UNPAYED="unpaid",
    PAYED="payed"
}

export enum SouscriptionType
{
    DEFAULT="default",
    NOTIFICATION="notification"
}

export interface SouscriptionModel {
    _id?: string;

    owner: string;

    isRunning:boolean;

    startedAt:Date;
    
    endedAt:Date;

    reminderId:string;

    unPayReminderId:string;
    
    periods:SouscriptionPeriodModel[];

    currentPeriod:string;

    souscriptionType:SouscriptionType;
    
    createdAt?:Date
}