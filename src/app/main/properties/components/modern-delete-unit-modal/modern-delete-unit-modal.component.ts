import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { RoomModel, RoomAction } from 'src/app/shared/store';

export interface DeleteUnitModalData {
  unit: RoomModel;
  propertyName?: string;
}

@Component({
  selector: 'app-modern-delete-unit-modal',
  templateUrl: './modern-delete-unit-modal.component.html',
  styleUrls: ['./modern-delete-unit-modal.component.scss']
})
export class ModernDeleteUnitModalComponent implements OnInit {
  isDeleting = false;

  constructor(
    public dialogRef: MatDialogRef<ModernDeleteUnitModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeleteUnitModalData,
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
      await this.store.dispatch(new RoomAction.DeleteRoom(this.data.unit._id)).toPromise();
      this.toastr.success(this.translate.instant('NOTIFICATIONS.UNIT_DELETED_SUCCESS'), 'Ndewa360°');
      this.dialogRef.close(true);
    } catch (error) {
      this.toastr.error(this.translate.instant('NOTIFICATIONS.UNIT_DELETE_ERROR'), 'Ndewa360°');
      this.isDeleting = false;
    }
  }

  getUnitDisplayName(): string {
    return this.data.unit?.code || `Unité ${this.data.unit?._id?.slice(-6)}` || 'Unité';
  }

  getUnitTypeLabel(): string {
    const typeLabels: Record<string, string> = {
      'STUDIO': 'Studio', 'APPARTEMENT': 'Appartement',
      'CHAMBRE': 'Chambre', 'MAISON': 'Maison',
      'BUREAU': 'Bureau', 'COMMERCE': 'Commerce'
    };
    return typeLabels[this.data.unit?.type] || this.data.unit?.type || 'Non spécifié';
  }

  formatPrice(price: number): string {
    if (!price) return 'Non spécifié';
    return new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(price);
  }
}
