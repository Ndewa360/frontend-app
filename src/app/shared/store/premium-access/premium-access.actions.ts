export namespace PremiumAccessAction {

  export class InitiatePayment {
    static readonly type = '[PremiumAccess] Initiate Payment';
    constructor(public payload: {
      userId: string;
      userEmail: string;
      amount: number;
      paymentMethod: 'orange_money' | 'mtn_money';
      phone: string;
      metadata?: any;
    }) {}
  }

  export class CheckPaymentStatus {
    static readonly type = '[PremiumAccess] Check Payment Status';
    constructor(public transactionId: string) {}
  }

  export class ConfirmAccess {
    static readonly type = '[PremiumAccess] Confirm Access';
    constructor(public accessId: string) {}
  }

  export class CheckActiveAccess {
    static readonly type = '[PremiumAccess] Check Active Access';
    constructor(public userId: string) {}
  }

  export class GetOwnerInfo {
    static readonly type = '[PremiumAccess] Get Owner Info';
    constructor(public userId: string, public ownerId: string) {}
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
