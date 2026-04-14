import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { MatDialog } from '@angular/material/dialog';

import {
  ContractTemplateModel,
  ContractTemplateType,
  ContractTemplateStatus,
  ContractTemplateStatsDTO,
  ContractTemplateAction,
  ContractTemplateState
} from '../../../shared/store/contract-templates';
import { TemplateSelectionModalComponent, TemplateSelectionData, TemplateSelectionResult } from '../components/template-selection-modal/template-selection-modal.component';
import { DuplicateTemplateModalComponent } from '../components/duplicate-template-modal/duplicate-template-modal.component';
import { DeleteConfirmationModalComponent } from '../components/delete-confirmation-modal/delete-confirmation-modal.component';

@Component({
  selector: 'app-contract-templates-dashboard',
  templateUrl: './contract-templates-dashboard.component.html',
  styleUrls: ['./contract-templates-dashboard.component.scss']
})
export class ContractTemplatesDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Observables du store
  statistics$: Observable<ContractTemplateStatsDTO | null>;
  recentTemplates$: Observable<ContractTemplateModel[]>;
  loading$: Observable<boolean>;
  loadingStatistics$: Observable<boolean>;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private store: Store,
    private dialog: MatDialog
  ) {
    // Initialiser les observables
    this.statistics$ = this.store.select(ContractTemplateState.selectStateStatistics);
    this.recentTemplates$ = this.store.select(ContractTemplateState.selectStateRecentTemplates);
    this.loading$ = this.store.select(ContractTemplateState.selectStateLoading);
    this.loadingStatistics$ = this.store.select(ContractTemplateState.selectStateLoadingStatistics);
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charger les données du dashboard
   */
  private loadDashboardData(): void {
    this.store.dispatch([
      new ContractTemplateAction.FetchTemplateStatistics(),
      new ContractTemplateAction.FetchRecentTemplates(6)
    ]);
  }

  /**
   * Créer un nouveau modèle
   */
  createNewTemplate(): void {
    this.router.navigate(['create'], { relativeTo: this.route });
  }

  /**
   * Réindexer les templates depuis Google Cloud Storage
   */
  reindexTemplates(): void {
    this.store.dispatch(new ContractTemplateAction.ReindexUserTemplates());
  }

  /**
   * Parcourir les modèles
   */
  browseTemplates(): void {
    this.router.navigate(['list'], { relativeTo: this.route });
  }

  /**
   * Dupliquer un modèle
   */
  duplicateTemplate(): void {
    const dialogData: TemplateSelectionData = {
      title: 'CONTRACT_TEMPLATES.DUPLICATE_MODAL.TITLE',
      message: 'CONTRACT_TEMPLATES.DUPLICATE_MODAL.MESSAGE',
      allowSystemTemplates: true
    };

    const dialogRef = this.dialog.open(TemplateSelectionModalComponent, {
      width: '800px',
      maxWidth: '90vw',
      data: dialogData,
      disableClose: false
    });

    dialogRef.afterClosed().subscribe((result: TemplateSelectionResult) => {
      if (result && result.selectedTemplate) {
        this.openDuplicateModal(result.selectedTemplate);
      }
    });
  }

  /**
   * Ouvrir la modal de duplication avec le template sélectionné
   */
  private openDuplicateModal(sourceTemplate: ContractTemplateModel): void {
    const dialogRef = this.dialog.open(DuplicateTemplateModalComponent, {
      width: '500px',
      data: { template: sourceTemplate }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success && result.newTemplate) {
        // Rediriger vers l'éditeur du nouveau template avec l'URL complète
        console.log('🔄 Redirection vers l\'éditeur du template dupliqué:', result.newTemplate._id);
        this.router.navigate(['/app/contract-templates/edit', result.newTemplate._id]);
      }
    });
  }

  /**
   * Voir tous les modèles
   */
  viewAllTemplates(): void {
    this.router.navigate(['list'], { relativeTo: this.route });
  }

  /**
   * Modifier un modèle
   */
  editTemplate(template: ContractTemplateModel): void {
    this.router.navigate(['edit', template._id], { relativeTo: this.route });
  }

  /**
   * Voir un modèle
   */
  viewTemplate(template: ContractTemplateModel): void {
    this.router.navigate(['view', template._id], { relativeTo: this.route });
  }

  /**
   * Supprimer un modèle depuis les templates récents
   */
  deleteTemplate(template: ContractTemplateModel): void {
    if (template.isSystemDefault) return;

    const dialogRef = this.dialog.open(DeleteConfirmationModalComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: {
        title: 'Supprimer le modèle',
        message: `Êtes-vous sûr de vouloir supprimer le modèle "${template.name}" ?`,
        warning: 'Cette action est irréversible. Le fichier sera également supprimé du stockage.',
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      },
      disableClose: true,
      panelClass: ['custom-dialog-container', 'delete-confirmation-dialog'],
      hasBackdrop: true,
      backdropClass: 'delete-confirmation-backdrop'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.store.dispatch(new ContractTemplateAction.DeleteTemplate(template._id));
      }
    });
  }



  /**
   * Obtenir le pourcentage de modèles actifs
   */
  getActivePercentage(statistics: ContractTemplateStatsDTO): number {
    if (!statistics || statistics.totalTemplates === 0) return 0;
    return Math.round((statistics.activeTemplates / statistics.totalTemplates) * 100);
  }

  /**
   * Obtenir le pourcentage de modèles personnalisés
   */
  getCustomPercentage(statistics: ContractTemplateStatsDTO): number {
    if (!statistics || statistics.totalTemplates === 0) return 0;
    return Math.round((statistics.customTemplates / statistics.totalTemplates) * 100);
  }

  /**
   * Obtenir la classe CSS pour le badge de type
   */
  getTypeBadgeClass(type: ContractTemplateType): string {
    switch (type) {
      case ContractTemplateType.DEFAULT:
        return 'type-default';
      case ContractTemplateType.CUSTOM:
        return 'type-custom';
      case ContractTemplateType.DUPLICATED:
        return 'type-duplicated';
      default:
        return 'type-default';
    }
  }

  /**
   * Obtenir la classe CSS pour le badge de statut
   */
  getStatusBadgeClass(status: ContractTemplateStatus): string {
    switch (status) {
      case ContractTemplateStatus.ACTIVE:
        return 'status-active';
      case ContractTemplateStatus.INACTIVE:
        return 'status-inactive';
      case ContractTemplateStatus.ARCHIVED:
        return 'status-archived';
      default:
        return 'status-active';
    }
  }

  /**
   * Obtenir le libellé du type de modèle
   */
  getTemplateTypeLabel(type: ContractTemplateType): string {
    return type.toUpperCase();
  }

  /**
   * Obtenir le libellé du statut
   */
  getStatusLabel(status: ContractTemplateStatus): string {
    return status.toUpperCase();
  }

  /**
   * TrackBy function pour optimiser le rendu
   */
  trackByTemplate(_index: number, template: ContractTemplateModel): string {
    return template._id;
  }
}
