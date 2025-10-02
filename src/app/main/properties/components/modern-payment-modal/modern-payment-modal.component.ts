import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store, Actions, ofActionSuccessful, ofActionErrored } from '@ngxs/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { ModalTranslationService } from '../../../../shared/services/modal-translation.service';
import {
  LocationPaymentModel,
  LocationPaymentAction,
  LocationPaymentType,
  PaymentMethod,
  LocataireModel,
  RoomModel,
  LocationModel,
  HistoryLocationPaymentModel,
  StatisticAction
} from 'src/app/shared/store';
import { FormUtils } from 'src/app/shared/utils';

export interface PaymentModalData {
  mode: 'create' | 'edit';
  room?: RoomModel;
  tenant?: LocataireModel;
  location?: LocationModel;
  transaction?: LocationPaymentModel;
  history?: HistoryLocationPaymentModel;
}

@Component({
  selector: 'app-modern-payment-modal',
  templateUrl: './modern-payment-modal.component.html',
  styleUrls: ['./modern-payment-modal.component.scss']
})
export class ModernPaymentModalComponent implements OnInit, OnDestroy {
  formGroup: FormGroup;
  isLoading = false;
  
  // Payment types
  paymentTypes = [
    { 
      value: LocationPaymentType.LOCATION, 
      label: 'Loyer mensuel', 
      icon: 'home',
      description: 'Paiement du loyer mensuel'
    },
    { 
      value: LocationPaymentType.CAUTION, 
      label: 'Caution', 
      icon: 'shield',
      description: 'Dépôt de garantie'
    }
  ];
  
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private store: Store,
    private actions: Actions,
    private toastr: ToastrService,
    private dialogRef: MatDialogRef<ModernPaymentModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PaymentModalData
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.setupActionListeners();
    
    if (this.data.mode === 'edit' && this.data.transaction) {
      this.populateForm();
    } else {
      this.setDefaultValues();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    const today = new Date().toISOString().split('T')[0];
    
    this.formGroup = this.formBuilder.group({
      paymentLocationType: [LocationPaymentType.LOCATION, [Validators.required]],
      locationPaymentPrice: [0, [Validators.required, Validators.min(1000)]],
      datePayment: [today, [Validators.required]],
      reason: [''],
      billingRef: [''],
      paymentMethod: ['CASH'],
      notes: ['']
    });

    // Watcher pour le type de paiement
    this.formGroup.get('paymentLocationType')?.valueChanges.subscribe(type => {
      this.updatePriceBasedOnType(type);
    });
  }

  private setDefaultValues(): void {
    // Définir le prix par défaut basé sur le type de chambre et le locataire
    if (this.data.room) {
      this.formGroup.patchValue({
        locationPaymentPrice: this.data.room.price || 0
      });
    }
    
    // Générer une référence de facturation automatique
    this.generateBillingRef();
  }

  private populateForm(): void {
    if (this.data.transaction) {
      const transaction = this.data.transaction;

      // Convertir la date au format YYYY-MM-DD pour l'input date
      let datePayment = '';
      if (transaction.datePayment) {
        const date = new Date(transaction.datePayment);
        datePayment = date.toISOString().split('T')[0];
      }

      this.formGroup.patchValue({
        paymentLocationType: transaction.paymentLocationType || LocationPaymentType.LOCATION,
        locationPaymentPrice: transaction.locationPaymentPrice || 0,
        datePayment: datePayment,
        reason: transaction.reason || '',
        billingRef: transaction.billingRef || '',
        paymentMethod: transaction.paymentMethod || 'CASH',
        notes: transaction.notes || ''
      });

      // Désactiver le champ référence en mode édition (non modifiable)
      this.formGroup.get('billingRef')?.disable();

      console.log('✅ Formulaire peuplé avec les données de transaction:', {
        type: transaction.paymentLocationType,
        amount: transaction.locationPaymentPrice,
        date: datePayment,
        ref: transaction.billingRef
      });
    }
  }

  private updatePriceBasedOnType(type: LocationPaymentType): void {
    if (type === LocationPaymentType.LOCATION && this.data.room) {
      this.formGroup.patchValue({
        locationPaymentPrice: this.data.room.price
      });
    } else if (type === LocationPaymentType.CAUTION && this.data.room?.cautionPrice) {
      this.formGroup.patchValue({
        locationPaymentPrice: this.data.room.cautionPrice
      });
    }
  }

  private generateBillingRef(): void {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = String(now.getTime()).slice(-6);
    
    const ref = `PAY-${year}${month}${day}-${time}`;
    this.formGroup.patchValue({ billingRef: ref });
  }

