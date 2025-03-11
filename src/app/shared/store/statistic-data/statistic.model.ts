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

export interface StatisticPaymentOfAllPropertyByYear {
    year: string;
    paymentProperty: {
        property:PropertyModel, 
        amountMonth:{totalAmountRelicat:number,totalAmountReceived:number,totalAmountToBeReceveid:number,month:number}[],
        amountProperty:{totalAmountRelicat:number,totalAmountReceived:number,totalAmountToBeReceveid:number}
    }[],
    paymentYear:{
        totalAmountRelicat:number,
        totalAmountReceived:number,
        totalAmountToBeReceveid:number
    }
}

export enum StatisticPaymentStateType
{   
    ENDED_CONTRACT="endedContract",
    PAYED="payed",
    UNPAYED="unpayed",
    WAITING="waiting",
    PARTIAL_PAYMENT="partialPayment",
    NO_CONTRACT="noContract"
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