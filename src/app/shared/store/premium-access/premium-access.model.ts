export interface PremiumAccessModel {
  id: string;
  userId: string;
  userEmail: string;
  amount: number;
  currency: string;
  paymentMethod: 'orange_money' | 'mtn_money';
  transactionId: string;
  accessId: string;
  purchaseDate: Date;
  expiryDate: Date;
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  accessCount: number;
  firstAccessDate?: Date;
  lastAccessDate?: Date;
  accessedOwners: string[];
  metadata?: any;
}

export interface OwnerInfoModel {
  access: {
    id: string;
    expiryDate: string;
    remainingDays: number;
    accessCount: number;
    accessedOwnersCount: number;
  };
  owner: {
    id: string;
    name: string;
    email: string;
    phone: string;
    whatsapp: string;
    address: string;
  };
}

export interface PremiumAccessStateModel {
  loading: boolean;
  error: string | null;
  currentAccess: PremiumAccessModel | null;
  ownerInfo: OwnerInfoModel | null;
  accessHistory: PremiumAccessModel[];
  hasActiveAccess: boolean;
  // Paiement en cours
  pendingTransactionId: string | null;
  pendingAccessId: string | null;
  paymentStatus: 'idle' | 'pending' | 'success' | 'failed';
  initLoadingState: 'NO_LOADED' | 'LOADING' | 'LOADED';
}
