import { LocataireModel } from "../locataire";
import { PropertyModel } from "../properties";
import { RoomModel } from "../rooms";


export interface StatisticRoomYearModel {
    room:RoomModel,
    paymentValue:number[],
    year:string;
    // 🆕 MÉTRIQUES ENRICHIES DU BACKEND
    totalPaid?: number;
    expectedAmount?: number;
    monthsDue?: number;
    paymentStatus?: string;
    advanceAmount?: number;
    debtAmount?: number;
    collectionRate?: number;
    adjustedPaid?: number;
    entryDate?: Date;
    contractEndDate?: Date;
    initialFinancialState?: string;
    initialSolde?: number;
}

// 🆕 MÉTRIQUES GLOBALES DE PROPRIÉTÉ
export interface PropertyMetrics {
    totalRevenue: number;
    totalExpected: number;
    collectionRate: number;
    averageRent: number;
    occupancyRate: number;
    totalRooms: number;
    occupiedRooms: number;
    totalAdvances: number;
    totalDebts: number;
}

// 🆕 RAPPORT COMPLET
export interface ComprehensiveReport {
    alerts: Array<{type: string, message: string, severity: string}>;
    recommendations: Array<{type: string, message: string, priority: string}>;
    summary: {
        totalRooms: number;
        performanceLevel: string;
        riskLevel: string;
    };
}

// 🆕 RÉPONSE ENRICHIE DU BACKEND
export interface EnrichedStatisticResponse {
    data: {
        rooms: StatisticRoomYearModel[],
        propertyMetrics:PropertyMetrics,
        comprehensiveReport:ComprehensiveReport,
        calculatedAt: Date,
        revenueDistribution: {
            monthlyDistribution: number[],
            monthlyExpected: number[],
            monthlyQuota: number[],
            monthlyExcess: number[],
            monthlyAnalysis: [
                {
                    month: number,
                    distributed: number,
                    expected: number,
                    fulfillmentRate: number,
                    variance: number,
                    deficit: number,
                    quota: number,
                    totalActiveRooms:number
                }
            ]
        },
        tenantsAnalysis: {
            summary: {
                totalTenants: number,
                upToDate: number,
                inAdvance: number,
                behind: number,
                aheadTenants: number,
                lateTenants: number,
                partialPaymentTenants: number,
                upToDateTenants: number,
                totalAmountBehind: number,
                totalAdvanceAmount: number,
                averagePaymentConsistency: number,
                globalCollectionRate: number,
                totalPaidByTenants: number,
                totalExpectedByTenants: number
            },
            tenants: {
                room:RoomModel,
                locataire:LocataireModel,
                financialAnalysis: {
                    monthlyRent: number,
                    entryDate: Date,
                    monthsElapsed: number,
                    totalPaid: number,
                    expectedPaymentToDate: number,
                    status: string,
                    monthsBehind: number,
                    amountBehind: number,
                    advanceAmount: number,
                    lastPaymentMonth: number,
                    paymentConsistency: number,
                    monthlyPayments: number[]
                }
            }[],    
        },       
        year:string,    
    },
    performanceMs:  number,
    roomsCount: number,
    metricsIncluded: {
        propertyMetrics: number,
        comprehensiveReport: number,
        alerts: number,
        recommendations: number
    },
    calculatedAt: Date,
}

export interface StatisticLocataireYearModel {
    locataire:LocataireModel,
    paymentValue:number[],
    year:string;
}

export interface StatisticPaymentOfAllPropertyByYear {
    year: string;
    paymentProperty: {
        property:PropertyModel, 
        amountMonth:{totalAmountRelicat:number,totalAmountReceived:number,totalAmountToBeReceveid:number,month:number}[],
        amountProperty:{totalAmountRelicat:number,totalAmountReceived:number,totalAmountToBeReceveid:number}
    }[],
    paymentYear:{
        totalAmountRelicat:number,
        totalAmountReceived:number,
        totalAmountToBeReceveid:number
    }
}

export enum StatisticPaymentStateType
{
    ENDED_CONTRACT="endedContract",
    PAYED="payed",
    UNPAYED="unpayed",
    LATE="late",
    WAITING="waiting",
    PARTIAL_PAYMENT="partialPayment",
    NO_CONTRACT="noContract"
}

export interface StatisticPaymentState
{
    month:number,
    year:string,
    state:StatisticPaymentStateType,
    price:number,
    unitLocationPaymentPrice?:number
  }

export interface StatisticAllPaymentLocataireYearModel {
    locataire:LocataireModel,
    room : RoomModel,
    paymentState : StatisticPaymentState[],
    year:string
}