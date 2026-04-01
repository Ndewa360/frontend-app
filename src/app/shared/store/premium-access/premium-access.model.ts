export interface PremiumAccessModel {
  id: string;
  userId: string;
  userEmail: string;
  amount: number;
  currency: string;
  paymentTransactionRef?: string;
  purchaseDate: Date;
  expiryDate: Date;
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  accessCount: number;
  firstAccessDate?: Date;
  lastAccessDate?: Date;
  accessedOwners: string[];
}

export interface OwnerInfoModel {
  access: {
    id: string;
    expiryDate: string;
    remainingDays: number;
    accessCount: number;
    accessedOwnersCount: number;
    paymentTransactionRef?: string;
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
  initLoadingState: 'NO_LOADED' | 'LOADING' | 'LOADED';
}
