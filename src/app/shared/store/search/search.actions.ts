export namespace SearchAction
{
    //Fetch  Search profil
    export class FetchSearch
    {
        static readonly type = '[Search] Fectch Search'
        constructor(public city:string){}
    }

}
