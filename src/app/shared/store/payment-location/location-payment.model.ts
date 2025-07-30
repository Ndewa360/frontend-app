
export enum LocationPaymentType {
    LOCATION = "LOCATION",
    CAUTION = "CAUTION"
}

export enum PaymentMethod {
    CASH = "CASH",
    BANK_TRANSFER = "BANK_TRANSFER",
    MOBILE_MONEY = "MOBILE_MONEY",
    CHECK = "CHECK",
    CARD = "CARD",
    OTHER = "OTHER"
}

export interface LocationPaymentModel {
    _id?: string;

    billingRef?: string; // Optionnel car généré côté backend

    // Propriétés pour l'affichage (réponse du backend)
    locataire?: string;
    location?: string;
    room?: string;
    property?: string;

    // Propriétés pour l'envoi au backend (DTO)
    locataireId?: string;
    locationId?: string;
    roomId?: string;
    propertyId?: string;

    locationPaymentPrice?: number;
    reason?: string;
    paymentLocationType?: LocationPaymentType;
    datePayment: Date;

    // Nouveaux champs
    paymentMethod?: PaymentMethod;
    notes?: string;

    createdAt?: Date;
}