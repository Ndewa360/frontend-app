import { lastValueFrom } from 'rxjs';
import { Component, Inject } from '@angular/core';
import { ConfirmDeleteComponent, deleteErrorMessage } from 'src/app/shared/components/confirm-delete/confirm-delete.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PropertyAction, PropertyModel } from 'src/app/shared/store';

export interface DeletePropertyModalData {
  property: PropertyModel;
}

/**
 * Confirmation de suppression d'un bien. Le serveur refuse la suppression tant
 * que le bien a des locations en cours : le message renvoyé est alors affiché.
 */
@Component({
  selector: 'app-delete-property-modal',
  standalone: true,
  imports: [TranslatePipe, ConfirmDeleteComponent],
  template: `
    <app-confirm-delete
      [title]="'PROPERTIES.DELETE.TITLE' | translate"
      [subject]="data.property?.name"
      [consequences]="['DELETE_DIALOG.PROPERTY.CONSEQ_1' | translate, 'DELETE_DIALOG.PROPERTY.CONSEQ_2' | translate]"
      [note]="'DELETE_DIALOG.PROPERTY.NOTE' | translate"
      [confirmText]="data.property?.name"
      [busy]="isDeleting"
      [error]="errorMessage"
      (cancel)="onCancel()"
      (confirm)="onConfirm()">
    </app-confirm-delete>
  `,
})
export class DeletePropertyModalComponent {
  isDeleting = false;
  errorMessage: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<DeletePropertyModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeletePropertyModalData,
    private store: Store,
    private toastr: ToastrService,
    private translate: TranslateService,
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  async onConfirm(): Promise<void> {
    if (this.isDeleting || !this.data.property?._id) return;
    this.isDeleting = true;
    this.errorMessage = null;
    try {
      await lastValueFrom(this.store.dispatch(new PropertyAction.DeleteProperty(this.data.property._id)), { defaultValue: undefined });
      this.toastr.success(this.translate.instant('PROPERTIES.DELETE.SUCCESS'), 'Ndewa360°');
      this.dialogRef.close(true);
    } catch (error: any) {
      // Motif du serveur (ex. locations en cours) affiché dans la fenêtre.
      this.errorMessage = deleteErrorMessage(error, this.translate.instant('PROPERTIES.DELETE.ERROR'));
      this.isDeleting = false;
    }
  }
}
