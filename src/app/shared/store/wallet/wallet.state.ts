import { Injectable, OnDestroy } from '@angular/core';
import { State, Action, StateContext, Selector, NgxsOnInit } from '@ngxs/store';
import { tap, catchError, switchMap, takeUntil, filter, debounceTime, timeout } from 'rxjs/operators';
import { throwError, interval, Subject, forkJoin, merge, Subscription, Observable, of } from 'rxjs';
import { RealtimeEvent, RealtimeService } from '../../../core/realtime';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { WalletAction } from './wallet.actions';
import { WalletStateModel, WalletSummary, WalletTransaction, WithdrawalRequest, DepositInitiateResult, RecentMovement } from './wallet.model';
import { WalletHttpService } from './wallet.service';

const POLLING_INTERVAL_MS = 5000;  // 5 secondes
const MAX_POLLING_ATTEMPTS = 72;   // 6 minutes max (72 × 5s) — EasyTransact peut prendre plusieurs minutes
const LOAD_TIMEOUT_MS = 20_000;    // au-delà, le chargement est considéré en échec

/** Message affiché quand le solde n'a pas pu être chargé. */
function walletLoadError(err: any): string {
  if (err?.name === 'TimeoutError') return 'WALLET.LOAD_ERROR.TIMEOUT';
  if (err?.status === 0) return 'WALLET.LOAD_ERROR.NETWORK';
  return 'WALLET.LOAD_ERROR.GENERIC';
}

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
export class WalletState implements OnDestroy, NgxsOnInit {
  /**
   * Subject recréé à chaque nouveau polling pour éviter le problème du singleton
   * NGXS (ngOnDestroy jamais appelé sur un state root) : on ne complete() jamais
   * le subject, on le remplace simplement par un nouveau lors du prochain polling.
   */
  private stopPolling$ = new Subject<void>();

  constructor(
    private walletService: WalletHttpService,
    private toastr: ToastrService,
    private translate: TranslateService,
    private realtime: RealtimeService,
  ) {}

  ngOnDestroy(): void {
    this.stopPolling$.next();
    this.realtimeSub?.unsubscribe();
  }

  private realtimeSub?: Subscription;