  private setupActionListeners(): void {
    // Succès d'ajout
    this.actions.pipe(
      ofActionSuccessful(LocationPaymentAction.AddLocationPayment),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      console.log('✅ Paiement ajouté avec succès');
      this.isLoading = false;
      this.toastr.success('Paiement enregistré avec succès', 'Succès');
      
      // Rafraîchir automatiquement les statistiques
      this.refreshStatistics();
      
      this.dialogRef.close(true);
    });

    // Succès de modification
    this.actions.pipe(
      ofActionSuccessful(LocationPaymentAction.UpdateLocationPayment),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      console.log('✅ Paiement modifié avec succès');
      this.isLoading = false;
      this.toastr.success('Paiement modifié avec succès', 'Succès');
      
      // Rafraîchir automatiquement les statistiques
      this.refreshStatistics();
      
      this.dialogRef.close(true);
    });

    // Erreurs d'ajout
    this.actions.pipe(
      ofActionErrored(LocationPaymentAction.AddLocationPayment),
      takeUntil(this.destroy$)
    ).subscribe((ctx) => {
      console.error('❌ Erreur lors de l\'ajout du paiement:', ctx);
      this.isLoading = false;
      const errorMessage = this.getErrorMessage(ctx);
      this.toastr.error(errorMessage, 'Erreur d\'ajout');
    });

    // Erreurs de modification
    this.actions.pipe(
      ofActionErrored(LocationPaymentAction.UpdateLocationPayment),
      takeUntil(this.destroy$)
    ).subscribe((ctx) => {
      console.error('❌ Erreur lors de la modification du paiement:', ctx);
      this.isLoading = false;
      const errorMessage = this.getErrorMessage(ctx);
      this.toastr.error(errorMessage, 'Erreur de modification');
    });
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
    return 'Une erreur inattendue est survenue';
  }

  onSubmit(): void {
    if (this.formGroup.invalid || this.isLoading) {
      this.formGroup.markAllAsTouched();
      this.toastr.warning('Veuillez corriger les erreurs dans le formulaire', 'Formulaire invalide');
      return;
    }

    // Validation des données requises
    if (!this.validateRequiredData()) {
      return;
    }

    this.isLoading = true;

    try {
      const formData = FormUtils.removeNullAttribut({ ...this.formGroup.value });

      // Gérer la date selon le format (string ou array)
      let datePayment = formData.datePayment;
      if (Array.isArray(datePayment)) {
        datePayment = datePayment[0];
        datePayment.setHours(6);
        datePayment = datePayment.toISOString().split("T")[0];
      } else if (typeof datePayment === 'string') {
        const date = new Date(datePayment);
        if (isNaN(date.getTime())) {
          throw new Error('Date de paiement invalide');
        }
        date.setHours(6);
        datePayment = date.toISOString().split("T")[0];
      }

      // Préparer les données selon le format attendu par le backend DTO
      const paymentData: any = {
        locationPaymentPrice: formData.locationPaymentPrice,
        paymentLocationType: formData.paymentLocationType,
        datePayment: datePayment,
        reason: formData.reason,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        // IDs requis par le DTO backend
        roomId: this.data.room?._id || this.data.transaction?.room,
        locataireId: this.data.tenant?._id || this.data.transaction?.locataire,
        propertyId: this.data.room?.property || this.data.transaction?.property
        // Note: billingRef sera généré automatiquement côté backend et ne doit pas être envoyé
      };

      // Supprimer billingRef pour la création (généré automatiquement côté backend)
      if (this.data.mode === 'create') {
        delete paymentData.billingRef;
      }

      console.log('💰 Données de paiement préparées:', paymentData);
      console.log('🔍 Validation des IDs:', {
        roomId: paymentData.roomId,
        locataireId: paymentData.locataireId,
        propertyId: paymentData.propertyId,
        locationId: this.data.location?._id
      });

      if (this.data.mode === 'create') {
        // Vérifier si on a une location réelle ou si on doit utiliser les IDs directs
        const targetLocation = this.data.location;

        if (targetLocation && targetLocation._id && !targetLocation._id.startsWith('temp_')) {
          // Cas 1: Location réelle existante
          console.log('✅ Utilisation de la location existante:', targetLocation._id);
          this.store.dispatch(new LocationPaymentAction.AddLocationPayment({
            ...paymentData,
            locationId: targetLocation._id
          }));
        } else if (this.data.room && this.data.tenant) {
          // Cas 2: Pas de location réelle, utiliser les IDs directs
          console.log('⚠️ Pas de location réelle, utilisation des IDs directs');

          // Vérifier que tous les IDs nécessaires sont présents
          if (!paymentData.roomId || !paymentData.locataireId || !paymentData.propertyId) {
            console.error('❌ IDs manquants pour créer le paiement:', {
              roomId: paymentData.roomId,
              locataireId: paymentData.locataireId,
              propertyId: paymentData.propertyId
            });
            this.isLoading = false;
            this.toastr.error('Données incomplètes pour créer le paiement', 'Erreur');
            return;
          }

          // Créer le paiement sans locationId (le backend se débrouillera)
          this.store.dispatch(new LocationPaymentAction.AddLocationPayment(paymentData));
        } else {
          console.error('❌ Données insuffisantes pour créer le paiement');
          this.isLoading = false;
          this.toastr.error('Données insuffisantes pour créer le paiement', 'Erreur');
          return;
        }
      } else {
        if (!this.data.transaction?._id || !this.data.tenant?._id) {
          console.error('Données de transaction manquantes pour la modification');
          this.isLoading = false;
          this.toastr.error('Données de transaction manquantes', 'Erreur');
          return;
        }

        this.store.dispatch(new LocationPaymentAction.UpdateLocationPayment(
          paymentData,
          this.data.transaction._id,
          this.data.tenant._id
        ));
      }
    } catch (error) {
      console.error('Erreur lors de la préparation des données:', error);
      this.isLoading = false;
      this.toastr.error('Erreur lors de la préparation des données', 'Erreur');
    }
  }

  /**
   * Valide les données requises selon le mode
   */
  private validateRequiredData(): boolean {
    if (this.data.mode === 'create') {
      if (!this.data.room?._id) {
        this.toastr.error('ID de chambre manquant', 'Erreur');
        this.isLoading = false;
        return false;
      }
      if (!this.data.tenant?._id) {
        this.toastr.error('ID de locataire manquant', 'Erreur');
        this.isLoading = false;
        return false;
      }
      if (!this.data.location?._id) {
        this.toastr.error('ID de location manquant', 'Erreur');
        this.isLoading = false;
        return false;
      }
      if (!this.data.room?.property) {
        this.toastr.error('ID de propriété manquant', 'Erreur');
        this.isLoading = false;
        return false;
      }
    } else {
      if (!this.data.transaction?._id) {
        this.toastr.error('ID de transaction manquant', 'Erreur');
        this.isLoading = false;
        return false;
      }
    }
    return true;
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  // Getters pour la validation
  get paymentLocationType() { return this.formGroup.get('paymentLocationType'); }
  get locationPaymentPrice() { return this.formGroup.get('locationPaymentPrice'); }
  get datePayment() { return this.formGroup.get('datePayment'); }
  get billingRef() { return this.formGroup.get('billingRef'); }

  getTitle(): string {
    return this.data.mode === 'create' ? 'Nouveau Paiement' : 'Modifier le Paiement';
  }

  getSubmitText(): string {
    if (this.isLoading) {
      return this.data.mode === 'create' ? 'Enregistrement...' : 'Modification...';
    }
    return this.data.mode === 'create' ? 'Enregistrer le Paiement' : 'Modifier le Paiement';
  }

  getTenantInfo(): string {
    if (this.data.tenant) {
      return this.data.tenant.fullName || 'Locataire';
    }
    return 'Aucun locataire';
  }

  getRoomInfo(): string {
    if (this.data.room) {
      return `${this.data.room.code} - ${this.formatPrice(this.data.room.price)}`;
    }
    return 'Aucune unité';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(price);
  }

  getPaymentTypeInfo(type: LocationPaymentType): any {
    return this.paymentTypes.find(pt => pt.value === type) || this.paymentTypes[0];
  }

  regenerateBillingRef(): void {
    this.generateBillingRef();
  }

  /**
   * Rafraîchit automatiquement les statistiques après un paiement
   */
  private refreshStatistics(): void {
    const propertyId = this.data.room?.property || this.data.transaction?.property;
    const currentYear = new Date().getFullYear();
    
    if (propertyId) {
      console.log('🔄 Déclenchement du rafraîchissement des statistiques pour:', {
        propertyId,
        year: currentYear
      });
      
      // Déclencher le rafraîchissement des statistiques
      this.store.dispatch(new StatisticAction.RefreshStatisticAfterPayment(propertyId, currentYear));
    } else {
      console.warn('⚠️ Impossible de rafraîchir les statistiques: propertyId manquant');
    }
  }

  // Méthodes de paiement disponibles
  getPaymentMethods() {
    return [
      { value: 'CASH', label: 'Espèces', icon: 'money' },
      { value: 'BANK_TRANSFER', label: 'Virement bancaire', icon: 'bank' },
      { value: 'MOBILE_MONEY', label: 'Mobile Money', icon: 'phone' },
      { value: 'CHECK', label: 'Chèque', icon: 'check' },
      { value: 'CARD', label: 'Carte bancaire', icon: 'card' }
    ];
  }
}
