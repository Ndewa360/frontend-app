import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store, Actions, ofActionSuccessful, ofActionErrored } from '@ngxs/store';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { FormUtils } from 'src/app/shared/utils';
import { HttpEventType, HttpResponse } from '@angular/common/http';

import {
  LocataireModel,
  LocataireAction,
  LocataireState,
  RoomModel,
  RoomState,
  PropertyModel
} from 'src/app/shared/store';
import {
  UploadFilesAction,
  FileUploadContentType,
  ContentUploadRoomType,
  UploadFilesService
} from 'src/app/shared/store/files-upload';
// import { phoneValidator } from 'src/app/shared/validators/phone.validator'; // Validator non trouvé

export interface TenantModalData {
  mode: 'create' | 'edit';
  property: PropertyModel;
  tenant?: LocataireModel;
}

@Component({
  selector: 'app-modern-tenant-modal',
  templateUrl: './modern-tenant-modal.component.html',
  styleUrls: ['./modern-tenant-modal.component.scss']
})
export class ModernTenantModalComponent implements OnInit, OnDestroy {
  formGroup: FormGroup;
  isLoading = false;
  
  // Photo upload
  selectedPhoto: File | null = null;
  photoPreview: string | null = null;
  isUploadingPhoto = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private store: Store,
    private actions: Actions,
    private toastr: ToastrService,
    private translate: TranslateService,
    private uploadService: UploadFilesService,
    private dialogRef: MatDialogRef<ModernTenantModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TenantModalData
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.setupActionListeners();

