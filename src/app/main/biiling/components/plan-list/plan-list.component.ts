import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store, Select } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SubscriptionPaymentState, SubscriptionPaymentAction, PaymentHistory, PaymentHistoryItem } from 'src/app/shared/store/subscription-payment';
import { SubscriptionLimitState, SubscriptionLimitAction, SubscriptionStatus } from 'src/app/shared/store/subscription-limit';
import { PaymentSessionService } from 'src/app/shared/services/payment-session.service';
import { UserProfileState } from 'src/app/shared/store/user-profile';
import { InvoiceDownloadService } from 'src/app/shared/services/invoice-download.service';

@Component({
  selector: 'plan-list',
  templateUrl: './plan-list.component.html',
  styleUrls: ['./plan-list.component.css']
})
export class PlanListComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();
  private lang = 'fr';

  @Select(SubscriptionPaymentState.selectPaymentHistory) paymentHistory$: Observable<PaymentHistory | null>;
  @Select(SubscriptionPaymentState.selectLoading) loading$: Observable<boolean>;
  @Select(SubscriptionLimitState.selectSubscriptionStatus) subscriptionStatus$: Observable<SubscriptionStatus | null>;

  paymentHistory: PaymentHistory | null = null;
  subscriptionStatus: SubscriptionStatus | null = null;
  loading = false;
  currentPage = 1;
  readonly pageSize = 10;

  constructor(
    private store: Store,
    private paymentSessionService: PaymentSessionService,
    private invoiceDownloadService: InvoiceDownloadService,
  ) {}

  ngOnInit(): void {
    this.lang = window.location.pathname.split('/')[1] || 'fr';

    this.paymentHistory$.pipe(takeUntil(this.destroy$)).subscribe(h => this.paymentHistory = h);
    this.loading$.pipe(takeUntil(this.destroy$)).subscribe(l => this.loading = l);
    this.subscriptionStatus$.pipe(takeUntil(this.destroy$)).subscribe(s => this.subscriptionStatus = s);

    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.store.dispatch(new SubscriptionPaymentAction.GetPaymentHistory(this.currentPage, this.pageSize));
    this.store.dispatch(new SubscriptionLimitAction.GetSubscriptionStatus());
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.store.dispatch(new SubscriptionPaymentAction.GetPaymentHistory(page, this.pageSize));
  }

  payPeriod(period: PaymentHistoryItem): void {
    const profile = this.store.selectSnapshot(UserProfileState.selectStateUserProfile);
    const currentPath = window.location.pathname;

    this.paymentSessionService.createAndRedirect(this.lang, {
      context: 'SUBSCRIPTION',
      amount: period.amount,
      amountEditable: false,
      currency: 'XAF',
      description: `Abonnement Ndewa360 — ${period.billingRef}`,
      reference: period.id,
      userId: profile?._id,
      userEmail: profile?.email,
      metadata: { periodId: period.id, lang: this.lang },
      successRedirectPath: `${currentPath}?payment=success`,
      cancelRedirectPath: currentPath,
    });
  }

  getPeriodStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      payed:            'Payé',
      waiting:          'En attente',
      unpaid:           'En retard',
      should_not_payed: 'Gratuit',
    };
    return labels[status] || status;
  }

  getPeriodStatusClass(status: string): string {
    const classes: Record<string, string> = {
      payed:            'success',
      waiting:          'warning',
      unpaid:           'danger',
      should_not_payed: 'info',
    };
    return classes[status] || 'secondary';
  }

  canPayPeriod(period: PaymentHistoryItem): boolean {
    return (period.status === 'waiting' || period.status === 'unpaid') && period.amount > 0;
  }

  // Compteurs pour le résumé rapide
  countByStatus(status: string): number {
    return (this.paymentHistory?.periods || []).filter(p => p.status === status).length;
  }

  get unpaidCount(): number  { return this.countByStatus('unpaid'); }
  get paidCount(): number    { return this.countByStatus('payed'); }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency', currency: 'XAF', minimumFractionDigits: 0
    }).format(amount || 0);
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  get totalPages(): number {
    return this.paymentHistory?.totalPages || 1;
  }

  downloadInvoice(periodId: string): void {
    this.invoiceDownloadService.downloadInvoicePdf(periodId);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}
