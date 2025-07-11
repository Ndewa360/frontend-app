import { SouscriptionPayementState } from "../souscription/souscription.model";

export interface SouscriptionPeriodModel {
    billingRef:string;

    _id?: string;

    startedAt:Date;

    endedAt:Date;

    state:SouscriptionPayementState;

    soucription:string;

    // Nouvelles propriétés pour correspondre au backend
    calculatedAmount:number;

    occupiedUnitsCount:number;

    totalUnitsRevenue:number;

    unitDetails?: Array<{
        unitId: string;
        unitName: string;
        unitCode: string;
        unitPrice: number;
        occupiedDays: number;
        isEligible: boolean;
        revenue: number;
        isActiveForSouscription: boolean;
        propertyName: string;
    }>;

    // Alias pour correspondre au backend
    unitsDetails?: Array<{
        unitId: string;
        unitName: string;
        unitCode: string;
        unitPrice: number;
        occupiedDays: number;
        isEligible: boolean;
        revenue: number;
        isActiveForSouscription: boolean;
        propertyName: string;
    }>;

    createdAt?:Date
}