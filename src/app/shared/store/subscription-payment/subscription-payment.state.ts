import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { SubscriptionPaymentAction } from './subscription-payment.action';
import { SubscriptionPaymentStateModel } from './subscription-payment.model';
import {
  SubscriptionPaymentService,
  PaymentHistory,
  UnpaidInvoice,
  PaymentStatus,
  Invoice,
} from '../../services/subscription-payment.service';

@State<SubscriptionPaymentStateModel>({
  name: 'subscriptionPayment',
  defaults: {
    paymentHistory: null,
    unpaidInvoices: [],
    paymentStatus: null,
    currentInvoice: null,
    totalUnpaidAmount: 0,
    loading: false,
    error: null,
    stripeLoading: false,
    stripeError: null,
    stripeSession: null,
    paymentMethods: null,
  }
})
@Injectable()
export class SubscriptionPaymentState {

  constructor(
    private subscriptionPaymentService: SubscriptionPaymentService,
    private toastrService: ToastrService,
    private translateService: TranslateService,
  ) {}

  // ─── Sélecteurs ────────────────────────────────────────────────────────────

  @Selector() static selectPaymentHistory(s: SubscriptionPaymentStateModel) { return s.paymentHistory; }
  @Selector() static selectUnpaidInvoices(s: SubscriptionPaymentStateModel) { return s.unpaidInvoices; }
  @Selector() static selectPaymentStatus(s: SubscriptionPaymentStateModel) { return s.paymentStatus; }
  @Selector() static selectCurrentInvoice(s: SubscriptionPaymentStateModel) { return s.currentInvoice; }
  @Selector() static selectTotalUnpaidAmount(s: SubscriptionPaymentStateModel) { return s.totalUnpaidAmount; }
  @Selector() static selectLoading(s: SubscriptionPaymentStateModel) { return s.loading; }
  @Selector() static selectError(s: SubscriptionPaymentStateModel) { return s.error; }
  @Selector() static selectHasUnpaidInvoices(s: SubscriptionPaymentStateModel) { return s.paymentStatus?.hasUnpaidInvoices || false; }
  @Selector() static selectStripeLoading(s: SubscriptionPaymentStateModel) { return s.stripeLoading; }
  @Selector() static selectStripeError(s: SubscriptionPaymentStateModel) { return s.stripeError; }
  @Selector() static selectStripeSession(s: SubscriptionPaymentStateModel) { return s.stripeSession; }
  @Selector() static selectPaymentMethods(s: SubscriptionPaymentStateModel) { return s.paymentMethods; }

  // ─── Initiation paiement via POST /subscription-payment/initiate ──────────

  @Action(SubscriptionPaymentAction.InitiatePayment)
  initiatePayment(ctx: StateContext<SubscriptionPaymentStateModel>, action: SubscriptionPaymentAction.InitiatePayment) {
    ctx.patchState({ stripeLoading: true, stripeError: null });

    return this.subscriptionPaymentService.initiatePayment(action.dto).pipe(
      tap((response: any) => {
        ctx.patchState({ stripeLoading: false, stripeSession: response.data });
        // Si redirectUrl présent (Stripe) → le composant gère la redirection
      }),
      catchError((error: any) => {
        ctx.patchState({
          stripeLoading: false,
          stripeError: error.error?.message || 'Erreur lors de l\'initiation du paiement',
        });
        this.toastrService.error(error.error?.message || this.translateService.instant('NOTIFICATIONS.STRIPE_SESSION_ERROR'), 'Ndewa360°');
        return throwError(error);
      })
    );
  }

  // ─── Vérification statut via GET /payment/check/:externalRef ─────────────

  @Action(SubscriptionPaymentAction.CheckPaymentStatus)
  checkPaymentStatus(ctx: StateContext<SubscriptionPaymentStateModel>, action: SubscriptionPaymentAction.CheckPaymentStatus) {
    return this.subscriptionPaymentService.checkPaymentStatus(action.externalRef).pipe(
      tap((response: any) => {
        if (response.data.status === 'SUCCESS') {
          ctx.patchState({ stripeSession: null });
        this.toastrService.success(this.translateService.instant('NOTIFICATIONS.PAYMENT_CONFIRMED_SUCCESS'), 'Ndewa360°');
          ctx.dispatch(new SubscriptionPaymentAction.GetPaymentHistory());
          ctx.dispatch(new SubscriptionPaymentAction.GetUnpaidInvoices());
          ctx.dispatch(new SubscriptionPaymentAction.GetPaymentStatus());
        }
      }),
      catchError((error: any) => throwError(error))
    );
  }

  // ─── CreateStripeSession → délègue vers InitiatePayment (provider=STRIPE) ─

  @Action(SubscriptionPaymentAction.CreateStripeSession)
  createStripeSession(ctx: StateContext<SubscriptionPaymentStateModel>, action: SubscriptionPaymentAction.CreateStripeSession) {
    return ctx.dispatch(new SubscriptionPaymentAction.InitiatePayment({
      periodId:    action.payload.periodId,
      provider:    'STRIPE',
      successUrl:  action.payload.successUrl,
      cancelUrl:   action.payload.cancelUrl,
    }));
  }

