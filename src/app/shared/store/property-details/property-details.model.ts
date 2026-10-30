import { LocataireModel } from "../locataire/locataire.model";
import { LocationModel } from "../location/location.model";
import { LocationPaymentModel } from "../payment-location/location-payment.model";
import { PropertyModel } from "../properties/property.model";
import { RoomModel } from "../rooms/room.model";
import { HistoryLocationPaymentModel } from "../history-payment-location/history-location-payment.model";

/**
 * Réponse de GET /property/:id/details : tout l'écran d'un bien en une requête.
 * Remplace /room/property, /locataire/property, /location/property,
 * /location-payment/property et /history-location-payment/property.
 */
export interface PropertyDetailsModel {
    property: PropertyModel;
    rooms: RoomModel[];
    locataires: LocataireModel[];
    /** Tous les baux, terminés compris (`endedAt` renseigné). */
    locations: LocationModel[];
    /** Paiements de loyer et de caution du bien. */
    payments: LocationPaymentModel[];
}

/** Identifiant d'une référence, peuplée ({ _id }) ou non. */
export const refId = (value: any): string => String(value?._id ?? value ?? '');

/** Baux en cours (ancien GET /location/property/:id). */
export function activeLocations(details: PropertyDetailsModel): LocationModel[] {
    return details.locations.filter((location: any) => location.endedAt == null);
}

/** Paiements portant le bien (ancien GET /location-payment/property/:id). */
export function propertyPayments(details: PropertyDetailsModel): LocationPaymentModel[] {
    const propertyId = refId(details.property);
    return details.payments.filter((payment) => refId(payment.property) === propertyId);
}

/** Un élément par bail, avec son unité, son locataire et ses paiements (ancien GET /history-location-payment/property/:id). */
export function buildHistory(details: PropertyDetailsModel): HistoryLocationPaymentModel[] {
    const rooms = new Map(details.rooms.map((room) => [refId(room), room]));
    const locataires = new Map(details.locataires.map((locataire) => [refId(locataire), locataire]));
    const paymentsByLocation = new Map<string, LocationPaymentModel[]>();
    for (const payment of details.payments) {
        const key = refId(payment.location);
        if (!paymentsByLocation.has(key)) paymentsByLocation.set(key, []);
        paymentsByLocation.get(key).push(payment);
    }
    return details.locations.map((location) => ({
        location,
        property: details.property,
        room: rooms.get(refId(location.room)),
        locataire: locataires.get(refId(location.locataire)),
        transactions: paymentsByLocation.get(refId(location)) || [],
    }));
}
