import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store } from '@ngxs/store';
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
            this.loading = false;
            // Récupérer le nouveau template depuis le store pour le retourner
            const newTemplate = this.store.selectSnapshot(ContractTemplateState.selectStateCurrentTemplate);
            this.dialogRef.close({ success: true, newTemplate });
          },
          error: () => {
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
      if (control.errors['required']) return 'Le nom est requis';
      if (control.errors['minlength']) return 'Le nom doit contenir au moins 3 caractères';
      if (control.errors['maxlength']) return 'Le nom ne peut pas dépasser 100 caractères';
    }
    return null;
  }

  get descriptionErrors() {
    const control = this.duplicateForm.get('description');
    if (control?.errors && control.touched) {
      if (control.errors['maxlength']) return 'La description ne peut pas dépasser 500 caractères';
    }
    return null;
  }

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
}
