import { LoaderTypeState } from "../../utils";
import { SouscriptionType } from "../souscription/souscription.model";
import { SouscriptionPeriodModel } from "./souscription-period.model";


export namespace SouscriptionPeriodAction
{
    //Update SouscriptionPeriod
    export class UpdateSouscriptionPeriod
    {
        static readonly type = '[SouscriptionPeriod] Update SouscriptionPeriod';
        constructor(public souscriptionPeriod:SouscriptionPeriodModel, public id:string){}
    }

    export class ResetAllState
    {
        static readonly type = '[SouscriptionPeriod] Reset All State';
    }

    //Fetch  SouscriptionPeriod
    export class FetchSouscriptionPeriod
    {
        static readonly type = '[SouscriptionPeriod] Fetch SouscriptionPeriod'
        constructor(public souscriptionPeriodId:string){}
    }
    
    //Fetch  SouscriptionPeriod
    export class FetchSouscriptionPeriodsByUserId
    {
        static readonly type = '[SouscriptionPeriod] Fetch SouscriptionPeriods'
        constructor(public userId:string){}
    }

    export class CreateSouscriptionPeriod
    {
        static readonly type = '[SouscriptionPeriod] create SouscriptionPeriod'
        constructor(public souscriptionPeriodType:SouscriptionType){}
    }

    export class SetSouscriptionPeriod
    {
        static readonly type = '[SouscriptionPeriod] set SouscriptionPeriod'
        constructor(public souscriptionPeriod:SouscriptionPeriodModel){}
    }

    export class DeleteSouscriptionPeriod
    {
        static readonly type = '[SouscriptionPeriod] delete SouscriptionPeriod'
        constructor(public souscriptionPeriodId:string){}
    }

    export class SetInitLoading
    {
        static readonly type = '[SouscriptionPeriod] set init'
        constructor(public stateLoading:LoaderTypeState){}
    }
    

}
