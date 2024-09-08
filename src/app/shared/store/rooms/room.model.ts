import { PropertyModel } from "../properties";

export enum RoomType 
{
    ROOM = "room",
    STUDIO = "studio",
    SIMPLE_APARTMENT = "simple_apartment",
    FURNISHED_APARTMENT = "furnished_apartment"
}

export enum Currency
{
    XOF = "XOF",
    USD = "$",
    EUR = "€",
    XAF = "FCFA"
}

export interface RoomModel {

    type:RoomType;
    price:number;
    specifity?:{
        numberOfBathroom?:number,
        numberOfLivingRoom?:number, 
        numberOfShower?:number, 
        isInternalShower?:boolean,
        hasKitchen?:boolean,
        isInternalKitchen?:boolean,
    }
    description?:string;
    country? :string
    image?:string;
    createdAt?: Date,
    updatedAt?: Date,
    code:string;
    _id:string;
    property:string;
    locataireId?:string;
    isFree:boolean;
}