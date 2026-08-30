export namespace PremiumAccessAction {

  /**
   * Vérifie si l'utilisateur a un accès actif pour UN propriétaire précis.
   * À appeler à chaque ouverture de fiche propriétaire.
   * Après 24h, l'accès est expiré → hasAccess = false → le client doit repayer.
   */
  export class CheckAccessForOwner {
    static readonly type = '[PremiumAccess] Check Access For Owner';
    constructor(public userId: string, public ownerId: string, public isAnonymous = false) {}
  }

  /**
   * Charge les infos du propriétaire si l'accès est actif.
   * Retourne une erreur si l'accès est expiré ou inexistant.
   */
  export class GetOwnerInfo {
    static readonly type = '[PremiumAccess] Get Owner Info';
    constructor(public userId: string, public ownerId: string, public isAnonymous = false) {}
  }

  /** Historique complet des accès (utilisateur connecté uniquement) */
  export class GetHistory {
    static readonly type = '[PremiumAccess] Get History';
  }

  /** Vide le cache d'un propriétaire (forcer rechargement après paiement) */
  export class ClearOwnerCache {
    static readonly type = '[PremiumAccess] Clear Owner Cache';
    constructor(public ownerId: string) {}
  }

  export class SetLoading {
    static readonly type = '[PremiumAccess] Set Loading';
    constructor(public loading: boolean) {}
  }

  export class SetError {
    static readonly type = '[PremiumAccess] Set Error';
    constructor(public error: string | null) {}
  }

  export class ClearError {
    static readonly type = '[PremiumAccess] Clear Error';
  }

  export class Reset {
    static readonly type = '[PremiumAccess] Reset';
  }
}
