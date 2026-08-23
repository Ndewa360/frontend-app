import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, interval, Observable, fromEvent } from 'rxjs';
import { takeUntil, debounceTime, skip } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { Store, Select } from '@ngxs/store';
import {
  AdminPlatformFinanceService,
  PlatformBalance,
  PlatformWithdrawal,
  PlatformKpis,
  PlatformRevenuePeriod,
  PlatformFinanceConfig,
} from '../../services/admin-platform-finance.service';
import { AdminCurrencyService } from '../../services/admin-currency.service';
import { PlatformFinanceState } from '../../store/platform-finance/platform-finance.state';
import { PlatformFinanceAction } from '../../store/platform-finance/platform-finance.actions';
import { PfPieSlice } from './components/pie-chart/pie-chart.component';
import { PfPieTooltipComponent } from './components/pie-tooltip/pie-tooltip.component';

// ── Constantes de validation Mobile Money Cameroun ────────────────────────────
const FEE_RATE = 0; // 0% pour les admins
const MIN_AMOUNT = 500;
const MAX_AMOUNT = 500_000; // Limite EasyTransact CASHOUT_CM
const ORANGE_REGEX = /^(69|66)\d{7}$|^65[5-9]\d{6}$/;
const MTN_REGEX = /^(67|68)\d{7}$|^65[0-4]\d{6}$/;

// ── Couleurs du camembert (identiques à la légende du graphique) ─────────────
const CATEGORY_COLORS = {
  subscriptions:  '#6366f1',
  premiumAccess:  '#f59e0b',
  withdrawalFees: '#10b981',
};

