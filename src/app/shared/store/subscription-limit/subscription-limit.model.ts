export interface SubscriptionStatus {
  plan: 'free' | 'premium' | 'trial';
  accountStatus: 'active' | 'suspended' | 'disabled';
  propertyCount: number;
  propertyLimit: number;
  unitsPerPropertyLimit?: number;
  monthlyAmount: number;
  isRunning?: boolean;
  lastCalculationDate?: Date;
  suspensionDate?: Date;
  needsUpgrade?: boolean;
  userType?: 'PROPERTY_OWNER' | 'AGENT';
  trialInfo?: {
    isTrial: boolean;
    daysRemaining: number;
    trialEndDate: Date;
    isTrialExpired: boolean;
  } | null;
}

export interface PropertyCreationCheck {
  canCreate: boolean;
  needsUpgrade: boolean;
}

export interface UnitDetail {
  unitId: string;
  unitCode: string;
  unitName: string;
  unitPrice: number;
  occupiedDays: number;
  isEligible: boolean;
  revenue: number;
  isActiveForSouscription: boolean;
  propertyName: string;
}

export interface MonthlyCalculation {
  amount: number;
  occupiedUnits: number;
  totalRevenue: number;
  unitDetails: UnitDetail[];
  month: string;
  calculationDate: Date;
}

export interface SubscriptionLimitStateModel {
  subscriptionStatus: SubscriptionStatus | null;
  canCreateProperty: boolean;
  needsUpgrade: boolean;
  monthlyAmount: number;
  monthlyCalculation: MonthlyCalculation | null;
  lastCalculationMonth: string | null;
  loading: boolean;
  error: string | null;
}