  /**
   * Loyer reçu, dépôt, paiement d'abonnement : le solde affiché se met à jour
   * sans rechargement, si le wallet a déjà été chargé dans cette session.
   */
  ngxsOnInit(ctx: StateContext<WalletStateModel>): void {
    this.realtimeSub = this.realtime.on(RealtimeEvent.WalletUpdated)
      .pipe(debounceTime(500))
      .subscribe(() => {
        if (ctx.getState().summary) {
          ctx.dispatch(new WalletAction.LoadSummary());
        }
      });
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

  @Selector()
  static recentMovements(s: WalletStateModel): RecentMovement[] {
    const rents: RecentMovement[] = s.rentPayments.map(tx => ({
      _id: tx._id, kind: 'rent', amount: tx.amount, createdAt: tx.createdAt,
      label: tx.locataire?.fullName || tx.description || 'Loyer reçu',
      rentTx: tx,
    }));
    const deposits: RecentMovement[] = s.deposits.map(tx => ({
      _id: tx._id, kind: 'deposit', amount: tx.amount, createdAt: tx.createdAt,
      label: tx.description || 'Dépôt',
    }));
    const withdrawals: RecentMovement[] = s.withdrawals.map(w => ({
      _id: w._id, kind: 'withdrawal', amount: w.amount, createdAt: w.createdAt,
      label: w.recipient, status: w.status,
    }));
    return [...rents, ...deposits, ...withdrawals]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }

  /**
   * Chargement du portefeuille. Chaque requête est indépendante et bornée
   * dans le temps : le solde s'affiche dès qu'il arrive, et une liste en
   * échec n'empêche plus l'affichage du reste. Auparavant, une seule requête
   * en échec ou sans réponse laissait l'écran « Chargement de votre
   * portefeuille… » sans fin ni message.
   */
  @Action(WalletAction.LoadAll)
  loadAll(ctx: StateContext<WalletStateModel>, { rentPage, depositPage, withdrawalPage, pageSize }: WalletAction.LoadAll) {
    ctx.patchState({ loading: true, error: null });
    const bounded = <T>(request: Observable<T>) => request.pipe(timeout(LOAD_TIMEOUT_MS));

    const summary$ = bounded(this.walletService.getSummary()).pipe(
      tap(res => ctx.patchState({ summary: res.data, loading: false })),
      catchError(err => {
        // Sans solde, rien d'utile à afficher : message d'erreur et « Réessayer ».
        ctx.patchState({ loading: false, error: walletLoadError(err) });
        return of(null);
      }),
    );
    // Une liste en échec reste vide sans bloquer le reste du portefeuille.
    const optional = <T>(list$: Observable<T>) => list$.pipe(catchError(() => of(null)));
    const lists$ = [
      optional(bounded(this.walletService.getRentPayments(rentPage, pageSize)).pipe(
        tap(res => ctx.patchState({ rentPayments: res.data.payments, totalRentPayments: res.data.total })),
      )),
      optional(bounded(this.walletService.getDeposits(depositPage, pageSize)).pipe(
        tap(res => ctx.patchState({ deposits: res.data.deposits, totalDeposits: res.data.total })),
      )),
      optional(bounded(this.walletService.getWithdrawals(withdrawalPage, pageSize)).pipe(
        tap(res => ctx.patchState({ withdrawals: res.data.withdrawals, totalWithdrawals: res.data.total })),
      )),
    ];

    return forkJoin([summary$, ...lists$]).pipe(
      tap(() => ctx.patchState({ loading: false })),
    );
  }

  @Action(WalletAction.LoadSummary)
  loadSummary(ctx: StateContext<WalletStateModel>) {
    return this.walletService.getSummary().pipe(
      tap(res => ctx.patchState({ summary: res.data })),
      catchError(err => { ctx.patchState({ error: err.message }); return throwError(err); })
    );
  }

  @Action(WalletAction.LoadTransactions)
  loadTransactions(ctx: StateContext<WalletStateModel>, { page, limit }: WalletAction.LoadTransactions) {
    return this.walletService.getTransactions(page, limit).pipe(
      tap(res => ctx.patchState({
        transactions: res.data.transactions,
        totalTransactions: res.data.total,
      })),
      catchError(err => { ctx.patchState({ error: err.message }); return throwError(err); })
    );
  }

  @Action(WalletAction.LoadRentPayments)
  loadRentPayments(ctx: StateContext<WalletStateModel>, { page, limit }: WalletAction.LoadRentPayments) {
    return this.walletService.getRentPayments(page, limit).pipe(
      tap(res => ctx.patchState({
        rentPayments: res.data.payments,
        totalRentPayments: res.data.total,
      })),
      catchError(err => { ctx.patchState({ error: err.message }); return throwError(err); })
    );
  }

  @Action(WalletAction.LoadDeposits)
  loadDeposits(ctx: StateContext<WalletStateModel>, { page, limit }: WalletAction.LoadDeposits) {
    return this.walletService.getDeposits(page, limit).pipe(
      tap(res => ctx.patchState({
        deposits: res.data.deposits,
        totalDeposits: res.data.total,
      })),
      catchError(err => { ctx.patchState({ error: err.message }); return throwError(err); })
    );
  }

  @Action(WalletAction.LoadWithdrawals)
  loadWithdrawals(ctx: StateContext<WalletStateModel>, { page, limit }: WalletAction.LoadWithdrawals) {
    return this.walletService.getWithdrawals(page, limit).pipe(
      tap(res => ctx.patchState({
        withdrawals: res.data.withdrawals,
        totalWithdrawals: res.data.total,
      })),
      catchError(err => { ctx.patchState({ error: err.message }); return throwError(err); })
    );
  }

  @Action(WalletAction.RequestWithdrawal)
  requestWithdrawal(ctx: StateContext<WalletStateModel>, { amount, method, recipient, idempotencyKey }: WalletAction.RequestWithdrawal) {
    ctx.patchState({ withdrawLoading: true, error: null });
    return this.walletService.requestWithdrawal(amount, method, recipient, idempotencyKey).pipe(
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
        const msg = err.error?.message?.[0] || err.error?.message || this.translate.instant('NOTIFICATIONS.WALLET_WITHDRAWAL_ERROR');
        ctx.patchState({ withdrawLoading: false, error: msg });
        this.toastr.error(msg, 'Ndewa360°');
        return throwError(err);
      })
    );
  }

  @Action(WalletAction.PollWithdrawalStatus)
  pollWithdrawalStatus(ctx: StateContext<WalletStateModel>, { withdrawalId }: WalletAction.PollWithdrawalStatus) {
    // Stopper tout polling précédent et recréer le subject (singleton NGXS safe)
    this.stopPolling$.next();
    this.stopPolling$ = new Subject<void>();

    let attempts = 0;

    // L'événement temps réel déclenche une vérification immédiate ; le polling
    // reste en secours si le socket est indisponible.
    const realtimeUpdate$ = this.realtime.on(RealtimeEvent.WalletWithdrawalUpdated).pipe(
      filter((event) => event.withdrawalId === withdrawalId),
    );

    return merge(interval(POLLING_INTERVAL_MS), realtimeUpdate$).pipe(
      takeUntil(this.stopPolling$),
      switchMap(() => {
        attempts++;
        return this.walletService.getWithdrawalStatus(withdrawalId);
      }),
      tap((res) => {
        const withdrawal = res.data;

        // Mettre à jour le retrait dans la liste ET dans le summary (bannière)
        const state = ctx.getState();
        const updatedWithdrawals = state.withdrawals.map(w =>
          w._id === withdrawalId ? { ...w, ...withdrawal } : w,
        );
        const updatedSummary = state.summary ? {
          ...state.summary,
          hasPendingWithdrawal: ['PENDING', 'PROCESSING'].includes(withdrawal.status)
            ? state.summary.hasPendingWithdrawal
            : state.summary.pendingWithdrawal?._id === withdrawalId ? false : state.summary.hasPendingWithdrawal,
          pendingWithdrawal: state.summary.pendingWithdrawal?._id === withdrawalId
            ? { ...state.summary.pendingWithdrawal, ...withdrawal }
            : state.summary.pendingWithdrawal,
        } : state.summary;
        ctx.patchState({ withdrawals: updatedWithdrawals, summary: updatedSummary });

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
    this.stopPolling$ = new Subject<void>();
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
          this.toastr.success(this.translate.instant('NOTIFICATIONS.WALLET_DEPOSIT_INITIATED'), 'Ndewa360°');
          ctx.dispatch(new WalletAction.LoadSummary());
          ctx.dispatch(new WalletAction.LoadDeposits());
        }
      }),
      catchError(err => {
        const msg = err.error?.message?.[0] || err.error?.message || this.translate.instant('NOTIFICATIONS.WALLET_DEPOSIT_ERROR');
        ctx.patchState({ depositLoading: false, error: msg });
        this.toastr.error(msg, 'Ndewa360°');
        return throwError(err);
      })
    );
  }

  @Action(WalletAction.Reset)
  reset(ctx: StateContext<WalletStateModel>) {
    this.stopPolling$.next();
    this.stopPolling$ = new Subject<void>();
    ctx.setState({
      summary: null, transactions: [], rentPayments: [], deposits: [], withdrawals: [],
      totalTransactions: 0, totalRentPayments: 0, totalDeposits: 0, totalWithdrawals: 0,
      loading: false, withdrawLoading: false, depositLoading: false, error: null,
      pollingWithdrawalId: null, deletingWithdrawalId: null,
    });
  }
}
