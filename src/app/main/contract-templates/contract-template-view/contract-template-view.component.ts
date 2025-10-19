import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Observable } from 'rxjs';
import { takeUntil, filter, take } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import {
  ContractTemplateModel,
  ContractTemplateType,
  ContractTemplateStatus,
  ContractTemplateAction,
  ContractTemplateState
} from '../../../shared/store/contract-templates';
import { ContractTemplateService } from '../../../shared/services/contract-template.service';
import { DuplicateTemplateModalComponent } from '../components/duplicate-template-modal/duplicate-template-modal.component';
import { DeleteConfirmationModalComponent } from '../components/delete-confirmation-modal/delete-confirmation-modal.component';
import { LanguageUrlService } from '../../../shared/services/language-url.service';

@Component({
  selector: 'app-contract-template-view',
  templateUrl: './contract-template-view.component.html',
  styleUrls: ['./contract-template-view.component.scss']
})
export class ContractTemplateViewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Observables du store
  template$: Observable<ContractTemplateModel | null>;
  loading$: Observable<boolean>;
  
  // État local
  templateId: string = '';
  content: SafeHtml | string = '';
  isLoadingContent = false;
  isDefaultTemplate = false;
  loadingError: string | null = null;

  // Énumérations pour le template
  ContractTemplateType = ContractTemplateType;
  ContractTemplateStatus = ContractTemplateStatus;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store,
    private dialog: MatDialog,
    private contractTemplateService: ContractTemplateService,
    private sanitizer: DomSanitizer,
    private languageUrlService: LanguageUrlService
  ) {
    // Initialiser les observables
    this.template$ = this.store.select(ContractTemplateState.selectStateCurrentTemplate);
    this.loading$ = this.store.select(ContractTemplateState.selectStateLoadingTemplate);
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['id']) {
        this.templateId = params['id'];
        this.loadTemplate(params['id']);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charger le modèle et son contenu
   */
  loadTemplate(templateId: string): void {
    console.log('Loading template with ID:', templateId);
    this.isDefaultTemplate = templateId === 'default';
    this.loadingError = null;

    if (this.isDefaultTemplate) {
      // Charger le template par défaut
      console.log('Loading default template');
      this.store.dispatch(new ContractTemplateAction.LoadDefaultTemplate());
    } else {
      // Charger un template utilisateur
      console.log('Loading user template:', templateId);
      this.store.dispatch(new ContractTemplateAction.FetchTemplate(templateId));
    }

    // Charger le contenu après un délai pour s'assurer que le template est chargé
    setTimeout(() => {
      this.loadContent(templateId);
    }, 500);
  }

  /**
   * Charger le contenu du modèle
   */
  loadContent(templateId: string): void {
    console.log('Loading content for template:', templateId);
    this.isLoadingContent = true;
    this.loadingError = null;

    if (this.isDefaultTemplate) {
      // Pour le template par défaut, utiliser directement l'ID spécial
      console.log('Loading default template content');
      this.contractTemplateService.getTemplateContent('default')
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('Default template content loaded:', response);
            this.content = this.sanitizer.bypassSecurityTrustHtml(response.content || '<p>Aucun contenu disponible</p>');
            this.isLoadingContent = false;
          },
          error: (error) => {
            console.error('Erreur lors du chargement du contenu par défaut:', error);
            this.loadingError = 'Impossible de charger le contenu du modèle par défaut';
            this.content = '<p>Erreur lors du chargement du contenu</p>';
            this.isLoadingContent = false;
          }
        });
    } else {
      // Pour les templates utilisateur, utiliser directement l'ID fourni
      console.log('Loading user template content for ID:', templateId);
      this.contractTemplateService.getTemplateContent(templateId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('User template content loaded:', response);
            this.content = this.sanitizer.bypassSecurityTrustHtml(response.content || '<p>Aucun contenu disponible</p>');
            this.isLoadingContent = false;
          },
          error: (error) => {
            console.error('Erreur lors du chargement du contenu utilisateur:', error);
            this.loadingError = 'Impossible de charger le contenu du modèle';
            this.content = '<p>Erreur lors du chargement du contenu</p>';
            this.isLoadingContent = false;
          }
        });
    }
  }

  /**
   * Modifier le modèle
   */
  editTemplate(): void {
    this.template$.pipe(takeUntil(this.destroy$)).subscribe(template => {
      if (template && !template.isSystemDefault) {
        const currentLang = this.languageUrlService.getCurrentLanguage();
        this.router.navigate([`/${currentLang}/app/contract-templates/edit`, template._id]);
      }
    });
  }

  /**
   * Dupliquer le modèle
   */
  duplicateTemplate(): void {
    this.template$.pipe(
      takeUntil(this.destroy$),
      take(1)
    ).subscribe(template => {
      if (template) {
        const dialogRef = this.dialog.open(DuplicateTemplateModalComponent, {
          width: '600px',
          maxWidth: '90vw',
          data: { template },
          disableClose: true,
          panelClass: 'custom-dialog-container'
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result?.success && result?.newTemplate) {
            console.log('✅ Template dupliqué avec succès:', result.newTemplate);
            const currentLang = this.languageUrlService.getCurrentLanguage();
            this.router.navigate([`/${currentLang}/app/contract-templates/edit`, result.newTemplate._id]);
          } else if (result?.success) {
            console.log('⚠️ Template dupliqué mais non retourné, utilisation du store...');
            this.store.select(ContractTemplateState.selectStateCurrentTemplate).pipe(
              takeUntil(this.destroy$),
              filter((newTemplate: ContractTemplateModel | null) =>
                newTemplate && newTemplate._id !== template._id)
            ).subscribe((newTemplate: ContractTemplateModel | null) => {
              if (newTemplate) {
                const currentLang = this.languageUrlService.getCurrentLanguage();
                this.router.navigate([`/${currentLang}/app/contract-templates/edit`, newTemplate._id]);
              } else {
                const currentLang = this.languageUrlService.getCurrentLanguage();
                this.router.navigate([`/${currentLang}/app/contract-templates/list`]);
              }
            });
          }
        });
      }
    });
  }

  /**
   * Retour à la liste
   */
  goBack(): void {
    const currentLang = this.languageUrlService.getCurrentLanguage();
    this.router.navigate([`/${currentLang}/app/contract-templates`]);
  }

  /**
   * Obtenir l'icône selon le type
   */
  getTypeIcon(type: ContractTemplateType): string {
    switch (type) {
      case ContractTemplateType.DEFAULT:
        return 'fas fa-file-contract';
      case ContractTemplateType.CUSTOM:
        return 'fas fa-file-edit';
      case ContractTemplateType.DUPLICATED:
        return 'fas fa-copy';
      default:
        return 'fas fa-file';
    }
  }

  /**
   * Obtenir le libellé du type
   */
  getTypeLabel(type: ContractTemplateType): string {
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
   * Convertir les variables personnalisées en tableau
   */
  getVariablesArray(customVariables: { [key: string]: string }): Array<{key: string, value: string}> {
    if (!customVariables) return [];
    return Object.entries(customVariables).map(([key, value]) => ({ key, value }));
  }

  /**
   * Formater la taille du fichier
   */
  formatFileSize(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Imprimer le template
   */
  printTemplate(): void {
    window.print();
  }

  /**
   * Obtenir le label du type de template
   */
  getTemplateTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'DEFAULT': 'Par défaut',
      'CUSTOM': 'Personnalisé',
      'SYSTEM': 'Système'
    };
    return labels[type] || type;
  }



  /**
   * Exporter en PDF
   */
  exportPDF(): void {
    this.printTemplate();
  }

  /**
   * Supprimer le template
   */
  deleteTemplate(): void {
    this.template$.pipe(takeUntil(this.destroy$)).subscribe(template => {
      if (template && !template.isSystemDefault) {
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
            // Dispatch l'action de suppression
            this.store.dispatch(new ContractTemplateAction.DeleteTemplate(template._id));

            // Rediriger vers la liste après suppression
            const currentLang = this.languageUrlService.getCurrentLanguage();
            this.router.navigate([`/${currentLang}/app/contract-templates`]);
          }
        });
      }
    });
  }
}
