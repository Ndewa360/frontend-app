import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { WalletAction } from './wallet.actions';
import { WalletStateModel, WalletSummary, WalletTransaction, WithdrawalRequest } from './wallet.model';
import { WalletHttpService } from './wallet.service';

@State<WalletStateModel>({
  name: 'wallet',
  defaults: {
    summary: null,
    transactions: [],
    rentPayments: [],
    withdrawals: [],
    totalTransactions: 0,
    totalRentPayments: 0,
    totalWithdrawals: 0,
    loading: false,
    withdrawLoading: false,
    error: null,
  },
})
@Injectable()
export class WalletState {
  constructor(
    private walletService: WalletHttpService,
    private toastr: ToastrService,
    private translate: TranslateService,
  ) {}

  @Selector() static summary(s: WalletStateModel): WalletSummary | null { return s.summary; }
  @Selector() static transactions(s: WalletStateModel): WalletTransaction[] { return s.transactions; }
  @Selector() static rentPayments(s: WalletStateModel): WalletTransaction[] { return s.rentPayments; }
  @Selector() static withdrawals(s: WalletStateModel): WithdrawalRequest[] { return s.withdrawals; }
  @Selector() static loading(s: WalletStateModel): boolean { return s.loading; }
  @Selector() static withdrawLoading(s: WalletStateModel): boolean { return s.withdrawLoading; }
  @Selector() static error(s: WalletStateModel): string | null { return s.error; }
  @Selector() static balance(s: WalletStateModel): number { return s.summary?.balance || 0; }
  @Selector() static totalRentPayments(s: WalletStateModel): number { return s.totalRentPayments; }

  @Action(WalletAction.LoadSummary)
  loadSummary(ctx: StateContext<WalletStateModel>) {
    ctx.patchState({ loading: true, error: null });
    return this.walletService.getSummary().pipe(
      tap(res => ctx.patchState({ summary: res.data, loading: false })),
      catchError(err => { ctx.patchState({ loading: false, error: err.message }); return throwError(err); })
    );
  }

  @Action(WalletAction.LoadTransactions)
  loadTransactions(ctx: StateContext<WalletStateModel>, { page, limit }: WalletAction.LoadTransactions) {
    ctx.patchState({ loading: true });
    return this.walletService.getTransactions(page, limit).pipe(
      tap(res => ctx.patchState({
        transactions: res.data.transactions,
        totalTransactions: res.data.total,
        loading: false,
      })),
      catchError(err => { ctx.patchState({ loading: false }); return throwError(err); })
    );
  }

  @Action(WalletAction.LoadRentPayments)
  loadRentPayments(ctx: StateContext<WalletStateModel>, { page, limit }: WalletAction.LoadRentPayments) {
    ctx.patchState({ loading: true });
    return this.walletService.getRentPayments(page, limit).pipe(
      tap(res => ctx.patchState({
        rentPayments: res.data.payments,
        totalRentPayments: res.data.total,
        loading: false,
      })),
      catchError(err => { ctx.patchState({ loading: false }); return throwError(err); })
    );
  }

  @Action(WalletAction.LoadWithdrawals)
  loadWithdrawals(ctx: StateContext<WalletStateModel>, { page, limit }: WalletAction.LoadWithdrawals) {
    ctx.patchState({ loading: true });
    return this.walletService.getWithdrawals(page, limit).pipe(
      tap(res => ctx.patchState({
        withdrawals: res.data.withdrawals,
        totalWithdrawals: res.data.total,
        loading: false,
      })),
      catchError(err => { ctx.patchState({ loading: false }); return throwError(err); })
    );
  }

  @Action(WalletAction.RequestWithdrawal)
  requestWithdrawal(ctx: StateContext<WalletStateModel>, { amount, method, recipient }: WalletAction.RequestWithdrawal) {
    ctx.patchState({ withdrawLoading: true, error: null });
    return this.walletService.requestWithdrawal(amount, method, recipient).pipe(
      tap(res => {
        ctx.patchState({ withdrawLoading: false });
        this.toastr.success(this.translate.instant('NOTIFICATIONS.WALLET_WITHDRAWAL_SUCCESS'), 'Ndewa360°');
        // Recharger le résumé pour mettre à jour le solde
        ctx.dispatch(new WalletAction.LoadSummary());
        ctx.dispatch(new WalletAction.LoadWithdrawals());
      }),
      catchError(err => {
        const msg = err.error?.message || this.translate.instant('NOTIFICATIONS.WALLET_WITHDRAWAL_ERROR');
        ctx.patchState({ withdrawLoading: false, error: msg });
        this.toastr.error(msg, 'Ndewa360°');
        return throwError(err);
      })
    );
  }

  @Action(WalletAction.Reset)
  reset(ctx: StateContext<WalletStateModel>) {
    ctx.setState({
      summary: null, transactions: [], rentPayments: [], withdrawals: [],
      totalTransactions: 0, totalRentPayments: 0, totalWithdrawals: 0,
      loading: false, withdrawLoading: false, error: null,
    });
  }
}
