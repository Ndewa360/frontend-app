import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { MonitoringService } from '../../shared/services/monitoring.service';
import {
  ErrorLog,
  ErrorLevel,
  ErrorSource,
  ErrorStatus,
  ErrorFilters
} from '../../shared/models/monitoring.models';
import { ToastrService } from 'ngx-toastr';
import { ErrorDetailsDialogComponent } from './error-details-dialog/error-details-dialog.component';


@Component({
  selector: 'app-error-management',
  templateUrl: './error-management.component.html',
  styleUrls: ['./error-management.component.scss']
})
export class ErrorManagementComponent implements OnInit, OnDestroy {
  @Input() errors: ErrorLog[] = [];
  @Output() errorUpdated = new EventEmitter<void>();
  @Output() errorDeleted = new EventEmitter<void>();

  private destroy$ = new Subject<void>();

  // États du composant
  isLoading = false;
  selectedErrors: Set<string> = new Set();
  showFilters = false;


  // Filtres
  filters: ErrorFilters = {
    limit: 50,
    skip: 0
  };

  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalErrors = 0;

  // Recherche
  searchTerm = '';
  searchTimeout: any;

  // Énumérations pour les templates
  ErrorLevel = ErrorLevel;
  ErrorSource = ErrorSource;
  ErrorStatus = ErrorStatus;

  // Options pour les filtres
  levelOptions = Object.values(ErrorLevel);
  sourceOptions = Object.values(ErrorSource);
  statusOptions = Object.values(ErrorStatus);

  constructor(
    private monitoringService: MonitoringService,
    private toastr: ToastrService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    // Si aucune erreur n'est fournie en input, charger les erreurs
    if (!this.errors || this.errors.length === 0) {
      this.loadErrors();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  // ==================== DATA LOADING ====================

  loadErrors() {
    console.log('🔄 Chargement des erreurs...');
    this.isLoading = true;
    const currentFilters = {
      ...this.filters,
      skip: (this.currentPage - 1) * this.pageSize,
      limit: this.pageSize
    };

    console.log('📋 Filtres appliqués:', currentFilters);

    this.monitoringService.getErrors(currentFilters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          console.log('✅ Erreurs chargées:', result);
          this.errors = result.errors || [];
          this.totalErrors = result.total || 0;
          this.isLoading = false;

          if (this.errors.length === 0) {
            console.log('⚠️ Aucune erreur trouvée');
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.error('Erreur lors du chargement des erreurs', 'Monitoring');
          console.error('❌ Erreur lors du chargement:', error);
        }
      });
  }

  // ==================== SEARCH & FILTERS ====================

  onSearch(event: any) {
    this.searchTerm = event.target.value;
    
    // Debounce la recherche
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    this.searchTimeout = setTimeout(() => {
      if (this.searchTerm.trim()) {
        this.searchErrors();
      } else {
        this.clearSearch();
      }
    }, 500);
  }

  searchErrors() {
    this.isLoading = true;
    this.monitoringService.searchErrors(this.searchTerm, this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (errors) => {
          this.errors = errors;
          this.totalErrors = errors.length;
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
          this.toastr.error('Erreur lors de la recherche', 'Monitoring');
        }
      });
  }

  clearSearch() {
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadErrors();
  }

  applyFilters() {
    this.currentPage = 1;
    this.loadErrors();
    this.showFilters = false;
    this.toastr.info('Filtres appliqués', 'Monitoring');
  }

  clearFilters() {
    this.filters = { limit: 50, skip: 0 };
    this.currentPage = 1;
    this.loadErrors();
    this.toastr.info('Filtres effacés', 'Monitoring');
  }

  // ==================== SELECTION ====================

  toggleErrorSelection(errorId: string) {
    if (this.selectedErrors.has(errorId)) {
      this.selectedErrors.delete(errorId);
    } else {
      this.selectedErrors.add(errorId);
    }
  }

  selectAllErrors() {
    if (this.selectedErrors.size === this.errors.length) {
      this.selectedErrors.clear();
    } else {
      this.errors.forEach(error => this.selectedErrors.add(error._id));
    }
  }

  isErrorSelected(errorId: string): boolean {
    return this.selectedErrors.has(errorId);
  }

  getSelectedCount(): number {
    return this.selectedErrors.size;
  }

  // ==================== ERROR ACTIONS ====================

