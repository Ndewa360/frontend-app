
export interface PropertyModel {

    name:string;
    location:string;
    geolocation?: {lat:number,lng:number}
    description?:string;
    country? :string
    image?:string;
    createdAt?: Date,
    updatedAt?: Date,
    hasClosure?:boolean,
    code:string;
    _id:string;
    hasParking?:boolean;
    owner?:string;
}