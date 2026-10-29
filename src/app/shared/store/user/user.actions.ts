export namespace UserAction
{

    export class ResetAllState
    {
        static readonly type = '[User] Reset All State'
    }

    export class Logout
    {
        static readonly type = '[User] Logout'
        constructor(){}
    }

    //Change loading state
    export class updateLoadingUserState
    {
        static readonly type = '[User] Loading state User'
        constructor(public status:boolean){}
    }
}
