import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, Observable } from 'rxjs';
import { Store } from '@ngxs/store';

import {
  ContractTemplateModel,
  ContractTemplateType,
  ContractTemplateStatus,
  ContractTemplateStatsDTO,
  ContractTemplateAction,
  ContractTemplateState
} from '../../../shared/store/contract-templates';

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
    private store: Store
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
    // Dispatcher les actions pour charger les données
    this.store.dispatch(new ContractTemplateAction.FetchTemplateStatistics());
    this.store.dispatch(new ContractTemplateAction.FetchRecentTemplates(6));
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
    // Pour l'instant, naviguer vers la liste pour sélectionner un modèle
    // TODO: Implémenter une modal de sélection
    this.router.navigate(['list'], {
      relativeTo: this.route,
      queryParams: { action: 'duplicate' }
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
   * Obtenir le pourcentage de modèles actifs
   */
  getActivePercentage(statistics: ContractTemplateStatsDTO): number {
    if (statistics.totalTemplates === 0) return 0;
    return Math.round((statistics.activeTemplates / statistics.totalTemplates) * 100);
  }

  /**
   * Obtenir le pourcentage de modèles personnalisés
   */
  getCustomPercentage(statistics: ContractTemplateStatsDTO): number {
    if (statistics.totalTemplates === 0) return 0;
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
    switch (type) {
      case ContractTemplateType.DEFAULT:
        return 'Par défaut';
      case ContractTemplateType.CUSTOM:
        return 'Personnalisé';
      case ContractTemplateType.DUPLICATED:
        return 'Dupliqué';
      default:
        return 'Inconnu';
    }
  }

  /**
   * Obtenir le libellé du statut
   */
  getStatusLabel(status: ContractTemplateStatus): string {
    switch (status) {
      case ContractTemplateStatus.ACTIVE:
        return 'Actif';
      case ContractTemplateStatus.INACTIVE:
        return 'Inactif';
      case ContractTemplateStatus.ARCHIVED:
        return 'Archivé';
      default:
        return 'Inconnu';
    }
  }

  /**
   * TrackBy function pour optimiser le rendu
   */
  trackByTemplate(_index: number, template: ContractTemplateModel): string {
    return template._id;
  }
}
