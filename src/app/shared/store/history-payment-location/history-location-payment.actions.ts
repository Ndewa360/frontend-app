import { LocationPaymentModel } from "../payment-location"


export namespace HistoryLocationPaymentAction
{
    //Fetch  HistoryLocationPayment
    export class FetchHistoryLocationPayment
    {
        static readonly type = '[HistoryLocationPayment] Fectch HistoryLocationPayment'
        constructor(public historyLocationPaymentId:string){}
    }

    export class FetchHistoryLocationPaymentsByPropertyId
    {
        static readonly type = '[HistoryLocationPayment] Fectch HistoryLocationPaymentById'
        constructor(public propertyId:string){}
    }

    export class FetchHistoryLocationByLocataireId
    {
        static readonly type = '[HistoryLocationPayment] Fectch FetchHistoryLocationByLocataireId'
        constructor(public locataireID:string){}
    }

    export class ResetAllState 
    {
        static readonly type = '[HistoryLocationPayment] ResetAllState'
    }

    export class Logout 
    {
        static readonly type = '[HistoryLocationPayment] Logout'
    }

    export class UpdateHistoryLocationPaymentTransaction
    {
        static readonly type = '[HistoryLocationPayment] Update HistoryLocationPaymentTransaction'
        constructor(public transactionId:string,public locataireID:string,public transactionModel:LocationPaymentModel){}
    }

    export class DeleteHistoryLocationPaymentTransaction
    {
        static readonly type = '[HistoryLocationPayment] Delete HistoryLocationPaymentTransaction'
        constructor(public transactionId:string,public locataireID:string){}
    }
}
