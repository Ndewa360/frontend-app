import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

// Models
import { AdminPaymentsStateModel, AdminPayment, AdminSubscription, AdminCoupon, PaymentStats } from './admin-payments.model';

// Actions
import { AdminPaymentsAction } from './admin-payments.actions';

// Services
import { AdminPaymentsService } from '../../services/admin-payments.service';

@State<AdminPaymentsStateModel>({
  name: 'adminPayments',
  defaults: {
    payments: [],
    subscriptions: [],
    coupons: [],
    stats: null,
    filters: {
      payments: {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      },
      subscriptions: {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      },
      coupons: {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }
    },
    pagination: {
      payments: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      },
      subscriptions: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      },
      coupons: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      }
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
  static selectCoupons(state: AdminPaymentsStateModel): AdminCoupon[] {
    return state.coupons;
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

  @Action(AdminPaymentsAction.LoadPayments)
  loadPayments(ctx: StateContext<AdminPaymentsStateModel>, action: AdminPaymentsAction.LoadPayments) {
    ctx.patchState({ loading: true, error: null });
    const filters = action.filters || ctx.getState().filters.payments;
    return this.adminPaymentsService.getPayments(filters).pipe(
      tap(response => {
        ctx.patchState({
          payments: response.payments || (response as any).data || [],
          pagination: {
            ...ctx.getState().pagination,
            payments: {
              page: response.meta?.page || 1,
              limit: response.meta?.limit || 20,
              total: response.total || 0,
              totalPages: response.meta?.totalPages || 0
            }
          },
          loading: false,
          error: null,
          lastUpdated: new Date()
        });
      }),
      catchError(error => {
        ctx.patchState({ loading: false, error: error.message });
        return throwError(error);
      })
    );
  }

  @Action(AdminPaymentsAction.LoadPaymentsSuccess)
  loadPaymentsSuccess(ctx: StateContext<AdminPaymentsStateModel>, action: AdminPaymentsAction.LoadPaymentsSuccess) {
    ctx.patchState({
      payments: action.payments || [],
      pagination: {
        ...ctx.getState().pagination,
        payments: {
          page: action.meta?.page || 1,
          limit: action.meta?.limit || 20,
          total: action.total || 0,
          totalPages: action.meta?.totalPages || 0
        }
      },
      loading: false,
      error: null,
      lastUpdated: new Date()
    });
  }

  @Action(AdminPaymentsAction.LoadPaymentsFailure)
  loadPaymentsFailure(ctx: StateContext<AdminPaymentsStateModel>, action: AdminPaymentsAction.LoadPaymentsFailure) {
    ctx.patchState({
      loading: false,
      error: action.error
    });
  }

  @Action(AdminPaymentsAction.LoadSubscriptions)
  loadSubscriptions(ctx: StateContext<AdminPaymentsStateModel>, action: AdminPaymentsAction.LoadSubscriptions) {
    ctx.patchState({ loading: true, error: null });
    const filters = action.filters || ctx.getState().filters.subscriptions;
    return this.adminPaymentsService.getSubscriptions(filters).pipe(
      tap(response => {
        ctx.patchState({
          subscriptions: response.subscriptions || (response as any).data || [],
          pagination: {
            ...ctx.getState().pagination,
            subscriptions: {
              page: response.meta?.page || 1,
              limit: response.meta?.limit || 20,
              total: response.total || 0,
              totalPages: response.meta?.totalPages || 0
            }
          },
          loading: false,
          error: null,
          lastUpdated: new Date()
        });
      }),
      catchError(error => {
        ctx.patchState({ loading: false, error: error.message });
        return throwError(error);
      })
    );
  }

  @Action(AdminPaymentsAction.LoadSubscriptionsSuccess)
  loadSubscriptionsSuccess(ctx: StateContext<AdminPaymentsStateModel>, action: AdminPaymentsAction.LoadSubscriptionsSuccess) {
    ctx.patchState({
      subscriptions: action.subscriptions || [],
      pagination: {
        ...ctx.getState().pagination,
        subscriptions: {
          page: action.meta?.page || 1,
          limit: action.meta?.limit || 20,
          total: action.total || 0,
          totalPages: action.meta?.totalPages || 0
        }
      },
      loading: false,
      error: null,
      lastUpdated: new Date()
    });
  }

  @Action(AdminPaymentsAction.LoadSubscriptionsFailure)
  loadSubscriptionsFailure(ctx: StateContext<AdminPaymentsStateModel>, action: AdminPaymentsAction.LoadSubscriptionsFailure) {
    ctx.patchState({
      loading: false,
      error: action.error
    });
  }

  @Action(AdminPaymentsAction.LoadPaymentStats)
  loadPaymentStats(ctx: StateContext<AdminPaymentsStateModel>) {
    ctx.patchState({ loading: true, error: null });
    
    return this.adminPaymentsService.getPaymentsStats().pipe(
      tap(stats => {
        ctx.dispatch(new AdminPaymentsAction.LoadPaymentStatsSuccess(stats));
      }),
      catchError(error => {
        ctx.dispatch(new AdminPaymentsAction.LoadPaymentStatsFailure(error));
        return throwError(error);
      })
    );
  }

  @Action(AdminPaymentsAction.LoadPaymentStatsSuccess)
  loadPaymentStatsSuccess(ctx: StateContext<AdminPaymentsStateModel>, action: AdminPaymentsAction.LoadPaymentStatsSuccess) {
    ctx.patchState({
      stats: action.stats,
      loading: false,
      error: null
    });
  }

  @Action(AdminPaymentsAction.LoadPaymentStatsFailure)
  loadPaymentStatsFailure(ctx: StateContext<AdminPaymentsStateModel>, action: AdminPaymentsAction.LoadPaymentStatsFailure) {
    ctx.patchState({
      loading: false,
      error: action.error
    });
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
      coupons: [],
      stats: null,
      error: null,
      lastUpdated: null
    });
  }

  @Action(AdminPaymentsAction.RefreshData)
  refreshData(ctx: StateContext<AdminPaymentsStateModel>) {
    const state = ctx.getState();
    ctx.dispatch([
      new AdminPaymentsAction.LoadPayments(state.filters.payments),
      new AdminPaymentsAction.LoadSubscriptions(state.filters.subscriptions),
      new AdminPaymentsAction.LoadCoupons(state.filters.coupons),
      new AdminPaymentsAction.LoadPaymentStats()
    ]);
  }

  @Action(AdminPaymentsAction.LoadCoupons)
  loadCoupons(ctx: StateContext<AdminPaymentsStateModel>, action: AdminPaymentsAction.LoadCoupons) {
    ctx.patchState({ loading: true, error: null });
    const filters = action.filters || ctx.getState().filters.coupons;
    return this.adminPaymentsService.getCoupons(filters).pipe(
      tap(response => {
        ctx.patchState({
          coupons: response.coupons,
          loading: false,
          lastUpdated: new Date()
        });
      }),
      catchError(error => {
        ctx.patchState({ loading: false, error: error.message });
        return throwError(error);
      })
    );
  }

  @Action(AdminPaymentsAction.CreateCoupon)
  createCoupon(ctx: StateContext<AdminPaymentsStateModel>, action: AdminPaymentsAction.CreateCoupon) {
    ctx.patchState({ loading: true });
    return this.adminPaymentsService.createCoupon(action.couponData).pipe(
      tap(coupon => {
        const state = ctx.getState();
        ctx.patchState({ coupons: [coupon, ...state.coupons], loading: false });
      }),
      catchError(error => {
        ctx.patchState({ loading: false, error: error.message });
        return throwError(error);
      })
    );
  }

  @Action(AdminPaymentsAction.UpdateCoupon)
  updateCoupon(ctx: StateContext<AdminPaymentsStateModel>, action: AdminPaymentsAction.UpdateCoupon) {
    ctx.patchState({ loading: true });
    return this.adminPaymentsService.updateCoupon(action.couponId, action.couponData).pipe(
      tap(updated => {
        const state = ctx.getState();
        ctx.patchState({
          coupons: state.coupons.map(c => c._id === updated._id ? updated : c),
          loading: false
        });
      }),
      catchError(error => {
        ctx.patchState({ loading: false, error: error.message });
        return throwError(error);
      })
    );
  }

  @Action(AdminPaymentsAction.DeleteCoupon)
  deleteCoupon(ctx: StateContext<AdminPaymentsStateModel>, action: AdminPaymentsAction.DeleteCoupon) {
    ctx.patchState({ loading: true });
    return this.adminPaymentsService.deleteCoupon(action.couponId).pipe(
      tap(() => {
        const state = ctx.getState();
        ctx.patchState({
          coupons: state.coupons.filter(c => c._id !== action.couponId),
          loading: false
        });
      }),
      catchError(error => {
        ctx.patchState({ loading: false, error: error.message });
        return throwError(error);
      })
    );
  }

  @Action(AdminPaymentsAction.ProcessPendingPayments)
  processPendingPayments(ctx: StateContext<AdminPaymentsStateModel>) {
    ctx.patchState({ loading: true });
    return this.adminPaymentsService.processPendingPayments().pipe(
      tap(() => {
        ctx.patchState({ loading: false });
        ctx.dispatch(new AdminPaymentsAction.LoadPayments());
      }),
      catchError(error => {
        ctx.patchState({ loading: false, error: error.message });
        return throwError(error);
      })
    );
  }
}
