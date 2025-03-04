export namespace AuthTokenAction
{
    export class SetAuthToken
    {
        static readonly type = '[AuthToken] Set AuthToken'
        constructor(public token:string){}
    }

    export class SetRefreshToken
    {
        static readonly type = '[AuthToken] Set RefreshToken'
        constructor(public token:string){}
    }

}
