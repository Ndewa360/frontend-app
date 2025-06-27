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
        constructor(public reason?: string){}
    }

    export class StartActivityMonitoring
    {
        static readonly type = '[AuthToken] Start Activity Monitoring'
        constructor(){}
    }

    export class StopActivityMonitoring
    {
        static readonly type = '[AuthToken] Stop Activity Monitoring'
        constructor(){}
    }

    export class UpdateActivityState
    {
        static readonly type = '[AuthToken] Update Activity State'
        constructor(public activityState: string){}
    }

    export class RefreshTokenSuccess
    {
        static readonly type = '[AuthToken] Refresh Token Success'
        constructor(public accessToken: string, public refreshToken: string){}
    }

    export class RefreshTokenFailure
    {
        static readonly type = '[AuthToken] Refresh Token Failure'
        constructor(public error: any){}
    }

}
