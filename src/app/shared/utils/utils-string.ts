import { Currency, RoomType } from "src/app/shared/store"
import { LocationPaymentType } from "../store/payment-location";

export class UtilsString
{
    static getStringOfRoomType(roomType:RoomType)
    {
        switch(roomType)
        {
            // case RoomType.ROOM:
            //     return "Chambre";
            case RoomType.STUDIO:
                return "Studio";
            case RoomType.SIMPLE_APARTMENT:
                return "Appartement";
            case RoomType.FURNISHED_APARTMENT:
                return "Appartement meublé";
            default:
                return "Chambre";
        }
    }

    static getStringOfLocationPaymentType(paymentType:LocationPaymentType)
    {
        switch(paymentType)
        {
            case LocationPaymentType.CAUTION:
                return "Paiement de Caution";
            case LocationPaymentType.LOCATION:
                return "Paiement classique";
            default:
                return "Paiement classique";
        }
    }

    static getCurrencySymbol(currency:Currency)
    {
        switch(currency)
        {
            case Currency.XOF:
                return "CFA";
            case Currency.USD:
                return "$";
            case Currency.EUR:
                return "€";
            case Currency.XAF:
                return "FCFA";
            default:
                return "CFA";
        }
    }

    static getDefaultCurrency()
    {
        return UtilsString.getCurrencySymbol(Currency.XAF);
    }
}