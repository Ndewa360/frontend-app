import { PaymentFilters, SubscriptionFilters } from './admin-payments.model';

export namespace AdminPaymentsAction {

  // Load Payments
  export class LoadPayments {
    static readonly type = '[Admin Payments] Load Payments';
    constructor(public filters?: PaymentFilters) {}
  }

  // Load Subscriptions
  export class LoadSubscriptions {
    static readonly type = '[Admin Payments] Load Subscriptions';
    constructor(public filters?: SubscriptionFilters) {}
  }

  // Load Payment Stats
  export class LoadPaymentStats {
    static readonly type = '[Admin Payments] Load Payment Stats';
  }

  export class LoadPaymentStatsSuccess {
    static readonly type = '[Admin Payments] Load Payment Stats Success';
    constructor(public stats: any) {}
  }

  export class LoadPaymentStatsFailure {
    static readonly type = '[Admin Payments] Load Payment Stats Failure';
    constructor(public error: any) {}
  }

  // Set Loading
  export class SetLoading {
    static readonly type = '[Admin Payments] Set Loading';
    constructor(public loading: boolean) {}
  }

  // Set Filters
  export class SetFilters {
    static readonly type = '[Admin Payments] Set Filters';
    constructor(public filters: any) {}
  }

  // Clear State
  export class ClearState {
    static readonly type = '[Admin Payments] Clear State';
  }

  // Refresh Data
  export class RefreshData {
    static readonly type = '[Admin Payments] Refresh Data';
  }
}
