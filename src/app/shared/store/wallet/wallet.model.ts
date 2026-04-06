export type WithdrawalMethod = 'MTN_MONEY' | 'ORANGE_MONEY' | 'EASY_TRANSACT' | 'BANK';
export type WithdrawalStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type WalletTxType = 'CREDIT_RENT' | 'DEBIT_WITHDRAWAL' | 'DEBIT_FEE' | 'REFUND';

export interface WalletSummary {
  balance: number;
  reservedBalance: number;
  totalReceived: number;
  totalWithdrawn: number;
  totalFees: number;
  currency: string;
  hasPendingWithdrawal: boolean;
  pendingWithdrawal: WithdrawalRequest | null;
}

export interface WalletTransaction {
  _id: string;
  type: WalletTxType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  currency: string;
  reference: string | null;
  description: string | null;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface WithdrawalRequest {
  _id: string;
  amount: number;
  fees: number;
  netAmount: number;
  method: WithdrawalMethod;
  recipient: string;
  status: WithdrawalStatus;
  providerRef: string | null;
  processedAt: Date | null;
  failureReason: string | null;
  currency: string;
  createdAt: Date;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface WalletStateModel {
  summary: WalletSummary | null;
  transactions: WalletTransaction[];
  rentPayments: WalletTransaction[];
  withdrawals: WithdrawalRequest[];
  totalTransactions: number;
  totalRentPayments: number;
  totalWithdrawals: number;
  loading: boolean;
  withdrawLoading: boolean;
  error: string | null;
}
