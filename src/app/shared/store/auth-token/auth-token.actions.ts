export namespace AuthTokenAction
{
    export class SetAuthToken
    {
        static readonly type = '[AuthToken] Set AuthToken'
        constructor(public token:string){}
    }

}
