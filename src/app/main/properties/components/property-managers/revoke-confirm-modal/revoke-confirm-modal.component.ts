import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIf, NgFor } from '@angular/common';

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
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    TranslatePipe
  ]
})
export class RevokeConfirmModalComponent {
  constructor(
    public dialogRef: MatDialogRef<RevokeConfirmModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RevokeConfirmModalData
  ) {}

  confirm(): void {
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
