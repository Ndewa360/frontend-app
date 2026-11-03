import { Store } from '@ngxs/store';
import { UserProfileState } from '../../../../shared/store/user-profile/user-profile.state';
import { isSuperAdmin } from '../../utils/admin-roles';
import { trackByFn } from '../../../../shared/utils/track-by.util';
import { tierLabel } from '../../../../shared/pricing/pricing-grid';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { AdminUsersService } from '../../services/admin-users.service';
import { AdminSubscriptionsService } from '../../services/admin-subscriptions.service';
import { AdminCurrencyService } from '../../services/admin-currency.service';
import { LanguageUrlService } from 'src/app/shared/services/language-url.service';
import { FormsModule } from '@angular/forms';
import { ExtendedModule } from '@angular/flex-layout/extended';
import { NgIf, NgClass, NgFor, NgStyle, JsonPipe } from '@angular/common';

interface SubscriptionPeriodSummary {
  _id: string;
  billingRef: string;
  state: string;
  calculatedAmount: number;
  startedAt: Date;
  endedAt: Date;
  paymentDate?: Date;
  paymentReference?: string;
}

interface RentTransaction {
  _id: string;
  externalRef: string;
  context: 'RENT' | 'SUBSCRIPTION';
  status: 'PENDING' | 'FAILED' | 'SUCCESS' | 'CANCELLED' | 'EXPIRED';
  amount: number;
  currency: string;
  provider: string;
  description: string;
  failureReason?: string;
  eventProcessed: boolean;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  // Locataire enrichi
  locataire?: {
    _id: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
    country?: string;
    idCardNumber?: string;
    idCardType?: string;
    fullNameRef?: string;
    phoneNumberRef?: string;
  };
  // Chambre enrichie
  room?: { _id: string; type: string; code: string; price: number; cautionPrice?: number; description?: string };
  // Contrat enrichi
  location?: { _id: string; startedAt: Date; endedAt?: Date; locationPriceUnit: number; isRunning: boolean };
  // Propriété enrichie
  property?: { _id: string; name: string; location?: string; propertyType?: string; image?: string };
  // Période souscription
  period?: { _id: string; billingRef: string; startedAt: Date; endedAt: Date; calculatedAmount: number };
  // IDs bruts
  locationId?: string;
  propertyId?: string;
  roomId?: string;
  locataireId?: string;
  periodId?: string;
  subscriptionId?: string;
  paymentLinkId?: string;
  rawProviderResponse?: Record<string, any>;
}

interface UserDetails {
  _id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  userType: 'PROPERTY_OWNER' | 'AGENT' | 'ADMIN';
  status: string;
  isActive: boolean;
  emailConfirmed: boolean;
  country?: string;
  createdAt: Date;
  roles?: any[];
  subscription?: {
    _id: string;
    plan: 'free' | 'premium' | 'trial';
    accountStatus: 'active' | 'suspended' | 'disabled';
    propertyLimit?: number;
    monthlyAmount: number;
    /** Palier de la grille (FREE, PRO_1…PRO_4, GOLD). */
    currentTier?: string | null;
    customMonthlyAmount?: number | null;
    /** Calcul de la grille au moment de la consultation. */
    pricing?: {
      tier: string;
      amount: number;
      occupiedUnitsCount: number;
      totalRent: number;
      propertiesCount: number;
      trialActive: boolean;
    } | null;
    hasUnpaidInvoices: boolean;
    totalUnpaidAmount: number;
    unpaidInvoicesCount: number;
    lastPaymentDate?: Date;
    createdAt: Date;
    currentPeriod?: SubscriptionPeriodSummary;
    firstUnpaidPeriod?: SubscriptionPeriodSummary;
    recentPeriods?: SubscriptionPeriodSummary[];
  };
  properties: {
    total: number;
    totalUnits: number;
    occupiedUnits: number;
    vacant: number;
    totalRevenue: number;
    monthlyRevenue: number;
  };
  financialSummary: {
    totalRevenue: number;
    monthlyRevenue: number;
    unpaidAmount: number;
    averageOccupancy: number;
    lastPaymentDate?: Date;
  };
}

