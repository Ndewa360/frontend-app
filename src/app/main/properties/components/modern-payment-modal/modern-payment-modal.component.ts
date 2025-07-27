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
  LocataireModel,
  RoomModel,
  LocationModel,
  HistoryLocationPaymentModel
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
        paymentMethod: 'CASH', // Valeur par défaut car paymentMethod n'existe pas dans le modèle
        notes: '' // Valeur par défaut car notes n'existe pas dans le modèle
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
      this.isLoading = false;
      this.toastr.success('Paiement enregistré avec succès', 'Succès');
      this.dialogRef.close(true);
    });

    // Succès de modification
    this.actions.pipe(
      ofActionSuccessful(LocationPaymentAction.UpdateLocationPayment),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.isLoading = false;
      this.toastr.success('Paiement modifié avec succès', 'Succès');
      this.dialogRef.close(true);
    });

    // Erreurs
    this.actions.pipe(
      ofActionErrored(LocationPaymentAction.AddLocationPayment, LocationPaymentAction.UpdateLocationPayment),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.isLoading = false;
      this.toastr.error('Une erreur est survenue', 'Erreur');
    });
  }

  onSubmit(): void {
    if (this.formGroup.invalid || this.isLoading) {
      this.formGroup.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    
    const formData = FormUtils.removeNullAttribut({ ...this.formGroup.value });
    
    // Gérer la date selon le format (string ou array)
    let datePayment = formData.datePayment;
    if (Array.isArray(datePayment)) {
      datePayment = datePayment[0];
      datePayment.setHours(6);
      datePayment = datePayment.toISOString().split("T")[0];
    } else if (typeof datePayment === 'string') {
      const date = new Date(datePayment);
      date.setHours(6);
      datePayment = date.toISOString().split("T")[0];
    }

    const paymentData: LocationPaymentModel = {
      ...formData,
      datePayment: datePayment,
      room: this.data.room?._id || this.data.transaction?.room,
      locataire: this.data.tenant?._id || this.data.transaction?.locataire,
      property: this.data.room?.property || this.data.transaction?.property
    };
    if (this.data.mode === 'create') {
      // Utiliser la location appropriée
      const targetLocation = this.data.location;
      
      if (!targetLocation) {
        console.error('Aucune location disponible pour créer le paiement');
        this.isLoading = false;
        this.toastr.error('Aucune location disponible', 'Erreur');
        return;
      }

      this.store.dispatch(new LocationPaymentAction.AddLocationPayment({
        ...paymentData,
        location: targetLocation._id
      }));
    } else {
      this.store.dispatch(new LocationPaymentAction.UpdateLocationPayment(
        paymentData,
        this.data.transaction!._id!,
        this.data.tenant!._id!
      ));
    }
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
