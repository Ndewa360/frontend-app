import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { SubscriptionPaymentAction } from './subscription-payment.action';
import { SubscriptionPaymentStateModel, PaymentHistory, UnpaidInvoice, PaymentStatus, Invoice } from './subscription-payment.model';
import { SubscriptionPaymentService } from '../../services/subscription-payment.service';

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
    paymentMethods: null
  }
})
@Injectable()
export class SubscriptionPaymentState {

  constructor(
    private subscriptionPaymentService: SubscriptionPaymentService,
    private toastrService: ToastrService,
    private translateService: TranslateService
  ) {}

  @Selector()
  static selectPaymentHistory(state: SubscriptionPaymentStateModel): PaymentHistory | null {
    return state.paymentHistory;
  }

  @Selector()
  static selectUnpaidInvoices(state: SubscriptionPaymentStateModel): UnpaidInvoice[] {
    return state.unpaidInvoices;
  }

  @Selector()
  static selectPaymentStatus(state: SubscriptionPaymentStateModel): PaymentStatus | null {
    return state.paymentStatus;
  }

  @Selector()
  static selectCurrentInvoice(state: SubscriptionPaymentStateModel): Invoice | null {
    return state.currentInvoice;
  }

  @Selector()
  static selectTotalUnpaidAmount(state: SubscriptionPaymentStateModel): number {
    return state.totalUnpaidAmount;
  }

  @Selector()
  static selectLoading(state: SubscriptionPaymentStateModel): boolean {
    return state.loading;
  }

  @Selector()
  static selectError(state: SubscriptionPaymentStateModel): string | null {
    return state.error;
  }

  @Selector()
  static selectHasUnpaidInvoices(state: SubscriptionPaymentStateModel): boolean {
    return state.paymentStatus?.hasUnpaidInvoices || false;
  }

  // ==================== NOUVEAUX SÉLECTEURS STRIPE ====================

  @Selector()
  static selectStripeLoading(state: SubscriptionPaymentStateModel): boolean {
    return state.stripeLoading;
  }

  @Selector()
  static selectStripeError(state: SubscriptionPaymentStateModel): string | null {
    return state.stripeError;
  }

  @Selector()
  static selectStripeSession(state: SubscriptionPaymentStateModel): any {
    return state.stripeSession;
  }

  @Selector()
  static selectPaymentMethods(state: SubscriptionPaymentStateModel): any {
    return state.paymentMethods;
  }

  @Action(SubscriptionPaymentAction.ProcessPayment)
  processPayment(ctx: StateContext<SubscriptionPaymentStateModel>, action: SubscriptionPaymentAction.ProcessPayment) {
    ctx.patchState({ loading: true, error: null });

    return this.subscriptionPaymentService.processPayment(action.paymentData).pipe(
      tap((response) => {
        ctx.patchState({ loading: false });
        this.toastrService.success(this.translateService.instant('NOTIFICATIONS.PAYMENT_PROCESSED_SUCCESS'), 'Paiement confirmé');
        
        // Recharger les données après paiement
        ctx.dispatch(new SubscriptionPaymentAction.GetPaymentStatus());
        ctx.dispatch(new SubscriptionPaymentAction.GetUnpaidInvoices());
      }),
      catchError((error) => {
        ctx.patchState({
          loading: false,
          error: error.message || 'Erreur lors du traitement du paiement'
        });
        this.toastrService.error(this.translateService.instant('NOTIFICATIONS.PAYMENT_PROCESS_ERROR'), 'Erreur');
        return throwError(error);
      })
    );
  }

  @Action(SubscriptionPaymentAction.GenerateInvoice)
  generateInvoice(ctx: StateContext<SubscriptionPaymentStateModel>, action: SubscriptionPaymentAction.GenerateInvoice) {
    ctx.patchState({ loading: true, error: null });

    return this.subscriptionPaymentService.generateInvoice(action.periodId).pipe(
      tap((response) => {
        ctx.patchState({
          currentInvoice: response.data,
          loading: false
        });
      }),
      catchError((error) => {
        ctx.patchState({
          loading: false,
          error: error.message || 'Erreur lors de la génération de la facture'
        });
        return throwError(error);
      })
    );
  }

