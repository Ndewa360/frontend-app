export interface PremiumAccessModel {
  id: string;
  userId: string;
  userEmail: string;
  ownerId: string;
  amount: number;
  currency: string;
  paymentTransactionRef?: string;
  purchaseDate: Date;
  expiryDate: Date;
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  accessCount: number;
  firstAccessDate?: Date;
  lastAccessDate?: Date;
}

export interface OwnerInfoModel {
  access: {
    id: string;
    ownerId: string;
    expiryDate: string;
    remainingHours: number;
    remainingDays: number;
    accessCount: number;
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

  /**
   * Liste des ownerId pour lesquels l'utilisateur a un accès actif en ce moment.
   * Après 24h, l'ownerId disparaît de cette liste.
   */
  activeOwnerIds: string[];

  /**
   * Cache des infos propriétaire déjà chargées, indexé par ownerId.
   * Évite de refaire un appel réseau si l'info est déjà en mémoire.
   */
  ownerInfoMap: Record<string, OwnerInfoModel>;

  accessHistory: PremiumAccessModel[];

  /** État de la vérification initiale pour un ownerId donné */
  checkLoadingMap: Record<string, 'NO_LOADED' | 'LOADING' | 'LOADED'>;
}
