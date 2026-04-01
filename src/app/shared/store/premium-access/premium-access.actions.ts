export namespace PremiumAccessAction {

  // ─── Vérifier l'accès actif (connecté ou anonyme) ────────────────────────
  export class CheckActiveAccess {
    static readonly type = '[PremiumAccess] Check Active Access';
    constructor(public userId: string) {}
  }

  // ─── Obtenir les infos propriétaire ──────────────────────────────────────
  // Pour utilisateur connecté : userId = vrai userId (JWT)
  // Pour visiteur anonyme    : userId = visitorId (localStorage)
  export class GetOwnerInfo {
    static readonly type = '[PremiumAccess] Get Owner Info';
    constructor(public userId: string, public ownerId: string, public isAnonymous = false) {}
  }

  // ─── Historique (utilisateur connecté uniquement) ────────────────────────
  export class GetHistory {
    static readonly type = '[PremiumAccess] Get History';
  }

  // ─── Utilitaires store ────────────────────────────────────────────────────
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
