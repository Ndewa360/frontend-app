import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { ContractTemplateModel, ContractTemplateType } from '../../../../shared/models/contract-template.model';
import { ContractTemplateAction, ContractTemplateState } from '../../../../shared/store/contract-templates';

export interface TemplateSelectionData {
  title: string;
  message: string;
  allowSystemTemplates?: boolean;
  excludeTemplateId?: string;
}

export interface TemplateSelectionResult {
  selectedTemplate: ContractTemplateModel;
  action: 'duplicate' | 'select';
}

@Component({
  selector: 'app-template-selection-modal',
  templateUrl: './template-selection-modal.component.html',
  styleUrls: ['./template-selection-modal.component.scss']
})
export class TemplateSelectionModalComponent implements OnInit {
  templates$: Observable<ContractTemplateModel[]>;
  loading$: Observable<boolean>;
  selectedTemplate: ContractTemplateModel | null = null;
  
  // Filtres
  searchTerm = '';
  selectedType: ContractTemplateType | 'ALL' = 'ALL';
  showSystemTemplates = true;
  
  templateTypes: { value: string; label: string }[] = [];

  constructor(
    public dialogRef: MatDialogRef<TemplateSelectionModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TemplateSelectionData,
    private store: Store,
    private translateService: TranslateService
  ) {
    this.showSystemTemplates = data.allowSystemTemplates !== false;
    this.initializeTemplateTypes();
  }

  private initializeTemplateTypes(): void {
    this.templateTypes = [
      { value: 'ALL', label: this.translateService.instant('CONTRACT_TEMPLATES.LIST.FILTERS.ALL_TYPES') },
      { value: ContractTemplateType.DEFAULT, label: this.translateService.instant('CONTRACT_TEMPLATES.TYPES.DEFAULT') },
      { value: ContractTemplateType.CUSTOM, label: this.translateService.instant('CONTRACT_TEMPLATES.TYPES.CUSTOM') },
      { value: ContractTemplateType.DUPLICATED, label: this.translateService.instant('CONTRACT_TEMPLATES.TYPES.DUPLICATED') }
    ];
  }

  ngOnInit(): void {
    // Charger les templates
    this.store.dispatch(new ContractTemplateAction.FetchTemplates());
    
    this.templates$ = this.store.select(ContractTemplateState.selectStateTemplates);
    this.loading$ = this.store.select(ContractTemplateState.selectStateLoading);
  }

  /**
   * Filtrer les templates selon les critères
   */
  getFilteredTemplates(templates: ContractTemplateModel[]): ContractTemplateModel[] {
    if (!templates) return [];

    return templates.filter(template => {
      // Exclure le template spécifié
      if (this.data.excludeTemplateId && template._id === this.data.excludeTemplateId) {
        return false;
      }

      // Filtrer par type
      if (this.selectedType !== 'ALL' && template.type !== this.selectedType) {
        return false;
      }

      // Filtrer les templates système si nécessaire
      if (!this.showSystemTemplates && template.isSystemDefault) {
        return false;
      }

      // Filtrer par terme de recherche
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        return template.name.toLowerCase().includes(searchLower) ||
               template.description.toLowerCase().includes(searchLower);
      }

      return true;
    });
  }

  /**
   * Sélectionner un template
   */
  selectTemplate(template: ContractTemplateModel): void {
    this.selectedTemplate = template;
  }

  /**
   * Confirmer la sélection
   */
  confirm(): void {
    if (this.selectedTemplate) {
      const result: TemplateSelectionResult = {
        selectedTemplate: this.selectedTemplate,
        action: 'duplicate'
      };
      this.dialogRef.close(result);
    }
  }

  /**
   * Annuler
   */
  cancel(): void {
    this.dialogRef.close();
  }

  /**
   * Obtenir l'icône du type de template
   */
  getTemplateTypeIcon(type: ContractTemplateType): string {
    switch (type) {
      case ContractTemplateType.DEFAULT:
        return 'fa-star';
      case ContractTemplateType.CUSTOM:
        return 'fa-edit';
      case ContractTemplateType.DUPLICATED:
        return 'fa-copy';
      default:
        return 'fa-file';
    }
  }

  /**
   * Obtenir le label du type de template
   */
  getTemplateTypeLabel(type: ContractTemplateType): string {
    switch (type) {
      case ContractTemplateType.DEFAULT:
        return this.translateService.instant('CONTRACT_TEMPLATES.TYPES.DEFAULT');
      case ContractTemplateType.CUSTOM:
        return this.translateService.instant('CONTRACT_TEMPLATES.TYPES.CUSTOM');
      case ContractTemplateType.DUPLICATED:
        return this.translateService.instant('CONTRACT_TEMPLATES.TYPES.DUPLICATED');
      default:
        return this.translateService.instant('CONTRACT_TEMPLATES.TYPES.UNKNOWN');
    }
  }
}
