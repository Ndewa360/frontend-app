import { GlobalModel } from "./global.model";
export namespace GlobalAction
{
    //Create
    export class AddNotification
    {
        static readonly type = '[Global-Notification] Add Notification';
        constructor(public notification:string){}
    }

    //Fetch All Global
    export class ChangeLoading
    {
        static readonly type = '[Global-Loading] Change Loading';
        constructor(public isLoading:boolean){}
    }

    export class ChangeWhatsAppConnectedStatus
    {
        static readonly type = '[Global-WhatsApp-Status] Change WhatsApp Status';
        constructor(public status:boolean){}
    }

    export class StartLoadData
    {
        static readonly type = '[Global] Load data';
        constructor(){}
    }
}
