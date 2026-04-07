import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface RevokeConfirmModalData {
  managerName: string;
  managerEmail: string;
  propertyName: string;
  permissions: string[];
}

@Component({
  selector: 'app-revoke-confirm-modal',
  templateUrl: './revoke-confirm-modal.component.html',
  styleUrls: ['./revoke-confirm-modal.component.scss'],
})
export class RevokeConfirmModalComponent {
  constructor(
    public dialogRef: MatDialogRef<RevokeConfirmModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RevokeConfirmModalData,
  ) {}

  confirm(): void {
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
