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

    export class SetToken
    {
        static readonly type = '[AuthToken] Set AuthToken & RefreshToken'
        constructor(public authToken:string,public refreshToken:string){}
    }

    export class Logout
    {
        static readonly type = '[Token] Logout'
        constructor(){}
    }

    

}
