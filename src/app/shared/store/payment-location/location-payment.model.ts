
export enum LocationPaymentType {
    LOCATION = "LOCATION",
    CAUTION = "CAUTION"
}

export interface LocationPaymentModel {
    _id?: string;

    billingRef:string;
    
    locataire?: string;

    location?: string;

    room?: string;

    property?:string;

    locationPaymentPrice?:number

    reason?:string;

    paymentLocationType?:LocationPaymentType;

    datePayment:Date;
    
    createdAt?:Date
}