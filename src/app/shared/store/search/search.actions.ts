import { AdvancedSearchFilters } from './search.service';

export namespace SearchAction
{
    export class FetchSearchByIdRoom
    {
        static readonly type = '[Search] Fectch Search By Room'
        constructor(public idRoom:string){}
    }

    export class AdvancedSearch
    {
        static readonly type = '[Search] Advanced Search'
        constructor(public filters: any, public resetResults: boolean = true){}
    }

}
