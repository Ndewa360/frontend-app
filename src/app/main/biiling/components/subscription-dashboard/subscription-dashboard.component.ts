import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store, Select } from '@ngxs/store';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import {
  SouscriptionState,
  SouscriptionAction,
  SouscriptionModel,
  SouscriptionPeriodState,
  SouscriptionPeriodAction,
  SouscriptionPeriodModel,
  SouscriptionPlan,
  SouscriptionPayementState,
} from 'src/app/shared/store';
import { SubscriptionPaymentState, SubscriptionPaymentAction } from 'src/app/shared/store/subscription-payment';
import { SubscriptionLimitAction } from 'src/app/shared/store/subscription-limit';
import { PaymentSessionService } from 'src/app/shared/services/payment-session.service';
import { UserProfileState } from 'src/app/shared/store/user-profile';
import { InvoiceDownloadService } from 'src/app/shared/services/invoice-download.service';

@Component({
  selector: 'app-subscription-dashboard',
  templateUrl: './subscription-dashboard.component.html',
  styleUrls: ['./subscription-dashboard.component.scss']
})
export class SubscriptionDashboardComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();
  private lang = 'fr';

  @Select(SouscriptionState.selectCurrentSubscription) currentSubscription$: Observable<SouscriptionModel | null>;
  @Select(SouscriptionState.selectSubscriptionHistory) subscriptionHistory$: Observable<SouscriptionModel[]>;
  @Select(SouscriptionState.selectLoadingHistory) loadingHistory$: Observable<boolean>;
  @Select(SouscriptionState.selectStateLoading) loading$: Observable<boolean>;
  @Select(SubscriptionPaymentState.selectStripeLoading) stripeLoading$: Observable<boolean>;
  @Select(SubscriptionPaymentState.selectStripeError) stripeError$: Observable<string | null>;
  @Select(SubscriptionPaymentState.selectStripeSession) stripeSession$: Observable<any>;
  @Select(SubscriptionPaymentState.selectPaymentHistory) paymentHistory$: Observable<any>;
  @Select(SubscriptionPaymentState.selectUnpaidInvoices) unpaidInvoices$: Observable<any[]>;

  currentSubscription: SouscriptionModel | null = null;
  subscriptionHistory: SouscriptionModel[] = [];
  currentPeriod: SouscriptionPeriodModel | null = null;
  loading = true;
  loadingHistory = false;
  stripeLoading = false;
  stripeError: string | null = null;
  stripeSession: any = null;

  constructor(
    private store: Store,
    private router: Router,
    private route: ActivatedRoute,
    private paymentSessionService: PaymentSessionService,
    private invoiceDownloadService: InvoiceDownloadService,
  ) {}

  ngOnInit(): void {
    this.lang = window.location.pathname.split('/')[1] || 'fr';
    this.setupSubscriptions();
    this.loadData();
    this.handlePaymentCallback();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Chargement de toutes les données ─────────────────────────────────────

  private loadData(): void {
    this.store.dispatch(new SouscriptionAction.FetchCurrentSubscription());
    this.store.dispatch(new SouscriptionAction.FetchSubscriptionHistory());
    // FetchCurrentPeriodWithDetails appelle GET /souscription-period/current-with-details
    // qui recalcule les montants en temps reel depuis les locations reelles
    this.store.dispatch(new SouscriptionPeriodAction.FetchCurrentPeriodWithDetails());
    this.store.dispatch(new SubscriptionPaymentAction.GetPaymentHistory());
    this.store.dispatch(new SubscriptionPaymentAction.GetUnpaidInvoices());
    this.store.dispatch(new SubscriptionPaymentAction.GetPaymentStatus());
    this.store.dispatch(new SubscriptionLimitAction.GetSubscriptionStatus());
  }

  private setupSubscriptions(): void {
    this.currentSubscription$.pipe(takeUntil(this.destroy$)).subscribe(subscription => {
      this.currentSubscription = subscription;
    });

    // Lire la periode depuis selectCurrentPeriodWithDetails
    // alimentee par FetchCurrentPeriodWithDetails qui recalcule en temps reel
    this.store.select(SouscriptionPeriodState.selectCurrentPeriodWithDetails)
      .pipe(takeUntil(this.destroy$), filter(p => !!p))
      .subscribe(period => { this.currentPeriod = period; });

    this.subscriptionHistory$.pipe(takeUntil(this.destroy$)).subscribe(history => {
      this.subscriptionHistory = history || [];
    });

    this.loading$.pipe(takeUntil(this.destroy$)).subscribe(l => this.loading = l);
    this.loadingHistory$.pipe(takeUntil(this.destroy$)).subscribe(l => this.loadingHistory = l);
    this.stripeLoading$.pipe(takeUntil(this.destroy$)).subscribe(l => this.stripeLoading = l);
    this.stripeError$.pipe(takeUntil(this.destroy$)).subscribe(e => this.stripeError = e);

    this.stripeSession$.pipe(
      takeUntil(this.destroy$),
      filter(session => !!session?.redirectUrl)
    ).subscribe(session => {
      this.stripeSession = session;
      window.location.href = session.redirectUrl;
    });
  }

  // ─── Retour après paiement ─────────────────────────────────────────────────

  private handlePaymentCallback(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['payment'] === 'success') {
        this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
        this.loadData();
      } else if (params['payment'] === 'cancelled') {
        this.stripeError = 'Paiement annulé.';
        this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
      }
    });
  }

  // ─── Actions ──────────────────────────────────────────────────────────────

  refreshData(): void { this.loadData(); }

  upgradeToPremium(): void {
    this.router.navigate([`/${this.lang}/app/facturation/choix-plan`]);
  }

  reactivateAccount(): void {
    this.store.dispatch(new SubscriptionLimitAction.ReactivateAccount());
  }

  downloadInvoice(periodId: string): void {
    // Telecharger la facture PDF uniquement si la periode est payee
    this.invoiceDownloadService.downloadInvoicePdf(periodId);
  }

  payCurrentPeriod(): void {
    if (!this.currentPeriod || this.stripeLoading) return;
    const profile = this.store.selectSnapshot(UserProfileState.selectStateUserProfile);
    const currentPath = window.location.pathname;
    this.paymentSessionService.createAndRedirect(this.lang, {
      context: 'SUBSCRIPTION',
      amount: this.currentPeriod.calculatedAmount || 0,
      amountEditable: false,
      currency: 'XAF',
      description: `Abonnement Ndewa360° — ${this.currentPeriod.billingRef}`,
      reference: this.currentPeriod._id,
      userId: profile?._id,
      userEmail: profile?.email,
      metadata: { periodId: this.currentPeriod._id, subscriptionId: this.currentSubscription?._id, lang: this.lang },
      successRedirectPath: `${currentPath}?payment=success`,
      cancelRedirectPath: currentPath,
    });
  }

  payPeriod(period: SouscriptionPeriodModel): void {
    if (!period || period.state === SouscriptionPayementState.PAYED) return;
    if (!period.calculatedAmount) return;
    const profile = this.store.selectSnapshot(UserProfileState.selectStateUserProfile);
    const currentPath = window.location.pathname;
    this.paymentSessionService.createAndRedirect(this.lang, {
      context: 'SUBSCRIPTION',
      amount: period.calculatedAmount,
      amountEditable: false,
      currency: 'XAF',
      description: `Abonnement Ndewa360° — ${period.billingRef || period._id}`,
      reference: period._id,
      userId: profile?._id,
      userEmail: profile?.email,
      metadata: { periodId: period._id, lang: this.lang },
      successRedirectPath: `${currentPath}?payment=success`,
      cancelRedirectPath: currentPath,
    });
  }

  // ─── Helpers template ─────────────────────────────────────────────────────

  canPayCurrentPeriod(): boolean {
    if (!this.currentPeriod) return false;
    return (
      this.currentPeriod.state === SouscriptionPayementState.WAITING ||
      this.currentPeriod.state === SouscriptionPayementState.UNPAYED
    ) && (this.currentPeriod.calculatedAmount || 0) > 0;
  }

  getPlanLabel(plan: SouscriptionPlan): string {
    return plan?.toLowerCase() === 'premium' ? 'Premium' : 'Gratuit';
  }

  getAccountStatusLabel(status: string): string {
    const labels: Record<string, string> = { active: 'Actif', suspended: 'Suspendu', disabled: 'Désactivé' };
    return labels[status?.toLowerCase()] || status;
  }

  getAccountStatusColor(status: string): string {
    const colors: Record<string, string> = { active: 'success', suspended: 'warning', disabled: 'danger' };
    return colors[status?.toLowerCase()] || 'secondary';
  }

  getPeriodStatusLabel(period: SouscriptionPeriodModel): string {
    if (!period) return 'N/A';
    const labels: Record<string, string> = {
      [SouscriptionPayementState.PAYED]:           'Payé',
      [SouscriptionPayementState.UNPAYED]:          'En retard',
      [SouscriptionPayementState.WAITING]:          'En attente',
      [SouscriptionPayementState.SHOULD_NOT_PAYED]: 'Gratuit',
    };
    return labels[period.state] || 'N/A';
  }

  getPeriodStatusColor(period: SouscriptionPeriodModel): string {
    if (!period) return 'secondary';
    const colors: Record<string, string> = {
      [SouscriptionPayementState.PAYED]:           'success',
      [SouscriptionPayementState.UNPAYED]:          'danger',
      [SouscriptionPayementState.WAITING]:          'warning',
      [SouscriptionPayementState.SHOULD_NOT_PAYED]: 'info',
    };
    return colors[period.state] || 'secondary';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(amount || 0);
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  formatDateShort(date: any): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  getDaysUntilDue(): number {
    if (!this.currentPeriod?.endedAt) return 0;
    const diff = new Date(this.currentPeriod.endedAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  getProgressPercentage(): number {
    if (!this.currentPeriod) return 0;
    const start = new Date(this.currentPeriod.startedAt).getTime();
    const end   = new Date(this.currentPeriod.endedAt).getTime();
    const now   = Date.now();
    return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
  }

  getUnpaidTotal(): number {
    const invoices = this.store.selectSnapshot(SubscriptionPaymentState.selectUnpaidInvoices);
    return (invoices || []).reduce((sum, inv) => sum + (inv.amount || 0), 0);
  }

  getTotalUnpaidAmount(): number {
    return this.subscriptionHistory
      .flatMap(sub => sub.periods || [])
      .filter(p => p.state === SouscriptionPayementState.UNPAYED)
      .reduce((total, p) => total + (p.calculatedAmount || 0), 0);
  }

  getUnpaidPeriodsCount(): number {
    return this.subscriptionHistory
      .flatMap(sub => sub.periods || [])
      .filter(p => p.state === SouscriptionPayementState.UNPAYED).length;
  }
}
