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
    
    console.log('🚀 [USER-DETAILS] Initialisation du composant');
    console.log('🆔 [USER-DETAILS] ID utilisateur depuis la route:', this.userId);
    
    if (!this.userId) {
      console.error('❌ [USER-DETAILS] Aucun ID utilisateur fourni dans la route');
      alert('Erreur: Aucun utilisateur spécifié');
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
    
    console.log('🔍 [USER-DETAILS] Chargement des détails utilisateur pour ID:', this.userId);
    console.log('🌐 [USER-DETAILS] URL API utilisée:', `${this.usersService['apiUrl']}/${this.userId}/details`);
    
    this.usersService.getUserDetails(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          console.log('✅ [USER-DETAILS] Données reçues du backend:', user);
          console.log('📊 [USER-DETAILS] Vérification des données:');
          console.log('  - ID utilisateur:', user?._id);
          console.log('  - Email:', user?.email);
          console.log('  - Nom complet:', `${user?.firstName} ${user?.lastName}`);
          console.log('  - Type utilisateur:', user?.userType);
          console.log('  - Date création:', user?.createdAt);
          console.log('  - Abonnement:', user?.subscription);
          console.log('  - Propriétés:', user?.properties);
          console.log('  - Résumé financier:', user?.financialSummary);
          
          // Vérification de l'intégrité des données
          if (!user || !user._id) {
            console.error('❌ [USER-DETAILS] Données utilisateur invalides ou manquantes');
            alert('Erreur: Données utilisateur invalides reçues du serveur');
            return;
          }
          
          if (user._id !== this.userId) {
            console.error('❌ [USER-DETAILS] Incohérence: ID demandé vs ID reçu', {
              requested: this.userId,
              received: user._id
            });
            alert('Erreur: Incohérence dans les données utilisateur');
            return;
          }
          
          // Vérification des données de test
          const isTestData = this.detectTestData(user);
          if (isTestData.isTest) {
            console.warn('⚠️ [USER-DETAILS] Données de test détectées:', isTestData.reasons);
          } else {
            console.log('✅ [USER-DETAILS] Données réelles confirmées');
          }
          
          console.log('✅ [USER-DETAILS] Validation des données réussie');
          this.user = user;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ [USER-DETAILS] Erreur lors du chargement:', error);
          console.error('📡 [USER-DETAILS] Détails de l\'erreur:', {
            status: error.status,
            message: error.message,
            url: error.url
          });
          this.isLoading = false;
          
          // Afficher un message d'erreur plus informatif
          if (error.status === 404) {
            alert('Utilisateur non trouvé');
          } else if (error.status === 403) {
            alert('Accès non autorisé');
          } else {
            alert('Erreur de connexion au serveur');
          }
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
  
  testBackendConnection(): void {
    console.log('🔍 [TEST] Test de connexion backend...');
    
    // Test simple de l'endpoint
    this.usersService.getUserDetails(this.userId)
      .subscribe({
        next: (response) => {
          console.log('✅ [TEST] Connexion backend réussie');
          console.log('📊 [TEST] Réponse brute:', response);
          alert('Connexion backend OK - Vérifiez la console pour les détails');
        },
        error: (error) => {
          console.error('❌ [TEST] Erreur de connexion:', error);
          alert(`Erreur backend: ${error.status} - ${error.message}`);
        }
      });
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
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  startTour(): void {
    console.log('Tour guidé - fonctionnalité à implémenter');
  }

  resetTour(): void {
    console.log('Reset tour - fonctionnalité à implémenter');
  }
  
  getApiUrl(): string {
    return this.usersService['apiUrl'] || 'URL non disponible';
  }
  
  getCurrentDate(): string {
    return this.formatDate(new Date());
  }
  
  private detectTestData(user: UserDetails): { isTest: boolean, reasons: string[] } {
    const reasons: string[] = [];
    
    // Vérifier les patterns de données de test
    const testPatterns = [
      { field: 'email', pattern: /test|demo|example|fake/i, value: user.email },
      { field: 'firstName', pattern: /test|demo|john|jane/i, value: user.firstName },
      { field: 'lastName', pattern: /test|demo|doe|smith/i, value: user.lastName },
      { field: 'phoneNumber', pattern: /^(123|000|555)/i, value: user.phoneNumber }
    ];
    
    testPatterns.forEach(({ field, pattern, value }) => {
      if (value && pattern.test(value)) {
        reasons.push(`${field}: ${value} correspond à un pattern de test`);
      }
    });
    
    // Vérifier les valeurs suspectes
    if (user.properties?.total === 0 && user.financialSummary?.totalRevenue === 0) {
      reasons.push('Aucune propriété ni revenus (possiblement des données vides)');
    }
    
    // Vérifier les dates suspectes
    const createdAt = new Date(user.createdAt);
    const now = new Date();
    const daysDiff = (now.getTime() - createdAt.getTime()) / (1000 * 3600 * 24);
    
    if (daysDiff < 1) {
      reasons.push('Compte créé très récemment (moins de 24h)');
    }
    
    return {
      isTest: reasons.length > 0,
      reasons
    };
  }
  
  getDataValidationClass(): string {
    if (!this.user) return 'text-gray-500';
    const validation = this.detectTestData(this.user);
    return validation.isTest ? 'text-orange-600 font-semibold' : 'text-green-600 font-semibold';
  }
  
  getDataValidationMessage(): string {
    if (!this.user) return 'En attente...';
    const validation = this.detectTestData(this.user);
    return validation.isTest 
      ? `⚠️ Données potentiellement de test (${validation.reasons.length} indicateurs)`
      : '✅ Données réelles confirmées';
  }
  
  // Méthode pour afficher les détails de validation
  showValidationDetails(): void {
    if (!this.user) return;
    
    const validation = this.detectTestData(this.user);
    const message = validation.isTest 
      ? `Indicateurs de données de test détectés:\n${validation.reasons.join('\n')}`
      : 'Aucun indicateur de données de test détecté. Les données semblent authentiques.';
    
    alert(message);
  }
}