  // ─── ConfirmStripePayment → délègue vers CheckPaymentStatus ──────────────

  @Action(SubscriptionPaymentAction.ConfirmStripePayment)
  confirmStripePayment(ctx: StateContext<SubscriptionPaymentStateModel>, action: SubscriptionPaymentAction.ConfirmStripePayment) {
    return ctx.dispatch(new SubscriptionPaymentAction.CheckPaymentStatus(action.payload.sessionId));
  }

  // ─── Historique ───────────────────────────────────────────────────────────

  @Action(SubscriptionPaymentAction.GetPaymentHistory)
  getPaymentHistory(ctx: StateContext<SubscriptionPaymentStateModel>, action: SubscriptionPaymentAction.GetPaymentHistory) {
    ctx.patchState({ loading: true, error: null });
    return this.subscriptionPaymentService.getPaymentHistory(action.page, action.limit).pipe(
      tap((response) => ctx.patchState({ paymentHistory: response.data, loading: false })),
      catchError((error) => {
        ctx.patchState({ loading: false, error: error.message });
        return throwError(error);
      })
    );
  }

  @Action(SubscriptionPaymentAction.GetUnpaidInvoices)
  getUnpaidInvoices(ctx: StateContext<SubscriptionPaymentStateModel>) {
    ctx.patchState({ loading: true, error: null });
    return this.subscriptionPaymentService.getUnpaidInvoices().pipe(
      tap((response) => ctx.patchState({
        unpaidInvoices: response.data.invoices,
        totalUnpaidAmount: response.data.totalAmount,
        loading: false,
      })),
      catchError((error) => {
        ctx.patchState({ loading: false, error: error.message });
        return throwError(error);
      })
    );
  }

  @Action(SubscriptionPaymentAction.GetPaymentStatus)
  getPaymentStatus(ctx: StateContext<SubscriptionPaymentStateModel>) {
    ctx.patchState({ loading: true, error: null });
    return this.subscriptionPaymentService.getPaymentStatus().pipe(
      tap((response) => ctx.patchState({ paymentStatus: response.data, loading: false })),
      catchError((error) => {
        ctx.patchState({ loading: false, error: error.message });
        return throwError(error);
      })
    );
  }

  @Action(SubscriptionPaymentAction.GetCurrentPeriodInvoice)
  getCurrentPeriodInvoice(ctx: StateContext<SubscriptionPaymentStateModel>, action: SubscriptionPaymentAction.GetCurrentPeriodInvoice) {
    ctx.patchState({ loading: true, error: null });
    return this.subscriptionPaymentService.generateInvoice(action.periodId).pipe(
      tap((response) => ctx.patchState({ currentInvoice: response.data, loading: false })),
      catchError((error) => {
        ctx.patchState({ loading: false, error: error.message });
        return throwError(error);
      })
    );
  }

  @Action(SubscriptionPaymentAction.GetPaymentMethods)
  getPaymentMethods(ctx: StateContext<SubscriptionPaymentStateModel>) {
    return this.subscriptionPaymentService.getPaymentMethods().pipe(
      tap((response: any) => ctx.patchState({ paymentMethods: response.data })),
      catchError((error: any) => throwError(error))
    );
  }

  @Action(SubscriptionPaymentAction.SendPaymentReminders)
  sendPaymentReminders(ctx: StateContext<SubscriptionPaymentStateModel>) {
    return this.subscriptionPaymentService.sendPaymentReminders().pipe(
      tap(() => this.toastrService.success(this.translateService.instant('NOTIFICATIONS.REMINDERS_SENT_SUCCESS'), 'Ndewa360°')),
      catchError((error: any) => throwError(error))
    );
  }

  // ─── Setters ──────────────────────────────────────────────────────────────

  @Action(SubscriptionPaymentAction.SetPaymentSession)
  setPaymentSession(ctx: StateContext<SubscriptionPaymentStateModel>, action: SubscriptionPaymentAction.SetPaymentSession) {
    ctx.patchState({ stripeSession: action.session });
  }

  @Action(SubscriptionPaymentAction.SetLoading)
  setLoading(ctx: StateContext<SubscriptionPaymentStateModel>, action: SubscriptionPaymentAction.SetLoading) {
    ctx.patchState({ loading: action.loading });
  }

  @Action(SubscriptionPaymentAction.SetError)
  setError(ctx: StateContext<SubscriptionPaymentStateModel>, action: SubscriptionPaymentAction.SetError) {
    ctx.patchState({ error: action.error, loading: false });
  }

  @Action(SubscriptionPaymentAction.SetStripeLoading)
  setStripeLoading(ctx: StateContext<SubscriptionPaymentStateModel>, action: SubscriptionPaymentAction.SetStripeLoading) {
    ctx.patchState({ stripeLoading: action.loading });
  }

  @Action(SubscriptionPaymentAction.SetStripeError)
  setStripeError(ctx: StateContext<SubscriptionPaymentStateModel>, action: SubscriptionPaymentAction.SetStripeError) {
    ctx.patchState({ stripeError: action.error });
  }

  @Action(SubscriptionPaymentAction.ClearStripeError)
  clearStripeError(ctx: StateContext<SubscriptionPaymentStateModel>) {
    ctx.patchState({ stripeError: null });
  }
}
