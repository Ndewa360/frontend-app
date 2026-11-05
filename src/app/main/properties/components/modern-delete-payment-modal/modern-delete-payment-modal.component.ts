import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store, Actions, ofActionSuccessful, ofActionErrored } from '@ngxs/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { 
  LocationPaymentModel, 
  LocationPaymentAction, 
  LocationPaymentType,
  LocataireModel,
  RoomModel,
  HistoryLocationPaymentModel,
  StatisticAction
} from 'src/app/shared/store';
import { ConfirmDeleteComponent, deleteErrorMessage } from 'src/app/shared/components/confirm-delete/confirm-delete.component';

export interface DeletePaymentModalData {
  transaction: LocationPaymentModel;
  history: HistoryLocationPaymentModel;
}

@Component({
  selector: 'app-modern-delete-payment-modal',
  standalone: true,
  imports: [TranslatePipe, ConfirmDeleteComponent],
  template: `
    <app-confirm-delete
      [title]="'MODALS.DELETE_PAYMENT.TITLE' | translate"
      [subtitle]="'MODALS.DELETE_PAYMENT.SUBTITLE' | translate"
      [subject]="'DELETE_DIALOG.PAYMENT.SUBJECT' | translate: { ref: getBillingRef() }"
      [details]="[
        { label: ('DELETE_DIALOG.PAYMENT.TENANT' | translate), value: getTenantName() },
        { label: ('DELETE_DIALOG.PAYMENT.UNIT' | translate), value: getRoomCode() },
        { label: ('DELETE_DIALOG.PAYMENT.AMOUNT' | translate), value: getPaymentAmount() },
        { label: ('DELETE_DIALOG.PAYMENT.TYPE' | translate), value: (getPaymentTypeKey() | translate) },
        { label: ('DELETE_DIALOG.PAYMENT.DATE' | translate), value: getPaymentDate() },
        { label: ('DELETE_DIALOG.PAYMENT.REASON' | translate), value: data.transaction?.reason }
      ]"
      [consequences]="[
        'MODALS.DELETE_PAYMENT.CONSEQUENCE_1' | translate,
        'MODALS.DELETE_PAYMENT.CONSEQUENCE_2' | translate,
        'MODALS.DELETE_PAYMENT.CONSEQUENCE_3' | translate
      ]"
      [confirmLabel]="'MODALS.DELETE_PAYMENT.CONFIRM_DELETE' | translate"
      [busyLabel]="'MODALS.DELETE_PAYMENT.DELETING' | translate"
      [busy]="isLoading"
      [error]="errorMessage"
      (cancel)="onCancel()"
      (confirm)="onConfirmDelete()">
    </app-confirm-delete>
  `
})
export class ModernDeletePaymentModalComponent implements OnInit, OnDestroy {
  isLoading = false;
  errorMessage: string | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private actions: Actions,
    private toastr: ToastrService,
    private translate: TranslateService,
    private dialogRef: MatDialogRef<ModernDeletePaymentModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeletePaymentModalData
  ) {}

  ngOnInit(): void {
    this.setupActionListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupActionListeners(): void {
    // Succès de suppression
    this.actions.pipe(
      ofActionSuccessful(LocationPaymentAction.DeleteLocationPayment),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.isLoading = false;
      this.toastr.success(this.translate.instant('NOTIFICATIONS.PAYMENT_DELETED_MODAL_SUCCESS'), 'Ndewa360°');
      
      // Rafraîchir automatiquement les statistiques
      this.refreshStatistics();
      
      this.dialogRef.close(true);
    });

    // Erreur de suppression
    this.actions.pipe(
      ofActionErrored(LocationPaymentAction.DeleteLocationPayment),
      takeUntil(this.destroy$)
    ).subscribe((ctx) => {
      this.isLoading = false;
      // Erreur affichée dans la fenêtre, qui reste ouverte.
      this.errorMessage = deleteErrorMessage((ctx as any)?.result?.error ?? (ctx as any)?.error, this.translate.instant('NOTIFICATIONS.UNEXPECTED_DELETE_ERROR'));
    });
  }

  onConfirmDelete(): void {
    if (this.isLoading) return;

    // Validation des données requises
    if (!this.validateDeleteData()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;


    // Utiliser l'action de suppression corrigée
    this.store.dispatch(new LocationPaymentAction.DeleteLocationPayment(
      this.data.transaction._id!,
      this.data.history.locataire._id!,
      this.data.history.property._id! // Ajouter le propertyID requis
    ));
  }

  /**
   * Valide les données requises pour la suppression
   */
  private validateDeleteData(): boolean {
    if (!this.data.transaction?._id) {
      this.toastr.error(this.translate.instant('NOTIFICATIONS.PAYMENT_ID_MISSING'), 'Ndewa360°');
      return false;
    }
    if (!this.data.history?.locataire?._id) {
      this.toastr.error(this.translate.instant('NOTIFICATIONS.TENANT_ID_MISSING'), 'Ndewa360°');
      return false;
    }
    if (!this.data.history?.property?._id) {
      this.toastr.error(this.translate.instant('NOTIFICATIONS.PROPERTY_ID_MISSING'), 'Ndewa360°');
      return false;
    }
    return true;
  }

  /**
   * Extrait un message d'erreur lisible
   */
  private getErrorMessage(error: any): string {
    if (error?.error?.message) {
      return error.error.message;
    }
    if (error?.message) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return this.translate.instant('NOTIFICATIONS.UNEXPECTED_DELETE_ERROR');
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  // Getters pour l'affichage
  getTenantName(): string {
    return this.data.history?.locataire?.fullName || 'Locataire inconnu';
  }

  getRoomCode(): string {
    return this.data.history?.room?.code || 'Unité inconnue';
  }

  getPaymentAmount(): string {
    return this.formatPrice(this.data.transaction?.locationPaymentPrice || 0);
  }

  getPaymentDate(): string {
    if (!this.data.transaction?.datePayment) return 'Date inconnue';
    
    const date = new Date(this.data.transaction.datePayment);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  /** Clé de traduction du type de paiement. */
  getPaymentTypeKey(): string {
    switch (this.data.transaction?.paymentLocationType) {
    case LocationPaymentType.LOCATION:
      return 'DELETE_DIALOG.PAYMENT.RENT';
    case LocationPaymentType.CAUTION:
      return 'DELETE_DIALOG.PAYMENT.DEPOSIT';
    default:
      return 'DELETE_DIALOG.PAYMENT.OTHER';
    }
  }

  getPaymentType(): string {
    switch (this.data.transaction?.paymentLocationType) {
    case LocationPaymentType.LOCATION:
      return 'Loyer mensuel';
    case LocationPaymentType.CAUTION:
      return 'Caution';
    default:
      return 'Autre';
    }
  }

  getPaymentMethod(): string {
    // Note: paymentMethod n'existe pas dans LocationPaymentModel, utilisons une valeur par défaut
    return 'Non spécifié';
  }

  getBillingRef(): string {
    return this.data.transaction?.billingRef || 'Aucune référence';
  }

  getReason(): string {
    return this.data.transaction?.reason || 'Aucun motif spécifié';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(price);
  }

  getPaymentTypeColor(): string {
    switch (this.data.transaction?.paymentLocationType) {
    case LocationPaymentType.LOCATION:
      return 'text-green-600 bg-green-100';
    case LocationPaymentType.CAUTION:
      return 'text-blue-600 bg-blue-100';
    default:
      return 'text-gray-600 bg-gray-100';
    }
  }

  getPaymentTypeIcon(): string {
    switch (this.data.transaction?.paymentLocationType) {
    case LocationPaymentType.LOCATION:
      return 'home';
    case LocationPaymentType.CAUTION:
      return 'shield';
    default:
      return 'money';
    }
  }

  /**
   * Rafraîchit automatiquement les statistiques après suppression d'un paiement
   */
  private refreshStatistics(): void {
    const propertyId = this.data.history?.property?._id;
    const currentYear = new Date().getFullYear();
    
    if (propertyId) {
             
      // Déclencher le rafraîchissement des statistiques
      this.store.dispatch(new StatisticAction.RefreshStatisticAfterPayment(propertyId, currentYear));
    } else {
    }
  }
}
