import { LocationPaymentModel } from "./location-payment.model";

export namespace LocationPaymentAction
{
    //Create LocationPayment
    export class AddLocationPayment
    {
        static readonly type = '[LocationPayment] Add LocationPayment';
        constructor(public locationPayment:LocationPaymentModel){}
    }

    //Update LocationPayment
    export class UpdateLocationPayment
    {
        static readonly type = '[LocationPayment] Update LocationPayment';
        constructor(public locationPayment:LocationPaymentModel, public id:string){}
    }

    //Fetch  LocationPayment
    export class FetchLocationPayment
    {
        static readonly type = '[LocationPayment] Fectch LocationPayment'
        constructor(public locationPaymentId:string){}
    }

    export class RemoveAssignationLocationPayment
    {
        static readonly type = '[LocationPayment] Remove assignation LocationPayment'
        constructor(public locationPaymentId:string,public description:string=""){}
    }
    
    //Fetch  LocationPayment
    export class FetchLocationPayments
    {
        static readonly type = '[LocationPayment] Fectch LocationPayments'
        constructor(public propertyId:string){}
    }

    export class FetchLocationPaymentsByPropertyId
    {
        static readonly type = '[LocationPayment] Fectch LocationPayments By PropertyID'
        constructor(public propertyId:string){}
    }

    
    //Set LocationPayment
    export class SetLocationPayment
    {
        static readonly type = '[LocationPayment] Set LocationPayment'
        constructor(public locationPayment:any){}
    }

    //Change loading state
    export class updateLoadingLocationPaymentState
    {
        static readonly type = '[LocationPayment] Loading state LocationPayment'
        constructor(public status:boolean){}
    }

    export class CreateLocationPayment
    {
        static readonly type = '[LocationPayment] create LocationPayment'
        constructor(public locationPayment:any){}
    }
}
