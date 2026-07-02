import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store, Select } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { WalletState, WalletAction, WalletSummary, WalletTransaction, WithdrawalRequest } from 'src/app/shared/store/wallet';
import { WithdrawalModalComponent } from '../components/withdrawal-modal/withdrawal-modal.component';
import { DepositModalComponent } from '../components/deposit-modal/deposit-modal.component';
@Component({
  selector: 'app-wallet-dashboard',
  templateUrl: './wallet-dashboard.component.html',
  styleUrls: ['./wallet-dashboard.component.scss'],
})
export class WalletDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @Select(WalletState.summary)         summary$: Observable<WalletSummary | null>;
  @Select(WalletState.rentPayments)    rentPayments$: Observable<WalletTransaction[]>;
  @Select(WalletState.deposits)        deposits$: Observable<WalletTransaction[]>;
  @Select(WalletState.withdrawals)     withdrawals$: Observable<WithdrawalRequest[]>;
  @Select(WalletState.loading)         loading$: Observable<boolean>;
  @Select(WalletState.totalRentPayments) totalRentPayments$: Observable<number>;
  @Select(WalletState.totalDeposits)   totalDeposits$: Observable<number>;
  @Select(WalletState.pollingWithdrawalId) pollingWithdrawalId$: Observable<string | null>;
  @Select(WalletState.deletingWithdrawalId) deletingWithdrawalId$: Observable<string | null>;

  summary: WalletSummary | null = null;
  rentPayments: WalletTransaction[] = [];
  deposits: WalletTransaction[] = [];
  withdrawals: WithdrawalRequest[] = [];
  loading = false;
  totalRentPayments = 0;
  totalDeposits = 0;
  pollingWithdrawalId: string | null = null;
  deletingWithdrawalId: string | null = null;

  /** ID du retrait pour lequel le modal de confirmation est ouvert */
  confirmDeleteId: string | null = null;

  activeTab: 'overview' | 'rent' | 'deposits' | 'withdrawals' = 'overview';
  rentPage = 1;
  depositPage = 1;
  withdrawalPage = 1;
  readonly pageSize = 10;
  readonly MIN_WITHDRAWAL = 500;

  constructor(
    private store: Store,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadAll();
    this.handleDepositCallback();

    this.summary$.pipe(takeUntil(this.destroy$)).subscribe(s => this.summary = s);
    this.rentPayments$.pipe(takeUntil(this.destroy$)).subscribe(p => this.rentPayments = p);
    this.deposits$.pipe(takeUntil(this.destroy$)).subscribe(d => this.deposits = d);
    this.withdrawals$.pipe(takeUntil(this.destroy$)).subscribe(w => this.withdrawals = w);
    this.loading$.pipe(takeUntil(this.destroy$)).subscribe(l => this.loading = l);
    this.totalRentPayments$.pipe(takeUntil(this.destroy$)).subscribe(t => this.totalRentPayments = t);
    this.totalDeposits$.pipe(takeUntil(this.destroy$)).subscribe(t => this.totalDeposits = t);
    this.pollingWithdrawalId$.pipe(takeUntil(this.destroy$)).subscribe(id => this.pollingWithdrawalId = id);
    this.deletingWithdrawalId$.pipe(takeUntil(this.destroy$)).subscribe(id => this.deletingWithdrawalId = id);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAll(): void {
    this.store.dispatch(new WalletAction.LoadSummary());
    this.store.dispatch(new WalletAction.LoadRentPayments(this.rentPage, this.pageSize));
    this.store.dispatch(new WalletAction.LoadDeposits(this.depositPage, this.pageSize));
    this.store.dispatch(new WalletAction.LoadWithdrawals(this.withdrawalPage, this.pageSize));
  }

  private handleDepositCallback(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['deposit'] === 'success') {
        this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
        this.loadAll();
        this.activeTab = 'deposits';
      }
    });
  }

  refresh(): void { this.loadAll(); }

  openWithdrawalModal(): void {
    // Recharger le solde frais avant d'ouvrir le modal pour éviter
    // qu'un crédit récent (loyer reçu) bloque le validateur Validators.max.
    this.store.dispatch(new WalletAction.LoadSummary()).subscribe(() => {
      const ref = this.dialog.open(WithdrawalModalComponent, {
        width: '480px',
        disableClose: false,
        data: { balance: this.summary?.balance || 0 },
      });
      ref.afterClosed().subscribe(result => {
        if (result?.success) this.loadAll();
      });
    });
  }

  openDepositModal(): void {
    const ref = this.dialog.open(DepositModalComponent, {
      width: '480px',
      disableClose: false,
    });
    ref.afterClosed().subscribe(result => {
      if (result?.success) this.loadAll();
    });
  }

  changeRentPage(page: number): void {
    this.rentPage = page;
    this.store.dispatch(new WalletAction.LoadRentPayments(page, this.pageSize));
  }

  changeDepositPage(page: number): void {
    this.depositPage = page;
    this.store.dispatch(new WalletAction.LoadDeposits(page, this.pageSize));
  }

  changeWithdrawalPage(page: number): void {
    this.withdrawalPage = page;
    this.store.dispatch(new WalletAction.LoadWithdrawals(page, this.pageSize));
  }

  // ── Suppression d'un retrait échoué ───────────────────────────────────────

  /** Ouvre le modal de confirmation pour un retrait échoué/annulé */
  openDeleteConfirm(withdrawalId: string): void {
    this.confirmDeleteId = withdrawalId;
  }

  /** Annule la suppression */
  cancelDelete(): void {
    this.confirmDeleteId = null;
  }

  /** Confirme et exécute la suppression */
  confirmDelete(): void {
    if (!this.confirmDeleteId) return;
    this.store.dispatch(new WalletAction.DeleteWithdrawal(this.confirmDeleteId));
    this.confirmDeleteId = null;
  }

  /** Retourne true si le retrait peut être supprimé (FAILED ou CANCELLED uniquement) */
  isDeletable(status: string): boolean {
    return status === 'FAILED' || status === 'CANCELLED';
  }

  get rentTotalPages(): number { return Math.ceil(this.totalRentPayments / this.pageSize) || 1; }
  get depositTotalPages(): number { return Math.ceil(this.totalDeposits / this.pageSize) || 1; }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(amount || 0);
  }

  formatDate(d: any): string {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getTxLabel(type: string): string {
    const labels: Record<string, string> = {
      CREDIT_RENT: 'Loyer reçu', CREDIT_DEPOSIT: 'Dépôt', DEBIT_WITHDRAWAL: 'Retrait',
      DEBIT_FEE: 'Frais', DEBIT_SUBSCRIPTION: 'Souscription', REFUND: 'Remboursement',
    };
    return labels[type] || type;
  }

  getTxColor(type: string): string {
    return ['CREDIT_RENT', 'CREDIT_DEPOSIT', 'REFUND'].includes(type) ? 'credit' : 'debit';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'En attente', PROCESSING: 'En cours', COMPLETED: 'Effectué', FAILED: 'Échoué', CANCELLED: 'Annulé',
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      PENDING: 'warning', PROCESSING: 'info', COMPLETED: 'success', FAILED: 'danger', CANCELLED: 'secondary',
    };
    return classes[status] || 'secondary';
  }

  getMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      MTN_MONEY: 'MTN Mobile Money', ORANGE_MONEY: 'Orange Money',
      EASY_TRANSACT: 'Easy Transact', BANK: 'Virement bancaire', WALLET: 'Wallet',
    };
    return labels[method] || method;
  }
}
