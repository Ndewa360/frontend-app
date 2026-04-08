import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { WalletAction } from './wallet.actions';
import { WalletStateModel, WalletSummary, WalletTransaction, WithdrawalRequest, DepositInitiateResult } from './wallet.model';
import { WalletHttpService } from './wallet.service';

@State<WalletStateModel>({
  name: 'wallet',
  defaults: {
    summary: null,
    transactions: [],
    rentPayments: [],
    deposits: [],
    withdrawals: [],
    totalTransactions: 0,
    totalRentPayments: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    loading: false,
    withdrawLoading: false,
    depositLoading: false,
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
  @Selector() static deposits(s: WalletStateModel): WalletTransaction[] { return s.deposits; }
  @Selector() static withdrawals(s: WalletStateModel): WithdrawalRequest[] { return s.withdrawals; }
  @Selector() static loading(s: WalletStateModel): boolean { return s.loading; }
  @Selector() static withdrawLoading(s: WalletStateModel): boolean { return s.withdrawLoading; }
  @Selector() static depositLoading(s: WalletStateModel): boolean { return s.depositLoading; }
  @Selector() static error(s: WalletStateModel): string | null { return s.error; }
  @Selector() static balance(s: WalletStateModel): number { return s.summary?.balance || 0; }
  @Selector() static totalRentPayments(s: WalletStateModel): number { return s.totalRentPayments; }
  @Selector() static totalDeposits(s: WalletStateModel): number { return s.totalDeposits; }

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

  @Action(WalletAction.LoadDeposits)
  loadDeposits(ctx: StateContext<WalletStateModel>, { page, limit }: WalletAction.LoadDeposits) {
    ctx.patchState({ loading: true });
    return this.walletService.getDeposits(page, limit).pipe(
      tap(res => ctx.patchState({
        deposits: res.data.deposits,
        totalDeposits: res.data.total,
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
      tap(() => {
        ctx.patchState({ withdrawLoading: false });
        this.toastr.success(this.translate.instant('NOTIFICATIONS.WALLET_WITHDRAWAL_SUCCESS'), 'Ndewa360°');
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

  @Action(WalletAction.InitiateDeposit)
  initiateDeposit(ctx: StateContext<WalletStateModel>, { amount, provider, phoneNumber, successUrl, cancelUrl }: WalletAction.InitiateDeposit) {
    ctx.patchState({ depositLoading: true, error: null });
    return this.walletService.initiateDeposit(amount, provider, phoneNumber, successUrl, cancelUrl).pipe(
      tap(res => {
        ctx.patchState({ depositLoading: false });
        if (res.data.redirectUrl) {
          window.location.href = res.data.redirectUrl;
        } else {
          this.toastr.success('Dépôt initié avec succès', 'Ndewa360°');
          ctx.dispatch(new WalletAction.LoadSummary());
          ctx.dispatch(new WalletAction.LoadDeposits());
        }
      }),
      catchError(err => {
        const msg = err.error?.message?.[0] || err.error?.message || 'Erreur lors du dépôt';
        ctx.patchState({ depositLoading: false, error: msg });
        this.toastr.error(msg, 'Ndewa360°');
        return throwError(err);
      })
    );
  }

  @Action(WalletAction.Reset)
  reset(ctx: StateContext<WalletStateModel>) {
    ctx.setState({
      summary: null, transactions: [], rentPayments: [], deposits: [], withdrawals: [],
      totalTransactions: 0, totalRentPayments: 0, totalDeposits: 0, totalWithdrawals: 0,
      loading: false, withdrawLoading: false, depositLoading: false, error: null,
    });
  }
}
