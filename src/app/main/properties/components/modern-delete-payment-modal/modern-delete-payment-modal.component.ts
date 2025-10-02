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
  HistoryLocationPaymentModel,
  StatisticAction
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
      ofActionSuccessful(LocationPaymentAction.DeleteLocationPayment),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      console.log('✅ Paiement supprimé avec succès');
      this.isLoading = false;
      this.toastr.success('Paiement supprimé avec succès', 'Succès');
      
      // Rafraîchir automatiquement les statistiques
      this.refreshStatistics();
      
      this.dialogRef.close(true);
    });

    // Erreur de suppression
    this.actions.pipe(
      ofActionErrored(LocationPaymentAction.DeleteLocationPayment),
      takeUntil(this.destroy$)
    ).subscribe((ctx) => {
      console.error('❌ Erreur lors de la suppression du paiement:', ctx);
      this.isLoading = false;
      const errorMessage = this.getErrorMessage(ctx);
      this.toastr.error(errorMessage, 'Erreur de suppression');
    });
  }

  onConfirmDelete(): void {
    if (this.isLoading) return;

    // Validation des données requises
    if (!this.validateDeleteData()) {
      return;
    }

    this.isLoading = true;

    console.log('🗑️ Suppression du paiement:', {
      transactionId: this.data.transaction._id,
      tenantId: this.data.history.locataire._id,
      propertyId: this.data.history.property._id
    });

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
      this.toastr.error('ID de transaction manquant', 'Erreur');
      return false;
    }
    if (!this.data.history?.locataire?._id) {
      this.toastr.error('ID de locataire manquant', 'Erreur');
      return false;
    }
    if (!this.data.history?.property?._id) {
      this.toastr.error('ID de propriété manquant', 'Erreur');
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
    return 'Une erreur inattendue est survenue lors de la suppression';
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

  /**
   * Rafraîchit automatiquement les statistiques après suppression d'un paiement
   */
  private refreshStatistics(): void {
    const propertyId = this.data.history?.property?._id;
    const currentYear = new Date().getFullYear();
    
    if (propertyId) {
      console.log('🔄 Déclenchement du rafraîchissement des statistiques après suppression pour:', {
        propertyId,
        year: currentYear
      });
      
      // Déclencher le rafraîchissement des statistiques
      this.store.dispatch(new StatisticAction.RefreshStatisticAfterPayment(propertyId, currentYear));
    } else {
      console.warn('⚠️ Impossible de rafraîchir les statistiques: propertyId manquant');
    }
  }
}
