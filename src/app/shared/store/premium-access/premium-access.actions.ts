export namespace PremiumAccessAction {
  
  export class CreateSession {
    static readonly type = '[PremiumAccess] Create Session';
    constructor(public payload: {
      userId: string;
      userEmail: string;
      amount: number;
      successUrl: string;
      cancelUrl: string;
      metadata?: any;
    }) {}
  }

  export class CheckActiveAccess {
    static readonly type = '[PremiumAccess] Check Active Access';
    constructor(public userId: string) {}
  }

  export class GetOwnerInfo {
    static readonly type = '[PremiumAccess] Get Owner Info';
    constructor(public userId: string, public ownerId: string) {}
  }

  export class ConfirmAccess {
    static readonly type = '[PremiumAccess] Confirm Access';
    constructor(public sessionId: string, public paymentIntentId: string) {}
  }

  export class GetHistory {
    static readonly type = '[PremiumAccess] Get History';
    constructor(public userId: string) {}
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
