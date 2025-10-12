import { AdvancedSearchFilters } from './search.service';

export namespace SearchAction
{
    //Fetch  Search profil
    export class FetchSearch
    {
        static readonly type = '[Search] Fectch Search'
        constructor(public city:string, public page:number = 1, public pageSize:number = 10000){}
    }

    export class FetchSearchByIdRoom
    {
        static readonly type = '[Search] Fectch Search By Room'
        constructor(public idRoom:string){}
    }

    export class ApplyFilter
    {
        static readonly type = '[Search] Apply Filter'
        constructor(public filter:{
            specifity?: { 
                hasClosure?: boolean,
                hasKitchen?: boolean,
                hasParking?: boolean,
                isInternalKitchen?: boolean,
                isInternalShower?: boolean,
                numberOfBathroom?: number,
                numberOfLivingRoom?: number,
                numberOfShower?:number,
            },
            type?: string,
            ville?:  string,
            minPrice?:number,
            maxPrice?:number
        }, public isNewLocation:boolean){}
    }

    export class AdvancedSearch
    {
        static readonly type = '[Search] Advanced Search'
        constructor(public filters: any, public resetResults: boolean = true){}
    }

}
