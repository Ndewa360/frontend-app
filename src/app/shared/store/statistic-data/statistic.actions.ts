

export namespace StatisticAction
{
    export class FetchStaticRoomDataByPropertyIdAndYear
    {
        static readonly type = '[Room] Fectch Statics Rooms By PropertyID'
        constructor(public propertyID:string,public year:string){}
    }

    export class FetchStaticLocataireDataByPropertyIdAndYear
    {
        static readonly type = '[Locataire] Fectch Statics Locataire By PropertyID'
        constructor(public propertyID:string,public year:string|number){}
    }

    export class FetchStaticAllPaymentLocataireDataByPropertyIdAndYear
    {
        static readonly type = '[Locataire] Fectch Statics All Payement Locataire By PropertyID'
        constructor(public propertyID:string,public year:string|number){}
    }

    export class ResetAllState
    {
        static readonly type = '[Statistic] Reset All State'
    }
}
