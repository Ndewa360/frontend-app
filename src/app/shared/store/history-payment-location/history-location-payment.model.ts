import { LocataireModel } from "../locataire";
import { LocationModel } from "../location";
import { LocationPaymentModel } from "../payment-location";
import { PropertyModel } from "../properties";
import { RoomModel } from "../rooms";


export interface HistoryLocationPaymentModel {
    _id?: string;

    locataire: LocataireModel;

    location: LocationModel;

    room: RoomModel;

    property:PropertyModel;

    transactions: LocationPaymentModel[]
}