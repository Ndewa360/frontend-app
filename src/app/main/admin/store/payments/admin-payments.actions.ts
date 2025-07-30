export namespace AdminPaymentsAction {
  
  // Load Payments
  export class LoadPayments {
    static readonly type = '[Admin Payments] Load Payments';
    constructor(public filters?: any) {}
  }

  export class LoadPaymentsSuccess {
    static readonly type = '[Admin Payments] Load Payments Success';
    constructor(public payments: any[], public total: number, public meta: any) {}
  }

  export class LoadPaymentsFailure {
    static readonly type = '[Admin Payments] Load Payments Failure';
    constructor(public error: any) {}
  }

  // Load Subscriptions
  export class LoadSubscriptions {
    static readonly type = '[Admin Payments] Load Subscriptions';
    constructor(public filters?: any) {}
  }

  export class LoadSubscriptionsSuccess {
    static readonly type = '[Admin Payments] Load Subscriptions Success';
    constructor(public subscriptions: any[], public total: number, public meta: any) {}
  }

  export class LoadSubscriptionsFailure {
    static readonly type = '[Admin Payments] Load Subscriptions Failure';
    constructor(public error: any) {}
  }

  // Load Coupons
  export class LoadCoupons {
    static readonly type = '[Admin Payments] Load Coupons';
    constructor(public filters?: any) {}
  }

  export class LoadCouponsSuccess {
    static readonly type = '[Admin Payments] Load Coupons Success';
    constructor(public coupons: any[], public total: number, public meta: any) {}
  }

  export class LoadCouponsFailure {
    static readonly type = '[Admin Payments] Load Coupons Failure';
    constructor(public error: any) {}
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

  // Create Coupon
  export class CreateCoupon {
    static readonly type = '[Admin Payments] Create Coupon';
    constructor(public couponData: any) {}
  }

  export class CreateCouponSuccess {
    static readonly type = '[Admin Payments] Create Coupon Success';
    constructor(public coupon: any) {}
  }

  export class CreateCouponFailure {
    static readonly type = '[Admin Payments] Create Coupon Failure';
    constructor(public error: any) {}
  }

  // Update Coupon
  export class UpdateCoupon {
    static readonly type = '[Admin Payments] Update Coupon';
    constructor(public couponId: string, public couponData: any) {}
  }

  export class UpdateCouponSuccess {
    static readonly type = '[Admin Payments] Update Coupon Success';
    constructor(public coupon: any) {}
  }

  export class UpdateCouponFailure {
    static readonly type = '[Admin Payments] Update Coupon Failure';
    constructor(public error: any) {}
  }

  // Delete Coupon
  export class DeleteCoupon {
    static readonly type = '[Admin Payments] Delete Coupon';
    constructor(public couponId: string) {}
  }

  export class DeleteCouponSuccess {
    static readonly type = '[Admin Payments] Delete Coupon Success';
    constructor(public couponId: string) {}
  }

  export class DeleteCouponFailure {
    static readonly type = '[Admin Payments] Delete Coupon Failure';
    constructor(public error: any) {}
  }

  // Process Pending Payments
  export class ProcessPendingPayments {
    static readonly type = '[Admin Payments] Process Pending Payments';
  }

  export class ProcessPendingPaymentsSuccess {
    static readonly type = '[Admin Payments] Process Pending Payments Success';
    constructor(public result: any) {}
  }

  export class ProcessPendingPaymentsFailure {
    static readonly type = '[Admin Payments] Process Pending Payments Failure';
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
