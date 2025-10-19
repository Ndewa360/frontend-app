import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { Store, Actions, ofActionSuccessful, ofActionErrored } from '@ngxs/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { FormUtils } from 'src/app/shared/utils';

import { 
  RoomModel, 
  RoomAction, 
  RoomType,
  PropertyModel 
} from 'src/app/shared/store';
import {
  UploadFilesAction,
  FileUploadContentType,
  ContentUploadRoomType
} from 'src/app/shared/store/files-upload';
import {
  SubscriptionLimitAction,
  SubscriptionLimitState
} from 'src/app/shared/store/subscription-limit';
import {
  SubscriptionLimitModalComponent,
  SubscriptionLimitModalData
} from 'src/app/shared/components/subscription-limit-modal/subscription-limit-modal.component';

export interface UnitModalData {
  mode: 'create' | 'edit';
  property: PropertyModel;
  unit?: RoomModel;
}

@Component({
  selector: 'app-modern-unit-modal',
  templateUrl: './modern-unit-modal.component.html',
  styleUrls: ['./modern-unit-modal.component.scss']
})
export class ModernUnitModalComponent implements OnInit, OnDestroy {
  formGroup: FormGroup;
  isLoading = false;
  
  // Images upload
  selectedImages: File[] = [];
  imagePreviews: string[] = [];
  isUploadingImages = false;
  
  // Room types
  roomTypes = [
    { value: RoomType.ROOM, label: this.translate.instant('ROOM_TYPES.ROOM'), icon: 'bed' },
    { value: RoomType.STUDIO, label: this.translate.instant('ROOM_TYPES.STUDIO'), icon: 'home' },
    { value: RoomType.SIMPLE_APARTMENT, label: this.translate.instant('ROOM_TYPES.SIMPLE_APARTMENT'), icon: 'apartment' },
    { value: RoomType.FURNISHED_APARTMENT, label: this.translate.instant('ROOM_TYPES.FURNISHED_APARTMENT'), icon: 'chair' }
  ];
  
  private destroy$ = new Subject<void>();

  // Déterminer si l'utilisateur est un agent
  isAgent = false;
  currentUser: any = null;

  constructor(
    private formBuilder: FormBuilder,
    private store: Store,
    private actions: Actions,
    private toastr: ToastrService,
    private translate: TranslateService,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<ModernUnitModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UnitModalData
  ) {
    // Vérifier si l'utilisateur est un agent
    this.currentUser = this.store.selectSnapshot(state => state.userProfile?.user);
    this.isAgent = this.currentUser?.userType === 'AGENT';
    
    this.initializeForm();
  }

  ngOnInit(): void {
    this.setupActionListeners();
    this.updateRoomTypes();
    
    if (this.data.mode === 'edit' && this.data.unit) {
      this.populateForm();
    }
  }

