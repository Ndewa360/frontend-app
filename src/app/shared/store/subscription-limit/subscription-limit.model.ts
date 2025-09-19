export interface SubscriptionStatus {
  plan: 'free' | 'premium';
  accountStatus: 'active' | 'suspended' | 'disabled';
  propertyCount: number;
  propertyLimit: number;
  unitsPerPropertyLimit?: number;
  monthlyAmount: number;
  lastCalculationDate?: Date;
  suspensionDate?: Date;
  needsUpgrade: boolean;
  userType?: 'PROPERTY_OWNER' | 'AGENT';
}

export interface PropertyCreationCheck {
  canCreate: boolean;
  needsUpgrade: boolean;
}

export interface MonthlyCalculation {
  amount: number;
  month: string;
  calculationDate: Date;
}

export interface SubscriptionLimitStateModel {
  subscriptionStatus: SubscriptionStatus | null;
  canCreateProperty: boolean;
  needsUpgrade: boolean;
  monthlyAmount: number;
  lastCalculationMonth: string | null;
  loading: boolean;
  error: string | null;
}
