import { PropertyDetailsModel } from "./property-details.model";

export namespace PropertyDetailsAction
{
    /** Charge (ou recharge) tout l'écran d'un bien en une requête. */
    export class Fetch
    {
        static readonly type = '[PropertyDetails] Fetch'
        constructor(public propertyId: string){}
    }

    /**
     * Réponse reçue : chaque état (bien, unités, locataires, baux, paiements,
     * historique) remplace ses données de ce bien.
     */
    export class Loaded
    {
        static readonly type = '[PropertyDetails] Loaded'
        constructor(public propertyId: string, public details: PropertyDetailsModel){}
    }
}