@Component({
  selector: 'app-user-details',
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.scss'],
  standalone: true,
  imports: [TranslateModule, NgIf, NgClass, ExtendedModule, NgFor, FormsModule, NgStyle, JsonPipe]
})
export class UserDetailsComponent implements OnInit, OnDestroy {
  /** Confirmation forcée d'un paiement : réservée au super-admin (le serveur refuse sinon). */
  superAdmin = false;
  trackByFn = trackByFn;

  private destroy$ = new Subject<void>();

  user: UserDetails | null = null;
  isLoading    = true;
  userId: string;
  isMarkingPaid = false;

  // Transactions loyer en attente
  rentTransactions: RentTransaction[] = [];
  isLoadingRentTx  = false;
  rentTxLoaded     = false;
  recheckingRef: string | null = null;
  confirmingRef: string | null = null;

  // Modal confirmation manuelle
  showConfirmModal  = false;
  pendingConfirmRef: string | null = null;
  pendingConfirmContext: string | null = null;
  adminNote = '';

  // Modal détail transaction
  showTxDetailModal = false;
  selectedTx: RentTransaction | null = null;

  // Modal suppression transaction
  showDeleteTxModal  = false;
  pendingDeleteRef: string | null = null;
  isDeletingTx = false;

  // Modals
  showSuspendModal  = false;
  showMarkPaidModal = false;
  showPeriodsModal  = false;
  suspendReason = '';
  paymentRef    = '';

