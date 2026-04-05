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

    export class Logout
    {
        static readonly type = '[Souscription] Logout'
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

    //Fetch Current Subscription
    export class FetchCurrentSubscription
    {
        static readonly type = '[Souscription] Fetch Current Subscription'
    }

    //Fetch Subscription History
    export class FetchSubscriptionHistory
    {
        static readonly type = '[Souscription] Fetch Subscription History'
    }

    // Mise a jour immediate du currentSubscription dans le store (sans appel reseau)
    export class SetCurrentSubscription
    {
        static readonly type = '[Souscription] Set Current Subscription'
        constructor(public subscription: SouscriptionModel) {}
    }

}
