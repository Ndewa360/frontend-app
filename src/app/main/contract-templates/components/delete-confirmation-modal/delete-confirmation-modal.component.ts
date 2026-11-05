import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { ConfirmDeleteComponent } from 'src/app/shared/components/confirm-delete/confirm-delete.component';

export interface DeleteConfirmationData {
  title: string;
  message: string;
  warning?: string;
  confirmText: string;
  cancelText: string;
}

@Component({
  selector: 'app-delete-confirmation-modal',
  standalone: true,
  imports: [TranslatePipe, ConfirmDeleteComponent],
  template: `
    <app-confirm-delete
      [title]="data.title | translate"
      [subtitle]="'CONTRACT_TEMPLATES.MODALS.DELETE_CONFIRMATION.SUBTITLE' | translate"
      [lead]="data.message | translate"
      [note]="data.warning ? (data.warning | translate) : null"
      [confirmLabel]="data.confirmText | translate"
      [cancelLabel]="data.cancelText | translate"
      (cancel)="cancel()"
      (confirm)="confirm()">
    </app-confirm-delete>
  `
})
export class DeleteConfirmationModalComponent {

  constructor(
    public dialogRef: MatDialogRef<DeleteConfirmationModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeleteConfirmationData,
    private translateService: TranslateService
  ) {}

  /**
   * Confirmer la suppression
   */
  confirm(): void {
    this.dialogRef.close(true);
  }

  /**
   * Annuler la suppression
   */
  cancel(): void {
    this.dialogRef.close(false);
  }
}
