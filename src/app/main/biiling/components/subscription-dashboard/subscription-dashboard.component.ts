import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store, Select } from '@ngxs/store';
import { Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  SouscriptionState,
  SouscriptionAction,
  SouscriptionModel,
  SouscriptionPeriodState,
  SouscriptionPeriodModel,
  SouscriptionPlan,
  SouscriptionPayementState
} from 'src/app/shared/store';

@Component({
  selector: 'app-subscription-dashboard',
  templateUrl: './subscription-dashboard.component.html',
  styleUrls: ['./subscription-dashboard.component.scss']
})
export class SubscriptionDashboardComponent implements OnInit, OnDestroy {
  
  private destroy$ = new Subject<void>();

  @Select(SouscriptionState.selectCurrentSubscription) currentSubscription$: Observable<SouscriptionModel | null>;
  @Select(SouscriptionState.selectSubscriptionHistory) subscriptionHistory$: Observable<SouscriptionModel[]>;
  @Select(SouscriptionState.selectLoadingHistory) loadingHistory$: Observable<boolean>;
  @Select(SouscriptionState.selectStateLoading) loading$: Observable<boolean>;

  currentSubscription: SouscriptionModel | null = null;
  subscriptionHistory: SouscriptionModel[] = [];
  currentPeriod: SouscriptionPeriodModel | null = null;
  loading = true;
  loadingHistory = false;

  constructor(
    private store: Store,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.setupSubscriptions();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSubscriptions(): void {
    // Observer la souscription actuelle
    this.currentSubscription$.pipe(takeUntil(this.destroy$)).subscribe(subscription => {
      this.currentSubscription = subscription;
      if (subscription?.currentPeriod) {
        this.loadCurrentPeriod(subscription.currentPeriod);
      }
    });

    // Observer l'historique
    this.subscriptionHistory$.pipe(takeUntil(this.destroy$)).subscribe(history => {
      this.subscriptionHistory = history || [];
    });

    // Observer les états de chargement
    this.loading$.pipe(takeUntil(this.destroy$)).subscribe(loading => {
      this.loading = loading;
    });

    this.loadingHistory$.pipe(takeUntil(this.destroy$)).subscribe(loading => {
      this.loadingHistory = loading;
    });
  }

  private loadCurrentPeriod(periodId: string): void {
    this.store.select(SouscriptionPeriodState.selectStateSouscriptionPeriod(periodId))
      .pipe(takeUntil(this.destroy$))
      .subscribe(period => {
        this.currentPeriod = period;
      });
  }

  private loadData(): void {
    // D'abord essayer de charger la souscription actuelle
    this.store.dispatch(new SouscriptionAction.FetchCurrentSubscription());
    this.store.dispatch(new SouscriptionAction.FetchSubscriptionHistory());

    // Si pas de souscription actuelle, essayer de charger depuis l'état existant
    const existingSubscription = this.store.selectSnapshot(SouscriptionState.selectStatePeriodDefaultWithRunningState);
    if (existingSubscription && !this.currentSubscription) {
      this.currentSubscription = existingSubscription;
      if (existingSubscription.currentPeriod) {
        this.loadCurrentPeriod(existingSubscription.currentPeriod);
      }
    }
  }

  // Méthodes utilitaires pour les templates
  getPlanLabel(plan: SouscriptionPlan): string {
    const labels = {
      [SouscriptionPlan.FREE]: 'Gratuit',
      [SouscriptionPlan.PREMIUM]: 'Premium'
    };
    return labels[plan] || plan;
  }

  getAccountStatusLabel(status: string): string {
    const labels = {
      'ACTIVE': 'Actif',
      'SUSPENDED': 'Suspendu',
      'CANCELLED': 'Annulé'
    };
    return labels[status] || status;
  }

  getAccountStatusColor(status: string): string {
    const colors = {
      'ACTIVE': 'success',
      'SUSPENDED': 'warning',
      'CANCELLED': 'danger'
    };
    return colors[status] || 'secondary';
  }

  getPeriodStatusLabel(period: SouscriptionPeriodModel): string {
    if (!period) return 'N/A';

    if (period.state === SouscriptionPayementState.PAYED) return 'Payé';
    if (period.state === SouscriptionPayementState.UNPAYED) return 'En retard';
    return 'En attente';
  }

  getPeriodStatusColor(period: SouscriptionPeriodModel): string {
    if (!period) return 'secondary';

    if (period.state === SouscriptionPayementState.PAYED) return 'success';
    if (period.state === SouscriptionPayementState.UNPAYED) return 'danger';
    return 'warning';
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
      month: 'long',
      day: 'numeric'
    });
  }

  formatDateShort(date: any): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  // Actions
  refreshData(): void {
    this.loadData();
  }

  payCurrentPeriod(): void {
    if (this.currentPeriod) {
      // TODO: Implémenter le paiement
      console.log('Payer la période:', this.currentPeriod._id);
    }
  }

  upgradeToPremium(): void {
    // Rediriger vers la page de choix de plan existante
    this.router.navigate(['/app/facturation/choix-plan']);
  }

  downloadInvoice(periodId: string): void {
    // TODO: Implémenter le téléchargement de facture
    console.log('Télécharger facture:', periodId);
  }

  // Calculs
  getDaysUntilDue(): number {
    if (!this.currentPeriod?.endedAt) return 0;
    
    const today = new Date();
    const dueDate = new Date(this.currentPeriod.endedAt);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }

  getProgressPercentage(): number {
    if (!this.currentPeriod) return 0;
    
    const start = new Date(this.currentPeriod.startedAt);
    const end = new Date(this.currentPeriod.endedAt);
    const now = new Date();
    
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  }

  getTotalUnpaidAmount(): number {
    return this.subscriptionHistory
      .flatMap(sub => sub.periods || [])
      .filter(period => period.state !== SouscriptionPayementState.PAYED)
      .reduce((total, period) => total + (period.calculatedAmount || 0), 0);
  }

  getUnpaidPeriodsCount(): number {
    return this.subscriptionHistory
      .flatMap(sub => sub.periods || [])
      .filter(period => period.state !== SouscriptionPayementState.PAYED).length;
  }
}
