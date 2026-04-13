import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import {
  AdminPlatformFinanceService,
  PlatformBalance,
  PlatformWithdrawal,
  PlatformKpis,
  PlatformRevenuePeriod,
  PlatformFinanceConfig,
} from '../../services/admin-platform-finance.service';

@Component({
  selector: 'app-platform-finance',
  templateUrl: './platform-finance.component.html',
  styleUrls: ['./platform-finance.component.scss'],
})
export class PlatformFinanceComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // State
  isLoading = false;
  selectedTab = 'overview';
  selectedCurrency = 'XAF';
  selectedPeriod: 'monthly' | 'quarterly' | 'semester' = 'monthly';
  selectedYear = new Date().getFullYear();

  // Data
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
    this.loadAll();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAll(): void {
    this.loadBalance();
    this.loadKpis();
    this.loadRevenue();
    this.loadWithdrawals();
    this.loadConfig();
  }

  loadBalance(): void {
    this.financeService.getBalance()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          if (Array.isArray(data)) {
            this.allBalances = data;
            this.balance = data.find(b => b.currency === this.selectedCurrency) || data[0] || null;
          } else {
            this.balance = data;
          }
        },
        error: () => this.toastr.error('Erreur chargement solde'),
      });
  }

  loadKpis(): void {
    this.financeService.getKpis(this.selectedCurrency)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: d => this.kpis = d, error: () => {} });
  }

  loadRevenue(): void {
    this.financeService.getRevenue(this.selectedPeriod, this.selectedYear, this.selectedCurrency)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: d => this.revenueData = d, error: () => {} });
  }

  loadTransactions(): void {
    this.financeService.getTransactions({ currency: this.selectedCurrency, page: this.txPage, limit: this.txLimit })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: r => { this.transactions = r.data; this.transactionsTotal = r.total; },
        error: () => this.toastr.error('Erreur chargement transactions'),
      });
  }

  loadWithdrawals(): void {
    this.financeService.getWithdrawals({ page: this.wdPage, limit: this.wdLimit })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: r => { this.withdrawals = r.data; this.withdrawalsTotal = r.total; },
        error: () => this.toastr.error('Erreur chargement retraits'),
      });
  }

  loadConfig(): void {
    this.financeService.getConfig()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: c => {
          this.config = c;
          this.configForm.patchValue(c);
        },
        error: () => {},
      });
  }

  onTabChange(tab: string): void {
    this.selectedTab = tab;
    if (tab === 'transactions' && !this.transactions.length) this.loadTransactions();
  }

  onCurrencyChange(currency: string): void {
    this.selectedCurrency = currency;
    this.loadBalance();
    this.loadKpis();
    this.loadRevenue();
  }

  onPeriodChange(period: 'monthly' | 'quarterly' | 'semester'): void {
    this.selectedPeriod = period;
    this.loadRevenue();
  }

  onYearChange(year: number): void {
    this.selectedYear = year;
    this.loadRevenue();
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
        next: () => { this.isLoading = false; this.toastr.success('Snapshot calculé'); this.loadRevenue(); },
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
        next: () => {
          this.isLoading = false;
          this.showWithdrawalModal = false;
          this.toastr.success('Demande de retrait créée');
          this.loadWithdrawals();
          this.loadBalance();
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
        next: () => { this.showApproveModal = false; this.toastr.success('Retrait approuvé'); this.loadWithdrawals(); },
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
        next: () => { this.showConfirmModal = false; this.toastr.success('Retrait confirmé'); this.loadWithdrawals(); this.loadBalance(); },
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
        next: () => { this.showFailModal = false; this.toastr.warning('Retrait marqué échoué'); this.loadWithdrawals(); this.loadBalance(); },
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
        next: () => { this.showCancelModal = false; this.toastr.info('Retrait annulé'); this.loadWithdrawals(); this.loadBalance(); },
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
        next: c => { this.config = c; this.showConfigModal = false; this.toastr.success('Configuration mise à jour'); },
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
