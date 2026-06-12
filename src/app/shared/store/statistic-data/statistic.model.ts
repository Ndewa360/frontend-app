import { LocataireModel } from "../locataire";
import { PropertyModel } from "../properties";
import { RoomModel } from "../rooms";

// ─── Modèle chambre par année ────────────────────────────────────────────────
export interface StatisticRoomYearModel {
  room: RoomModel;
  paymentValue: number[];
  year: string;
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
  lastPaymentDate?: Date | null;
  nextPaymentDate?: Date | null;
}

// ─── Métriques globales de propriété ─────────────────────────────────────────
export interface PropertyMetrics {
  totalRevenue: number;
  totalCoveredInYear?: number;
  totalExpected: number;
  collectionRate: number;
  averageRent: number;
  occupancyRate: number;
  totalRooms: number;
  occupiedRooms: number;
  totalAdvances: number;
  totalDebts: number;
  averageFulfillmentRate?: number;
  monthsAt100Percent?: number;
  monthsBelow50Percent?: number;
}

// ─── Rapport complet ──────────────────────────────────────────────────────────
export interface ComprehensiveReport {
  alerts: string[];
  recommendations: string[];
  summary: {
    totalRooms: number;
    performanceLevel: string;
    riskLevel: string;
  };
}

// ─── Analyse mensuelle ────────────────────────────────────────────────────────
export interface MonthlyAnalysisItem {
  month: number;
  distributed: number;    // projection : mois couverts par le cumul (règle d'anniversaire)
  realReceived: number;   // encaissements réels (datePayment dans le mois)
  expected: number;
  quota: number;
  fulfillmentRate: number; // taux basé sur la projection
  realRate: number;        // taux basé sur les encaissements réels
  deficit: number;
  status: 'complete' | 'good' | 'warning' | 'critical';
  roomsAtQuota: number;
  totalActiveRooms: number;
}

// ─── Distribution des revenus ─────────────────────────────────────────────────
export interface RevenueDistribution {
  monthlyDistribution: number[];
  monthlyRealReceived: number[];  // encaissements réels par mois (datePayment)
  monthlyExpected: number[];
  monthlyQuota: number[];
  monthlyFulfillmentRate: number[];
  totalDistributed: number;
  roomQuotaDetails: RoomQuotaDetail[];
  averageFulfillmentRate: number;
  monthsAt100Percent: number;
  monthsBelow50Percent: number;
  monthlyAnalysis: MonthlyAnalysisItem[];
}

export interface RoomQuotaDetail {
  roomCode: string;
  monthlyRent: number;
  monthlyQuotas: number[];
  monthlyPayments: number[];
  monthlyFulfillment: number[];
  entryDate: Date;
  contractEndDate?: Date;
}

// ─── Métriques agrégées calculées backend (frontend + mobile) ─────────────────
export interface AggregatedMetrics {
  totalRealReceived: number;
  monthlyRealReceived: number[];
  realYearCollectionRate: number;
  totalCoveredInYear: number;
  projectionCollectionRate: number;
  totalPaidAllTime: number;
  expectedSinceEntry: number;
  realCollectionRate: number;
  totalDebts: number;
  totalAdvances: number;
  monthsDueInYear: number;
  shortfallYear: number;
  shortfallSinceEntry: number;
  bestMonth:  { index: number; rate: number };
  worstMonth: { index: number; rate: number };
}

// ─── Analyse financière d'un locataire ───────────────────────────────────────
export interface TenantFinancialAnalysis {
  monthlyRent: number;
  entryDate: Date;
  monthsElapsed: number;
  totalPaid: number;
  expectedPaymentToDate: number;
  status: 'up_to_date' | 'advance' | 'behind' | 'unknown';
  monthsBehind: number;
  amountBehind: number;
  advanceAmount: number;
  lastPaymentMonth: number | null;
  paymentConsistency: number;
  monthlyPayments: number[];
  collectionRate: number;
  lastPaymentDate?: Date | null;
  nextPaymentDate?: Date | null;
  lateMonths?: number;
  advanceMonths?: number;
  coveredMonthsInYear?: number;
  coveredAmountInYear?: number;
  coveredUntilDate?: Date | null;
  totalMonthsCovered?: number;
  monthsDueInYear?: number;
}

export interface TenantAnalysisItem {
  room: RoomModel;
  locataire: LocataireModel | null;
  financialAnalysis: TenantFinancialAnalysis;
}

export interface TenantsAnalysisSummary {
  totalTenants: number;
  upToDate: number;
  inAdvance: number;
  behind: number;
  aheadTenants: number;
  lateTenants: number;
  partialPaymentTenants: number;
  upToDateTenants: number;
  totalAmountBehind: number;
  totalAdvanceAmount: number;
  averagePaymentConsistency: number;
  globalCollectionRate: number;
  totalPaidByTenants: number;
  totalExpectedByTenants: number;
}

export interface TenantsAnalysis {
  tenants: TenantAnalysisItem[];
  summary: TenantsAnalysisSummary;
}

// ─── Paiement de caution ──────────────────────────────────────────────────────
export interface CautionPaymentDetail {
  paymentId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  billingRef?: string;
  notes?: string;
}

export interface RoomCautionData {
  room: RoomModel;
  tenant: LocataireModel | null;
  location: {
    _id: string;
    startedAt: string;
    endedAt: string | null;
    locationPriceUnit: number;
  };
  cautionStatus: 'paid' | 'partial' | 'unpaid' | 'overpaid';
  expectedCautionAmount: number;
  totalCautionPaid: number;
  cautionDeficit: number;
  cautionExcess: number;
  paymentsCount: number;
  cautionPayments: CautionPaymentDetail[];
  lastCautionPayment: CautionPaymentDetail | null;
}

