import { AdminChartData } from '../../models/shared.types';

export interface AdminPayment {
  _id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  method: 'card' | 'mobile_money' | 'bank_transfer' | 'cash';
  provider: string;
  transactionId?: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  subscription?: {
    _id: string;
    plan: string;
    period: string;
  };
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
}

export interface AdminSubscription {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  plan: 'free' | 'premium';
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  amount: number;
  currency: string;
  paymentMethod?: string;
  lastPayment?: Date;
  nextPayment?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminCoupon {
  _id: string;
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed';
  value: number;
  currency?: string;
  minAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usageCount: number;
  userLimit?: number;
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  applicableTo: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface PaymentStats {
  overview: {
    totalRevenue: number;
    monthlyRevenue: number;
    totalPayments: number;
    successfulPayments: number;
    failedPayments: number;
    pendingPayments: number;
    refundedPayments: number;
    successRate: number;
    averageAmount: number;
  };
  subscriptions: {
    totalSubscriptions: number;
    activeSubscriptions: number;
    freeSubscriptions: number;
    premiumSubscriptions: number;
    monthlyRevenue: number;
    churnRate: number;
    conversionRate: number;
  };
  coupons: {
    totalCoupons: number;
    activeCoupons: number;
    usedCoupons: number;
    totalDiscount: number;
    mostUsedCoupons: CouponUsage[];
  };
  trends: {
    revenueChart: AdminChartData[];
    paymentsChart: AdminChartData[];
    subscriptionsChart: AdminChartData[];
    methodDistribution: MethodDistribution[];
  };
}

export interface CouponUsage {
  couponId: string;
  couponCode: string;
  usageCount: number;
  totalDiscount: number;
}

// ChartData moved to shared.types.ts as AdminChartData

export interface MethodDistribution {
  method: string;
  count: number;
  percentage: number;
  amount: number;
  color: string;
}

export interface PaymentFilters {
  search?: string;
  status?: string;
  method?: string;
  provider?: string;
  userId?: string;
  subscriptionId?: string;
  amountMin?: number;
  amountMax?: number;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SubscriptionFilters {
  search?: string;
  plan?: string;
  status?: string;
  userId?: string;
  autoRenew?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CouponFilters {
  search?: string;
  type?: string;
  isActive?: boolean;
  hasUsage?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateCouponDto {
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed';
  value: number;
  currency?: string;
  minAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  userLimit?: number;
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
  applicableTo?: string[];
}

export interface UpdateCouponDto {
  name?: string;
  description?: string;
  value?: number;
  minAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  userLimit?: number;
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
  applicableTo?: string[];
}

export interface AdminPaymentsStateModel {
  payments: AdminPayment[];
  subscriptions: AdminSubscription[];
  coupons: AdminCoupon[];
  stats: PaymentStats | null;
  filters: {
    payments: PaymentFilters;
    subscriptions: SubscriptionFilters;
    coupons: CouponFilters;
  };
  pagination: {
    payments: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    subscriptions: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    coupons: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  loading: boolean;
  error: any;
  lastUpdated: Date | null;
}
