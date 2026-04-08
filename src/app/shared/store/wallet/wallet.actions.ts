import { WithdrawalMethod, PaymentProvider } from './wallet.model';

export namespace WalletAction {
  export class LoadSummary {
    static readonly type = '[Wallet] Load Summary';
  }
  export class LoadTransactions {
    static readonly type = '[Wallet] Load Transactions';
    constructor(public page = 1, public limit = 20) {}
  }
  export class LoadRentPayments {
    static readonly type = '[Wallet] Load Rent Payments';
    constructor(public page = 1, public limit = 20) {}
  }
  export class LoadDeposits {
    static readonly type = '[Wallet] Load Deposits';
    constructor(public page = 1, public limit = 20) {}
  }
  export class LoadWithdrawals {
    static readonly type = '[Wallet] Load Withdrawals';
    constructor(public page = 1, public limit = 10) {}
  }
  export class RequestWithdrawal {
    static readonly type = '[Wallet] Request Withdrawal';
    constructor(public amount: number, public method: WithdrawalMethod, public recipient: string) {}
  }
  export class InitiateDeposit {
    static readonly type = '[Wallet] Initiate Deposit';
    constructor(
      public amount: number,
      public provider: PaymentProvider,
      public phoneNumber?: string,
      public successUrl?: string,
      public cancelUrl?: string,
    ) {}
  }
  export class Reset {
    static readonly type = '[Wallet] Reset';
  }
}
