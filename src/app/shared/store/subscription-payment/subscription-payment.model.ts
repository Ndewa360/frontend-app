export interface PaymentData {
  periodId: string;
  paymentAmount: number;
  paymentReference: string;
  paymentMethod?: string;
}

export interface Invoice {
  invoiceNumber: string;
  subscriptionId: string;
  periodId: string;
  userId: string;
  userInfo: {
    name: string;
    email: string;
  };
  period: {
    startDate: Date;
    endDate: Date;
    billingRef: string;
  };
  amount: number;
  plan: string;
  status: string;
  createdAt: Date;
  dueDate: Date;
  unitsDetails: any[];
}

export interface PaymentHistoryItem {
  id: string;
  billingRef: string;
  startDate: Date;
  endDate: Date;
  amount: number;
  status: string;
  occupiedUnits: number;
  totalRevenue: number;
  unitsDetails: any[];
}

export interface PaymentHistory {
  periods: PaymentHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UnpaidInvoice {
  id: string;
  billingRef: string;
  startDate: Date;
  endDate: Date;
  amount: number;
  dueDate: Date;
  overdueDays: number;
}

export interface UnpaidInvoicesResponse {
  invoices: UnpaidInvoice[];
  totalAmount: number;
  count: number;
}

export interface PaymentStatus {
  hasUnpaidInvoices: boolean;
  totalUnpaidAmount: number;
  paymentRequired: boolean;
}

export interface SubscriptionPaymentStateModel {
  paymentHistory: PaymentHistory | null;
  unpaidInvoices: UnpaidInvoice[];
  paymentStatus: PaymentStatus | null;
  currentInvoice: Invoice | null;
  totalUnpaidAmount: number;
  loading: boolean;
  error: string | null;
}