    if (this.data.mode === 'edit' && this.data.tenant) {
      this.populateForm();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Génère un ObjectId MongoDB valide
   */
  private generateObjectId(): string {
    const timestamp = Math.floor(Date.now() / 1000).toString(16);
    const randomBytes = Array.from({length: 16}, () => Math.floor(Math.random() * 16).toString(16)).join('');
    return (timestamp + randomBytes).substring(0, 24);
  }

  private initializeForm(): void {
    this.formGroup = this.formBuilder.group({
      // Informations personnelles
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.email]],
      phoneNumber: ['', [Validators.required]],
      
      // Informations d'identité
      idCardNumber: ['', [Validators.required]],
      idCardType: ['CNI', [Validators.required]],
      
      // Informations de localisation
      country: ['Cameroun'],
      location: [''],
      
      // Informations de contact de référence
      fullNameRef: [''],
      phoneNumberRef: [''],
      emailRef: ['', [Validators.email]],

      // Confirmation
      confirm: [false, [Validators.requiredTrue]]
    });
  }

  // Méthode loadAvailableRooms supprimée - utiliser l'assistant d'assignation

  private populateForm(): void {
    if (this.data.tenant) {
      const tenant = this.data.tenant;
      this.formGroup.patchValue({
        fullName: tenant.fullName || null,
        email: tenant.email || null,
        phoneNumber: tenant.phoneNumber || null,
        idCardNumber: tenant.idCardNumber, 
        idCardType: tenant.idCardType,
        country: tenant.country || 'Cameroun',
        location: tenant.location || null,
        fullNameRef: tenant.fullNameRef || null,
        phoneNumberRef: tenant.phoneNumberRef || null,
        emailRef: tenant.emailRef || '',
        roomId: tenant.room || null,
        description: tenant.description || null,
        confirm: true
      });
      
      // Charger la photo existante
      if (tenant.profilePicture) {
        this.photoPreview = tenant.profilePicture;
      }
    }
  }

  private setupActionListeners(): void {
    // Succès de création
    this.actions.pipe(
      ofActionSuccessful(LocataireAction.CreateLocataire),
      takeUntil(this.destroy$)
    ).subscribe(async (actionContext) => {
      console.log('✅ Locataire créé avec succès');

      // Récupérer l'ID du locataire créé depuis le state
      const locataires = this.store.selectSnapshot(LocataireState.selectStateLocataires) as LocataireModel[];
      const createdTenant = locataires?.find(l =>
        l.email === this.formGroup.value.email &&
        l.phoneNumber === this.formGroup.value.phoneNumber
      );

      // Si une photo est sélectionnée, essayer de l'uploader avec l'ID réel
      if (this.selectedPhoto && createdTenant?._id) {
        console.log('📸 Upload de la photo en cours...');

        try {
          const photoUrl = await this.uploadPhotoForTenant(createdTenant._id);

          if (photoUrl) {
            console.log('✅ Photo uploadée avec succès:', photoUrl);
            // Afficher un message spécifique pour la photo
            this.toastr.success(
              this.translate.instant('NOTIFICATIONS.TENANT_CREATED_WITH_PHOTO'),
              this.translate.instant('NOTIFICATIONS.SUCCESS')
            );
          } else {
            // Pas de photo uploadée, message standard
            this.toastr.success(
              this.translate.instant('NOTIFICATIONS.TENANT_CREATED_SUCCESS'),
              this.translate.instant('NOTIFICATIONS.SUCCESS')
            );
          }
        } catch (error) {
          console.error('❌ Erreur lors de l\'upload de la photo:', error);
          // Afficher un message indiquant que le locataire est créé mais sans photo
          this.toastr.warning(
            this.translate.instant('NOTIFICATIONS.TENANT_CREATED_PHOTO_ERROR'),
            this.translate.instant('NOTIFICATIONS.WARNING')
          );
        }
      } else {
        // Pas de photo sélectionnée, message standard
        this.toastr.success(
          this.translate.instant('NOTIFICATIONS.TENANT_CREATED_SUCCESS'),
          this.translate.instant('NOTIFICATIONS.SUCCESS')
        );
      }

      this.isLoading = false;
      this.dialogRef.close(true);
    });

    // Succès de modification
    this.actions.pipe(
      ofActionSuccessful(LocataireAction.UpdateLocataire),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.isLoading = false;
      this.toastr.success(
        this.translate.instant('NOTIFICATIONS.TENANT_UPDATED_SUCCESS'),
        this.translate.instant('NOTIFICATIONS.SUCCESS')
      );
      this.dialogRef.close(true);
    });

    // Erreurs de création
    this.actions.pipe(
      ofActionErrored(LocataireAction.CreateLocataire),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.isLoading = false;
      this.toastr.error(
        this.translate.instant('NOTIFICATIONS.TENANT_CREATE_ERROR'),
        this.translate.instant('NOTIFICATIONS.ERROR')
      );
    });

    // Erreurs de modification
    this.actions.pipe(
      ofActionErrored(LocataireAction.UpdateLocataire),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.isLoading = false;
      this.toastr.error(
        this.translate.instant('NOTIFICATIONS.TENANT_UPDATE_ERROR'),
        this.translate.instant('NOTIFICATIONS.ERROR')
      );
    });
  }

  // Gestion de la photo
  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validation du fichier
      if (!file.type.startsWith('image/')) {
        this.toastr.error(
          this.translate.instant('ERRORS.INVALID_FILE_TYPE'),
          this.translate.instant('NOTIFICATIONS.ERROR')
        );
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB
        this.toastr.error(
          this.translate.instant('ERRORS.FILE_TOO_LARGE'),
          this.translate.instant('NOTIFICATIONS.ERROR')
        );
        return;
      }
      
      this.selectedPhoto = file;
      
      // Prévisualisation
      const reader = new FileReader();
      reader.onload = (e) => {
        this.photoPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removePhoto(): void {
    this.selectedPhoto = null;
    this.photoPreview = null;

    // Reset input file
    const input = document.getElementById('photoInput') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  triggerPhotoInput(): void {
    const input = document.getElementById('photoInput') as HTMLInputElement;
    if (input) {
      input.click();
    }
  }

  /**
   * Upload de la photo avec un ID de locataire spécifique
   */
  private async uploadPhotoForTenant(tenantId: string): Promise<string | null> {
    if (!this.selectedPhoto) return null;

    this.isUploadingPhoto = true;
    console.log('📤 Upload de photo pour locataire avec ID réel:', tenantId);

    try {
      const uploadObservable = this.uploadService.uploadFiles({
        file: this.selectedPhoto,
        contentType: FileUploadContentType.FOR_USER_FILE,
        contentID: tenantId,
        contentRoomType: ContentUploadRoomType.FOR_ROOM
      }).pipe(
        filter(event => event.type === HttpEventType.Response),
        takeUntil(this.destroy$)
      );

      const uploadResult = await firstValueFrom(uploadObservable) as HttpResponse<any>;
      console.log('✅ Upload réussi avec ID réel:', uploadResult);

      if (uploadResult && uploadResult.body && uploadResult.body.data && uploadResult.body.data.profilePicture) {
        const photoUrl = uploadResult.body.data.profilePicture;
        console.log('📸 URL de la photo récupérée:', photoUrl);
        return photoUrl;
      } else {
        console.warn('⚠️ Réponse d\'upload inattendue:', uploadResult);
        return null;
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'upload de la photo:', error);
      throw error;
    } finally {
      this.isUploadingPhoto = false;
    }
  }

  private async uploadPhoto(): Promise<string | null> {
    if (!this.selectedPhoto) return null;

    this.isUploadingPhoto = true;
    console.log('📤 Début de l\'upload de la photo de profil locataire');

    try {
      // Générer un ObjectId valide pour les nouveaux locataires
      const contentID = this.data.tenant?._id || this.generateObjectId();

      console.log('📤 Upload de photo pour locataire:', {
        isNewTenant: !this.data.tenant?._id,
        contentID,
        fileSize: this.selectedPhoto.size
      });

      // Utiliser directement le service d'upload et filtrer pour obtenir la réponse finale
      const uploadObservable = this.uploadService.uploadFiles({
        file: this.selectedPhoto,
        contentType: FileUploadContentType.FOR_USER_FILE,
        contentID: contentID,
        contentRoomType: ContentUploadRoomType.FOR_ROOM
      }).pipe(
        filter(event => event.type === HttpEventType.Response),
        takeUntil(this.destroy$)
      );

      const uploadResult = await firstValueFrom(uploadObservable) as HttpResponse<any>;

      console.log('✅ Upload réussi:', uploadResult);

      // Extraire l'URL de la réponse
      if (uploadResult && uploadResult.body && uploadResult.body.data && uploadResult.body.data.profilePicture) {
        const photoUrl = uploadResult.body.data.profilePicture;
        console.log('📸 URL de la photo récupérée:', photoUrl);
        return photoUrl;
      } else {
        console.warn('⚠️ Pas d\'URL de photo dans la réponse:', uploadResult);
        return null;
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'upload de la photo:', error);
      this.toastr.error(
        this.translate.instant('ERRORS.UPLOAD_FAILED'),
        this.translate.instant('NOTIFICATIONS.ERROR')
      );
      return null;
    } finally {
      this.isUploadingPhoto = false;
    }
  }

  async onSubmit(): Promise<void> {
    if (this.formGroup.invalid || this.isLoading) {
      this.formGroup.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    try {
      const formData = this.formGroup.value;

      if (this.data.mode === 'create') {
        // Pour un nouveau locataire, créer d'abord sans photo
        const tenantData = FormUtils.removeNullAttribut({
          ...formData,
          profilePicture: null, // Sera ajoutée après création
          propertyId: this.data.property._id
          // roomId supprimé - utiliser l'assistant d'assignation
        });

        delete tenantData.confirm;
        console.log('👤 Création du locataire sans photo...');
        this.store.dispatch(new LocataireAction.CreateLocataire(tenantData));

        // La photo sera uploadée dans setupActionListeners après création réussie

      } else {
        // Pour un locataire existant, uploader la photo d'abord si nécessaire
        let photoUrl = this.data.tenant?.profilePicture || null;
        if (this.selectedPhoto) {
          console.log('📸 Upload de la photo pour locataire existant...');
          photoUrl = await this.uploadPhoto();
        }

        const tenantData = FormUtils.removeNullAttribut({
          ...formData,
          profilePicture: photoUrl,
          propertyId: this.data.property._id
          // roomId supprimé - utiliser l'assistant d'assignation
        });

        delete tenantData.confirm;
        this.store.dispatch(new LocataireAction.UpdateLocataire(tenantData, this.data.tenant!._id!));
      }
    } catch (error) {
      this.isLoading = false;
      this.toastr.error(
        this.translate.instant('NOTIFICATIONS.OPERATION_ERROR'),
        this.translate.instant('NOTIFICATIONS.ERROR')
      );
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  // Getters pour la validation
  get fullName() { return this.formGroup.get('fullName'); }
  get email() { return this.formGroup.get('email'); }
  get phoneNumber() { return this.formGroup.get('phoneNumber'); }
  get idCardNumber() { return this.formGroup.get('idCardNumber'); }
  get phoneNumberRef() { return this.formGroup.get('phoneNumberRef'); }
  get emailRef() { return this.formGroup.get('emailRef'); }
  get confirm() { return this.formGroup.get('confirm'); }

  getTitle(): string {
    return this.data.mode === 'create'
      ? 'TENANT_MANAGEMENT.ADD_TENANT'
      : 'TENANT_MANAGEMENT.EDIT_TENANT';
  }

  getSubmitText(): string {
    if (this.isLoading) {
      return this.data.mode === 'create' ? 'TENANT_MANAGEMENT.CREATING' : 'TENANT_MANAGEMENT.UPDATING';
    }
    return this.data.mode === 'create' ? 'TENANT_MANAGEMENT.CREATE_TENANT' : 'TENANT_MANAGEMENT.UPDATE_TENANT';
  }
}
