import { lastValueFrom } from 'rxjs';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { RoomModel, RoomAction } from 'src/app/shared/store';
import { ConfirmDeleteComponent, deleteErrorMessage } from 'src/app/shared/components/confirm-delete/confirm-delete.component';

export interface DeleteUnitModalData {
  unit: RoomModel;
  propertyName?: string;
}

@Component({
  selector: 'app-modern-delete-unit-modal',
  standalone: true,
  imports: [TranslatePipe, ConfirmDeleteComponent],
  template: `
    <app-confirm-delete
      [title]="'DELETE_DIALOG.UNIT.TITLE' | translate"
      [subtitle]="data.propertyName"
      [subject]="getUnitDisplayName()"
      [details]="[
        { label: ('DELETE_DIALOG.UNIT.CODE' | translate), value: getUnitDisplayName() },
        { label: ('DELETE_DIALOG.UNIT.TYPE' | translate), value: getUnitTypeLabel() },
        { label: ('DELETE_DIALOG.UNIT.PRICE' | translate), value: data.unit?.price ? formatPrice(data.unit.price) : null },
        { label: ('DELETE_DIALOG.UNIT.STATUS' | translate), value: ((data.unit?.isFree ? 'DELETE_DIALOG.UNIT.FREE' : 'DELETE_DIALOG.UNIT.OCCUPIED') | translate) },
        { label: ('DELETE_DIALOG.UNIT.PROPERTY' | translate), value: data.propertyName }
      ]"
      [consequences]="['DELETE_DIALOG.UNIT.CONSEQ_1' | translate, 'DELETE_DIALOG.UNIT.CONSEQ_2' | translate]"
      [note]="'DELETE_DIALOG.UNIT.NOTE' | translate"
      [busy]="isDeleting"
      [error]="errorMessage"
      (cancel)="onCancel()"
      (confirm)="onConfirmDelete()">
    </app-confirm-delete>
  `
})
export class ModernDeleteUnitModalComponent implements OnInit {
  isDeleting = false;
  errorMessage: string | null = null;

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
    this.errorMessage = null;
    try {
      await lastValueFrom(this.store.dispatch(new RoomAction.DeleteRoom(this.data.unit._id)), { defaultValue: undefined });
      this.toastr.success(this.translate.instant('NOTIFICATIONS.UNIT_DELETED_SUCCESS'), 'Ndewa360°');
      this.dialogRef.close(true);
    } catch (error) {
      // Erreur affichée dans la fenêtre (motif du serveur), qui reste ouverte.
      this.errorMessage = deleteErrorMessage(error, this.translate.instant('DELETE_DIALOG.UNIT.ERROR'));
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
