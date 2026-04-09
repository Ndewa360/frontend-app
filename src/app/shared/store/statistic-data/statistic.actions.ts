

export namespace StatisticAction
{

    
    export class FetchStaticByPropertyIdAndYear
    {
        static readonly type = '[Room] Fetch Statics PropertyID and Year'
        constructor(public propertyID:string,public year:string){}
    }

    /** @deprecated Utiliser FetchStaticByPropertyIdAndYear à la place */
    export class FetchStaticRoomDataByPropertyIdAndYear
    {
        static readonly type = '[Room] Fetch Statics Rooms By PropertyID'
        constructor(public propertyID:string,public year:string){}
    }

    export class FetchStaticLocataireDataByPropertyIdAndYear
    {
        static readonly type = '[Statistic] Refresh Statics Locataire By PropertyID'
        constructor(public propertyID:string,public year:string|number){}
    }

    export class RefreshStaticLocataireDataByPropertyIdAndYear
    {
        static readonly type = '[Locataire] Fetch Statics Locataire By PropertyID'
        constructor(public propertyID:string,public year:string|number){}
    }
    export class FetchStaticAllPaymentLocataireDataByPropertyIdAndYear
    {
        static readonly type = '[Locataire] Fetch Statics All Payement Locataire By PropertyID'
        constructor(public propertyID:string,public year:string|number){}
    }

    export class FetchStatisticPaymentRecapitulationAccountOfAllPropertyByYear
    {
        static readonly type = '[Locataire] Fetch Statics of account Of all property recapitulation by year recap'
        constructor(public year:string|number){}
    }

    export class ResetAllState
    {
        static readonly type = '[Statistic] Reset All State'
    }

    export class Logout
    {
        static readonly type = '[Statistic] Logout'
    }

    export class RefreshStatisticAfterPayment
    {
        static readonly type = '[Statistic] Refresh After Payment'
        constructor(public propertyID: string, public year: string | number) {}
    }
}