  @Action(SubscriptionPaymentAction.GetPaymentHistory)
  getPaymentHistory(ctx: StateContext<SubscriptionPaymentStateModel>, action: SubscriptionPaymentAction.GetPaymentHistory) {
    ctx.patchState({ loading: true, error: null });

    return this.subscriptionPaymentService.getPaymentHistory(action.page, action.limit).pipe(
      tap((response) => {
        ctx.patchState({
          paymentHistory: response.data,
          loading: false
        });
      }),
      catchError((error) => {
        ctx.patchState({
          loading: false,
          error: error.message || 'Erreur lors du chargement de l\'historique'
        });
        return throwError(error);
      })
    );
  }

  @Action(SubscriptionPaymentAction.GetUnpaidInvoices)
  getUnpaidInvoices(ctx: StateContext<SubscriptionPaymentStateModel>) {
    ctx.patchState({ loading: true, error: null });

    return this.subscriptionPaymentService.getUnpaidInvoices().pipe(
      tap((response) => {
        ctx.patchState({
          unpaidInvoices: response.data.invoices,
          totalUnpaidAmount: response.data.totalAmount,
          loading: false
        });
      }),
      catchError((error) => {
        ctx.patchState({
          loading: false,
          error: error.message || 'Erreur lors du chargement des factures impayées'
        });
        return throwError(error);
      })
    );
  }

  @Action(SubscriptionPaymentAction.GetPaymentStatus)
  getPaymentStatus(ctx: StateContext<SubscriptionPaymentStateModel>) {
    ctx.patchState({ loading: true, error: null });

    return this.subscriptionPaymentService.getPaymentStatus().pipe(
      tap((response) => {
        ctx.patchState({
          paymentStatus: response.data,
          loading: false
        });
      }),
      catchError((error) => {
        ctx.patchState({
          loading: false,
          error: error.message || 'Erreur lors du chargement du statut de paiement'
        });
        return throwError(error);
      })
    );
  }

  @Action(SubscriptionPaymentAction.SendPaymentReminders)
  sendPaymentReminders(ctx: StateContext<SubscriptionPaymentStateModel>) {
    ctx.patchState({ loading: true, error: null });

    return this.subscriptionPaymentService.sendPaymentReminders().pipe(
      tap((response) => {
        ctx.patchState({ loading: false });
        this.toastrService.success(this.translateService.instant('NOTIFICATIONS.PAYMENT_REMINDERS_SENT'), 'Envoi terminé');
      }),
      catchError((error) => {
        ctx.patchState({
          loading: false,
          error: error.message || 'Erreur lors de l\'envoi des rappels'
        });
        this.toastrService.error(this.translateService.instant('NOTIFICATIONS.PAYMENT_REMINDERS_ERROR'), 'Erreur');
        return throwError(error);
      })
    );
  }

  @Action(SubscriptionPaymentAction.GetCurrentPeriodInvoice)
  getCurrentPeriodInvoice(ctx: StateContext<SubscriptionPaymentStateModel>) {
    ctx.patchState({ loading: true, error: null });

    return this.subscriptionPaymentService.getCurrentPeriodInvoice().pipe(
      tap((response) => {
        ctx.patchState({
          currentInvoice: response.data,
          loading: false
        });
      }),
      catchError((error) => {
        ctx.patchState({
          loading: false,
          error: error.message || 'Erreur lors du chargement de la facture courante'
        });
        return throwError(error);
      })
    );
  }

  @Action(SubscriptionPaymentAction.SetPaymentHistory)
  setPaymentHistory(ctx: StateContext<SubscriptionPaymentStateModel>, action: SubscriptionPaymentAction.SetPaymentHistory) {
    ctx.patchState({
      paymentHistory: action.history
    });
  }

  @Action(SubscriptionPaymentAction.SetUnpaidInvoices)
  setUnpaidInvoices(ctx: StateContext<SubscriptionPaymentStateModel>, action: SubscriptionPaymentAction.SetUnpaidInvoices) {
    ctx.patchState({
      unpaidInvoices: action.invoices
    });
  }

  @Action(SubscriptionPaymentAction.SetPaymentStatus)
  setPaymentStatus(ctx: StateContext<SubscriptionPaymentStateModel>, action: SubscriptionPaymentAction.SetPaymentStatus) {
    ctx.patchState({
      paymentStatus: action.status
    });
  }

