import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { LocataireModel, LocataireAction } from 'src/app/shared/store';

export interface DeleteTenantModalData {
  tenant: LocataireModel;
  propertyName?: string;
}

@Component({
  selector: 'app-modern-delete-tenant-modal',
  templateUrl: './modern-delete-tenant-modal.component.html',
  styleUrls: ['./modern-delete-tenant-modal.component.scss']
})
export class ModernDeleteTenantModalComponent implements OnInit {
  isDeleting = false;

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
    try {
      await this.store.dispatch(new LocataireAction.DeleteLocataire(this.data.tenant._id)).toPromise();
      this.toastr.success(this.translate.instant('NOTIFICATIONS.TENANT_DELETED_SUCCESS'), 'Ndewa360°');
      this.dialogRef.close(true);
    } catch (error) {
      this.toastr.error(this.translate.instant('NOTIFICATIONS.TENANT_DELETE_ERROR'), 'Ndewa360°');
      this.isDeleting = false;
    }
  }

  getTenantDisplayName(): string {
    return this.data.tenant?.fullName || this.data.tenant?.name || 'Locataire';
  }
}
