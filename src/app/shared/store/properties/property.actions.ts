import { PropertyModel } from "./property.model";

export namespace PropertyAction
{
    //Create
    export class UpdateProperty
    {
        static readonly type = '[Property] Update Property';
        constructor(public property:PropertyModel, public id:string){}
    }

    //Fetch  Property profil
    export class FetchProperty
    {
        static readonly type = '[Property] Fectch Property'
        constructor(public propertyId:string){}
    }

    //Fetch  Property profil
    export class FetchProperties
    {
        static readonly type = '[Property] Fectch Propertys'
        constructor(public propertiesId:string[]=[]){}
    }

   
    //Set property profil
    export class SetProperty
    {
        static readonly type = '[Property] Set Property'
        constructor(public property:any){}
    }

    //Create property
    export class CreateProperty
    {
        static readonly type = '[Property] Create Property'
        constructor(public property:any){}
    }


    //Change loading state
    export class updateLoadingPropertyState
    {
        static readonly type = '[Property] Loading state Property'
        constructor(public status:boolean){}
    }
}