  @Action(SubscriptionPaymentAction.SetCurrentInvoice)
  setCurrentInvoice(ctx: StateContext<SubscriptionPaymentStateModel>, action: SubscriptionPaymentAction.SetCurrentInvoice) {
    ctx.patchState({
      currentInvoice: action.invoice
    });
  }

  @Action(SubscriptionPaymentAction.SetLoading)
  setLoading(ctx: StateContext<SubscriptionPaymentStateModel>, action: SubscriptionPaymentAction.SetLoading) {
    ctx.patchState({
      loading: action.loading
    });
  }

  @Action(SubscriptionPaymentAction.SetError)
  setError(ctx: StateContext<SubscriptionPaymentStateModel>, action: SubscriptionPaymentAction.SetError) {
    ctx.patchState({
      error: action.error
    });
  }

  // ==================== NOUVELLES ACTIONS STRIPE ====================

  @Action(SubscriptionPaymentAction.CreateStripeSession)
  createStripeSession(ctx: StateContext<SubscriptionPaymentStateModel>, action: SubscriptionPaymentAction.CreateStripeSession) {
    ctx.patchState({ stripeLoading: true, stripeError: null });

    return this.subscriptionPaymentService.createStripeSession(action.payload).pipe(
      tap((response: any) => {
        ctx.patchState({
          stripeLoading: false,
          stripeSession: response.data
        });
      }),
      catchError((error: any) => {
        ctx.patchState({
          stripeLoading: false,
          stripeError: error.error?.message || 'Erreur lors de la création de la session Stripe'
        });
        this.toastrService.error(this.translateService.instant('NOTIFICATIONS.STRIPE_SESSION_ERROR'));
        return throwError(error);
      })
    );
  }

  @Action(SubscriptionPaymentAction.ConfirmStripePayment)
  confirmStripePayment(ctx: StateContext<SubscriptionPaymentStateModel>, action: SubscriptionPaymentAction.ConfirmStripePayment) {
    ctx.patchState({ stripeLoading: true, stripeError: null });

    return this.subscriptionPaymentService.confirmStripePayment(action.payload).pipe(
      tap((response: any) => {
        ctx.patchState({
          stripeLoading: false,
          stripeSession: null
        });
        this.toastrService.success(this.translateService.instant('NOTIFICATIONS.STRIPE_PAYMENT_CONFIRMED'));
        // Recharger les données de paiement
        ctx.dispatch(new SubscriptionPaymentAction.GetPaymentHistory());
        ctx.dispatch(new SubscriptionPaymentAction.GetUnpaidInvoices());
      }),
      catchError((error: any) => {
        ctx.patchState({
          stripeLoading: false,
          stripeError: error.error?.message || 'Erreur lors de la confirmation du paiement'
        });
        this.toastrService.error(this.translateService.instant('NOTIFICATIONS.STRIPE_PAYMENT_ERROR'));
        return throwError(error);
      })
    );
  }

  @Action(SubscriptionPaymentAction.GetStripeSessionStatus)
  getStripeSessionStatus(ctx: StateContext<SubscriptionPaymentStateModel>, action: SubscriptionPaymentAction.GetStripeSessionStatus) {
    ctx.patchState({ stripeLoading: true, stripeError: null });

    return this.subscriptionPaymentService.checkStripeSessionStatus(action.sessionId).pipe(
      tap((response: any) => {
        ctx.patchState({
          stripeLoading: false
        });
      }),
      catchError((error: any) => {
        ctx.patchState({
          stripeLoading: false,
          stripeError: error.error?.message || 'Erreur lors de la récupération du statut'
        });
        return throwError(error);
      })
    );
  }

  @Action(SubscriptionPaymentAction.GetPaymentMethods)
  getPaymentMethods(ctx: StateContext<SubscriptionPaymentStateModel>) {
    ctx.patchState({ stripeLoading: true, stripeError: null });

    return this.subscriptionPaymentService.getPaymentMethods().pipe(
      tap((response: any) => {
        ctx.patchState({
          stripeLoading: false,
          paymentMethods: response.data
        });
      }),
      catchError((error: any) => {
        ctx.patchState({
          stripeLoading: false,
          stripeError: error.error?.message || 'Erreur lors de la récupération des méthodes de paiement'
        });
        return throwError(error);
      })
    );
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