  updateErrorStatus(errorId: string, status: ErrorStatus) {
    this.monitoringService.updateErrorStatus(errorId, status, 'Admin', `Status changed to ${status}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastr.success('Statut mis à jour', 'Monitoring');
          this.errorUpdated.emit();
          this.loadErrors();
        },
        error: (error) => {
          this.toastr.error('Erreur lors de la mise à jour', 'Monitoring');
        }
      });
  }

  deleteError(errorId: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette erreur ?')) {
      this.monitoringService.deleteError(errorId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastr.success('Erreur supprimée', 'Monitoring');
            this.errorDeleted.emit();
            this.loadErrors();
          },
          error: (error) => {
            this.toastr.error('Erreur lors de la suppression', 'Monitoring');
          }
        });
    }
  }

  bulkUpdateStatus(status: ErrorStatus) {
    if (this.selectedErrors.size === 0) {
      this.toastr.warning('Aucune erreur sélectionnée', 'Monitoring');
      return;
    }

    const errorIds = Array.from(this.selectedErrors);
    this.monitoringService.bulkUpdateErrors({
      ids: errorIds,
      updates: { status }
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (count) => {
        this.toastr.success(`${count} erreurs mises à jour`, 'Monitoring');
        this.selectedErrors.clear();
        this.errorUpdated.emit();
        this.loadErrors();
      },
      error: (error) => {
        this.toastr.error('Erreur lors de la mise à jour en lot', 'Monitoring');
      }
    });
  }

  bulkDelete() {
    if (this.selectedErrors.size === 0) {
      this.toastr.warning('Aucune erreur sélectionnée', 'Monitoring');
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer ${this.selectedErrors.size} erreur(s) ?`)) {
      const deletePromises = Array.from(this.selectedErrors).map(id => 
        this.monitoringService.deleteError(id).toPromise()
      );

      Promise.all(deletePromises)
        .then(() => {
          this.toastr.success(`${this.selectedErrors.size} erreurs supprimées`, 'Monitoring');
          this.selectedErrors.clear();
          this.errorDeleted.emit();
          this.loadErrors();
        })
        .catch((error) => {
          this.toastr.error('Erreur lors de la suppression en lot', 'Monitoring');
        });
    }
  }

  // ==================== ERROR DETAILS ====================

  showDetails(error: ErrorLog) {
    const dialogRef = this.dialog.open(ErrorDetailsDialogComponent, {
      width: '90vw',
      maxWidth: '1200px',
      maxHeight: '90vh',
      data: error,
      panelClass: 'error-details-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (result.action === 'updateStatus') {
          this.updateErrorStatus(result.errorId, result.status);
        } else if (result.action === 'delete') {
          this.deleteError(result.errorId);
        }
      }
    });
  }





  // ==================== PAGINATION ====================

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadErrors();
  }

  getTotalPages(): number {
    return Math.ceil(this.totalErrors / this.pageSize);
  }

  // ==================== UTILITY METHODS ====================

  getErrorLevelClass(level: ErrorLevel): string {
    const classes = {
      [ErrorLevel.LOW]: 'level-low',
      [ErrorLevel.MEDIUM]: 'level-medium',
      [ErrorLevel.HIGH]: 'level-high',
      [ErrorLevel.CRITICAL]: 'level-critical'
    };
    return classes[level] || 'level-medium';
  }

  getErrorLevelLabel(level: ErrorLevel): string {
    const labels = {
      [ErrorLevel.LOW]: 'Faible',
      [ErrorLevel.MEDIUM]: 'Moyen',
      [ErrorLevel.HIGH]: 'Élevé',
      [ErrorLevel.CRITICAL]: 'Critique'
    };
    return labels[level] || level;
  }

  getErrorSourceLabel(source: ErrorSource): string {
    const labels = {
      [ErrorSource.FRONTEND]: 'Frontend',
      [ErrorSource.BACKEND]: 'Backend',
      [ErrorSource.DATABASE]: 'Base de données',
      [ErrorSource.EXTERNAL_API]: 'API externe',
      [ErrorSource.AUTHENTICATION]: 'Authentification',
      [ErrorSource.AUTHORIZATION]: 'Autorisation',
      [ErrorSource.VALIDATION]: 'Validation',
      [ErrorSource.NETWORK]: 'Réseau'
    };
    return labels[source] || source;
  }

  getErrorStatusLabel(status: ErrorStatus): string {
    const labels = {
      [ErrorStatus.NEW]: 'Nouveau',
      [ErrorStatus.ACKNOWLEDGED]: 'Reconnu',
      [ErrorStatus.IN_PROGRESS]: 'En cours',
      [ErrorStatus.RESOLVED]: 'Résolu',
      [ErrorStatus.IGNORED]: 'Ignoré'
    };
    return labels[status] || status;
  }

  getErrorStatusClass(status: ErrorStatus): string {
    const classes = {
      [ErrorStatus.NEW]: 'status-new',
      [ErrorStatus.ACKNOWLEDGED]: 'status-acknowledged',
      [ErrorStatus.IN_PROGRESS]: 'status-progress',
      [ErrorStatus.RESOLVED]: 'status-resolved',
      [ErrorStatus.IGNORED]: 'status-ignored'
    };
    return classes[status] || 'status-new';
  }

  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('fr-FR');
  }

  truncateText(text: string, maxLength: number = 100): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  formatJson(data: any): string {
    if (!data) return 'Aucune donnée';
    try {
      return JSON.stringify(data, null, 2);
    } catch (error) {
      return 'Données non formatables: ' + String(data);
    }
  }

  formatStackTrace(stackTrace: any): string {
    if (!stackTrace) return 'Aucune stack trace disponible';

    if (typeof stackTrace === 'string') {
      return stackTrace;
    }

    if (Array.isArray(stackTrace)) {
      return stackTrace.join('\n');
    }

    try {
      return JSON.stringify(stackTrace, null, 2);
    } catch (error) {
      return String(stackTrace);
    }
  }



}
