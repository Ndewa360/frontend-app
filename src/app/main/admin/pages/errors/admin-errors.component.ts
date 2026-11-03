import { Component, OnDestroy, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe, JsonPipe, NgFor, NgIf } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { trackByFn } from '../../../../shared/utils/track-by.util';

export type ErrorLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ErrorStatus = 'NEW' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'IGNORED';

interface MonitoringError {
  _id: string;
  message: string;
  level: ErrorLevel;
  source: string;
  status: ErrorStatus;
  url?: string;
  method?: string;
  userEmail?: string;
  component?: string;
  feature?: string;
  stackTrace?: any;
  occurrenceCount: number;
  firstOccurrence: string;
  lastOccurrence: string;
  resolvedBy?: string;
  resolvedAt?: string;
  notes?: string;
}

interface ErrorStats {
  totalErrors: number;
  recentErrors: number;
  errorsByLevel: Record<string, number>;
  errorsByStatus: Record<string, number>;
}

/**
 * Erreurs applicatives remontées par le web, le mobile et le serveur
 * (backend /monitoring/errors) : liste filtrable, détail, changement de statut.
 */
@Component({
  selector: 'app-admin-errors',
  templateUrl: './admin-errors.component.html',
  styleUrls: ['./admin-errors.component.scss'],
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, DatePipe, DecimalPipe, JsonPipe, TranslateModule],
})
export class AdminErrorsComponent implements OnInit, OnDestroy {
  trackByFn = trackByFn;
  private destroy$ = new Subject<void>();
  private readonly apiUrl = `${environment.apiUrl}/monitoring`;

  readonly levels: ErrorLevel[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  readonly statuses: ErrorStatus[] = ['NEW', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'IGNORED'];

  filters = { level: '', status: 'NEW', search: '' };
  readonly limit = 30;
  page = 1;
  total = 0;
  errors: MonitoringError[] = [];
  stats: ErrorStats | null = null;
  isLoading = false;
  selected: MonitoringError | null = null;
  updatingId: string | null = null;

  constructor(private http: HttpClient, private toastr: ToastrService, private translate: TranslateService) {}

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.limit));
  }

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(): void {
    this.isLoading = true;
    let params = new HttpParams().set('limit', this.limit).set('skip', (this.page - 1) * this.limit);
    if (this.filters.level) params = params.set('level', this.filters.level);
    if (this.filters.status) params = params.set('status', this.filters.status);
    if (this.filters.search.trim()) params = params.set('search', this.filters.search.trim());

    this.http.get<any>(`${this.apiUrl}/errors`, { params })
      .pipe(finalize(() => this.isLoading = false), takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.errors = res?.data?.errors || [];
          this.total = res?.data?.total || 0;
        },
        error: () => this.toastr.error(this.translate.instant('ADMIN.ERRORS.LOAD_ERROR')),
      });

    this.http.get<any>(`${this.apiUrl}/errors/stats`).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => this.stats = res?.data || null,
      error: () => this.stats = null,
    });
  }

  applyFilters(): void {
    this.page = 1;
    this.selected = null;
    this.load();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.page) return;
    this.page = page;
    this.load();
  }

  select(error: MonitoringError): void {
    this.selected = this.selected?._id === error._id ? null : error;
  }

  setStatus(error: MonitoringError, status: ErrorStatus): void {
    if (this.updatingId) return;
    this.updatingId = error._id;
    this.http.put<any>(`${this.apiUrl}/errors/${error._id}`, { status })
      .pipe(finalize(() => this.updatingId = null), takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const updated = res?.data || { ...error, status };
          this.errors = this.errors.map((e) => (e._id === error._id ? { ...e, ...updated } : e));
          if (this.selected?._id === error._id) this.selected = { ...this.selected, ...updated };
          this.toastr.success(this.translate.instant('ADMIN.ERRORS.STATUS_UPDATED'));
        },
        error: () => this.toastr.error(this.translate.instant('ADMIN.COMMON.GENERIC_ERROR')),
      });
  }

  levelClass(level: string): string {
    return level === 'CRITICAL' || level === 'HIGH' ? 'adm-pill--danger' : level === 'MEDIUM' ? 'adm-pill--warning' : 'adm-pill--info';
  }

  statusClass(status: string): string {
    return status === 'RESOLVED' ? 'adm-pill--success' : status === 'NEW' ? 'adm-pill--danger' : status === 'IGNORED' ? '' : 'adm-pill--warning';
  }

  stack(error: MonitoringError): string {
    const s = error.stackTrace;
    if (!s) return '';
    return typeof s === 'string' ? s : JSON.stringify(s, null, 2);
  }
}
