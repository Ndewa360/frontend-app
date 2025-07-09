import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
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
    error: null
  }
})
@Injectable()
export class SubscriptionPaymentState {

  constructor(
    private subscriptionPaymentService: SubscriptionPaymentService,
    private toastrService: ToastrService
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

  @Action(SubscriptionPaymentAction.ProcessPayment)
  processPayment(ctx: StateContext<SubscriptionPaymentStateModel>, action: SubscriptionPaymentAction.ProcessPayment) {
    ctx.patchState({ loading: true, error: null });

    return this.subscriptionPaymentService.processPayment(action.paymentData).pipe(
      tap((response) => {
        ctx.patchState({ loading: false });
        this.toastrService.success('Paiement traité avec succès', 'Paiement confirmé');
        
        // Recharger les données après paiement
        ctx.dispatch(new SubscriptionPaymentAction.GetPaymentStatus());
        ctx.dispatch(new SubscriptionPaymentAction.GetUnpaidInvoices());
      }),
      catchError((error) => {
        ctx.patchState({
          loading: false,
          error: error.message || 'Erreur lors du traitement du paiement'
        });
        this.toastrService.error('Erreur lors du traitement du paiement', 'Erreur');
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
        this.toastrService.success('Rappels de paiement envoyés', 'Envoi terminé');
      }),
      catchError((error) => {
        ctx.patchState({
          loading: false,
          error: error.message || 'Erreur lors de l\'envoi des rappels'
        });
        this.toastrService.error('Erreur lors de l\'envoi des rappels', 'Erreur');
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
}
