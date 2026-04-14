import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { Router } from '@angular/router';
import { LanguageUrlService } from 'src/app/shared/services/language-url.service';

import { AdminDashboardAction } from '../../store/dashboard/admin-dashboard.actions';
import { AdminDashboardState } from '../../store/dashboard/admin-dashboard.state';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  dashboardStats$   = this.store.select(AdminDashboardState.selectDashboardStats);
  systemHealth$     = this.store.select(AdminDashboardState.selectSystemHealth);
  recentActivities$ = this.store.select(AdminDashboardState.selectRecentActivities);
  isLoading$        = this.store.select(AdminDashboardState.selectIsLoading);

  financialData: any = null;
  alerts: any[] = [];

  private readonly MONTH_LABELS = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
    'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
  ];

  constructor(
    private store: Store,
    private router: Router,
    private languageUrlService: LanguageUrlService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.store.select(AdminDashboardState.selectFinancialData)
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => { if (data) this.financialData = data; });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDashboardData(): void {
    this.store.dispatch(new AdminDashboardAction.LoadDashboardStats());
    this.store.dispatch(new AdminDashboardAction.LoadSystemHealth());
    this.store.dispatch(new AdminDashboardAction.LoadRecentActivities(20));
    this.store.dispatch(new AdminDashboardAction.LoadFinancialDashboard());
    this.loadAlerts();
  }

  private loadAlerts(): void {
    this.dashboardStats$.pipe(takeUntil(this.destroy$)).subscribe(stats => {
      if (!stats) return;
      this.alerts = [];
      const sub = stats.subscriptions;
      const lang = this.languageUrlService.getCurrentLanguage();
      if (sub?.unpaidAmount > 0) {
        this.alerts.push({
          type: 'warning', title: 'Factures impayées',
          message: `${sub.unpaidCount} facture(s) — ${this.formatCurrency(sub.unpaidAmount)}`,
          link: `/${lang}/admin/subscriptions`
        });
      }
      if (sub?.suspended > 0) {
        this.alerts.push({
          type: 'info', title: 'Comptes suspendus',
          message: `${sub.suspended} compte(s) suspendu(s)`,
          link: `/${lang}/admin/subscriptions`
        });
      }
      if (stats.users?.newThisMonth > 0) {
        this.alerts.push({
          type: 'success', title: 'Nouveaux utilisateurs',
          message: `${stats.users.newThisMonth} nouvel(s) utilisateur(s) ce mois`,
          link: `/${lang}/admin/users`
        });
      }
    });
  }

  onRefreshData(): void { this.loadDashboardData(); }

  onExportReport(): void {
    this.store.dispatch(new AdminDashboardAction.ExportDashboardReport());
  }

  onViewDetails(section: string): void {
    const lang = this.languageUrlService.getCurrentLanguage();
    const routes: Record<string, string> = {
      users:         `/${lang}/admin/users`,
      payments:      `/${lang}/admin/payments`,
      subscriptions: `/${lang}/admin/subscriptions`,
      agents:        `/${lang}/admin/agents`,
      activities:    `/${lang}/admin/monitoring`,
    };
    if (routes[section]) this.router.navigate([routes[section]]);
  }

  // ── Helpers stats ─────────────────────────────────────────────────────────

  getTotalUsers(stats: any): number {
    return stats?.users?.total || stats?.subscriptions?.total || 0;
  }

  getUserGrowthRate(stats: any): number {
    return stats?.users?.newThisMonth || 0;
  }

  getTotalRevenue(stats: any): number {
    return stats?.subscriptions?.totalRevenue || stats?.payments?.totalRevenue || 0;
  }

  getMonthlyRevenue(stats: any): number {
    return stats?.subscriptions?.monthlyRevenue || stats?.payments?.monthlyRevenue || 0;
  }

  getPremiumUsers(stats: any): number {
    return stats?.subscriptions?.premium || 0;
  }

  getSuspendedUsers(stats: any): number {
    return stats?.subscriptions?.suspended || 0;
  }

  getUnpaidAmount(stats: any): number {
    return stats?.subscriptions?.unpaidAmount || 0;
  }

  getTotalCountries(stats: any): number {
    return stats?.geography?.countries || 0;
  }

  getTotalCities(stats: any): number {
    return stats?.geography?.cities || 0;
  }

  // ── Helpers activités ─────────────────────────────────────────────────────

  getActivityIcon(type: string): string {
    const icons: Record<string, string> = {
      user: 'fa-user', property: 'fa-home',
      payment: 'fa-credit-card', system: 'fa-cog',
      coupon: 'fa-tag', role: 'fa-shield-alt',
      INFO: 'fa-info-circle', ERROR: 'fa-exclamation-circle',
      WARNING: 'fa-exclamation-triangle'
    };
    return icons[type] || 'fa-circle';
  }

  // ── Helpers alertes ───────────────────────────────────────────────────────

  getAlertClass(type: string): string {
    const map: Record<string, string> = {
      warning: 'alert-warning', info: 'alert-info',
      success: 'alert-success', danger: 'alert-danger', error: 'alert-danger'
    };
    return map[type] || 'alert-info';
  }

  getAlertIcon(type: string): string {
    const map: Record<string, string> = {
      warning: 'fa-exclamation-triangle', info: 'fa-info-circle',
      success: 'fa-check-circle', danger: 'fa-times-circle', error: 'fa-times-circle'
    };
    return map[type] || 'fa-bell';
  }

  // ── Helpers graphique ─────────────────────────────────────────────────────

  getBarHeight(value: number, data: any[]): number {
    if (!data?.length) return 0;
    const max = Math.max(...data.map(d => d.revenue || 0));
    if (!max) return 0;
    return Math.max(4, Math.round((value / max) * 100));
  }

  getMonthLabel(month: number): string {
    return this.MONTH_LABELS[(month - 1) % 12] || '';
  }

  // ── Helpers système ───────────────────────────────────────────────────────

  formatUptime(seconds: number): string {
    if (!seconds) return 'N/A';
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}j ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency', currency: 'XAF', minimumFractionDigits: 0
    }).format(amount || 0);
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  getRecentAlerts(alerts: any[]): any[] {
    return alerts?.slice(0, 3) || [];
  }
}
