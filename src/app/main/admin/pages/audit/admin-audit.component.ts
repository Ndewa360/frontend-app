import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgFor, NgIf, DatePipe, JsonPipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AdminAuditFilters, AdminAuditLog, AdminAuditPage, AdminAuditService } from '../../services/admin-audit.service';

/**
 * Journal d'audit : toutes les actions des administrateurs qui modifient des
 * données (qui, quoi, sur quelle ressource, avec quel résultat). Conservé 1 an.
 */
@Component({
  selector: 'app-admin-audit',
  templateUrl: './admin-audit.component.html',
  styleUrls: ['./admin-audit.component.scss'],
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, DatePipe, JsonPipe, DecimalPipe, TranslateModule]
})
export class AdminAuditComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  page: AdminAuditPage = { data: [], total: 0, page: 1, limit: 30, totalPages: 0 };
  filters: AdminAuditFilters = { page: 1, limit: 30, success: '', target: '' };
  isLoading = false;
  expandedId: string | null = null;

  constructor(private audit: AdminAuditService, private toastr: ToastrService, private translate: TranslateService) {}

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(page = this.filters.page || 1): void {
    this.filters = { ...this.filters, page, target: (this.filters.target || '').trim() };
    this.isLoading = true;
    this.audit.list(this.filters)
      .pipe(finalize(() => this.isLoading = false), takeUntil(this.destroy$))
      .subscribe({
        next: result => this.page = result,
        error: () => this.toastr.error('Impossible de charger le journal d\'audit.')
      });
  }

  applyFilters(): void {
    this.expandedId = null;
    this.load(1);
  }

  clearFilters(): void {
    this.filters = { page: 1, limit: 30, success: '', target: '' };
    this.applyFilters();
  }

  toggle(log: AdminAuditLog): void {
    this.expandedId = this.expandedId === log._id ? null : log._id;
  }

  hasPayload(log: AdminAuditLog): boolean {
    return !!log.payload && typeof log.payload === 'object' && Object.keys(log.payload).length > 0;
  }

  methodLabel(method: string): string {
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) ? this.translate.instant(`ADMIN.AUDIT.METHODS.${method}`) : method;
  }

  /** Libellé traduit de l'action ; repli sur le libellé enregistré. */
  actionLabel(log: AdminAuditLog): string {
    return log.actionKey && log.actionKey !== 'OTHER' ? this.translate.instant(`ADMIN.AUDIT.ACTIONS.${log.actionKey}`) : log.action;
  }

  trackById(_: number, log: AdminAuditLog): string { return log._id; }
}
