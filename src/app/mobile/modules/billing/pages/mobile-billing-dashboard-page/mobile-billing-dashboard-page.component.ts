import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { Store } from '@ngxs/store';
import { Observable, Subject, combineLatest } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';

// Store
import { 
  SouscriptionState, 
  SouscriptionAction,
  StatisticState,
  StatisticAction,
  SouscriptionModel 
} from '../../../../../shared/store';
import { MobileNotificationService } from '../../../../shared/services/mobile-notification.service';
import { MobileCacheService } from '../../../../shared/services/mobile-cache.service';

export interface BillingStats {
  currentMonthRevenue: number;
  pendingPayments: number;
  totalInvoices: number;
  subscriptionStatus: string;
  occupancyRate: number;
  nextPaymentDate: Date | null;
}

@Component({
  selector: 'app-mobile-billing-dashboard-page',
  templateUrl: './mobile-billing-dashboard-page.component.html',
  styleUrls: ['./mobile-billing-dashboard-page.component.scss']
})
export class MobileBillingDashboardPageComponent implements OnInit, OnDestroy {
  @ViewChild(IonContent, { static: false }) content!: IonContent;

  private destroy$ = new Subject<void>();

  // Observables du store
  subscriptions$ = this.store.select(SouscriptionState.selectStateSouscriptions);
  currentSubscription$ = this.store.select(SouscriptionState.selectCurrentSubscription);
  isLoading$ = this.store.select(SouscriptionState.selectStateSouscriptions); // Pas de sélecteur loading disponible
  
  // Statistiques financières
  billingStats: BillingStats = {
    currentMonthRevenue: 0,
    pendingPayments: 0,
    totalInvoices: 0,
    subscriptionStatus: 'unknown',
    occupancyRate: 0,
    nextPaymentDate: null
  };

  // Actions rapides
  quickActions = [
    {
      title: 'Factures',
      subtitle: 'Gérer les factures',
      icon: 'receipt',
      color: 'primary',
      route: '/mobile/billing/invoices',
      badge: 0
    },
    {
      title: 'Paiements',
      subtitle: 'Historique des paiements',
      icon: 'card',
      color: 'success',
      route: '/mobile/billing/payments',
      badge: 0
    },
    {
      title: 'Abonnement',
      subtitle: 'Gérer l\'abonnement',
      icon: 'diamond',
      color: 'warning',
      route: '/mobile/billing/subscription',
      badge: 0
    },
    {
      title: 'Rapports',
      subtitle: 'Analyses financières',
      icon: 'stats-chart',
      color: 'tertiary',
      route: '/mobile/billing/reports',
      badge: 0
    }
  ];

  constructor(
    private store: Store,
    private router: Router,
    private notificationService: MobileNotificationService,
    private cacheService: MobileCacheService
  ) {}

