import { CityModel } from "../city";
import { CountryModel } from "../country";

export interface PropertyModel {

    name:string;
    location:string;
    geolocationCountry:CountryModel;
    geolocationCity:CityModel
    description?:string;
    image?:string;
    createdAt?: Date,
    updatedAt?: Date,
    hasClosure?:boolean,
    code:string;
    _id:string;
    hasParking?:boolean;
    owner?:string;
}