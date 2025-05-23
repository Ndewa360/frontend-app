import { CityModel } from "./city.model";
export namespace CityAction
{
    //Create City profil
    export class AddCity
    {
        static readonly type = '[City] Add City';
        constructor(public city:CityModel){}
    }

    //Update City profil
    export class UpdateCity
    {
        static readonly type = '[City] Update City';
        constructor(public city:CityModel, public id:string){}
    }


    //Add City from loaded country
    export class AddCityFromLoadedCountry
    {
        static readonly type = '[City] Add City From Loaded Country';
        constructor(public cities:CityModel[]){}
    }
    
    export class UpdateCityRoom
    {
        static readonly type = '[City] Update City Room';
        constructor(public cityId:string,public roomId:string){}
    }

    //Fetch  City profil
    export class FetchCity
    {
        static readonly type = '[City] Fectch City'
        constructor(public cityId:string){}
    }


    
    //Set city profil
    export class SetCity
    {
        static readonly type = '[City] Set City'
        constructor(public city:any){}
    }

    export class ResetAllState
    {
        static readonly type = '[City] Reset All State';
    }

    //Change loading state
    export class updateLoadingCityState
    {
        static readonly type = '[City] Loading state City'
        constructor(public status:boolean){}
    }

    export class CreateCity
    {
        static readonly type = '[City] create City'
        constructor(public city){}
    }

    export class Logout
    {
        static readonly type = '[City] logout'
    }
}
