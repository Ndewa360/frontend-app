import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

// Models
import { AdminPaymentsStateModel, AdminPayment, AdminSubscription, PaymentStats } from './admin-payments.model';

// Actions
import { AdminPaymentsAction } from './admin-payments.actions';

// Services
import { AdminPaymentsService } from '../../services/admin-payments.service';

const EMPTY_PAGE = { page: 1, limit: 20, total: 0, totalPages: 0 };

@State<AdminPaymentsStateModel>({
  name: 'adminPayments',
  defaults: {
    payments: [],
    subscriptions: [],
    stats: null,
    filters: {
      payments: {
        page: 1,
        limit: 20,
        sortBy: 'paymentDate',
        sortOrder: 'desc'
      },
      subscriptions: {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }
    },
    pagination: {
      payments: { ...EMPTY_PAGE },
      subscriptions: { ...EMPTY_PAGE }
    },
    loading: false,
    error: null,
    lastUpdated: null
  }
})
@Injectable()
export class AdminPaymentsState {

  constructor(private adminPaymentsService: AdminPaymentsService) {}

  // Selectors
  @Selector()
  static selectPayments(state: AdminPaymentsStateModel): AdminPayment[] {
    return state.payments;
  }

  @Selector()
  static selectSubscriptions(state: AdminPaymentsStateModel): AdminSubscription[] {
    return state.subscriptions;
  }

  @Selector()
  static selectStats(state: AdminPaymentsStateModel): PaymentStats | null {
    return state.stats;
  }

  @Selector()
  static selectFilters(state: AdminPaymentsStateModel) {
    return state.filters;
  }

  @Selector()
  static selectPagination(state: AdminPaymentsStateModel) {
    return state.pagination;
  }

  @Selector()
  static selectIsLoading(state: AdminPaymentsStateModel): boolean {
    return state.loading;
  }

  @Selector()
  static selectError(state: AdminPaymentsStateModel): any {
    return state.error;
  }

  @Selector()
  static selectLastUpdated(state: AdminPaymentsStateModel): Date | null {
    return state.lastUpdated;
  }

  // Actions

  /** Les filtres reçus complètent ceux déjà actifs (recherche + statut + page). */
  @Action(AdminPaymentsAction.LoadPayments)
  loadPayments(ctx: StateContext<AdminPaymentsStateModel>, action: AdminPaymentsAction.LoadPayments) {
    const state = ctx.getState();
    const filters = { ...state.filters.payments, ...(action.filters || {}) };
    ctx.patchState({ loading: true, error: null, filters: { ...state.filters, payments: filters } });
    return this.adminPaymentsService.getPayments(filters).pipe(
      tap(response => {
        ctx.patchState({
          payments: response.payments,
          pagination: {
            ...ctx.getState().pagination,
            payments: { ...response.meta, total: response.total }
          },
          loading: false,
          error: null,
          lastUpdated: new Date()
        });
      }),
      catchError(error => {
        ctx.patchState({ loading: false, error: error.message });
        return throwError(() => error);
      })
    );
  }

  @Action(AdminPaymentsAction.LoadSubscriptions)
  loadSubscriptions(ctx: StateContext<AdminPaymentsStateModel>, action: AdminPaymentsAction.LoadSubscriptions) {
    const state = ctx.getState();
    const filters = { ...state.filters.subscriptions, ...(action.filters || {}) };
    ctx.patchState({ loading: true, error: null, filters: { ...state.filters, subscriptions: filters } });
    return this.adminPaymentsService.getSubscriptions(filters).pipe(
      tap(response => {
        ctx.patchState({
          subscriptions: response.subscriptions,
          pagination: {
            ...ctx.getState().pagination,
            subscriptions: { ...response.meta, total: response.total }
          },
          loading: false,
          error: null,
          lastUpdated: new Date()
        });
      }),
      catchError(error => {
        ctx.patchState({ loading: false, error: error.message });
        return throwError(() => error);
      })
    );
  }

  @Action(AdminPaymentsAction.LoadPaymentStats)
  loadPaymentStats(ctx: StateContext<AdminPaymentsStateModel>) {
    return this.adminPaymentsService.getPaymentsStats().pipe(
      tap(stats => {
        ctx.dispatch(new AdminPaymentsAction.LoadPaymentStatsSuccess(stats));
      }),
      catchError(error => {
        ctx.dispatch(new AdminPaymentsAction.LoadPaymentStatsFailure(error));
        return throwError(() => error);
      })
    );
  }

  @Action(AdminPaymentsAction.LoadPaymentStatsSuccess)
  loadPaymentStatsSuccess(ctx: StateContext<AdminPaymentsStateModel>, action: AdminPaymentsAction.LoadPaymentStatsSuccess) {
    ctx.patchState({ stats: action.stats, error: null });
  }

  @Action(AdminPaymentsAction.LoadPaymentStatsFailure)
  loadPaymentStatsFailure(ctx: StateContext<AdminPaymentsStateModel>, action: AdminPaymentsAction.LoadPaymentStatsFailure) {
    ctx.patchState({ error: action.error });
  }

  @Action(AdminPaymentsAction.SetLoading)
  setLoading(ctx: StateContext<AdminPaymentsStateModel>, action: AdminPaymentsAction.SetLoading) {
    ctx.patchState({ loading: action.loading });
  }

  @Action(AdminPaymentsAction.SetFilters)
  setFilters(ctx: StateContext<AdminPaymentsStateModel>, action: AdminPaymentsAction.SetFilters) {
    ctx.patchState({
      filters: { ...ctx.getState().filters, ...action.filters }
    });
  }

  @Action(AdminPaymentsAction.ClearState)
  clearState(ctx: StateContext<AdminPaymentsStateModel>) {
    ctx.patchState({
      payments: [],
      subscriptions: [],
      stats: null,
      error: null,
      lastUpdated: null
    });
  }

  @Action(AdminPaymentsAction.RefreshData)
  refreshData(ctx: StateContext<AdminPaymentsStateModel>) {
    return ctx.dispatch([
      new AdminPaymentsAction.LoadPayments(),
      new AdminPaymentsAction.LoadSubscriptions(),
      new AdminPaymentsAction.LoadPaymentStats()
    ]);
  }
}
