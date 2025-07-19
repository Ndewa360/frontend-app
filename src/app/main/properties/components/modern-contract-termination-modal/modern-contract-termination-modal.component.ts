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
  LocationModel, 
  LocationAction, 
  LocataireModel,
  RoomModel
} from 'src/app/shared/store';

export interface ContractTerminationModalData {
  location: LocationModel;
  tenant?: LocataireModel;
  room?: RoomModel;
}

@Component({
  selector: 'app-modern-contract-termination-modal',
  templateUrl: './modern-contract-termination-modal.component.html',
  styleUrls: ['./modern-contract-termination-modal.component.scss']
})
export class ModernContractTerminationModalComponent implements OnInit, OnDestroy {
  formGroup: FormGroup;
  isLoading = false;
  
  // Raisons de résiliation prédéfinies (seront traduites dynamiquement)
  terminationReasons: Array<{value: string, label: string, description: string}> = [];
  
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private store: Store,
    private actions: Actions,
    private toastr: ToastrService,
    private translate: TranslateService,
    private modalTranslation: ModalTranslationService,
    private dialogRef: MatDialogRef<ModernContractTerminationModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ContractTerminationModalData
  ) {
    this.initializeForm();
    this.initializeTerminationReasons();
  }

  ngOnInit(): void {
    this.setupActionListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialise les raisons de résiliation traduites
   */
  private initializeTerminationReasons(): void {
    this.terminationReasons = [
      {
        value: 'END_OF_LEASE',
        label: this.translate.instant('MODALS.CONTRACT_TERMINATION.REASONS.END_OF_LEASE'),
        description: this.translate.instant('MODALS.CONTRACT_TERMINATION.REASON_DESCRIPTIONS.END_OF_LEASE')
      },
      {
        value: 'TENANT_REQUEST',
        label: this.translate.instant('MODALS.CONTRACT_TERMINATION.REASONS.TENANT_REQUEST'),
        description: this.translate.instant('MODALS.CONTRACT_TERMINATION.REASON_DESCRIPTIONS.TENANT_REQUEST')
      },
      {
        value: 'NON_PAYMENT',
        label: this.translate.instant('MODALS.CONTRACT_TERMINATION.REASONS.NON_PAYMENT'),
        description: this.translate.instant('MODALS.CONTRACT_TERMINATION.REASON_DESCRIPTIONS.NON_PAYMENT')
      },
      {
        value: 'BREACH_OF_CONTRACT',
        label: this.translate.instant('MODALS.CONTRACT_TERMINATION.REASONS.BREACH_OF_CONTRACT'),
        description: this.translate.instant('MODALS.CONTRACT_TERMINATION.REASON_DESCRIPTIONS.BREACH_OF_CONTRACT')
      },
      {
        value: 'PROPERTY_SALE',
        label: this.translate.instant('MODALS.CONTRACT_TERMINATION.REASONS.PROPERTY_SALE'),
        description: this.translate.instant('MODALS.CONTRACT_TERMINATION.REASON_DESCRIPTIONS.PROPERTY_SALE')
      },
      {
        value: 'RENOVATION',
        label: this.translate.instant('MODALS.CONTRACT_TERMINATION.REASONS.RENOVATION'),
        description: this.translate.instant('MODALS.CONTRACT_TERMINATION.REASON_DESCRIPTIONS.RENOVATION')
      },
      {
        value: 'OTHER',
        label: this.translate.instant('MODALS.CONTRACT_TERMINATION.REASONS.OTHER'),
        description: this.translate.instant('MODALS.CONTRACT_TERMINATION.REASON_DESCRIPTIONS.OTHER')
      }
    ];
  }

  private initializeForm(): void {
    const today = new Date().toISOString().split('T')[0];
    
    this.formGroup = this.formBuilder.group({
      terminationDate: [today, [Validators.required]],
      terminationReason: ['', [Validators.required]],
      customReason: [''],
      notes: [''],
      refundDeposit: [true],
      refundAmount: [0, [Validators.min(0)]],
      finalInspectionDate: [''],
      handoverDate: [''],
      confirm: [false, [Validators.requiredTrue]]
    });

    // Watchers
    this.formGroup.get('terminationReason')?.valueChanges.subscribe(reason => {
      const customReasonControl = this.formGroup.get('customReason');
      if (reason === 'OTHER') {
        customReasonControl?.setValidators([Validators.required]);
      } else {
        customReasonControl?.clearValidators();
        customReasonControl?.setValue('');
      }
      customReasonControl?.updateValueAndValidity();
    });

    this.formGroup.get('refundDeposit')?.valueChanges.subscribe(shouldRefund => {
      const refundAmountControl = this.formGroup.get('refundAmount');
      if (!shouldRefund) {
        refundAmountControl?.setValue(0);
      }
    });
  }

  private setupActionListeners(): void {
    // Succès de résiliation
    this.actions.pipe(
      ofActionSuccessful(LocationAction.RemoveAssignationLocation),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.isLoading = false;
      this.toastr.success('Contrat résilié avec succès', 'Succès');
      this.dialogRef.close(true);
    });

    // Erreur
    this.actions.pipe(
      ofActionErrored(LocationAction.RemoveAssignationLocation),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.isLoading = false;
      this.toastr.error('Une erreur est survenue lors de la résiliation', 'Erreur');
    });
  }

  onSubmit(): void {
    if (this.formGroup.invalid || this.isLoading) {
      this.formGroup.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    
    const formData = this.formGroup.value;
    
    // Préparer les données de résiliation
    const terminationData = {
      terminationDate: formData.terminationDate,
      terminationReason: formData.terminationReason === 'OTHER' ? formData.customReason : this.getReasonLabel(formData.terminationReason),
      notes: formData.notes,
      refundDeposit: formData.refundDeposit,
      refundAmount: formData.refundAmount,
      finalInspectionDate: formData.finalInspectionDate,
      handoverDate: formData.handoverDate
    };

    // Dispatch l'action de résiliation
    this.store.dispatch(new LocationAction.RemoveAssignationLocation(
      this.data.location._id,
      terminationData.terminationReason || 'Résiliation de contrat'
    ));
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  // Getters pour la validation
  get terminationDate() { return this.formGroup.get('terminationDate'); }
  get terminationReason() { return this.formGroup.get('terminationReason'); }
  get customReason() { return this.formGroup.get('customReason'); }
  get refundAmount() { return this.formGroup.get('refundAmount'); }
  get confirm() { return this.formGroup.get('confirm'); }

  // Getters pour l'affichage
  getTenantName(): string {
    return this.data.tenant?.fullName || 'Locataire inconnu';
  }

  getRoomCode(): string {
    return this.data.room?.code || 'Unité inconnue';
  }

  getContractStartDate(): string {
    if (!this.data.location?.startedAt) return 'Date inconnue';

    const date = new Date(this.data.location.startedAt);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  getContractDuration(): string {
    if (!this.data.location?.startedAt) return 'Durée inconnue';

    const startDate = new Date(this.data.location.startedAt);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} jour(s)`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} mois`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);
      return `${years} an(s) ${remainingMonths > 0 ? `et ${remainingMonths} mois` : ''}`;
    }
  }

  getMonthlyRent(): string {
    if (!this.data.room?.price) return 'Montant inconnu';
    return this.formatPrice(this.data.room.price);
  }

  getDepositAmount(): string {
    if (!this.data.room?.cautionPrice) return 'Aucune caution';
    return this.formatPrice(this.data.room.cautionPrice);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(price);
  }

  getReasonLabel(value: string): string {
    const reason = this.terminationReasons.find(r => r.value === value);
    return reason?.label || value;
  }

  isCustomReasonRequired(): boolean {
    return this.formGroup.get('terminationReason')?.value === 'OTHER';
  }

  shouldShowRefundAmount(): boolean {
    return this.formGroup.get('refundDeposit')?.value === true;
  }

  setRefundToFullDeposit(): void {
    if (this.data.room?.cautionPrice) {
      this.formGroup.patchValue({
        refundAmount: this.data.room.cautionPrice
      });
    }
  }

  calculateProportionalRefund(): void {
    // Logique pour calculer un remboursement proportionnel
    // basé sur la durée restante du contrat, etc.
    if (this.data.room?.cautionPrice) {
      // Exemple: 80% de la caution
      const proportionalAmount = Math.floor(this.data.room.cautionPrice * 0.8);
      this.formGroup.patchValue({
        refundAmount: proportionalAmount
      });
    }
  }

  getSubmitText(): string {
    if (this.isLoading) {
      return 'Résiliation en cours...';
    }
    return 'Résilier le Contrat';
  }
}
