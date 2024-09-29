

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
}
