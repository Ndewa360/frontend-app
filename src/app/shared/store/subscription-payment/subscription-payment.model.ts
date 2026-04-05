import {
  PaymentHistory,
  UnpaidInvoice,
  PaymentStatus,
  Invoice,
} from '../../services/subscription-payment.service';

export interface SubscriptionPaymentStateModel {
  paymentHistory: PaymentHistory | null;
  unpaidInvoices: UnpaidInvoice[];
  paymentStatus: PaymentStatus | null;
  currentInvoice: Invoice | null;
  totalUnpaidAmount: number;
  loading: boolean;
  error: string | null;
  stripeLoading: boolean;
  stripeError: string | null;
  // Session de paiement retournee par POST /subscription-payment/initiate
  stripeSession: PaymentSessionModel | null;
  paymentMethods: any | null;
}

// Reponse de POST /subscription-payment/initiate
export interface PaymentSessionModel {
  externalRef: string;
  status: string;
  redirectUrl?: string;  // URL Stripe Checkout si provider=STRIPE
}
