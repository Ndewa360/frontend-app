import { ProspectionModel } from "./prospection.model";

export namespace ProspectionAction
{
    //Create
    export class CreateNewProspection
    {
        static readonly type = '[Prospection] Create New Prospection';
        constructor(public prosectionModel:ProspectionModel){}
    }
}