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

  ngOnInit(): void {
    console.log('🗑️ Modal de suppression ouvert pour:', this.data.tenant);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  async onConfirmDelete(): Promise<void> {
    if (this.isDeleting) return;

    this.isDeleting = true;

    try {
      console.log('🗑️ Suppression du locataire:', this.data.tenant._id);
      
      // Dispatch l'action de suppression
      await this.store.dispatch(new LocataireAction.DeleteLocataire(this.data.tenant._id)).toPromise();
      
      console.log('✅ Locataire supprimé avec succès');
      this.toastr.success('Locataire supprimé avec succès', 'Succès');
      this.dialogRef.close(true);
      
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      this.toastr.error('Erreur lors de la suppression du locataire', 'Erreur');
      this.isDeleting = false;
    }
  }

  getTenantDisplayName(): string {
    return this.data.tenant?.fullName ||
           this.data.tenant?.name ||
           'Locataire';
  }
}
