import { InitiatePaymentDto } from 'src/app/public/payment/services/unified-payment.service';

export namespace SubscriptionPaymentAction {

  export class ProcessPayment {
    static readonly type = '[SubscriptionPayment] Process Payment';
    constructor(public paymentData: any) {}
  }

  export class GenerateInvoice {
    static readonly type = '[SubscriptionPayment] Generate Invoice';
    constructor(public periodId: string) {}
  }

  export class GetPaymentHistory {
    static readonly type = '[SubscriptionPayment] Get Payment History';
    constructor(public page: number = 1, public limit: number = 10) {}
  }

  export class GetUnpaidInvoices {
    static readonly type = '[SubscriptionPayment] Get Unpaid Invoices';
  }

  export class GetPaymentStatus {
    static readonly type = '[SubscriptionPayment] Get Payment Status';
  }

  export class SendPaymentReminders {
    static readonly type = '[SubscriptionPayment] Send Payment Reminders';
  }

  export class GetCurrentPeriodInvoice {
    static readonly type = '[SubscriptionPayment] Get Current Period Invoice';
  }

  export class SetPaymentHistory {
    static readonly type = '[SubscriptionPayment] Set Payment History';
    constructor(public history: any) {}
  }

  export class SetUnpaidInvoices {
    static readonly type = '[SubscriptionPayment] Set Unpaid Invoices';
    constructor(public invoices: any[]) {}
  }

  export class SetPaymentStatus {
    static readonly type = '[SubscriptionPayment] Set Payment Status';
    constructor(public status: any) {}
  }

  export class SetCurrentInvoice {
    static readonly type = '[SubscriptionPayment] Set Current Invoice';
    constructor(public invoice: any) {}
  }

  export class SetLoading {
    static readonly type = '[SubscriptionPayment] Set Loading';
    constructor(public loading: boolean) {}
  }

  export class SetError {
    static readonly type = '[SubscriptionPayment] Set Error';
    constructor(public error: string | null) {}
  }

  // ─── Paiement unifié (POST /payment/initiate) ─────────────────────────────
  // Remplace CreateStripeSession — supporte tous les providers

  export class InitiatePayment {
    static readonly type = '[SubscriptionPayment] Initiate Payment';
    constructor(public dto: InitiatePaymentDto) {}
  }

  export class CheckPaymentStatus {
    static readonly type = '[SubscriptionPayment] Check Payment Status';
    constructor(public externalRef: string) {}
  }

  // Gardé pour compatibilité avec les composants existants
  export class CreateStripeSession {
    static readonly type = '[SubscriptionPayment] Create Stripe Session';
    constructor(public payload: {
      periodId: string;
      subscriptionId?: string;
      amount: number;
      userEmail?: string;
      successUrl: string;
      cancelUrl: string;
    }) {}
  }

  export class ConfirmStripePayment {
    static readonly type = '[SubscriptionPayment] Confirm Stripe Payment';
    constructor(public payload: {
      sessionId: string;
      paymentIntentId: string;
    }) {}
  }

  export class GetPaymentMethods {
    static readonly type = '[SubscriptionPayment] Get Payment Methods';
  }

  export class SetPaymentSession {
    static readonly type = '[SubscriptionPayment] Set Payment Session';
    constructor(public session: any) {}
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
