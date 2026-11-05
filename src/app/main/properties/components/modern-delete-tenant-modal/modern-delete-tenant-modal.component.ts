import { lastValueFrom } from 'rxjs';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LocataireModel, LocataireAction } from 'src/app/shared/store';
import { ConfirmDeleteComponent, deleteErrorMessage } from 'src/app/shared/components/confirm-delete/confirm-delete.component';

export interface DeleteTenantModalData {
  tenant: LocataireModel;
  propertyName?: string;
}

@Component({
  selector: 'app-modern-delete-tenant-modal',
  standalone: true,
  imports: [TranslatePipe, ConfirmDeleteComponent],
  template: `
    <app-confirm-delete
      [title]="'DELETE_DIALOG.TENANT.TITLE' | translate"
      [subtitle]="data.propertyName"
      [subject]="getTenantDisplayName()"
      [details]="[
        { label: ('DELETE_DIALOG.TENANT.NAME' | translate), value: getTenantDisplayName() },
        { label: ('DELETE_DIALOG.TENANT.EMAIL' | translate), value: data.tenant?.email },
        { label: ('DELETE_DIALOG.TENANT.PHONE' | translate), value: data.tenant?.phoneNumber },
        { label: ('DELETE_DIALOG.TENANT.PROPERTY' | translate), value: data.propertyName }
      ]"
      [consequences]="['DELETE_DIALOG.TENANT.CONSEQ_1' | translate]"
      [note]="'DELETE_DIALOG.TENANT.NOTE' | translate"
      [busy]="isDeleting"
      [error]="errorMessage"
      (cancel)="onCancel()"
      (confirm)="onConfirmDelete()">
    </app-confirm-delete>
  `
})
export class ModernDeleteTenantModalComponent implements OnInit {
  isDeleting = false;
  errorMessage: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<ModernDeleteTenantModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeleteTenantModalData,
    private store: Store,
    private toastr: ToastrService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  async onConfirmDelete(): Promise<void> {
    if (this.isDeleting) return;
    this.isDeleting = true;
    this.errorMessage = null;
    try {
      await lastValueFrom(this.store.dispatch(new LocataireAction.DeleteLocataire(this.data.tenant._id)), { defaultValue: undefined });
      this.toastr.success(this.translate.instant('NOTIFICATIONS.TENANT_DELETED_SUCCESS'), 'Ndewa360°');
      this.dialogRef.close(true);
    } catch (error) {
      // Erreur affichée dans la fenêtre (motif du serveur), qui reste ouverte.
      this.errorMessage = deleteErrorMessage(error, this.translate.instant('DELETE_DIALOG.TENANT.ERROR'));
      this.isDeleting = false;
    }
  }

  getTenantDisplayName(): string {
    return this.data.tenant?.fullName || this.data.tenant?.name || 'Locataire';
  }
}
