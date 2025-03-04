import { SouscriptionModel, SouscriptionType } from "./souscription.model";

export namespace SouscriptionAction
{
    //Update Souscription
    export class UpdateSouscription
    {
        static readonly type = '[Souscription] Update Souscription';
        constructor(public souscription:SouscriptionModel, public id:string){}
    }

    //Fetch  Souscription
    export class FetchSouscription
    {
        static readonly type = '[Souscription] Fetch Souscription'
        constructor(public souscriptionId:string){}
    }
    
    export class ResetAllState
    {
        static readonly type = '[Souscription] Reset All State'
    }
    
    //Fetch  Souscription
    export class FetchSouscriptionsByUserId
    {
        static readonly type = '[Souscription] Fetch Souscriptions'
        constructor(public userId:string){}
    }

    export class CreateSouscription
    {
        static readonly type = '[Souscription] create Souscription'
        constructor(public souscriptionType:SouscriptionType){}
    }
    export class DeleteSouscription
    {
        static readonly type = '[Souscription] delete Souscription'
        constructor(public souscriptionId:string){}
    }

}
