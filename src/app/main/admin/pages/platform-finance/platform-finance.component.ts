import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { Store, Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import {
  AdminPlatformFinanceService,
  PlatformBalance,
  PlatformWithdrawal,
  PlatformKpis,
  PlatformRevenuePeriod,
  PlatformFinanceConfig,
} from '../../services/admin-platform-finance.service';
import { PlatformFinanceState } from '../../store/platform-finance/platform-finance.state';
import { PlatformFinanceAction } from '../../store/platform-finance/platform-finance.actions';

@Component({
  selector: 'app-platform-finance',
  templateUrl: './platform-finance.component.html',
  styleUrls: ['./platform-finance.component.scss'],
})
export class PlatformFinanceComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @Select(PlatformFinanceState.balance)           balance$: Observable<PlatformBalance | null>;
  @Select(PlatformFinanceState.kpis)              kpis$: Observable<PlatformKpis | null>;
  @Select(PlatformFinanceState.revenueData)       revenueData$: Observable<PlatformRevenuePeriod[]>;
  @Select(PlatformFinanceState.withdrawals)       withdrawals$: Observable<PlatformWithdrawal[]>;
  @Select(PlatformFinanceState.withdrawalsTotal)  withdrawalsTotal$: Observable<number>;
  @Select(PlatformFinanceState.transactions)      transactions$: Observable<any[]>;
  @Select(PlatformFinanceState.transactionsTotal) transactionsTotal$: Observable<number>;
  @Select(PlatformFinanceState.config)            config$: Observable<PlatformFinanceConfig | null>;
  @Select(PlatformFinanceState.loading)           loading$: Observable<boolean>;
  @Select(PlatformFinanceState.configError)       configError$: Observable<string | null>;

  // State
  isLoading = false;
  selectedTab = 'overview';
  selectedCurrency = 'XAF';
  selectedPeriod: 'monthly' | 'quarterly' | 'semester' = 'monthly';
  selectedYear = new Date().getFullYear();

  // Data (sync depuis store)
  balance: PlatformBalance | null = null;
  allBalances: PlatformBalance[] = [];
  kpis: PlatformKpis | null = null;
  revenueData: PlatformRevenuePeriod[] = [];
  transactions: any[] = [];
  transactionsTotal = 0;
  withdrawals: PlatformWithdrawal[] = [];
  withdrawalsTotal = 0;
  config: PlatformFinanceConfig | null = null;

  // Pagination
  txPage = 1;
  txLimit = 20;
  wdPage = 1;
  wdLimit = 20;

  // Modals
  showWithdrawalModal = false;
  showApproveModal = false;
  showConfirmModal = false;
  showFailModal = false;
  showCancelModal = false;
  showConfigModal = false;
  selectedWithdrawal: PlatformWithdrawal | null = null;

  // Modal inputs
  approveNotes = '';
  confirmExternalRef = '';
  confirmNotes = '';
  failReason = '';
  cancelReason = '';

  // Forms
  withdrawalForm: FormGroup;
  configForm: FormGroup;

  years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  constructor(
    private store: Store,
    private financeService: AdminPlatformFinanceService,
    private fb: FormBuilder,
    private toastr: ToastrService,
  ) {
    this.withdrawalForm = this.fb.group({
      requestedAmount: [null, [Validators.required, Validators.min(1)]],
      method:          ['BANK_TRANSFER', Validators.required],
      recipientName:   ['', Validators.required],
      recipientAccount:['', Validators.required],
      bankName:        [''],
      operator:        [''],
      currency:        ['XAF'],
      notes:           [''],
    });

    this.configForm = this.fb.group({
      userWithdrawalFeePercent: [2, [Validators.required, Validators.min(0), Validators.max(100)]],
      minWithdrawalAmount:      [500, [Validators.required, Validators.min(0)]],
      maxWithdrawalAmount:      [10000000, [Validators.required, Validators.min(1)]],
      defaultCurrency:          ['XAF', Validators.required],
      requireDualValidation:    [true],
      notifyOnWithdrawal:       [true],
    });
  }

  ngOnInit(): void {
    // Abonnements store
    this.balance$.pipe(takeUntil(this.destroy$)).subscribe(b => this.balance = b);
    this.kpis$.pipe(takeUntil(this.destroy$)).subscribe(k => this.kpis = k);
    this.revenueData$.pipe(takeUntil(this.destroy$)).subscribe(r => this.revenueData = r);
    this.withdrawals$.pipe(takeUntil(this.destroy$)).subscribe(w => this.withdrawals = w);
    this.withdrawalsTotal$.pipe(takeUntil(this.destroy$)).subscribe(t => this.withdrawalsTotal = t);
    this.transactions$.pipe(takeUntil(this.destroy$)).subscribe(t => this.transactions = t);
    this.transactionsTotal$.pipe(takeUntil(this.destroy$)).subscribe(t => this.transactionsTotal = t);
    this.loading$.pipe(takeUntil(this.destroy$)).subscribe(l => this.isLoading = l);
    this.config$.pipe(takeUntil(this.destroy$)).subscribe(c => {
      this.config = c;
      if (c) this.configForm.patchValue(c);
    });
    // Fix #7 : afficher l'erreur config si elle survient
    this.configError$.pipe(takeUntil(this.destroy$)).subscribe(err => {
      if (err) this.toastr.error(err, 'Configuration');
    });
    this.loadAll();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAll(): void {
    this.store.dispatch(new PlatformFinanceAction.LoadBalance());
    this.store.dispatch(new PlatformFinanceAction.LoadKpis(this.selectedCurrency));
    this.store.dispatch(new PlatformFinanceAction.LoadRevenue(this.selectedPeriod, this.selectedYear, this.selectedCurrency));
    this.store.dispatch(new PlatformFinanceAction.LoadWithdrawals(this.wdPage, this.wdLimit));
    this.store.dispatch(new PlatformFinanceAction.LoadConfig());
  }

  loadBalance(): void {
    this.store.dispatch(new PlatformFinanceAction.LoadBalance());
  }

  loadKpis(): void {
    this.store.dispatch(new PlatformFinanceAction.LoadKpis(this.selectedCurrency));
  }

  loadRevenue(): void {
    this.store.dispatch(new PlatformFinanceAction.LoadRevenue(this.selectedPeriod, this.selectedYear, this.selectedCurrency));
  }

  loadTransactions(): void {
    this.store.dispatch(new PlatformFinanceAction.LoadTransactions({ currency: this.selectedCurrency, page: this.txPage, limit: this.txLimit }));
  }

  loadWithdrawals(): void {
    this.store.dispatch(new PlatformFinanceAction.LoadWithdrawals(this.wdPage, this.wdLimit));
  }

  loadConfig(): void {
    this.store.dispatch(new PlatformFinanceAction.LoadConfig());
  }

  onTabChange(tab: string): void {
    this.selectedTab = tab;
    if (tab === 'transactions' && !this.transactions.length) this.loadTransactions();
  }

  onCurrencyChange(currency: string): void {
    this.selectedCurrency = currency;
    this.store.dispatch(new PlatformFinanceAction.LoadBalance());
    this.store.dispatch(new PlatformFinanceAction.LoadKpis(currency));
    this.store.dispatch(new PlatformFinanceAction.LoadRevenue(this.selectedPeriod, this.selectedYear, currency));
  }

  onPeriodChange(period: 'monthly' | 'quarterly' | 'semester'): void {
    this.selectedPeriod = period;
    this.store.dispatch(new PlatformFinanceAction.LoadRevenue(period, this.selectedYear, this.selectedCurrency));
  }

  onYearChange(year: number): void {
    this.selectedYear = year;
    this.store.dispatch(new PlatformFinanceAction.LoadRevenue(this.selectedPeriod, year, this.selectedCurrency));
  }

  onRefresh(): void {
    this.loadAll();
    this.toastr.info('Données actualisées');
  }

  onComputeSnapshot(): void {
    this.isLoading = true;
    this.financeService.computeSnapshot(undefined, undefined, this.selectedCurrency)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.toastr.success('Snapshot calculé');
          this.store.dispatch(new PlatformFinanceAction.LoadRevenue(this.selectedPeriod, this.selectedYear, this.selectedCurrency));
        },
        error: () => { this.isLoading = false; this.toastr.error('Erreur calcul snapshot'); },
      });
  }

  // ── Withdrawal modal ──────────────────────────────────────────────────────

  openWithdrawalModal(): void {
    this.withdrawalForm.reset({ method: 'BANK_TRANSFER', currency: this.selectedCurrency });
    this.showWithdrawalModal = true;
  }

  submitWithdrawal(): void {
    if (this.withdrawalForm.invalid) { this.withdrawalForm.markAllAsTouched(); return; }
    this.isLoading = true;
    this.financeService.createWithdrawal(this.withdrawalForm.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (w: any) => {
          this.isLoading = false;
          this.showWithdrawalModal = false;
          // Super-admin : retrait directement confirmé, pas besoin d'approbation
          if (w?.status === 'CONFIRMED') {
            this.toastr.success('Retrait effectué avec succès');
          } else {
            this.toastr.success('Demande de retrait créée');
          }
          this.store.dispatch(new PlatformFinanceAction.LoadWithdrawals(this.wdPage, this.wdLimit));
          this.store.dispatch(new PlatformFinanceAction.LoadBalance());
        },
        error: (e) => { this.isLoading = false; this.toastr.error(e?.error?.message || 'Erreur création retrait'); },
      });
  }

  // ── Approve ───────────────────────────────────────────────────────────────

  openApproveModal(w: PlatformWithdrawal): void {
    this.selectedWithdrawal = w;
    this.approveNotes = '';
    this.showApproveModal = true;
  }

  confirmApprove(): void {
    if (!this.selectedWithdrawal) return;
    this.financeService.approveWithdrawal(this.selectedWithdrawal._id, this.approveNotes)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => { this.showApproveModal = false; this.toastr.success('Retrait approuvé'); this.store.dispatch(new PlatformFinanceAction.LoadWithdrawals(this.wdPage, this.wdLimit)); },
        error: (e) => this.toastr.error(e?.error?.message || 'Erreur approbation'),
      });
  }

  // ── Confirm ───────────────────────────────────────────────────────────────

  openConfirmModal(w: PlatformWithdrawal): void {
    this.selectedWithdrawal = w;
    this.confirmExternalRef = '';
    this.confirmNotes = '';
    this.showConfirmModal = true;
  }

  submitConfirm(): void {
    if (!this.selectedWithdrawal) return;
    this.financeService.confirmWithdrawal(this.selectedWithdrawal._id, this.confirmExternalRef, this.confirmNotes)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => { this.showConfirmModal = false; this.toastr.success('Retrait confirmé'); this.store.dispatch(new PlatformFinanceAction.LoadWithdrawals(this.wdPage, this.wdLimit)); this.store.dispatch(new PlatformFinanceAction.LoadBalance()); },
        error: (e) => this.toastr.error(e?.error?.message || 'Erreur confirmation'),
      });
  }

  // ── Fail ──────────────────────────────────────────────────────────────────

  openFailModal(w: PlatformWithdrawal): void {
    this.selectedWithdrawal = w;
    this.failReason = '';
    this.showFailModal = true;
  }

  submitFail(): void {
    if (!this.selectedWithdrawal || !this.failReason.trim()) return;
    this.financeService.failWithdrawal(this.selectedWithdrawal._id, this.failReason)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => { this.showFailModal = false; this.toastr.warning('Retrait marqué échoué'); this.store.dispatch(new PlatformFinanceAction.LoadWithdrawals(this.wdPage, this.wdLimit)); this.store.dispatch(new PlatformFinanceAction.LoadBalance()); },
        error: (e) => this.toastr.error(e?.error?.message || 'Erreur'),
      });
  }

  // ── Cancel ────────────────────────────────────────────────────────────────

  openCancelModal(w: PlatformWithdrawal): void {
    this.selectedWithdrawal = w;
    this.cancelReason = '';
    this.showCancelModal = true;
  }

  submitCancel(): void {
    if (!this.selectedWithdrawal) return;
    this.financeService.cancelWithdrawal(this.selectedWithdrawal._id, this.cancelReason)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => { this.showCancelModal = false; this.toastr.info('Retrait annulé'); this.store.dispatch(new PlatformFinanceAction.LoadWithdrawals(this.wdPage, this.wdLimit)); this.store.dispatch(new PlatformFinanceAction.LoadBalance()); },
        error: (e) => this.toastr.error(e?.error?.message || 'Erreur annulation'),
      });
  }

  // ── Config ────────────────────────────────────────────────────────────────

  openConfigModal(): void { this.showConfigModal = true; }

  submitConfig(): void {
    if (this.configForm.invalid) return;
    this.financeService.updateConfig(this.configForm.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: c => { this.config = c; this.showConfigModal = false; this.toastr.success('Configuration mise à jour'); this.store.dispatch(new PlatformFinanceAction.LoadConfig()); },
        error: () => this.toastr.error('Erreur mise à jour configuration'),
      });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  formatCurrency(amount: number, currency = 'XAF'): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount || 0);
  }

  getPeriodLabel(period: number): string {
    if (this.selectedPeriod === 'monthly') {
      return ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'][period - 1] || `M${period}`;
    }
    if (this.selectedPeriod === 'quarterly') return `T${period}`;
    return `S${period}`;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING:    'admin-badge-warning',
      APPROVED:   'admin-badge-info',
      PROCESSING: 'admin-badge-info',
      CONFIRMED:  'admin-badge-success',
      FAILED:     'admin-badge-danger',
      CANCELLED:  'admin-badge-secondary',
    };
    return map[status] || 'admin-badge-secondary';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING:    'En attente',
      APPROVED:   'Approuvé',
      PROCESSING: 'En cours',
      CONFIRMED:  'Confirmé',
      FAILED:     'Échoué',
      CANCELLED:  'Annulé',
    };
    return map[status] || status;
  }

  getMaxBarHeight(data: PlatformRevenuePeriod[]): number {
    return Math.max(...data.map(d => d.total), 1);
  }

  getBarHeight(value: number, max: number): number {
    return Math.round((value / max) * 100);
  }

  get growthPositive(): boolean { return (this.kpis?.monthOverMonthGrowth || 0) >= 0; }

  get pendingWithdrawalsCount(): number {
    return this.withdrawals.filter(w => w.status === 'PENDING' || w.status === 'APPROVED').length;
  }
}
