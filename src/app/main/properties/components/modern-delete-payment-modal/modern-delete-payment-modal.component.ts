import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store, Actions, ofActionSuccessful, ofActionErrored } from '@ngxs/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { 
  LocationPaymentModel, 
  LocationPaymentAction, 
  LocationPaymentType,
  LocataireModel,
  RoomModel,
  HistoryLocationPaymentModel
} from 'src/app/shared/store';

export interface DeletePaymentModalData {
  transaction: LocationPaymentModel;
  history: HistoryLocationPaymentModel;
}

@Component({
  selector: 'app-modern-delete-payment-modal',
  templateUrl: './modern-delete-payment-modal.component.html',
  styleUrls: ['./modern-delete-payment-modal.component.scss']
})
export class ModernDeletePaymentModalComponent implements OnInit, OnDestroy {
  isLoading = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private actions: Actions,
    private toastr: ToastrService,
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
      ofActionSuccessful(LocationPaymentAction.DeletehLocationPayment),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.isLoading = false;
      this.toastr.success('Paiement supprimé avec succès', 'Succès');
      this.dialogRef.close(true);
    });

    // Erreur
    this.actions.pipe(
      ofActionErrored(LocationPaymentAction.DeletehLocationPayment),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.isLoading = false;
      this.toastr.error('Une erreur est survenue lors de la suppression', 'Erreur');
    });
  }

  onConfirmDelete(): void {
    if (this.isLoading) return;

    this.isLoading = true;
    
    // Utiliser l'action de suppression existante
    this.store.dispatch(new LocationPaymentAction.DeletehLocationPayment(
      this.data.transaction._id!,
      this.data.history.locataire._id!,
      this.data.history.property._id! // Ajouter le propertyID requis
    ));
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
}
