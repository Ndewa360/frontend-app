import { Injectable, OnDestroy } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { tap, catchError, switchMap, takeUntil } from 'rxjs/operators';
import { throwError, interval, Subject } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { WalletAction } from './wallet.actions';
import { WalletStateModel, WalletSummary, WalletTransaction, WithdrawalRequest, DepositInitiateResult } from './wallet.model';
import { WalletHttpService } from './wallet.service';

const POLLING_INTERVAL_MS = 5000;  // 5 secondes — identique au module de paiement central
const MAX_POLLING_ATTEMPTS = 24;   // 2 minutes max (24 × 5s)

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
    pollingWithdrawalId: null,
    deletingWithdrawalId: null,
  },
})
@Injectable()
export class WalletState implements OnDestroy {
  /** Subject pour stopper le polling en cours */
  private stopPolling$ = new Subject<void>();

  constructor(
    private walletService: WalletHttpService,
    private toastr: ToastrService,
    private translate: TranslateService,
  ) {}

  ngOnDestroy(): void {
    this.stopPolling$.next();
    this.stopPolling$.complete();
  }

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
  @Selector() static pollingWithdrawalId(s: WalletStateModel): string | null { return s.pollingWithdrawalId; }
  @Selector() static deletingWithdrawalId(s: WalletStateModel): string | null { return s.deletingWithdrawalId; }

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
      tap((res) => {
        ctx.patchState({ withdrawLoading: false });
        const withdrawal = res.data;

        if (withdrawal.status === 'COMPLETED') {
          // Retrait traité immédiatement (synchrone)
          this.toastr.success(
            this.translate.instant('NOTIFICATIONS.WALLET_WITHDRAWAL_SUCCESS'),
            'Ndewa360°',
          );
        } else if (['PENDING', 'PROCESSING'].includes(withdrawal.status)) {
          // Retrait asynchrone — démarrer le polling
          this.toastr.info(
            this.translate.instant('NOTIFICATIONS.WALLET_WITHDRAWAL_PROCESSING'),
            'Ndewa360°',
          );
          ctx.patchState({ pollingWithdrawalId: withdrawal._id });
          ctx.dispatch(new WalletAction.PollWithdrawalStatus(withdrawal._id));
        }

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

  @Action(WalletAction.PollWithdrawalStatus)
  pollWithdrawalStatus(ctx: StateContext<WalletStateModel>, { withdrawalId }: WalletAction.PollWithdrawalStatus) {
    // Stopper tout polling précédent
    this.stopPolling$.next();

    let attempts = 0;

    return interval(POLLING_INTERVAL_MS).pipe(
      takeUntil(this.stopPolling$),
      switchMap(() => {
        attempts++;
        return this.walletService.getWithdrawalStatus(withdrawalId);
      }),
      tap((res) => {
        const withdrawal = res.data;

        // Mettre à jour le retrait dans la liste
        const state = ctx.getState();
        const updatedWithdrawals = state.withdrawals.map(w =>
          w._id === withdrawalId ? { ...w, ...withdrawal } : w,
        );
        ctx.patchState({ withdrawals: updatedWithdrawals });

        if (withdrawal.status === 'COMPLETED') {
          // Retrait confirmé
          this.stopPolling$.next();
          ctx.patchState({ pollingWithdrawalId: null });
          this.toastr.success(
            this.translate.instant('NOTIFICATIONS.WALLET_WITHDRAWAL_SUCCESS'),
            'Ndewa360°',
          );
          ctx.dispatch(new WalletAction.LoadSummary());
          ctx.dispatch(new WalletAction.LoadWithdrawals());
        } else if (['FAILED', 'CANCELLED'].includes(withdrawal.status)) {
          // Retrait échoué
          this.stopPolling$.next();
          ctx.patchState({ pollingWithdrawalId: null });
          const reason = withdrawal.failureReason || this.translate.instant('NOTIFICATIONS.WALLET_WITHDRAWAL_ERROR');
          this.toastr.error(reason, 'Ndewa360°');
          ctx.dispatch(new WalletAction.LoadSummary());
          ctx.dispatch(new WalletAction.LoadWithdrawals());
        } else if (attempts >= MAX_POLLING_ATTEMPTS) {
          // Timeout polling — arrêter sans erreur (le cron backend prendra le relais)
          this.stopPolling$.next();
          ctx.patchState({ pollingWithdrawalId: null });
          this.toastr.warning(
            this.translate.instant('NOTIFICATIONS.WALLET_WITHDRAWAL_TIMEOUT'),
            'Ndewa360°',
          );
          ctx.dispatch(new WalletAction.LoadSummary());
        }
      }),
      catchError(() => {
        // Erreur réseau — continuer le polling silencieusement
        return [];
      }),
    );
  }

  @Action(WalletAction.StopWithdrawalPolling)
  stopWithdrawalPolling(ctx: StateContext<WalletStateModel>) {
    this.stopPolling$.next();
    ctx.patchState({ pollingWithdrawalId: null });
  }

  @Action(WalletAction.DeleteWithdrawal)
  deleteWithdrawal(ctx: StateContext<WalletStateModel>, { withdrawalId }: WalletAction.DeleteWithdrawal) {
    ctx.patchState({ deletingWithdrawalId: withdrawalId, error: null });
    return this.walletService.deleteWithdrawal(withdrawalId).pipe(
      tap(() => {
        // Retirer le retrait de la liste localement sans recharger
        const state = ctx.getState();
        ctx.patchState({
          withdrawals:          state.withdrawals.filter(w => w._id !== withdrawalId),
          totalWithdrawals:     Math.max(0, state.totalWithdrawals - 1),
          deletingWithdrawalId: null,
        });
        this.toastr.success(
          this.translate.instant('NOTIFICATIONS.WALLET_WITHDRAWAL_DELETED'),
          'Ndewa360°',
        );
      }),
      catchError(err => {
        const msg = err.error?.message || this.translate.instant('NOTIFICATIONS.WALLET_WITHDRAWAL_DELETE_ERROR');
        ctx.patchState({ deletingWithdrawalId: null, error: msg });
        this.toastr.error(msg, 'Ndewa360°');
        return throwError(err);
      }),
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
    this.stopPolling$.next();
    ctx.setState({
      summary: null, transactions: [], rentPayments: [], deposits: [], withdrawals: [],
      totalTransactions: 0, totalRentPayments: 0, totalDeposits: 0, totalWithdrawals: 0,
      loading: false, withdrawLoading: false, depositLoading: false, error: null,
      pollingWithdrawalId: null, deletingWithdrawalId: null,
    });
  }
}
