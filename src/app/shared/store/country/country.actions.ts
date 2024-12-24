import { CityModel } from "../city";
import { CountryModel } from "./country.model";

export namespace CountryAction
{
    //Create
    export class UpdateCountry
    {
        static readonly type = '[Country] Update Country';
        constructor(public country:CountryModel, public id:string){}
    }

    //Fetch  Country profil
    export class FetchCountry
    {
        static readonly type = '[Country] Fectch Country'
        constructor(public countryId:string){}
    }

    export class ResetAllState
    {
        static readonly type = '[Country] Reset All State'
    }
    
    //Fetch  Country profil
    export class FetchCountries
    {
        static readonly type = '[Country] Fectch Countries'
        constructor(){}
    }


    //Create country
    export class CreateCountry
    {
        static readonly type = '[Country] Create Country'
        constructor(public country:any){}
    }


    //Change loading state
    export class updateLoadingCountryState
    {
        static readonly type = '[Country] Loading state Country'
        constructor(public status:boolean){}
    }

    export class AddCity 
    {
        static readonly type = '[Country] Add City'
        constructor(public city:CityModel, public countryID:string){}
    }
}
