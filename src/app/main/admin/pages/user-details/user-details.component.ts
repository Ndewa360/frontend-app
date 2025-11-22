import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AdminUsersService } from '../../services/admin-users.service';
import { AdminSubscriptionsService } from '../../services/admin-subscriptions.service';

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private usersService: AdminUsersService,
    private subscriptionsService: AdminSubscriptionsService
  ) {}

  ngOnInit(): void {
    this.userId = this.route.snapshot.params['id'];
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
          console.error('Error loading user details:', error);
          this.isLoading = false;
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/main/admin/users']);
  }

  upgradeToPremium(): void {
    if (!this.user?.subscription) return;
    
    const reason = prompt('Raison de l\'upgrade:');
    if (reason !== null) {
      this.subscriptionsService.forceUpgradeToPremium(this.user.subscription._id, reason)
        .subscribe({
          next: () => {
            this.loadUserDetails();
          },
          error: (error) => {
            alert('Erreur lors de l\'upgrade: ' + error.message);
          }
        });
    }
  }

  suspendAccount(): void {
    if (!this.user?.subscription) return;
    
    const reason = prompt('Raison de la suspension:');
    if (reason) {
      this.subscriptionsService.suspendAccount(this.user.subscription._id, reason)
        .subscribe({
          next: () => {
            this.loadUserDetails();
          },
          error: (error) => {
            alert('Erreur lors de la suspension: ' + error.message);
          }
        });
    }
  }

  reactivateAccount(): void {
    if (!this.user?.subscription) return;
    
    if (confirm('Confirmer la réactivation du compte?')) {
      this.subscriptionsService.reactivateAccount(this.user.subscription._id)
        .subscribe({
          next: () => {
            this.loadUserDetails();
          },
          error: (error) => {
            alert('Erreur lors de la réactivation: ' + error.message);
          }
        });
    }
  }

  sendPaymentReminder(): void {
    if (!this.user?.subscription) return;
    
    this.subscriptionsService.sendPaymentReminder(this.user.subscription._id)
      .subscribe({
        next: () => {
          alert('Rappel de paiement envoyé avec succès');
        },
        error: (error) => {
          alert('Erreur lors de l\'envoi: ' + error.message);
        }
      });
  }

  markAsPaid(): void {
    alert('Fonctionnalité à implémenter');
  }

  refreshSubscription(): void {
    this.loadUserDetails();
  }

  // Helper methods
  getPlanBadgeClass(plan?: string): string {
    return plan === 'premium' 
      ? 'bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium' 
      : 'bg-gray-600 text-white px-3 py-1 rounded-full text-sm font-medium';
  }

  getPlanLabel(plan?: string): string {
    return plan === 'premium' ? 'Premium' : 'Gratuit';
  }

  getStatusBadgeClass(status?: string): string {
    switch (status) {
      case 'active': return 'bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium';
      case 'suspended': return 'bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium';
      case 'disabled': return 'bg-gray-600 text-white px-3 py-1 rounded-full text-sm font-medium';
      default: return 'bg-gray-400 text-white px-3 py-1 rounded-full text-sm font-medium';
    }
  }

  getStatusLabel(status?: string): string {
    switch (status) {
      case 'active': return 'Actif';
      case 'suspended': return 'Suspendu';
      case 'disabled': return 'Désactivé';
      default: return 'Inconnu';
    }
  }

  getPaymentStatusClass(): string {
    if (!this.user?.subscription) return 'bg-gray-100 border border-gray-300 rounded-lg p-4';
    return this.user.subscription.hasUnpaidInvoices 
      ? 'bg-red-50 border border-red-200 rounded-lg p-4' 
      : 'bg-green-50 border border-green-200 rounded-lg p-4';
  }

  getPaymentStatusIconColor(): string {
    if (!this.user?.subscription) return 'text-gray-500';
    return this.user.subscription.hasUnpaidInvoices ? 'text-red-500' : 'text-green-500';
  }

  getPaymentStatusTextColor(): string {
    if (!this.user?.subscription) return 'text-gray-700';
    return this.user.subscription.hasUnpaidInvoices ? 'text-red-700' : 'text-green-700';
  }

  getPaymentStatusSubtitleColor(): string {
    if (!this.user?.subscription) return 'text-gray-600';
    return this.user.subscription.hasUnpaidInvoices ? 'text-red-600' : 'text-green-600';
  }

  getPaymentStatusTitle(): string {
    if (!this.user?.subscription) return 'Statut inconnu';
    return this.user.subscription.hasUnpaidInvoices ? 'Paiements en retard' : 'Paiements à jour';
  }

  getPaymentStatusSubtitle(): string {
    if (!this.user?.subscription) return '';
    if (this.user.subscription.hasUnpaidInvoices) {
      return `${this.user.subscription.unpaidInvoicesCount} facture(s) impayée(s)`;
    }
    return this.user.subscription.lastPaymentDate 
      ? `Dernier paiement: ${this.formatDate(this.user.subscription.lastPaymentDate)}`
      : 'Aucun paiement requis';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount || 0);
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR');
  }
}