export interface PlatformWithdrawalMethodDef {
  value: string;
  label: string;
  description: string;
  badge: string;
  badgeClass: string;
  placeholder: string;
  inputType: 'phone' | 'text';
}

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
  selectedPeriod: 'monthly' | 'quarterly' | 'semester' = 'monthly';
  selectedYear = new Date().getFullYear();

  get selectedCurrency(): string {
    return this.currencyService.currency;
  }

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

  // ── Camembert au survol ─────────────────────────────────────────────────────
  hoveredSlices: PfPieSlice[] = [];
  hoveredTitle = '';
  tooltipLeft = 0;
  tooltipTop = 0;
  tooltipPlacement: 'above' | 'below' = 'above';
  private hoveredEl: HTMLElement | null = null;

  @ViewChild('pfTooltip', { read: ElementRef }) pfTooltipRef: ElementRef | null = null;

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

  // ── Withdrawal modal step & methods ─────────────────────────────────────────
  wStep: 'method' | 'details' = 'method';
  selectedMethodDef: PlatformWithdrawalMethodDef | null = null;
  wError: string | null = null;

  MIN_AMOUNT = MIN_AMOUNT;
  MAX_AMOUNT = MAX_AMOUNT;

  methods: PlatformWithdrawalMethodDef[] = [
    {
      value: 'ORANGE_MONEY',
      label: 'Orange Money',
      description: 'Retrait vers un compte Orange Money',
      badge: 'OM',
      badgeClass: 'pw-badge--orange',
      placeholder: '6XXXXXXXX',
      inputType: 'phone',
    },
    {
      value: 'MTN_MONEY',
      label: 'MTN Mobile Money',
      description: 'Retrait vers un compte MTN MoMo',
      badge: 'MTN',
      badgeClass: 'pw-badge--mtn',
      placeholder: '6XXXXXXXX',
      inputType: 'phone',
    },
  ];

  years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  constructor(
    private store: Store,
    private financeService: AdminPlatformFinanceService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private translate: TranslateService,
    private currencyService: AdminCurrencyService,
  ) {
    this.withdrawalForm = this.fb.group({
      requestedAmount: [null, [Validators.required, Validators.min(MIN_AMOUNT), Validators.max(MAX_AMOUNT)]],
      method:          ['', Validators.required],
      recipientName:   ['', Validators.required],
      recipientAccount:['', [Validators.required, Validators.minLength(9), Validators.maxLength(9)]],
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
      if (err) this.toastr.error(err, 'Ndewa360°');
    });
    // Recentrer le camembert si la fenêtre est redimensionnée pendant le survol
    fromEvent(window, 'resize')
      .pipe(debounceTime(100), takeUntil(this.destroy$))
      .subscribe(() => this.positionTooltip());
    // Devise globale : recharger les données quand elle change (ignore la 1ère émission)
    this.currencyService.currencyChange$
      .pipe(skip(1), takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadKpis();
        this.loadRevenue();
        this.loadTransactions();
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
    this.loadExchangeRates();
  }

  loadExchangeRates(): void {
    this.currencyService.refreshRates();
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
    this.currencyService.setCurrency(currency);
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
    this.toastr.info(this.translate.instant('NOTIFICATIONS.ADMIN_DATA_REFRESHED'), 'Ndewa360°');
  }

  onComputeSnapshot(): void {
    this.isLoading = true;
    this.financeService.computeSnapshot(undefined, undefined, this.selectedCurrency)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.toastr.success(this.translate.instant('NOTIFICATIONS.PLATFORM_SNAPSHOT_CALCULATED'), 'Ndewa360°');
          this.store.dispatch(new PlatformFinanceAction.LoadRevenue(this.selectedPeriod, this.selectedYear, this.selectedCurrency));
        },
        error: () => { this.isLoading = false; this.toastr.error(this.translate.instant('NOTIFICATIONS.PLATFORM_SNAPSHOT_CALC_ERROR'), 'Ndewa360°'); },
      });
  }

  // ── Withdrawal modal (2-step flow) ────────────────────────────────────────

  openWithdrawalModal(): void {
    this.withdrawalForm.reset({ method: '', currency: 'XAF' });
    this.wStep = 'method';
    this.selectedMethodDef = null;
    this.wError = null;
    this.showWithdrawalModal = true;
  }

  selectMethod(m: PlatformWithdrawalMethodDef): void {
    this.selectedMethodDef = m;
    this.withdrawalForm.patchValue({ method: m.value, recipientAccount: '', recipientName: '' });
    this.wError = null;
    this.updateRecipientValidator(m.value);
    this.wStep = 'details';
  }

  backToMethod(): void {
    this.wStep = 'method';
    this.selectedMethodDef = null;
    this.wError = null;
    this.withdrawalForm.patchValue({ method: '', recipientAccount: '' });
    this.withdrawalForm.get('recipientAccount')?.setValidators([Validators.required, Validators.minLength(9), Validators.maxLength(9)]);
    this.withdrawalForm.get('recipientAccount')?.updateValueAndValidity();
  }

  setMaxAmount(): void {
    this.withdrawalForm.patchValue({ requestedAmount: this.balance?.available || 0 });
  }

  private updateRecipientValidator(method: string): void {
    const ctrl = this.withdrawalForm.get('recipientAccount');
    if (method === 'ORANGE_MONEY') {
      ctrl?.setValidators([Validators.required, Validators.minLength(9), Validators.maxLength(9), Validators.pattern(ORANGE_REGEX)]);
    } else if (method === 'MTN_MONEY') {
      ctrl?.setValidators([Validators.required, Validators.minLength(9), Validators.maxLength(9), Validators.pattern(MTN_REGEX)]);
    } else {
      ctrl?.setValidators([Validators.required, Validators.minLength(6), Validators.maxLength(34)]);
    }
    ctrl?.updateValueAndValidity();
  }

  get phoneError(): string | null {
    const ctrl = this.withdrawalForm.get('recipientAccount');
    if (!ctrl?.invalid || !ctrl?.touched) return null;
    if (ctrl.errors?.['required']) return 'Ce champ est requis.';
    if (ctrl.errors?.['minlength'] || ctrl.errors?.['maxlength'])
      return 'Le numéro doit contenir exactement 9 chiffres (ex : 6XXXXXXXX).';
    if (ctrl.errors?.['pattern']) {
      if (this.selectedMethodDef?.value === 'ORANGE_MONEY')
        return 'Numéro invalide pour Orange Money. Les numéros Orange commencent par 69, 655-659 ou 66 (ex : 691234567).';
      if (this.selectedMethodDef?.value === 'MTN_MONEY')
        return 'Numéro invalide pour MTN MoMo. Les numéros MTN commencent par 67, 68 ou 650-654 (ex : 671234567).';
    }
    return 'Numéro invalide.';
  }

  get wMaxAmount(): number {
    return Math.min(this.balance?.available || 0, MAX_AMOUNT);
  }

  get wFees(): number { return 0; }
  get wNetAmount(): number { return this.withdrawalForm.value.requestedAmount || 0; }

  submitWithdrawal(): void {
    if (this.withdrawalForm.invalid) { this.withdrawalForm.markAllAsTouched(); return; }
    this.isLoading = true;
    this.wError = null;

    const formVal = this.withdrawalForm.value;
    const payload = {
      requestedAmount:  formVal.requestedAmount,
      method:           formVal.method,
      recipientName:    formVal.recipientName,
      recipientAccount: formVal.recipientAccount,
      currency:         formVal.currency,
      notes:            `Retrait super wallet via ${this.selectedMethodDef?.label}`,
    };

    this.financeService.createWithdrawal(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (w: any) => {
          this.isLoading = false;
          this.showWithdrawalModal = false;
          if (w?.status === 'CONFIRMED') {
            this.toastr.success(this.translate.instant('NOTIFICATIONS.PLATFORM_WITHDRAWAL_DONE'), 'Ndewa360°');
            // this.toastr.success('Retrait effectué avec succès');
          } else if (w?.status === 'PROCESSING' || w?.status === 'PENDING') {
            this.toastr.success('Demande de retrait créée — suivi du statut en cours');
            this.startWithdrawalPolling(w._id);
          } else {
            this.toastr.success(this.translate.instant('NOTIFICATIONS.PLATFORM_WITHDRAWAL_REQUEST_CREATED'), 'Ndewa360°');
          }
          this.store.dispatch(new PlatformFinanceAction.LoadWithdrawals(this.wdPage, this.wdLimit));
          this.store.dispatch(new PlatformFinanceAction.LoadBalance());
        },
        error: (e) => { this.isLoading = false; this.toastr.error(e?.error?.message || this.translate.instant('NOTIFICATIONS.PLATFORM_WITHDRAWAL_REQUEST_ERROR'), 'Ndewa360°'); },
      });
  }

  // ── Polling statut retrait ─────────────────────────────────────────────────

  private startWithdrawalPolling(withdrawalId: string): void {
    const MAX_ATTEMPTS = 72;
    let attempts = 0;

    interval(5000).pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (attempts >= MAX_ATTEMPTS) return;
      attempts++;
      this.financeService.checkWithdrawalStatus(withdrawalId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (w) => {
            if (w.status === 'CONFIRMED') {
              this.toastr.success(`Retrait ${w.reference} confirmé !`);
              this.store.dispatch(new PlatformFinanceAction.LoadWithdrawals(this.wdPage, this.wdLimit));
              this.store.dispatch(new PlatformFinanceAction.LoadBalance());
              attempts = MAX_ATTEMPTS;
            } else if (w.status === 'FAILED') {
              this.toastr.error(`Retrait ${w.reference} échoué : ${w.failureReason || 'Erreur agrégateur'}`);
              this.store.dispatch(new PlatformFinanceAction.LoadWithdrawals(this.wdPage, this.wdLimit));
              attempts = MAX_ATTEMPTS;
            }
          },
        });
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
        next: () => { this.showApproveModal = false; this.toastr.success(this.translate.instant('NOTIFICATIONS.PLATFORM_WITHDRAWAL_APPROVED'), 'Ndewa360°'); this.store.dispatch(new PlatformFinanceAction.LoadWithdrawals(this.wdPage, this.wdLimit)); },
        error: (e) => this.toastr.error(e?.error?.message || this.translate.instant('NOTIFICATIONS.PLATFORM_WITHDRAWAL_APPROVE_ERROR'), 'Ndewa360°'),
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
        error: (e) => this.toastr.error(e?.error?.message || this.translate.instant('NOTIFICATIONS.PLATFORM_WITHDRAWAL_CONFIRM_ERROR'), 'Ndewa360°'),
        next: (w: PlatformWithdrawal) => {
          this.showConfirmModal = false;
          this.store.dispatch(new PlatformFinanceAction.LoadWithdrawals(this.wdPage, this.wdLimit));
          this.store.dispatch(new PlatformFinanceAction.LoadBalance());
          if (w?.status === 'CONFIRMED') {
            this.toastr.success('Retrait confirmé par l\'agrégateur');
          } else if (w?.status === 'PROCESSING') {
            this.toastr.info('Retrait soumis à l\'agrégateur — en cours de traitement');
            this.startWithdrawalPolling(w._id);
          } else if (w?.status === 'FAILED') {
            this.toastr.error(`Retrait échoué : ${w.failureReason || 'Erreur agrégateur'}`, 'Échec');
          } else {
            this.toastr.success('Retrait confirmé');
          }
        },
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
        next: () => { this.showFailModal = false; this.toastr.warning(this.translate.instant('NOTIFICATIONS.PLATFORM_WITHDRAWAL_FAILED_MARKED'), 'Ndewa360°'); this.store.dispatch(new PlatformFinanceAction.LoadWithdrawals(this.wdPage, this.wdLimit)); this.store.dispatch(new PlatformFinanceAction.LoadBalance()); },
        error: (e) => this.toastr.error(e?.error?.message || this.translate.instant('COMMON.ERROR'), 'Ndewa360°'),
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
        next: () => { this.showCancelModal = false; this.toastr.info(this.translate.instant('NOTIFICATIONS.PLATFORM_WITHDRAWAL_CANCELLED'), 'Ndewa360°'); this.store.dispatch(new PlatformFinanceAction.LoadWithdrawals(this.wdPage, this.wdLimit)); this.store.dispatch(new PlatformFinanceAction.LoadBalance()); },
        error: (e) => this.toastr.error(e?.error?.message || this.translate.instant('NOTIFICATIONS.PLATFORM_WITHDRAWAL_CANCEL_ERROR'), 'Ndewa360°'),
      });
  }

  // ── Config ────────────────────────────────────────────────────────────────

  openConfigModal(): void { this.showConfigModal = true; }

  submitConfig(): void {
    if (this.configForm.invalid) return;
    this.financeService.updateConfig(this.configForm.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: c => { this.config = c; this.showConfigModal = false; this.toastr.success(this.translate.instant('NOTIFICATIONS.PLATFORM_CONFIG_UPDATED'), 'Ndewa360°'); this.store.dispatch(new PlatformFinanceAction.LoadConfig()); },
        error: () => this.toastr.error(this.translate.instant('NOTIFICATIONS.PLATFORM_CONFIG_UPDATE_ERROR'), 'Ndewa360°'),
      });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Convertit un montant XAF vers la devise sélectionnée et formate.
   * Les montants du backend sont TOUJOURS en XAF.
   */
  formatCurrency(amountInXaf: number, _currencyOverride?: string): string {
    return this.currencyService.format(amountInXaf, _currencyOverride);
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
    if (!value || value <= 0) return 0;
    return Math.max(Math.ceil((value / max) * 100), 2);
  }

  // ── Camembert au survol ────────────────────────────────────────────────────

  onBarHover(event: MouseEvent, d: PlatformRevenuePeriod): void {
    this.hoveredEl = event.currentTarget as HTMLElement;
    this.hoveredSlices = this.buildSlices(d);
    this.hoveredTitle = `${this.getPeriodLabel(d.period)} ${this.selectedYear}`;
    this.positionTooltip();
    requestAnimationFrame(() => this.positionTooltip());
  }

  onBarLeave(): void {
    this.hoveredEl = null;
    this.hoveredSlices = [];
  }

  onChartScroll(): void {
    if (this.hoveredEl) this.positionTooltip();
  }

  /**
   * Construit les parts du camembert pour un mois donné.
   * Les catégories à 0 sont exclues.
   */
  private buildSlices(d: PlatformRevenuePeriod): PfPieSlice[] {
    const entries = [
      { label: 'Souscriptions',    value: d.subscriptions.revenue,  color: CATEGORY_COLORS.subscriptions },
      { label: 'Accès premium',    value: d.premiumAccess.revenue,  color: CATEGORY_COLORS.premiumAccess },
      { label: 'Frais de retrait', value: d.withdrawalFees.revenue, color: CATEGORY_COLORS.withdrawalFees },
    ];

    const slices: PfPieSlice[] = [];
    for (const e of entries) {
      if (e.value > 0) {
        slices.push({ label: e.label, value: e.value, color: e.color, formattedValue: this.formatCurrency(e.value) });
      }
    }
    return slices;
  }

  /**
   * Positionne le camembert (position:fixed) au-dessus de la barre survolée,
   * en le maintenant dans la fenêtre. Si l'espace au-dessus manque, il est placé dessous.
   */
  private positionTooltip(): void {
    if (!this.hoveredEl) return;

    const rect = this.hoveredEl.getBoundingClientRect();
    const el = this.pfTooltipRef?.nativeElement as HTMLElement | undefined;
    const tooltipWidth = el?.offsetWidth || 240;
    const tooltipHeight = el?.offsetHeight || 250;
    const margin = 14;
    const viewportGap = 8;

    this.tooltipPlacement = rect.top - tooltipHeight - margin >= viewportGap ? 'above' : 'below';
    this.tooltipTop = this.tooltipPlacement === 'above' ? rect.top - margin : rect.bottom + margin;

    let left = rect.left + rect.width / 2;
    left = Math.min(
      Math.max(left, tooltipWidth / 2 + viewportGap),
      window.innerWidth - tooltipWidth / 2 - viewportGap
    );
    this.tooltipLeft = left;
  }

  get growthPositive(): boolean { return (this.kpis?.monthOverMonthGrowth || 0) >= 0; }

  get pendingWithdrawalsCount(): number {
    return this.withdrawals.filter(w => w.status === 'PENDING' || w.status === 'APPROVED').length;
  }
}