  private updateRoomTypes(): void {
    this.roomTypes = [
      { value: RoomType.ROOM, label: this.translate.instant('ROOM_TYPES.ROOM'), icon: 'bed' },
      { value: RoomType.STUDIO, label: this.translate.instant('ROOM_TYPES.STUDIO'), icon: 'home' },
      { value: RoomType.SIMPLE_APARTMENT, label: this.translate.instant('ROOM_TYPES.SIMPLE_APARTMENT'), icon: 'apartment' },
      { value: RoomType.FURNISHED_APARTMENT, label: this.translate.instant('ROOM_TYPES.FURNISHED_APARTMENT'), icon: 'chair' }
    ];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.formGroup = this.formBuilder.group({
      // Informations de base
      code: [{value: '', disabled: true}],
      type: [RoomType.ROOM, [Validators.required]],
      price: [0, [Validators.required, Validators.min(1000)]],
      description: [''],
      
      // Spécificités
      numberOfBathroom: [1, [Validators.min(0)]],
      numberOfLivingRoom: [0, [Validators.min(0)]],
      numberOfShower: [1, [Validators.min(0)]],
      isInternalShower: [true],
      hasKitchen: [false],
      isInternalKitchen: [false],
      numberOfKitchen: [0, [Validators.min(0)]], 
      
      // Caution
      shouldPayCaution: [false],
      cautionPrice: [0, [Validators.min(0)]],
      
      // Visibilité
      isActiveForSouscription: [true],
      isShowToPublic: [false],
      
      // Statut de disponibilité (pour les agents)
      isFree: [true]
    });

    // Watchers pour les dépendances
    this.formGroup.get('hasKitchen')?.valueChanges.subscribe(hasKitchen => {
      const kitchenCountControl = this.formGroup.get('numberOfKitchen');
      const internalKitchenControl = this.formGroup.get('isInternalKitchen');
      
      if (hasKitchen) {
        kitchenCountControl?.setValue(Math.max(1, kitchenCountControl?.value || 0));
      } else {
        kitchenCountControl?.setValue(0);
        internalKitchenControl?.setValue(false);
      }
    });

    this.formGroup.get('shouldPayCaution')?.valueChanges.subscribe(shouldPay => {
      const cautionPriceControl = this.formGroup.get('cautionPrice');
      if (!shouldPay) {
        cautionPriceControl?.setValue(0);
      }
    });
    
    // Validation personnalisée pour s'assurer que le formulaire est valide
    this.formGroup.statusChanges.subscribe(status => {
      console.log('Form status:', status, 'Form errors:', this.getFormErrors());
    });
  }
  
  // Helper pour déboguer les erreurs de validation
  private getFormErrors(): any {
    const errors: any = {};
    Object.keys(this.formGroup.controls).forEach(key => {
      const control = this.formGroup.get(key);
      if (control && control.errors) {
        errors[key] = control.errors;
      }
    });
    return errors;
  }

  private populateForm(): void {
    if (this.data.unit) {
      const unit = this.data.unit;
      this.formGroup.patchValue({
        code: unit.code || null,
        type: unit.type || RoomType.ROOM,
        price: unit.price || 0,
        description: unit.description || '',
        numberOfBathroom: unit.specifity?.numberOfBathroom || 1,
        numberOfLivingRoom: unit.specifity?.numberOfLivingRoom || 0,
        numberOfShower: unit.specifity?.numberOfShower || 1,
        isInternalShower: unit.specifity?.isInternalShower ?? true,
        hasKitchen: unit.specifity?.hasKitchen ?? false,
        isInternalKitchen: unit.specifity?.isInternalKitchen ?? false,
        numberOfKitchen: unit.specifity?.numberOfKitchen || 0,
        shouldPayCaution: unit.shouldPayCaution ?? false,
        cautionPrice: unit.cautionPrice || 0,
        isActiveForSouscription: unit.isActiveForSouscription ?? true,
        isShowToPublic: unit.isShowToPublic ?? false,
        isFree: unit.isFree ?? true
      });

      // Désactiver le champ prix si l'unité est occupée
      if (this.isUnitOccupied()) {
        this.formGroup.get('price')?.disable();
        console.log('💡 Champ prix désactivé car l\'unité est occupée');
      }
      
      // Le code est toujours désactivé (généré automatiquement)
      this.formGroup.get('code')?.disable();

      // Charger les images existantes
      if (unit.medias && unit.medias.length > 0) {
        this.imagePreviews = [...unit.medias];
      }
    }
  }

  /**
   * Vérifier si l'unité est occupée
   */
  isUnitOccupied(): boolean {
    if (!this.data.unit) return false;

    // Une unité est considérée comme occupée si elle a un locataire actif
    return this.data.unit.locataire && this.data.unit.locataire.length > 0;
  }

  private setupActionListeners(): void {
    // Succès de création
    this.actions.pipe(
      ofActionSuccessful(RoomAction.CreateRoom),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.isLoading = false;
      this.toastr.success(
        this.translate.instant('NOTIFICATIONS.UNIT_CREATED_SUCCESS'),
        this.translate.instant('NOTIFICATIONS.SUCCESS')
      );
      this.dialogRef.close(true);
    });

