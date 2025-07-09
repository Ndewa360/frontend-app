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
}
