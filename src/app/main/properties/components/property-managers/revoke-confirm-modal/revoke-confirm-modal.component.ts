import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { ConfirmDeleteComponent } from 'src/app/shared/components/confirm-delete/confirm-delete.component';

export interface RevokeConfirmModalData {
  managerName: string;
  managerEmail: string;
  propertyName: string;
  permissions: string[];
}

@Component({
  selector: 'app-revoke-confirm-modal',
  standalone: true,
  imports: [TranslatePipe, ConfirmDeleteComponent],
  template: `
    <app-confirm-delete
      icon="fas fa-user-slash"
      tone="warning"
      [title]="'PROPERTY_MANAGERS.REVOKE_MODAL.TITLE' | translate"
      [subtitle]="'PROPERTY_MANAGERS.REVOKE_MODAL.SUBTITLE' | translate"
      [lead]="'PROPERTY_MANAGERS.REVOKE_MODAL.WARNING' | translate"
      [details]="[
        { label: ('DELETE_DIALOG.MANAGER.MANAGER' | translate), value: data.managerName },
        { label: ('DELETE_DIALOG.MANAGER.EMAIL' | translate), value: data.managerEmail },
        { label: ('DELETE_DIALOG.MANAGER.PROPERTY' | translate), value: data.propertyName },
        { label: ('DELETE_DIALOG.MANAGER.PERMISSIONS' | translate), value: data.permissions?.join(', ') }
      ]"
      [cancelLabel]="'PROPERTY_MANAGERS.REVOKE_MODAL.CANCEL' | translate"
      [confirmLabel]="'PROPERTY_MANAGERS.REVOKE_MODAL.CONFIRM' | translate"
      (cancel)="cancel()"
      (confirm)="confirm()">
    </app-confirm-delete>
  `
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
