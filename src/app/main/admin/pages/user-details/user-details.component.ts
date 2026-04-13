import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { AdminUsersService } from '../../services/admin-users.service';
import { AdminSubscriptionsService } from '../../services/admin-subscriptions.service';
import { LanguageUrlService } from 'src/app/shared/services/language-url.service';

interface UserDetails {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  userType: 'OWNER' | 'AGENT';
  createdAt: Date;
  isActive: boolean;
  subscription?: {
    _id: string;
    plan: 'free' | 'premium';
    accountStatus: 'active' | 'suspended' | 'disabled';
    propertyLimit: number;
    monthlyAmount: number;
    hasUnpaidInvoices: boolean;
    totalUnpaidAmount: number;
    unpaidInvoicesCount: number;
    lastPaymentDate?: Date;
    createdAt: Date;
    currentPeriod?: { _id: string; billingRef: string; state: string };
  };
  properties: {
    total: number;
    active: number;
    occupied: number;
    vacant: number;
    totalUnits: number;
    occupiedUnits: number;
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
  isLoading = true;
  userId: string;
  isMarkingPaid = false;

  // Modal state — remplace window.prompt()
  showSuspendModal = false;
  showMarkPaidModal = false;
  suspendReason = '';
  paymentRef = '';

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
        },
        error: (error) => {
          this.isLoading = false;
          if (error.status === 404) {
            this.toastr.error('Utilisateur non trouvé');
          } else if (error.status === 403) {
            this.toastr.error('Accès non autorisé');
          } else {
            this.toastr.error('Erreur de connexion au serveur');
          }
        }
      });
  }

  goBack(): void {
    const lang = this.languageUrlService.getCurrentLanguage();
    this.router.navigate([`/${lang}/admin/users`]);
  }

  upgradeToPremium(): void {
    if (!this.user?.subscription) return;
    const reason = 'Upgrade administratif';
    this.subscriptionsService.forceUpgradeToPremium(this.user.subscription._id, reason)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastr.success('Compte upgradé vers Premium');
          this.loadUserDetails();
        },
        error: () => this.toastr.error('Erreur lors de l\'upgrade')
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
        next: () => {
          this.toastr.success('Compte suspendu');
          this.loadUserDetails();
        },
        error: () => this.toastr.error('Erreur lors de la suspension')
      });
  }

  cancelSuspend(): void {
    this.showSuspendModal = false;
    this.suspendReason = '';
  }

  reactivateAccount(): void {
    if (!this.user?.subscription) return;
    this.subscriptionsService.reactivateAccount(this.user.subscription._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastr.success('Compte réactivé');
          this.loadUserDetails();
        },
        error: () => this.toastr.error('Erreur lors de la réactivation')
      });
  }

  sendPaymentReminder(): void {
    if (!this.user?.subscription) return;
    this.subscriptionsService.sendPaymentReminder(this.user.subscription._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.toastr.success('Rappel de paiement envoyé'),
        error: () => this.toastr.error('Erreur lors de l\'envoi du rappel')
      });
  }

  markAsPaid(): void {
    if (!this.user?.subscription) return;
    const periodId = this.user.subscription.currentPeriod?._id;
    if (!periodId) {
      this.toastr.warning('Aucune période en cours à marquer comme payée');
      return;
    }
    this.paymentRef = '';
    this.showMarkPaidModal = true;
  }

  confirmMarkPaid(): void {
    if (!this.user?.subscription) return;
    const periodId = this.user.subscription.currentPeriod?._id;
    if (!periodId) return;
    const ref = this.paymentRef.trim() || 'ADMIN_MANUAL';
    this.showMarkPaidModal = false;
    this.isMarkingPaid = true;
    this.subscriptionsService.markPaymentAsPaid(this.user.subscription._id, periodId, ref)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastr.success('Paiement marqué comme payé');
          this.isMarkingPaid = false;
          this.loadUserDetails();
        },
        error: () => {
          this.toastr.error('Erreur lors du marquage du paiement');
          this.isMarkingPaid = false;
        }
      });
  }

  cancelMarkPaid(): void {
    this.showMarkPaidModal = false;
    this.paymentRef = '';
  }

  refreshSubscription(): void {
    this.loadUserDetails();
  }

  // Helper methods
  getPlanBadgeClass(plan?: string): string {
    return plan === 'premium'
      ? 'admin-badge admin-badge-success'
      : 'admin-badge admin-badge-secondary';
  }

  getPlanLabel(plan?: string): string {
    return plan === 'premium' ? 'Premium' : 'Gratuit';
  }

  getStatusBadgeClass(status?: string): string {
    switch (status) {
      case 'active':    return 'admin-badge admin-badge-success';
      case 'suspended': return 'admin-badge admin-badge-warning';
      case 'disabled':  return 'admin-badge admin-badge-danger';
      default:          return 'admin-badge admin-badge-secondary';
    }
  }

  getStatusLabel(status?: string): string {
    switch (status) {
      case 'active':    return 'Actif';
      case 'suspended': return 'Suspendu';
      case 'disabled':  return 'Désactivé';
      default:          return 'Inconnu';
    }
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
}
