import { SouscriptionPayementState } from '../souscription/souscription.model';

export interface SouscriptionPeriodModel {
  _id?: string;
  billingRef: string;
  startedAt: Date;
  endedAt: Date;
  state: SouscriptionPayementState;
  souscription: string;   // corrigé (était "soucription")
  calculatedAmount: number;
  occupiedUnitsCount: number;
  totalUnitsRevenue: number;
  // Le backend retourne "unitsDetails"
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
  // Champs paiement
  paymentDate?: Date;
  paymentMethod?: string;
  paymentReference?: string;
  paymentTransactionRef?: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  createdAt?: Date;
}
