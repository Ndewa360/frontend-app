import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store } from '@ngxs/store';
import { TranslateService } from '@ngx-translate/core';
import { ContractTemplateAction, ContractTemplateState } from '../../../../shared/store/contract-templates';
import { ContractTemplateModel, ContractTemplateType } from '../../../../shared/store/contract-templates/contract-template.model';

export interface DuplicateTemplateData {
  template: ContractTemplateModel;
}

@Component({
  selector: 'app-duplicate-template-modal',
  templateUrl: './duplicate-template-modal.component.html',
  styleUrls: ['./duplicate-template-modal.component.scss']
})
export class DuplicateTemplateModalComponent {
  duplicateForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private translateService: TranslateService,
    public dialogRef: MatDialogRef<DuplicateTemplateModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DuplicateTemplateData
  ) {
    this.duplicateForm = this.fb.group({
      name: [
        `${this.data.template.name} (Copie)`,
        [Validators.required, Validators.minLength(3), Validators.maxLength(100)]
      ],
      description: [
        this.data.template.description ? `${this.data.template.description} (Copie)` : '',
        [Validators.maxLength(500)]
      ]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onDuplicate(): void {
    if (this.duplicateForm.valid && !this.loading) {
      this.loading = true;
      
      const duplicateDto = {
        sourceTemplateId: this.data.template._id,
        name: this.duplicateForm.value.name.trim(),
        description: this.duplicateForm.value.description?.trim() || undefined
      };

      this.store.dispatch(new ContractTemplateAction.DuplicateTemplate(duplicateDto))
        .subscribe({
          next: () => {
            // Petit délai pour s'assurer que le store est mis à jour
            setTimeout(() => {
              this.loading = false;
              // Récupérer le nouveau template depuis le store pour le retourner
              const newTemplate = this.store.selectSnapshot(ContractTemplateState.selectStateCurrentTemplate);
              console.log('✅ Template dupliqué, fermeture de la modal:', newTemplate?._id);
              this.dialogRef.close({ success: true, newTemplate });
            }, 100);
          },
          error: (error) => {
            console.error('❌ Erreur lors de la duplication:', error);
            this.loading = false;
            this.dialogRef.close({ success: false });
          }
        });
    }
  }

  // Getters pour les erreurs de validation
  get nameErrors() {
    const control = this.duplicateForm.get('name');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return this.translateService.instant('ERRORS.REQUIRED_FIELD');
      if (control.errors['minlength']) return this.translateService.instant('ERRORS.MIN_LENGTH', { min: 3 });
      if (control.errors['maxlength']) return this.translateService.instant('ERRORS.MAX_LENGTH', { max: 100 });
    }
    return null;
  }

  get descriptionErrors() {
    const control = this.duplicateForm.get('description');
    if (control?.errors && control.touched) {
      if (control.errors['maxlength']) return this.translateService.instant('ERRORS.MAX_LENGTH', { max: 500 });
    }
    return null;
  }

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
