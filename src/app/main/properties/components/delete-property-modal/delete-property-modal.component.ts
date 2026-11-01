import { lastValueFrom } from 'rxjs';
import { Component, Inject } from '@angular/core';
import { NgIf } from '@angular/common';
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
  imports: [NgIf, TranslatePipe],
  template: `
    <div class="dpm">
      <div class="dpm__icon"><i class="fas fa-trash-alt"></i></div>
      <h2 class="dpm__title">{{ 'PROPERTIES.DELETE.TITLE' | translate }}</h2>
      <p class="dpm__text">
        {{ 'PROPERTIES.DELETE.CONFIRM' | translate: { name: data.property?.name || '' } }}
      </p>
      <p class="dpm__warning">{{ 'PROPERTIES.DELETE.WARNING' | translate }}</p>
      <p *ngIf="errorMessage" class="dpm__error">{{ errorMessage }}</p>
      <div class="dpm__actions">
        <button type="button" class="dpm__btn dpm__btn--cancel" (click)="onCancel()" [disabled]="isDeleting">
          {{ 'COMMON.CANCEL' | translate }}
        </button>
        <button type="button" class="dpm__btn dpm__btn--danger" (click)="onConfirm()" [disabled]="isDeleting">
          {{ (isDeleting ? 'PROPERTIES.DELETE.IN_PROGRESS' : 'PROPERTIES.DELETE.BUTTON') | translate }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dpm { padding: 24px; text-align: center; max-width: 480px; }
    .dpm__icon { width: 56px; height: 56px; margin: 0 auto 16px; border-radius: 50%; background: #fee2e2; color: #dc2626;
      display: flex; align-items: center; justify-content: center; font-size: 22px; }
    .dpm__title { font-size: 1.25rem; font-weight: 600; margin: 0 0 8px; }
    .dpm__text { margin: 0 0 8px; }
    .dpm__warning { font-size: .875rem; color: #6b7280; margin: 0 0 16px; }
    .dpm__error { font-size: .875rem; color: #dc2626; background: #fef2f2; border-radius: 8px; padding: 8px 12px; margin: 0 0 16px; }
    .dpm__actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
    .dpm__btn { min-height: 44px; padding: 0 20px; border-radius: 8px; font-weight: 600; cursor: pointer; border: 1px solid transparent; }
    .dpm__btn:disabled { opacity: .6; cursor: not-allowed; }
    .dpm__btn--cancel { background: #fff; border-color: #d1d5db; color: #374151; }
    .dpm__btn--danger { background: #dc2626; color: #fff; }
  `],
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
      const message = error?.error?.message;
      this.errorMessage = (Array.isArray(message) ? message[0] : message) || this.translate.instant('PROPERTIES.DELETE.ERROR');
      this.isDeleting = false;
    }
  }
}
