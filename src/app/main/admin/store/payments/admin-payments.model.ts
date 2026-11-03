import { CsvExport } from '../../utils/csv-download';

/** Facture d'abonnement (période) vue comme un paiement. */
export interface AdminPayment {
  _id: string;
  amount: number;
  currency: string;
  /** completed = payée, pending = en attente, failed = impayée. */
  status: 'pending' | 'completed' | 'failed';
  method: string;
  provider?: string;
  reference?: string;
  user: {
    _id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  subscription?: {
    _id: string;
    plan: string;
    tier?: string;
    period: string;
  };
  createdAt: Date;
  processedAt?: Date;
}

export interface AdminSubscription {
  _id: string;
  user: {
    _id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  plan: 'free' | 'premium';
  currentTier?: string;
  customMonthlyAmount?: number | null;
  /** active, cancelled (= suspendu pour impayé), inactive (= désactivé par un admin). */
  status: 'active' | 'inactive' | 'cancelled';
  accountStatus?: string;
  startDate?: Date;
  endDate?: Date;
  amount?: number;
  monthlyAmount?: number;
  currency?: string;
  lastPayment?: Date;
  nextPayment?: Date;
  createdAt: Date;
}

export interface PaymentStats {
  totalRevenue?: number;
  monthlyRevenue?: number;
  totalSubscriptions?: number;
  activeSubscriptions?: number;
  /** Factures émises (montant > 0). */
  totalPayments?: number;
  /** Factures payées. */
  successfulPayments?: number;
  /** Tentatives de paiement d'abonnement échouées (opérateur). */
  failedPayments?: number;
  averageRevenuePerUser?: number;
  churnRate?: number;
  conversionRate?: number;
  revenueByPlan?: Array<{ plan: string; revenue: number; count: number }>;
  revenueByMonth?: any[];
  paymentMethodDistribution?: Array<{ method: string; count: number; percentage: number }>;
}

export interface PaymentFilters {
  search?: string;
  status?: string;
  paymentMethod?: string;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SubscriptionFilters {
  search?: string;
  subscriptionPlan?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PageInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type PaymentsExport = CsvExport;

export interface AdminPaymentsStateModel {
  payments: AdminPayment[];
  subscriptions: AdminSubscription[];
  stats: PaymentStats | null;
  filters: {
    payments: PaymentFilters;
    subscriptions: SubscriptionFilters;
  };
  pagination: {
    payments: PageInfo;
    subscriptions: PageInfo;
  };
  loading: boolean;
  error: any;
  lastUpdated: Date | null;
}
