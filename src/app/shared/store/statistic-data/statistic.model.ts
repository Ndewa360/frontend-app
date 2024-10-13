import { LocataireModel } from "../locataire";
import { PropertyModel } from "../properties";
import { RoomModel } from "../rooms";


export interface StatisticRoomYearModel {
    room:RoomModel,
    paymentValue:number[],
    year:string;
}

export interface StatisticLocataireYearModel {
    locataire:LocataireModel,
    paymentValue:number[],
    year:string;
}

export enum StatisticPaymentStateType
{   
    ENDED_CONTRACT="payed",
    PAYED="payed",
    UNPAYED="unpayed",
    WAITING="waiting"
}

export interface StatisticPaymentState
{
    month:number,
    year:string,
    state:StatisticPaymentStateType,
    price:number,
    unitLocationPaymentPrice?:number
  }

export interface StatisticAllPaymentLocataireYearModel {
    locataire:LocataireModel,
    room : RoomModel,
    paymentState : StatisticPaymentState[],
    year:string
}