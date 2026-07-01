import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { AdminUsersService } from '../../services/admin-users.service';
import { AdminSubscriptionsService } from '../../services/admin-subscriptions.service';
import { LanguageUrlService } from 'src/app/shared/services/language-url.service';

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
    propertyLimit: number;
    monthlyAmount: number;
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
  styleUrls: ['./user-details.component.scss']
})
export class UserDetailsComponent implements OnInit, OnDestroy {
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
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.userId = this.route.snapshot.params['id'];
    if (!this.userId) {
      this.toastr.error('Aucun utilisateur spécifié');
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
          if      (error.status === 404) this.toastr.error('Utilisateur non trouvé');
          else if (error.status === 403) this.toastr.error('Accès non autorisé');
          else                           this.toastr.error('Erreur de connexion au serveur');
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
            this.toastr.success('Paiement confirmé par le provider !');
            this.loadUserDetails();
          } else {
            this.toastr.info(result.message);
            this.loadRentTransactions();
          }
        },
        error: (e) => {
          this.recheckingRef = null;
          this.toastr.error(e?.error?.message || 'Erreur lors de la vérification');
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
    if (!this.pendingConfirmRef) return;
    const ref = this.pendingConfirmRef;
    this.confirmingRef = ref;
    this.showConfirmModal = false;

    this.usersService.confirmRentTransaction(ref, this.adminNote || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.confirmingRef = null;
          this.pendingConfirmRef = null;
          this.toastr.success('Paiement confirmé — LocationPayment créé et wallet crédité');
          this.loadUserDetails();
        },
        error: (e) => {
          this.confirmingRef = null;
          this.toastr.error(e?.error?.message || 'Erreur lors de la confirmation');
        }
      });
  }

  // ── Actions souscription ──────────────────────────────────────────────────

  upgradeToPremium(): void {
    if (!this.user?.subscription) return;
    this.subscriptionsService.forceUpgradeToPremium(this.user.subscription._id, 'Upgrade administratif')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  () => { this.toastr.success('Compte upgradé vers Premium'); this.loadUserDetails(); },
        error: (e) => this.toastr.error(e?.error?.message || 'Erreur lors de l\'upgrade')
      });
  }

  suspendAccount(): void {
    if (!this.user?.subscription) return;
    this.suspendReason = '';
    this.showSuspendModal = true;
  }

  confirmSuspend(): void {
    if (!this.suspendReason.trim() || !this.user?.subscription) return;
    this.showSuspendModal = false;
    this.subscriptionsService.suspendAccount(this.user.subscription._id, this.suspendReason)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  () => { this.toastr.success('Compte suspendu'); this.loadUserDetails(); },
        error: (e) => this.toastr.error(e?.error?.message || 'Erreur lors de la suspension')
      });
  }

  cancelSuspend(): void { this.showSuspendModal = false; this.suspendReason = ''; }

  reactivateAccount(): void {
    if (!this.user?.subscription) return;
    this.subscriptionsService.reactivateAccount(this.user.subscription._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  () => { this.toastr.success('Compte réactivé'); this.loadUserDetails(); },
        error: (e) => this.toastr.error(e?.error?.message || 'Erreur lors de la réactivation')
      });
  }

  sendPaymentReminder(): void {
    if (!this.user?.subscription) return;
    this.subscriptionsService.sendPaymentReminder(this.user.subscription._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  () => this.toastr.success('Rappel de paiement envoyé'),
        error: (e) => this.toastr.error(e?.error?.message || 'Erreur lors de l\'envoi du rappel')
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
      this.toastr.warning('Aucune période impayée trouvée');
      return;
    }

    this.selectedPeriodId = unpaidPeriod._id;
    this.paymentRef = '';
    this.showMarkPaidModal = true;
  }

  confirmMarkPaid(): void {
    if (!this.user?.subscription || !this.selectedPeriodId) return;
    const ref = this.paymentRef.trim() || 'ADMIN_MANUAL';
    this.showMarkPaidModal = false;
    this.isMarkingPaid = true;

    this.subscriptionsService.markPaymentAsPaid(this.user.subscription._id, this.selectedPeriodId, ref)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastr.success('Paiement marqué comme payé');
          this.isMarkingPaid = false;
          this.selectedPeriodId = null;
          this.loadUserDetails();
        },
        error: (e) => {
          this.toastr.error(e?.error?.message || 'Erreur lors du marquage du paiement');
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

  getPlanBadgeClass(plan?: string): string {
    return plan === 'premium' ? 'admin-badge admin-badge-success'
         : plan === 'trial'   ? 'admin-badge admin-badge-info'
         : 'admin-badge admin-badge-secondary';
  }

  getPlanLabel(plan?: string): string {
    const map: Record<string, string> = { premium: 'Premium', free: 'Gratuit', trial: 'Essai' };
    return map[plan || ''] || plan || 'Inconnu';
  }

  getStatusBadgeClass(status?: string): string {
    const map: Record<string, string> = {
      active:    'admin-badge admin-badge-success',
      suspended: 'admin-badge admin-badge-warning',
      disabled:  'admin-badge admin-badge-danger',
    };
    return map[status || ''] || 'admin-badge admin-badge-secondary';
  }

  getStatusLabel(status?: string): string {
    const map: Record<string, string> = { active: 'Actif', suspended: 'Suspendu', disabled: 'Désactivé' };
    return map[status || ''] || 'Inconnu';
  }

  getUserStatusLabel(status?: string): string {
    const map: Record<string, string> = {
      active:    'Actif',
      inactive:  'Inactif',
      suspended: 'Suspendu',
      banned:    'Banni',
      disabled:  'Désactivé',
    };
    return map[status || ''] || status || 'Inconnu';
  }

  getUserStatusClass(status?: string): string {
    const map: Record<string, string> = {
      active:    'admin-badge admin-badge-success',
      inactive:  'admin-badge admin-badge-secondary',
      suspended: 'admin-badge admin-badge-warning',
      banned:    'admin-badge admin-badge-danger',
      disabled:  'admin-badge admin-badge-danger',
    };
    return map[status || ''] || 'admin-badge admin-badge-secondary';
  }

  getPeriodStateLabel(state: string): string {
    const map: Record<string, string> = {
      payed:            '✅ Payé',
      unpaid:           '🔴 Impayé',
      waiting:          '⏳ En attente',
      should_not_payed: '⚪ Non applicable',
    };
    return map[state] || state;
  }

  getPeriodStateClass(state: string): string {
    const map: Record<string, string> = {
      payed:            'admin-badge admin-badge-success',
      unpaid:           'admin-badge admin-badge-danger',
      waiting:          'admin-badge admin-badge-warning',
      should_not_payed: 'admin-badge admin-badge-secondary',
    };
    return map[state] || 'admin-badge admin-badge-secondary';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency', currency: 'XAF', minimumFractionDigits: 0
    }).format(amount || 0);
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  }

  formatDateShort(date: any): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  getOccupancyClass(rate: number): string {
    if (rate >= 85) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }

  getTxStatusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING:   '⏳ En attente',
      FAILED:    '❌ Échoué',
      SUCCESS:   '✅ Réussi',
      CANCELLED: '⏹ Annulé',
      EXPIRED:   '⏰ Expiré',
    };
    return map[status] || status;
  }

  getTxStatusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING:   'admin-badge admin-badge-warning',
      FAILED:    'admin-badge admin-badge-danger',
      SUCCESS:   'admin-badge admin-badge-success',
      CANCELLED: 'admin-badge admin-badge-secondary',
      EXPIRED:   'admin-badge admin-badge-secondary',
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
      EASY_TRANSACT: 'EasyTransact', STRIPE: 'Stripe',
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
          this.toastr.success('Transaction supprimée');
          this.rentTransactions = this.rentTransactions.filter(t => t.externalRef !== ref);
        },
        error: (e) => {
          this.isDeletingTx = false;
          this.toastr.error(e?.error?.message || 'Erreur lors de la suppression');
        }
      });
  }

  isDeletingThisTx(ref: string): boolean { return this.isDeletingTx && this.pendingDeleteRef === ref; }

  canDeleteTx(status: string): boolean {
    return ['FAILED', 'CANCELLED', 'EXPIRED'].includes(status);
  }
}