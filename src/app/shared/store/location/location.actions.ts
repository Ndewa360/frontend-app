import { LocationModel } from "./location.model";

export namespace LocationAction
{
    //Create Location
    export class AddLocation
    {
        static readonly type = '[Location] Add Location';
        constructor(public location:LocationModel){}
    }

    //Update Location
    export class UpdateLocation
    {
        static readonly type = '[Location] Update Location';
        constructor(public location:LocationModel, public id:string){}
    }

    //Fetch  Location
    export class FetchLocation
    {
        static readonly type = '[Location] Fectch Location'
        constructor(public locationId:string){}
    }

    export class RemoveAssignationLocation
    {
        static readonly type = '[Location] Remove assignation Location'
        constructor(public locationId:string,public description:string=""){}
    }
    
    //Fetch  Location
    export class FetchLocations
    {
        static readonly type = '[Location] Fectch Locations'
        constructor(public propertyId:string){}
    }

    export class FetchLocationsByPropertyId
    {
        static readonly type = '[Location] Fectch Locations By PropertyID'
        constructor(public propertyId:string){}
    }

    
    //Set Location
    export class SetLocation
    {
        static readonly type = '[Location] Set Location'
        constructor(public location:any){}
    }

    //Change loading state
    export class updateLoadingLocationState
    {
        static readonly type = '[Location] Loading state Location'
        constructor(public status:boolean){}
    }

    export class CreateLocation
    {
        static readonly type = '[Location] create Location'
        constructor(public location:any){}
    }
}
