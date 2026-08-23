export type WithdrawalMethod = 'MTN_MONEY' | 'ORANGE_MONEY' | 'EASY_TRANSACT' | 'BANK';
export type WithdrawalStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type WalletTxType =
  | 'CREDIT_RENT'
  | 'CREDIT_DEPOSIT'
  | 'DEBIT_WITHDRAWAL'
  | 'DEBIT_FEE'
  | 'DEBIT_SUBSCRIPTION'
  | 'REFUND';

export type PaymentProvider = 'MTN_MONEY' | 'ORANGE_MONEY' | 'EASY_TRANSACT' | 'STRIPE';

export interface WalletSummary {
  balance: number;
  reservedBalance: number;
  totalReceived: number;
  totalWithdrawn: number;
  totalFees: number;
  totalSubscriptions: number;
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
  // Enrichissement loyer
  locataire?: {
    _id: string;
    fullName: string;
    email?: string;
    phoneNumber?: string;
    country?: string;
    idCardNumber?: string;
    idCardType?: string;
    fullNameRef?: string;
    phoneNumberRef?: string;
  } | null;
  room?: { _id: string; code: string; type: string; price: number; cautionPrice?: number; description?: string } | null;
  property?: { _id: string; name: string; location?: string; propertyType?: string } | null;
  location?: { _id: string; startedAt: Date; endedAt?: Date; locationPriceUnit: number; isRunning: boolean } | null;
  datePayment?: Date | null;
  paymentLocationType?: string | null;
  paymentMethod?: string | null;
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

export interface DepositInitiateResult {
  externalRef: string;
  status: string;
  redirectUrl?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type RecentMovementKind = 'rent' | 'deposit' | 'withdrawal';

export interface RecentMovement {
  _id: string;
  kind: RecentMovementKind;
  amount: number;
  createdAt: Date;
  label: string;        // nom locataire, description, ou destinataire
  status?: string;      // pour les retraits
  rentTx?: WalletTransaction; // référence complète pour ouvrir le modal
}

export interface WalletStateModel {
  summary: WalletSummary | null;
  transactions: WalletTransaction[];
  rentPayments: WalletTransaction[];
  deposits: WalletTransaction[];
  withdrawals: WithdrawalRequest[];
  totalTransactions: number;
  totalRentPayments: number;
  totalDeposits: number;
  totalWithdrawals: number;
  loading: boolean;
  withdrawLoading: boolean;
  depositLoading: boolean;
  error: string | null;
  /** ID du retrait en cours de polling (null si aucun) */
  pollingWithdrawalId: string | null;
  /** ID du retrait en cours de suppression (null si aucun) */
  deletingWithdrawalId: string | null;
}
