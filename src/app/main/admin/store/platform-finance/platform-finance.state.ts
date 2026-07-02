import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { PlatformFinanceStateModel } from './platform-finance.model';
import { PlatformFinanceAction } from './platform-finance.actions';
import { AdminPlatformFinanceService } from '../../services/admin-platform-finance.service';

const DEFAULTS: PlatformFinanceStateModel = {
  balance:           null,
  kpis:              null,
  revenueData:       [],
  withdrawals:       [],
  withdrawalsTotal:  0,
  transactions:      [],
  transactionsTotal: 0,
  config:            null,
  loading:           false,
  configError:       null,
};

@State<PlatformFinanceStateModel>({
  name: 'platformFinance',
  defaults: DEFAULTS,
})
@Injectable()
export class PlatformFinanceState {

  constructor(private service: AdminPlatformFinanceService) {}

  @Selector() static balance(s: PlatformFinanceStateModel)           { return s.balance; }
  @Selector() static kpis(s: PlatformFinanceStateModel)              { return s.kpis; }
  @Selector() static revenueData(s: PlatformFinanceStateModel)       { return s.revenueData; }
  @Selector() static withdrawals(s: PlatformFinanceStateModel)       { return s.withdrawals; }
  @Selector() static withdrawalsTotal(s: PlatformFinanceStateModel)  { return s.withdrawalsTotal; }
  @Selector() static transactions(s: PlatformFinanceStateModel)      { return s.transactions; }
  @Selector() static transactionsTotal(s: PlatformFinanceStateModel) { return s.transactionsTotal; }
  @Selector() static config(s: PlatformFinanceStateModel)            { return s.config; }
  @Selector() static loading(s: PlatformFinanceStateModel)           { return s.loading; }
  @Selector() static configError(s: PlatformFinanceStateModel)       { return s.configError; }

  @Action(PlatformFinanceAction.LoadBalance)
  loadBalance(ctx: StateContext<PlatformFinanceStateModel>) {
    ctx.patchState({ loading: true });
    return this.service.getBalance().pipe(
      tap((data: any) => {
        const balance = Array.isArray(data)
          ? (data.find((b: any) => b.currency === 'XAF') || data[0] || null)
          : data;
        ctx.patchState({ balance, loading: false });
      }),
      catchError(() => { ctx.patchState({ loading: false }); return of(null); }),
    );
  }

  @Action(PlatformFinanceAction.LoadKpis)
  loadKpis(ctx: StateContext<PlatformFinanceStateModel>, { currency }: PlatformFinanceAction.LoadKpis) {
    return this.service.getKpis(currency).pipe(
      tap(kpis => ctx.patchState({ kpis })),
      catchError(() => of(null)),
    );
  }

  @Action(PlatformFinanceAction.LoadRevenue)
  loadRevenue(ctx: StateContext<PlatformFinanceStateModel>, { period, year, currency }: PlatformFinanceAction.LoadRevenue) {
    return this.service.getRevenue(period, year, currency).pipe(
      tap(revenueData => ctx.patchState({ revenueData })),
      catchError(() => of(null)),
    );
  }

  @Action(PlatformFinanceAction.LoadWithdrawals)
  loadWithdrawals(ctx: StateContext<PlatformFinanceStateModel>, { page, limit }: PlatformFinanceAction.LoadWithdrawals) {
    return this.service.getWithdrawals({ page, limit }).pipe(
      tap(r => ctx.patchState({ withdrawals: r.data, withdrawalsTotal: r.total })),
      catchError(() => of(null)),
    );
  }

  @Action(PlatformFinanceAction.LoadTransactions)
  loadTransactions(ctx: StateContext<PlatformFinanceStateModel>, { filters }: PlatformFinanceAction.LoadTransactions) {
    return this.service.getTransactions(filters).pipe(
      tap(r => ctx.patchState({ transactions: r.data, transactionsTotal: r.total })),
      catchError(() => of(null)),
    );
  }

  // Fix #7 : erreur loadConfig exposée dans le state (plus avalée silencieusement)
  @Action(PlatformFinanceAction.LoadConfig)
  loadConfig(ctx: StateContext<PlatformFinanceStateModel>) {
    ctx.patchState({ configError: null });
    return this.service.getConfig().pipe(
      tap(config => ctx.patchState({ config, configError: null })),
      catchError((err) => {
        const msg = err?.error?.message || 'Erreur chargement configuration';
        ctx.patchState({ configError: msg });
        return of(null);
      }),
    );
  }
}
