
export namespace ContractAction
{
    
    //Fetch  Contract profil
    export class FetchContract
    {
        static readonly type = '[Contract] Fectch Contract'
        constructor(public locationId:string){}
    }

    export class ResetAllState
    {
        static readonly type = '[Contract] Reset All State'
    }

    export class Logout
    {
        static readonly type = '[Contract] logout'
    }



}
