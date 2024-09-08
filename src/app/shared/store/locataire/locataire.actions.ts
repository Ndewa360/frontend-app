import { LocataireModel } from "./locataire.model";
export namespace LocataireAction
{
    //Create Locataire profil
    export class AddLocataire
    {
        static readonly type = '[Locataire] Add Locataire';
        constructor(public locataire:LocataireModel){}
    }

    //Update Locataire profil
    export class UpdateLocataire
    {
        static readonly type = '[Locataire] Update Locataire';
        constructor(public locataire:LocataireModel, public id:string){}
    }

    //Fetch  Locataire profil
    export class FetchLocataire
    {
        static readonly type = '[Locataire] Fectch Locataire'
        constructor(public locataireId:string){}
    }

    //Fetch  Locataire profil
    export class FetchLocataires
    {
        static readonly type = '[Locataire] Fectch Locataires'
        constructor(public propertyId:string){}
    }

    export class FetchLocatairesByPropertyId
    {
        static readonly type = '[Locataire] Fectch Locataires'
        constructor(public propertyId:string){}
    }

    
    //Set locataire profil
    export class SetLocataire
    {
        static readonly type = '[Locataire] Set Locataire'
        constructor(public locataire:any){}
    }

    //Change loading state
    export class updateLoadingLocataireState
    {
        static readonly type = '[Locataire] Loading state Locataire'
        constructor(public status:boolean){}
    }

    export class CreateLocataire
    {
        static readonly type = '[Locataire] create Locataire'
        constructor(public locataire:LocataireModel){}
    }
}