    // Succès de modification
    this.actions.pipe(
      ofActionSuccessful(RoomAction.UpdateRoom),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.isLoading = false;
      this.toastr.success(
        this.translate.instant('NOTIFICATIONS.UNIT_UPDATED_SUCCESS'),
        this.translate.instant('NOTIFICATIONS.SUCCESS')
      );
      this.dialogRef.close(true);
    });

    // Erreurs de création
    this.actions.pipe(
      ofActionErrored(RoomAction.CreateRoom),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.isLoading = false;
      console.log('🔍 Erreur de création interceptée');

      // Pour l'instant, on affiche le modal de limite par défaut
      // L'erreur spécifique sera gérée côté backend
      this.showRoomLimitModal();
    });

    // Erreurs de modification
    this.actions.pipe(
      ofActionErrored(RoomAction.UpdateRoom),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.isLoading = false;
      this.toastr.error(
        this.translate.instant('NOTIFICATIONS.UNIT_UPDATE_ERROR'),
        this.translate.instant('NOTIFICATIONS.ERROR')
      );
    });
  }

  // Gestion des images
  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      
      // Validation
      const validFiles = files.filter(file => {
        if (!file.type.startsWith('image/')) {
          this.toastr.error(
            this.translate.instant('ERRORS.INVALID_FILE_TYPE', { fileName: file.name }),
            this.translate.instant('NOTIFICATIONS.ERROR')
          );
          return false;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB
          this.toastr.error(
            this.translate.instant('ERRORS.FILE_TOO_LARGE', { fileName: file.name }),
            this.translate.instant('NOTIFICATIONS.ERROR')
          );
          return false;
        }
        return true;
      });

      if (validFiles.length > 0) {
        this.selectedImages = [...this.selectedImages, ...validFiles];
        
        // Prévisualisation
        validFiles.forEach(file => {
          const reader = new FileReader();
          reader.onload = (e) => {
            this.imagePreviews.push(e.target?.result as string);
          };
          reader.readAsDataURL(file);
        });
      }
    }
  }

  removeImage(index: number): void {
    this.imagePreviews.splice(index, 1);
    if (index < this.selectedImages.length) {
      this.selectedImages.splice(index, 1);
    }
  }

  private async uploadImages(): Promise<string[]> {
    if (this.selectedImages.length === 0) {
      return this.data.unit?.medias || [];
    }
    
    this.isUploadingImages = true;
    const uploadedUrls: string[] = [];
    
    try {
      for (const file of this.selectedImages) {
        const uploadAction = new UploadFilesAction.UploadFiles({
          file: file,
          contentID: this.data.unit?._id || 'new-unit',
          contentType: FileUploadContentType.FOR_ROOM_FILE,
          contentRoomType: ContentUploadRoomType.FOR_ROOM
        });
        
        await this.store.dispatch(uploadAction).toPromise();
        uploadedUrls.push(file.name); // Adapter selon votre API
      }
      
      // Conserver les images existantes
      const existingImages = this.data.unit?.medias || [];
      return [...existingImages, ...uploadedUrls];
      
    } catch (error) {
      console.error('Erreur lors de l\'upload des images:', error);
      this.toastr.error(
        this.translate.instant('ERRORS.UPLOAD_FAILED'),
        this.translate.instant('NOTIFICATIONS.ERROR')
      );
      return this.data.unit?.medias || [];
    } finally {
      this.isUploadingImages = false;
    }
  }

  async onSubmit(): Promise<void> {
    if (this.formGroup.invalid || this.isLoading) {
      this.formGroup.markAllAsTouched();
      return;
    }

    // Pour la création, vérifier les limites d'abord
    if (this.data.mode === 'create') {
      this.checkRoomLimits();
      return;
    }

    // Pour l'édition, procéder directement
    this.createOrUpdateRoom();
  }

  private checkRoomLimits(): void {
    // Pour la création d'unités, on laisse le backend gérer la vérification
    // et on intercepte l'erreur dans setupActionListeners
    console.log('🔍 Tentative de création d\'unité - vérification côté backend');
    this.createOrUpdateRoom();
  }

  private async createOrUpdateRoom(): Promise<void> {
    this.isLoading = true;

    try {
      // Upload des images si nécessaire
      const mediaUrls = await this.uploadImages();

      // Récupérer les données du formulaire, y compris les champs désactivés
      const formData = this.formGroup.getRawValue(); // getRawValue() inclut les champs désactivés
      const unitData = {
        ...formData,
        medias: mediaUrls,
        specifity: {
          numberOfBathroom: formData.numberOfBathroom,
          numberOfLivingRoom: formData.numberOfLivingRoom,
          numberOfShower: formData.numberOfShower,
          isInternalShower: formData.isInternalShower,
          hasKitchen: formData.hasKitchen,
          isInternalKitchen: formData.isInternalKitchen,
          numberOfKitchen: formData.numberOfKitchen
        }
      };

      //suppression des properietés rédondantes
      delete unitData.hasKitchen;
      delete unitData.isInternalKitchen;
      delete unitData.isInternalShower;
      delete unitData.numberOfKitchen;
      delete unitData.numberOfLivingRoom;
      delete unitData.numberOfShower;
      delete unitData.numberOfBathroom;

      if (this.data.mode === 'create') {
        delete unitData.code;
        this.store.dispatch(new RoomAction.CreateRoom(unitData, this.data.property._id));
      } else {
        this.store.dispatch(new RoomAction.UpdateRoom(unitData, this.data.unit!._id));
      }
    } catch (error) {
      this.isLoading = false;
      console.error('Erreur lors de la création/modification:', error);
    }
  }

  private showRoomLimitModal(): void {
    const modalData: SubscriptionLimitModalData = {
      type: 'limit_reached',
      currentLimit: 8,
      limitType: 'room'
    };

    const dialogRef = this.dialog.open(SubscriptionLimitModalComponent, {
      width: '600px',
      disableClose: true,
      data: modalData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.upgraded) {
        // L'utilisateur a upgradé, permettre la création
        this.createOrUpdateRoom();
      }
      // Sinon, ne rien faire (l'utilisateur a annulé)
    });
  }

  private showAccountSuspendedModal(): void {
    const modalData: SubscriptionLimitModalData = {
      type: 'account_suspended'
    };

    const dialogRef = this.dialog.open(SubscriptionLimitModalComponent, {
      width: '600px',
      disableClose: true,
      data: modalData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.reactivated) {
        // Le compte a été réactivé, permettre la création
        this.createOrUpdateRoom();
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  // Getters pour la validation
  get code() { return this.formGroup.get('code'); }
  get type() { return this.formGroup.get('type'); }
  get price() { return this.formGroup.get('price'); }
  get cautionPrice() { return this.formGroup.get('cautionPrice'); }

  getTitle(): string {
    return this.data.mode === 'create' ? 'UNIT_MANAGEMENT.ADD_UNIT' : 'UNIT_MANAGEMENT.EDIT_UNIT';
  }

  getSubmitText(): string {
    if (this.isLoading) {
      return this.data.mode === 'create' ? 'UNIT_MANAGEMENT.CREATING' : 'UNIT_MANAGEMENT.UPDATING';
    }
    return this.data.mode === 'create' ? 'UNIT_MANAGEMENT.CREATE_UNIT' : 'UNIT_MANAGEMENT.UPDATE_UNIT';
  }

  getRoomTypeIcon(type: RoomType): string {
    const roomType = this.roomTypes.find(rt => rt.value === type);
    return roomType?.icon || 'home';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(price);
  }

  // Validation helpers
  hasKitchen(): boolean {
    return this.formGroup.get('hasKitchen')?.value || false;
  }

  shouldPayCaution(): boolean {
    return this.formGroup.get('shouldPayCaution')?.value || false;
  }

  triggerImagesInput(): void {
    const input = document.getElementById('imagesInput') as HTMLInputElement;
    if (input) {
      input.click();
    }
  }
}
