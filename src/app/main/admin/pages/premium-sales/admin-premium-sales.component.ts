import { Component, OnDestroy, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe, NgFor, NgIf } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { trackByFn } from '../../../../shared/utils/track-by.util';

type SaleStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

interface PremiumSale {
  _id: string;
  buyerEmail: string;
  owner: { _id: string; name: string | null; email: string | null };
  amount: number;
  currency: string;
  status: SaleStatus;
  purchaseDate: string;
  expiryDate: string;
  accessCount: number;
  reference: string | null;
}

interface SalesSummary { paidCount: number; paidAmount: number; monthCount: number; monthAmount: number; }

/**
 * Ventes d'accès premium (contacts d'un propriétaire pendant 24 h), avec le
 * total encaissé et celui du mois (backend GET /premium-access/admin/list).
 */
@Component({
  selector: 'app-admin-premium-sales',
  templateUrl: './admin-premium-sales.component.html',
  styleUrls: ['./admin-premium-sales.component.scss'],
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, DatePipe, DecimalPipe, TranslateModule],
})
export class AdminPremiumSalesComponent implements OnInit, OnDestroy {
  trackByFn = trackByFn;
  private destroy$ = new Subject<void>();

  readonly statuses: SaleStatus[] = ['ACTIVE', 'EXPIRED', 'PENDING', 'CANCELLED'];
  filters = { status: '', search: '' };
  readonly limit = 20;
  page = 1;
  total = 0;
  totalPages = 1;
  sales: PremiumSale[] = [];
  summary: SalesSummary | null = null;
  isLoading = false;

  constructor(private http: HttpClient, private toastr: ToastrService, private translate: TranslateService) {}

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(): void {
    this.isLoading = true;
    let params = new HttpParams().set('page', this.page).set('limit', this.limit);
    if (this.filters.status) params = params.set('status', this.filters.status);
    if (this.filters.search.trim()) params = params.set('search', this.filters.search.trim());
    this.http.get<any>(`${environment.apiUrl}/premium-access/admin/list`, { params })
      .pipe(finalize(() => this.isLoading = false), takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const data = res?.data || {};
          this.sales = data.data || [];
          this.total = data.total || 0;
          this.totalPages = Math.max(1, data.totalPages || 1);
          this.summary = data.summary || null;
        },
        error: () => this.toastr.error(this.translate.instant('ADMIN.PREMIUM_SALES.LOAD_ERROR')),
      });
  }

  applyFilters(): void {
    this.page = 1;
    this.load();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.page) return;
    this.page = page;
    this.load();
  }

  formatAmount(amount: number, currency = 'XAF'): string {
    const locale = this.translate.currentLang === 'en' ? 'en-US' : 'fr-FR';
    return `${new Intl.NumberFormat(locale).format(amount || 0)} ${currency === 'XAF' ? 'FCFA' : currency}`;
  }

  statusClass(status: SaleStatus): string {
    return status === 'ACTIVE' ? 'adm-pill--success' : status === 'PENDING' ? 'adm-pill--warning' : status === 'CANCELLED' ? 'adm-pill--danger' : '';
  }
}
