export interface AdminUserSubscription {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    userType: 'OWNER' | 'AGENT';
  };
  plan: 'free' | 'premium';
  accountStatus: 'active' | 'suspended' | 'disabled';
  propertyCount: number;
  propertyLimit: number;
  monthlyAmount: number;
  hasUnpaidInvoices: boolean;
  totalUnpaidAmount: number;
  unpaidInvoicesCount: number;
  lastPaymentDate?: Date;
  nextPaymentDate?: Date;
  suspensionDate?: Date;
  lastCalculationDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  currentPeriod?: {
    _id: string;
    billingRef: string;
    startedAt: Date;
    endedAt: Date;
    calculatedAmount: number;
    state: 'waiting' | 'unpaid' | 'payed' | 'should_not_payed';
    occupiedUnitsCount: number;
    totalUnitsRevenue: number;
  };
  periods?: SubscriptionPeriod[];
}

export interface SubscriptionPeriod {
  _id: string;
  billingRef: string;
  startedAt: Date;
  endedAt: Date;
  calculatedAmount: number;
  state: 'waiting' | 'unpaid' | 'payed' | 'should_not_payed';
  occupiedUnitsCount: number;
  totalUnitsRevenue: number;
  paymentDate?: Date;
  paymentMethod?: string;
  paymentReference?: string;
}

export interface SubscriptionStats {
  overview: {
    totalUsers: number;
    freeUsers: number;
    premiumUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    disabledUsers: number;
    totalRevenue: number;
    monthlyRevenue: number;
    totalUnpaidAmount: number;
    unpaidInvoicesCount: number;
  };
  trends: {
    userGrowth: ChartData[];
    revenueGrowth: ChartData[];
    planDistribution: PlanDistribution[];
    paymentStatus: PaymentStatusDistribution[];
  };
  topMetrics: {
    conversionRate: number;
    churnRate: number;
    averageRevenuePerUser: number;
    paymentSuccessRate: number;
  };
}

export interface ChartData {
  date: string;
  value: number;
  label?: string;
}

export interface PlanDistribution {
  plan: string;
  count: number;
  percentage: number;
  revenue: number;
  color: string;
}

export interface PaymentStatusDistribution {
  status: string;
  count: number;
  percentage: number;
  amount: number;
  color: string;
}

export interface SubscriptionFilters {
  search?: string;
  plan?: string;
  accountStatus?: string;
  paymentStatus?: string;
  userType?: string;
  hasUnpaidInvoices?: boolean;
  propertyCountMin?: number;
  propertyCountMax?: number;
  monthlyAmountMin?: number;
  monthlyAmountMax?: number;
  createdFrom?: Date;
  createdTo?: Date;
  lastPaymentFrom?: Date;
  lastPaymentTo?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SubscriptionAction {
  type: 'upgrade' | 'downgrade' | 'suspend' | 'reactivate' | 'payment_reminder';
  subscriptionId: string;
  targetPlan?: string;
  reason?: string;
  metadata?: any;
}

export interface BulkSubscriptionAction {
  action: SubscriptionAction['type'];
  subscriptionIds: string[];
  targetPlan?: string;
  reason?: string;
  metadata?: any;
}

export interface AdminSubscriptionsStateModel {
  subscriptions: AdminUserSubscription[];
  stats: SubscriptionStats | null;
  filters: SubscriptionFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  loading: boolean;
  error: any;
  lastUpdated: Date | null;
  selectedSubscriptions: string[];
}

export interface CreateSubscriptionDto {
  userId: string;
  plan: 'free' | 'premium';
  autoUpgrade?: boolean;
  metadata?: any;
}

export interface UpdateSubscriptionDto {
  plan?: 'free' | 'premium';
  accountStatus?: 'active' | 'suspended' | 'disabled';
  propertyLimit?: number;
  monthlyAmount?: number;
  metadata?: any;
}

export interface SubscriptionActionResult {
  success: boolean;
  subscription?: AdminUserSubscription;
  message?: string;
  error?: string;
}