  // Période sélectionnée pour markAsPaid
  selectedPeriodId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private usersService: AdminUsersService,
    private subscriptionsService: AdminSubscriptionsService,
    private languageUrlService: LanguageUrlService,
    private toastr: ToastrService,
    private translate: TranslateService,
    private currencyService: AdminCurrencyService,
    private store: Store
  ) {}

  ngOnInit(): void {
    this.superAdmin = isSuperAdmin(this.store.selectSnapshot(UserProfileState.selectStateUserProfile));
    this.userId = this.route.snapshot.params['id'];
    if (!this.userId) {
      this.toastr.error(this.translate.instant('NOTIFICATIONS.ADMIN_NO_USER_SPECIFIED'));
      this.goBack();
      return;
    }
    this.loadUserDetails();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUserDetails(): void {
    this.isLoading = true;
    this.usersService.getUserDetails(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.user = user;
          this.isLoading = false;
          this.loadRentTransactions();
        },
        error: (error) => {
          this.isLoading = false;
          if      (error.status === 404) this.toastr.error(this.translate.instant('NOTIFICATIONS.ADMIN_USER_NOT_FOUND'));
          else if (error.status === 403) this.toastr.error(this.translate.instant('NOTIFICATIONS.ADMIN_ACCESS_DENIED'));
          else                           this.toastr.error(this.translate.instant('NOTIFICATIONS.ADMIN_SERVER_ERROR'));
        }
      });
  }

  goBack(): void {
    const lang = this.languageUrlService.getCurrentLanguage();
    this.router.navigate([`/${lang}/admin/users`]);
  }

  refreshData(): void { this.loadUserDetails(); }

  // ── Transactions loyer en attente ─────────────────────────────────────────

  loadRentTransactions(): void {
    this.isLoadingRentTx = true;
    this.usersService.getPendingRentTransactions(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (txs) => {
          this.rentTransactions = txs;
          this.isLoadingRentTx  = false;
          this.rentTxLoaded     = true;
        },
        error: () => {
          this.isLoadingRentTx = false;
          this.rentTxLoaded    = true;
        }
      });
  }

  recheckTransaction(externalRef: string): void {
    this.recheckingRef = externalRef;
    this.usersService.recheckRentTransaction(externalRef)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.recheckingRef = null;
          if (result.status === 'SUCCESS') {
            this.toastr.success(this.translate.instant('NOTIFICATIONS.ADMIN_PAYMENT_CONFIRMED_BY_PROVIDER'));
            this.loadUserDetails();
          } else {
            this.toastr.info(result.message);
            this.loadRentTransactions();
          }
        },
        error: (e) => {
          this.recheckingRef = null;
          this.toastr.error(e?.error?.message || this.translate.instant('NOTIFICATIONS.ADMIN_VERIFY_ERROR'));
        }
      });
  }

  openConfirmModal(externalRef: string): void {
    const tx = this.rentTransactions.find(t => t.externalRef === externalRef);
    this.pendingConfirmRef = externalRef;
    this.pendingConfirmContext = tx?.context || null;
    this.adminNote = '';
    this.showConfirmModal = true;
  }

  cancelConfirmModal(): void {
    this.showConfirmModal = false;
    this.pendingConfirmRef = null;
    this.pendingConfirmContext = null;
    this.adminNote = '';
  }

  confirmTransaction(): void {
    if (!this.pendingConfirmRef || (this.adminNote || '').trim().length < 10) return;
    const ref = this.pendingConfirmRef;
    this.confirmingRef = ref;
    this.showConfirmModal = false;

    this.usersService.confirmRentTransaction(ref, this.adminNote.trim())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.confirmingRef = null;
          this.pendingConfirmRef = null;
          this.toastr.success(this.translate.instant('NOTIFICATIONS.ADMIN_PAYMENT_CONFIRMED'));
          this.loadUserDetails();
        },
        error: (e) => {
          this.confirmingRef = null;
          this.toastr.error(e?.error?.message || this.translate.instant('NOTIFICATIONS.ADMIN_CONFIRM_ERROR'));
        }
      });
  }

  // ── Actions souscription ──────────────────────────────────────────────────

  suspendAccount(): void {
    if (!this.user?.subscription) return;
    this.suspendReason = '';
    this.showSuspendModal = true;
  }

  confirmSuspend(): void {
    if (this.suspendReason.trim().length < 10 || !this.user?.subscription) return;
    this.showSuspendModal = false;
    this.subscriptionsService.suspendAccount(this.user.subscription._id, this.suspendReason.trim())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  () => { this.toastr.success(this.translate.instant('NOTIFICATIONS.ADMIN_ACCOUNT_SUSPENDED')); this.loadUserDetails(); },
        error: (e) => this.toastr.error(e?.error?.message || this.translate.instant('NOTIFICATIONS.ADMIN_SUSPEND_ERROR'))
      });
  }

  cancelSuspend(): void { this.showSuspendModal = false; this.suspendReason = ''; }

  reactivateAccount(): void {
    if (!this.user?.subscription) return;
    this.subscriptionsService.reactivateAccount(this.user.subscription._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  () => { this.toastr.success(this.translate.instant('NOTIFICATIONS.ADMIN_ACCOUNT_REACTIVATED')); this.loadUserDetails(); },
        error: (e) => this.toastr.error(e?.error?.message || this.translate.instant('NOTIFICATIONS.ADMIN_REACTIVATE_ERROR'))
      });
  }

  sendPaymentReminder(): void {
    if (!this.user?.subscription) return;
    this.subscriptionsService.sendPaymentReminder(this.user.subscription._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  () => this.toastr.success(this.translate.instant('NOTIFICATIONS.ADMIN_PAYMENT_REMINDER_SENT')),
        error: (e) => this.toastr.error(e?.error?.message || this.translate.instant('NOTIFICATIONS.ADMIN_REMINDER_ERROR'))
      });
  }

  /**
   * Ouvre le modal markAsPaid.
   * Utilise firstUnpaidPeriod (première période impayée) si currentPeriod est null.
   */
  markAsPaid(): void {
    if (!this.user?.subscription) return;

    // Priorité : firstUnpaidPeriod > currentPeriod (si impayée)
    const unpaidPeriod = this.user.subscription.firstUnpaidPeriod
      || (this.user.subscription.currentPeriod?.state === 'unpaid' ? this.user.subscription.currentPeriod : null);

    if (!unpaidPeriod) {
      this.toastr.warning(this.translate.instant('NOTIFICATIONS.ADMIN_NO_UNPAID_PERIOD'));
      return;
    }

    this.selectedPeriodId = unpaidPeriod._id;
    this.paymentRef = '';
    this.showMarkPaidModal = true;
  }

  /** Une référence vérifiable (reçu, virement, transaction) est obligatoire : elle est journalisée. */
  get paymentRefValid(): boolean {
    return this.paymentRef.trim().length >= 3;
  }

  confirmMarkPaid(): void {
    if (!this.user?.subscription || !this.selectedPeriodId || !this.paymentRefValid) return;
    const ref = this.paymentRef.trim();
    this.showMarkPaidModal = false;
    this.isMarkingPaid = true;

    this.subscriptionsService.markPaymentAsPaid(this.user.subscription._id, this.selectedPeriodId, ref)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastr.success(this.translate.instant('NOTIFICATIONS.ADMIN_PAYMENT_MARKED_PAID'));
          this.isMarkingPaid = false;
          this.selectedPeriodId = null;
          this.loadUserDetails();
        },
        error: (e) => {
          this.toastr.error(e?.error?.message || this.translate.instant('NOTIFICATIONS.ADMIN_MARK_PAID_ERROR'));
          this.isMarkingPaid = false;
        }
      });
  }

  cancelMarkPaid(): void {
    this.showMarkPaidModal = false;
    this.paymentRef = '';
    this.selectedPeriodId = null;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getUserDisplayName(): string {
    if (!this.user) return '';
    const full = `${this.user.firstName} ${this.user.lastName}`.trim();
    return full || this.user.name || this.user.email;
  }

  getPlanBadgeClass(plan?: string, tier?: string | null): string {
    if (tier === 'GOLD') return 'admin-badge admin-badge-warning';
    if (tier && tier !== 'FREE') return 'admin-badge admin-badge-success';
    return plan === 'premium' ? 'admin-badge admin-badge-success'
      : plan === 'trial'   ? 'admin-badge admin-badge-info'
        : 'admin-badge admin-badge-secondary';
  }

  getPlanLabel(plan?: string, tier?: string | null): string {
    if (plan === 'trial' && !tier) return 'Essai';
    return tierLabel(tier, plan, this.translate.currentLang);
  }

  getStatusBadgeClass(status?: string): string {
    const map: Record<string, string> = {
      active:    'admin-badge admin-badge-success',
      suspended: 'admin-badge admin-badge-warning',
      disabled:  'admin-badge admin-badge-danger'
    };
    return map[status || ''] || 'admin-badge admin-badge-secondary';
  }

  getStatusLabel(status?: string): string {
    return ['active', 'suspended', 'disabled'].includes(status || '')
      ? this.translate.instant(`ADMIN.USER_DETAILS.TS.ACCOUNT_${status}`)
      : this.translate.instant('ADMIN.USER_DETAILS.TS.UNKNOWN');
  }

  getUserStatusLabel(status?: string): string {
    return ['active', 'inactive', 'suspended', 'banned', 'disabled'].includes(status || '')
      ? this.translate.instant(`ADMIN.USER_DETAILS.TS.USER_${status}`)
      : status || this.translate.instant('ADMIN.USER_DETAILS.TS.UNKNOWN');
  }

  getUserStatusClass(status?: string): string {
    const map: Record<string, string> = {
      active:    'admin-badge admin-badge-success',
      inactive:  'admin-badge admin-badge-secondary',
      suspended: 'admin-badge admin-badge-warning',
      banned:    'admin-badge admin-badge-danger',
      disabled:  'admin-badge admin-badge-danger'
    };
    return map[status || ''] || 'admin-badge admin-badge-secondary';
  }

  getPeriodStateLabel(state: string): string {
    return ['payed', 'unpaid', 'waiting', 'should_not_payed'].includes(state)
      ? this.translate.instant(`ADMIN.USER_DETAILS.TS.PERIOD_${state}`)
      : state;
  }

  getPeriodStateClass(state: string): string {
    const map: Record<string, string> = {
      payed:            'admin-badge admin-badge-success',
      unpaid:           'admin-badge admin-badge-danger',
      waiting:          'admin-badge admin-badge-warning',
      should_not_payed: 'admin-badge admin-badge-secondary'
    };
    return map[state] || 'admin-badge admin-badge-secondary';
  }

  formatCurrency(amount: number): string {
    return this.currencyService.format(amount);
  }

  get displayCurrency(): string {
    return this.currencyService.currency;
  }

  formatDate(date: any): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString(this.locale, {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  }

  formatDateShort(date: any): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString(this.locale, { year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  private get locale(): string {
    return this.translate.currentLang === 'en' ? 'en-GB' : 'fr-FR';
  }

  getOccupancyClass(rate: number): string {
    if (rate >= 85) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }

  getTxStatusLabel(status: string): string {
    return ['PENDING', 'FAILED', 'SUCCESS', 'CANCELLED', 'EXPIRED'].includes(status)
      ? this.translate.instant(`ADMIN.USER_DETAILS.TS.TX_${status}`)
      : status;
  }

  getTxStatusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING:   'admin-badge admin-badge-warning',
      FAILED:    'admin-badge admin-badge-danger',
      SUCCESS:   'admin-badge admin-badge-success',
      CANCELLED: 'admin-badge admin-badge-secondary',
      EXPIRED:   'admin-badge admin-badge-secondary'
    };
    return map[status] || 'admin-badge admin-badge-secondary';
  }

  getTxContextLabel(context: string): string {
    return context === 'RENT' ? '🏠 Loyer' : '💳 Souscription';
  }

  getTxContextClass(context: string): string {
    return context === 'RENT' ? 'admin-badge admin-badge-info' : 'admin-badge admin-badge-secondary';
  }

  getProviderLabel(provider: string): string {
    const map: Record<string, string> = {
      MTN: 'MTN Money', ORANGE: 'Orange Money',
      EASY_TRANSACT: 'EasyTransact', STRIPE: 'Stripe'
    };
    return map[provider] || provider;
  }

  isRecheckingTx(ref: string): boolean { return this.recheckingRef === ref; }
  isConfirmingTx(ref: string): boolean { return this.confirmingRef === ref; }
  isTxBusy(ref: string): boolean { return this.isRecheckingTx(ref) || this.isConfirmingTx(ref); }

  // ── Modal détail transaction ──────────────────────────────────────────────────────────────────

  openTxDetail(tx: RentTransaction): void {
    this.selectedTx = tx;
    this.showTxDetailModal = true;
  }

  closeTxDetail(): void {
    this.showTxDetailModal = false;
    this.selectedTx = null;
  }

  // ── Modal suppression transaction ────────────────────────────────────────────────────────────

  openDeleteTxModal(externalRef: string): void {
    this.pendingDeleteRef = externalRef;
    this.showDeleteTxModal = true;
  }

  cancelDeleteTx(): void {
    this.showDeleteTxModal = false;
    this.pendingDeleteRef = null;
  }

  confirmDeleteTx(): void {
    if (!this.pendingDeleteRef) return;
    const ref = this.pendingDeleteRef;
    this.isDeletingTx = true;
    this.showDeleteTxModal = false;

    this.usersService.deleteRentTransaction(ref)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isDeletingTx = false;
          this.pendingDeleteRef = null;
          this.toastr.success(this.translate.instant('NOTIFICATIONS.ADMIN_TX_DELETED'));
          this.rentTransactions = this.rentTransactions.filter(t => t.externalRef !== ref);
        },
        error: (e) => {
          this.isDeletingTx = false;
          this.toastr.error(e?.error?.message || this.translate.instant('NOTIFICATIONS.ADMIN_DELETE_ERROR'));
        }
      });
  }

  isDeletingThisTx(ref: string): boolean { return this.isDeletingTx && this.pendingDeleteRef === ref; }

  canDeleteTx(status: string): boolean {
    return ['FAILED', 'CANCELLED', 'EXPIRED'].includes(status);
  }
}