export interface CautionsAnalysisSummary {
  totalOccupiedRooms: number;
  roomsRequiringCaution: number;
  roomsWithCautionPaid: number;
  roomsWithCautionUnpaid: number;
  totalCautionsReceived: number;
  totalCautionsExpected: number;
  cautionCoverageRate: number;
  paidCautions: number;
  partialCautions: number;
  unpaidCautions: number;
  overpaidCautions: number;
}

export interface CautionsAnalysis {
  roomsCautions: RoomCautionData[];
  summary: CautionsAnalysisSummary;
  alerts: string[];
}

// ─── Corps de la réponse enrichie (data.data) ─────────────────────────────────
export interface EnrichedStatisticData {
  rooms: StatisticRoomYearModel[];
  propertyMetrics: PropertyMetrics;
  comprehensiveReport: ComprehensiveReport;
  revenueDistribution: RevenueDistribution;
  aggregatedMetrics: AggregatedMetrics;
  tenantsAnalysis: TenantsAnalysis;
  cautionsAnalysis: CautionsAnalysis;
  calculatedAt: Date;
  year: string;
}

// ─── Réponse complète de l'API (enveloppe) ────────────────────────────────────
export interface EnrichedStatisticResponse {
  data: EnrichedStatisticData;
  performanceMs: number;
  roomsCount: number;
  metricsIncluded: {
    propertyMetrics: boolean;
    comprehensiveReport: boolean;
    revenueDistribution: boolean;
    alerts: number;
    recommendations: number;
    averageFulfillmentRate: number;
    totalDistributed: number;
    monthsAt100Percent: number;
    monthsBelow50Percent: number;
    roomQuotaDetailsCount: number;
    tenantsAnalysis: boolean;
    totalTenants: number;
    tenantsUpToDate: number;
    tenantsBehind: number;
    tenantsInAdvance: number;
    aheadTenants: number;
    lateTenants: number;
    partialPaymentTenants: number;
    upToDateTenants: number;
    globalCollectionRate: number;
    cautionsAnalysis: boolean;
    totalOccupiedRooms: number;
    roomsRequiringCaution: number;
    totalCautionsReceived: number;
    totalCautionsExpected: number;
    cautionCoverageRate: number;
    roomsWithCautionPaid: number;
    roomsWithCautionUnpaid: number;
    paidCautions: number;
    partialCautions: number;
    unpaidCautions: number;
    overpaidCautions: number;
    cautionAlertsCount: number;
  };
  calculatedAt: Date;
}

// ─── Modèle locataire par année ───────────────────────────────────────────────
export interface StatisticLocataireYearModel {
  locataire: LocataireModel;
  paymentValue: number[];
  year: string;
  totalPaid?: number;
  expectedAmount?: number;
  monthsDue?: number;
  paymentStatus?: string;
  advanceAmount?: number;
  debtAmount?: number;
  collectionRate?: number;
}

// ─── Récapitulatif annuel toutes propriétés ───────────────────────────────────
export interface StatisticPaymentOfAllPropertyByYear {
  year: string;
  paymentProperty: {
    property: PropertyModel;
    amountMonth: {
      totalAmountRelicat: number;
      totalAmountReceived: number;
      totalAmountToBeReceveid: number;
      month: number;
    }[];
    amountProperty: {
      totalAmountRelicat: number;
      totalAmountReceived: number;
      totalAmountToBeReceveid: number;
    };
    detailedMetrics?: PropertyMetrics & {
      performanceLevel: string;
      riskLevel: string;
    };
    revenueDistribution?: RevenueDistribution;
    tenantsAnalysis?: TenantsAnalysis;
    cautionsAnalysis?: CautionsAnalysis;
  }[];
  paymentYear: {
    totalAmountRelicat: number;
    totalAmountReceived: number;
    totalAmountToBeReceveid: number;
  };
  globalMetrics?: {
    globalCollectionRate: number;
    totalProperties: number;
    totalAdvances: number;
    totalDebts: number;
    averagePropertyRevenue: number;
    calculationDate: Date;
    dataQuality: string;
    netCashFlow: number;
    advanceToDebtRatio: number;
    averageCollectionRate: number;
    averageOccupancyRate: number;
    totalRooms: number;
    totalOccupiedRooms: number;
    performanceLevel: string;
    riskLevel: string;
    trendIndicator: string;
  };
  globalAlerts?: string[];
  globalRecommendations?: string[];
}

// ─── Statuts de paiement ──────────────────────────────────────────────────────
export enum StatisticPaymentStateType {
  ENDED_CONTRACT = 'endedContract',
  PAYED = 'payed',
  UNPAYED = 'unpayed',
  LATE = 'late',
  WAITING = 'waiting',
  PARTIAL_PAYMENT = 'partialPayment',
  NO_CONTRACT = 'noContract'
}

export interface StatisticPaymentState {
  month: number;
  year: string;
  state: StatisticPaymentStateType;
  price: number;
  unitLocationPaymentPrice?: number;
  paymentDate?: Date | null;
}

export interface StatisticAllPaymentLocataireYearModel {
  locataire: LocataireModel;
  room: RoomModel;
  paymentState: StatisticPaymentState[];
  year: string;
  totalPaid?: number;
  expectedAmount?: number;
  monthsDue?: number;
  paymentStatus?: string;
  advanceAmount?: number;
  debtAmount?: number;
  lastPaymentDate?: Date | null;
  nextPaymentDate?: Date | null;
}
