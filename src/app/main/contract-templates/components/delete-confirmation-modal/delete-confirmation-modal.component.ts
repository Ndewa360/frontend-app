import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';

export interface DeleteConfirmationData {
  title: string;
  message: string;
  warning?: string;
  confirmText: string;
  cancelText: string;
}

@Component({
  selector: 'app-delete-confirmation-modal',
  templateUrl: './delete-confirmation-modal.component.html',
  styleUrls: ['./delete-confirmation-modal.component.scss']
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
