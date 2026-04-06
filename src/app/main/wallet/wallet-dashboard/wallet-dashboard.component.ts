import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store, Select } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { WalletState, WalletAction, WalletSummary, WalletTransaction, WithdrawalRequest } from 'src/app/shared/store/wallet';
import { WithdrawalModalComponent } from '../components/withdrawal-modal/withdrawal-modal.component';

@Component({
  selector: 'app-wallet-dashboard',
  templateUrl: './wallet-dashboard.component.html',
  styleUrls: ['./wallet-dashboard.component.scss'],
})
export class WalletDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @Select(WalletState.summary)      summary$: Observable<WalletSummary | null>;
  @Select(WalletState.rentPayments) rentPayments$: Observable<WalletTransaction[]>;
  @Select(WalletState.withdrawals)  withdrawals$: Observable<WithdrawalRequest[]>;
  @Select(WalletState.loading)      loading$: Observable<boolean>;
  @Select(WalletState.totalRentPayments) totalRentPayments$: Observable<number>;

  summary: WalletSummary | null = null;
  rentPayments: WalletTransaction[] = [];
  withdrawals: WithdrawalRequest[] = [];
  loading = false;
  totalRentPayments = 0;

  activeTab: 'overview' | 'rent' | 'withdrawals' = 'overview';
  rentPage = 1;
  withdrawalPage = 1;
  readonly pageSize = 10;

  constructor(private store: Store, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadAll();

    this.summary$.pipe(takeUntil(this.destroy$)).subscribe(s => this.summary = s);
    this.rentPayments$.pipe(takeUntil(this.destroy$)).subscribe(p => this.rentPayments = p);
    this.withdrawals$.pipe(takeUntil(this.destroy$)).subscribe(w => this.withdrawals = w);
    this.loading$.pipe(takeUntil(this.destroy$)).subscribe(l => this.loading = l);
    this.totalRentPayments$.pipe(takeUntil(this.destroy$)).subscribe(t => this.totalRentPayments = t);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAll(): void {
    this.store.dispatch(new WalletAction.LoadSummary());
    this.store.dispatch(new WalletAction.LoadRentPayments(this.rentPage, this.pageSize));
    this.store.dispatch(new WalletAction.LoadWithdrawals(this.withdrawalPage, this.pageSize));
  }

  refresh(): void { this.loadAll(); }

  openWithdrawalModal(): void {
    const ref = this.dialog.open(WithdrawalModalComponent, {
      width: '480px',
      disableClose: false,
      data: { balance: this.summary?.balance || 0 },
    });
    ref.afterClosed().subscribe(result => {
      if (result?.success) this.loadAll();
    });
  }

  changeRentPage(page: number): void {
    this.rentPage = page;
    this.store.dispatch(new WalletAction.LoadRentPayments(page, this.pageSize));
  }

  changeWithdrawalPage(page: number): void {
    this.withdrawalPage = page;
    this.store.dispatch(new WalletAction.LoadWithdrawals(page, this.pageSize));
  }

  get rentTotalPages(): number {
    return Math.ceil(this.totalRentPayments / this.pageSize) || 1;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(amount || 0);
  }

  formatDate(d: any): string {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getTxLabel(type: string): string {
    const labels: Record<string, string> = {
      CREDIT_RENT: 'Loyer reçu', DEBIT_WITHDRAWAL: 'Retrait', DEBIT_FEE: 'Frais', REFUND: 'Remboursement',
    };
    return labels[type] || type;
  }

  getTxColor(type: string): string {
    return type === 'CREDIT_RENT' || type === 'REFUND' ? 'credit' : 'debit';
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
      MTN_MONEY: 'MTN Mobile Money', ORANGE_MONEY: 'Orange Money', BANK: 'Virement bancaire',
    };
    return labels[method] || method;
  }
}
