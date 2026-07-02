export namespace PlatformFinanceAction {
  export class LoadBalance       { static readonly type = '[PlatformFinance] Load Balance'; }
  export class LoadKpis          { static readonly type = '[PlatformFinance] Load KPIs'; constructor(public currency = 'XAF') {} }
  export class LoadRevenue       { static readonly type = '[PlatformFinance] Load Revenue'; constructor(public period: 'monthly'|'quarterly'|'semester', public year: number, public currency = 'XAF') {} }
  export class LoadWithdrawals   { static readonly type = '[PlatformFinance] Load Withdrawals'; constructor(public page = 1, public limit = 20) {} }
  export class LoadConfig        { static readonly type = '[PlatformFinance] Load Config'; }
  export class LoadTransactions  { static readonly type = '[PlatformFinance] Load Transactions'; constructor(public filters: any = {}) {} }
}
