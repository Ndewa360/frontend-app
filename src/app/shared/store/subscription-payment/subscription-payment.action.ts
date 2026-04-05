import { InitiateSubscriptionPaymentDto } from 'src/app/shared/services/subscription-payment.service';

export namespace SubscriptionPaymentAction {

  // ─── Paiement via POST /subscription-payment/initiate ────────────────────
  export class InitiatePayment {
    static readonly type = '[SubscriptionPayment] Initiate Payment';
    constructor(public dto: InitiateSubscriptionPaymentDto) {}
  }

  // ─── Vérification statut via GET /payment/check/:externalRef ─────────────
  export class CheckPaymentStatus {
    static readonly type = '[SubscriptionPayment] Check Payment Status';
    constructor(public externalRef: string) {}
  }

  // ─── Alias rétrocompatibilité : CreateStripeSession → InitiatePayment ─────
  export class CreateStripeSession {
    static readonly type = '[SubscriptionPayment] Create Stripe Session';
    constructor(public payload: {
      periodId: string;
      subscriptionId?: string;
      amount?: number;
      userEmail?: string;
      successUrl: string;
      cancelUrl: string;
    }) {}
  }

  // ─── Alias rétrocompatibilité : ConfirmStripePayment → CheckPaymentStatus ─
  export class ConfirmStripePayment {
    static readonly type = '[SubscriptionPayment] Confirm Stripe Payment';
    constructor(public payload: { sessionId: string; paymentIntentId: string }) {}
  }

  // ─── Historique & factures ────────────────────────────────────────────────
  export class GetPaymentHistory {
    static readonly type = '[SubscriptionPayment] Get Payment History';
    constructor(public page = 1, public limit = 10) {}
  }

  export class GetUnpaidInvoices {
    static readonly type = '[SubscriptionPayment] Get Unpaid Invoices';
  }

  export class GetPaymentStatus {
    static readonly type = '[SubscriptionPayment] Get Payment Status';
  }

  export class GetCurrentPeriodInvoice {
    static readonly type = '[SubscriptionPayment] Get Current Period Invoice';
    constructor(public periodId: string) {}
  }

  export class GetPaymentMethods {
    static readonly type = '[SubscriptionPayment] Get Payment Methods';
  }

  export class SendPaymentReminders {
    static readonly type = '[SubscriptionPayment] Send Payment Reminders';
  }

  // ─── Setters store ────────────────────────────────────────────────────────
  export class SetPaymentSession {
    static readonly type = '[SubscriptionPayment] Set Payment Session';
    constructor(public session: any) {}
  }

  export class SetLoading {
    static readonly type = '[SubscriptionPayment] Set Loading';
    constructor(public loading: boolean) {}
  }

  export class SetError {
    static readonly type = '[SubscriptionPayment] Set Error';
    constructor(public error: string | null) {}
  }

  export class SetStripeLoading {
    static readonly type = '[SubscriptionPayment] Set Stripe Loading';
    constructor(public loading: boolean) {}
  }

  export class SetStripeError {
    static readonly type = '[SubscriptionPayment] Set Stripe Error';
    constructor(public error: string | null) {}
  }

  export class ClearStripeError {
    static readonly type = '[SubscriptionPayment] Clear Stripe Error';
  }
}