  ngOnInit(): void {
    this.loadBillingData();
    this.setupSubscriptions();
    this.loadCachedData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charger les données de facturation
   */
  private loadBillingData(): void {
    const currentYear = new Date().getFullYear();
    
    // Charger les abonnements
    // TODO: Implémenter FetchSouscriptions ou utiliser FetchSouscription
    // this.store.dispatch(new SouscriptionAction.FetchSouscription());
    
    // Charger les statistiques financières
    this.store.dispatch(
      new StatisticAction.FetchStatisticPaymentRecapitulationAccountOfAllPropertyByYear(currentYear)
    );
  }

  /**
   * Configurer les abonnements
   */
  private setupSubscriptions(): void {
    // Combiner les données pour calculer les statistiques
    combineLatest([
      this.subscriptions$,
      this.currentSubscription$,
      // TODO: Vérifier le bon sélecteur pour les statistiques
      this.store.select(state => state) // Sélecteur temporaire
    ])
    .pipe(
      takeUntil(this.destroy$),
      map(([subscriptions, currentSubscription, paymentStats]) => {
        return this.calculateBillingStats(subscriptions, currentSubscription, paymentStats);
      })
    )
    .subscribe(stats => {
      this.billingStats = stats;
      this.updateQuickActionsBadges();
      this.cacheBillingStats(stats);
    });
  }

  /**
   * Charger les données mises en cache
   */
  private async loadCachedData(): Promise<void> {
    try {
      const cachedStats = await this.cacheService.get<BillingStats>('billing_stats');
      if (cachedStats) {
        this.billingStats = cachedStats;
        this.updateQuickActionsBadges();
        console.log('📦 Statistiques de facturation chargées depuis le cache');
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement du cache:', error);
    }
  }

  /**
   * Mettre en cache les statistiques
   */
  private async cacheBillingStats(stats: BillingStats): Promise<void> {
    try {
      await this.cacheService.set('billing_stats', stats, 15 * 60 * 1000); // 15 minutes
    } catch (error) {
      console.error('❌ Erreur lors de la mise en cache:', error);
    }
  }

  /**
   * Calculer les statistiques de facturation
   */
  private calculateBillingStats(
    subscriptions: SouscriptionModel[] | null,
    currentSubscription: SouscriptionModel | null,
    paymentStats: any
  ): BillingStats {
    const stats: BillingStats = {
      currentMonthRevenue: 0,
      pendingPayments: 0,
      totalInvoices: 0,
      subscriptionStatus: 'unknown',
      occupancyRate: 0,
      nextPaymentDate: null
    };

    // Calculer le revenu du mois actuel
    if (paymentStats && paymentStats.monthlyRevenue) {
      stats.currentMonthRevenue = paymentStats.monthlyRevenue;
    }

    // Calculer les paiements en attente
    if (paymentStats && paymentStats.pendingPayments) {
      stats.pendingPayments = paymentStats.pendingPayments;
    }

    // Calculer le nombre total de factures
    if (paymentStats && paymentStats.totalInvoices) {
      stats.totalInvoices = paymentStats.totalInvoices;
    }

    // Statut de l'abonnement
    if (currentSubscription) {
      stats.subscriptionStatus = this.getSubscriptionStatus(currentSubscription);
      stats.nextPaymentDate = this.getNextPaymentDate(currentSubscription);
    }

    // Taux d'occupation
    if (paymentStats && paymentStats.occupancyRate) {
      stats.occupancyRate = paymentStats.occupancyRate;
    }

    return stats;
  }

  /**
   * Obtenir le statut de l'abonnement
   */
  private getSubscriptionStatus(subscription: SouscriptionModel): string {
    if (!subscription.endedAt) return 'active';

    const now = new Date();
    const endDate = new Date(subscription.endedAt);

    if (now > endDate) return 'expired';
    // TODO: Vérifier la propriété correcte pour isPaid
    // if (subscription.isPaid) return 'active';
    return 'pending';
  }

  /**
   * Obtenir la prochaine date de paiement
   */
  private getNextPaymentDate(subscription: SouscriptionModel): Date | null {
    if (!subscription.endedAt) return null;

    const endDate = new Date(subscription.endedAt);
    const nextMonth = new Date(endDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    return nextMonth;
  }

  /**
   * Mettre à jour les badges des actions rapides
   */
  private updateQuickActionsBadges(): void {
    // Mettre à jour les badges selon les données
    this.quickActions[0].badge = this.billingStats.totalInvoices; // Factures
    this.quickActions[1].badge = this.billingStats.pendingPayments; // Paiements
    
    // Badge pour l'abonnement si expiré ou en attente
    if (this.billingStats.subscriptionStatus === 'expired' || 
        this.billingStats.subscriptionStatus === 'pending') {
      this.quickActions[2].badge = 1;
    } else {
      this.quickActions[2].badge = 0;
    }
  }

  /**
   * Rafraîchir les données
   */
  async onRefresh(event: any): Promise<void> {
    try {
      this.loadBillingData();
      
      setTimeout(() => {
        event.target.complete();
        this.notificationService.showSuccess('Données actualisées');
      }, 1000);
    } catch (error) {
      event.target.complete();
      this.notificationService.showError('Erreur lors de l\'actualisation');
    }
  }

  /**
   * Naviguer vers une action rapide
   */
  navigateToAction(action: any): void {
    this.router.navigate([action.route]);
  }

  /**
   * Formater le prix
   */
  formatPrice(price: number): string {
    if (!price) return '0 FCFA';
    
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  /**
   * Formater la date
   */
  formatDate(date: Date | null): string {
    if (!date) return 'Non définie';
    
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }



  /**
   * Obtenir la couleur du taux d'occupation
   */
  getOccupancyColor(): string {
    const rate = this.billingStats.occupancyRate;

    if (rate >= 80) return 'success';
    if (rate >= 50) return 'warning';
    return 'danger';
  }

  /**
   * Méthodes pour le template
   */
  getTotalProperties(): number {
    return 5; // Simulation - à remplacer par les vraies données
  }

  getOccupiedUnits(): number {
    return 12; // Simulation - à remplacer par les vraies données
  }

  getMonthlyRevenue(): number {
    return 850000; // Simulation - à remplacer par les vraies données
  }

  getSubscriptionStatusColor(subscription: SouscriptionModel): string {
    const status = this.getSubscriptionStatus(subscription);
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'expired': return 'danger';
      default: return 'medium';
    }
  }

  getSubscriptionStatusLabel(subscription: SouscriptionModel): string {
    const status = this.getSubscriptionStatus(subscription);
    switch (status) {
      case 'active': return 'Actif';
      case 'pending': return 'En attente';
      case 'expired': return 'Expiré';
      default: return 'Inconnu';
    }
  }

  refreshData(): void {
    this.loadBillingData();
  }

  viewInvoices(): void {
    this.router.navigate(['/mobile/billing/invoices']);
  }

  viewPayments(): void {
    this.router.navigate(['/mobile/billing/payments']);
  }

  manageSubscription(): void {
    this.router.navigate(['/mobile/billing/subscription']);
  }

  upgradeSubscription(): void {
    this.router.navigate(['/mobile/billing/subscription']);
  }
}
