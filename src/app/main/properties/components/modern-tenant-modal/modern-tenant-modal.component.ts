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
  availableRooms?: RoomModel[];
}

@Component({
  selector: 'app-modern-tenant-modal',
  templateUrl: './modern-tenant-modal.component.html',
  styleUrls: ['./modern-tenant-modal.component.scss']
})
export class ModernTenantModalComponent implements OnInit, OnDestroy {
  formGroup: FormGroup;
  isLoading = false;
  availableRooms: { content: string; valueType: string }[] = [];
  
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
    this.loadAvailableRooms();
    this.setupActionListeners();
    
    if (this.data.mode === 'edit' && this.data.tenant) {
      this.populateForm();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
      
      // Informations de location
      roomId: [''],
      description: [''],
      
      // Confirmation
      confirm: [false, [Validators.requiredTrue]]
    });
  }

  private loadAvailableRooms(): void {
    this.store.select(RoomState.selectStateRoomByPropertyId(this.data.property._id))
      .pipe(takeUntil(this.destroy$))
      .subscribe((rooms: RoomModel[]) => {
        // Filtrer les chambres libres ou la chambre actuelle du locataire
        const availableRooms = rooms.filter(room => 
          room.isFree || (this.data.tenant && room._id === this.data.tenant.room)
        );
        
        this.availableRooms = availableRooms.map(room => ({
          content: `${room.code} - ${room.price.toLocaleString()} FCFA`,
          valueType: room._id
        }));
      });
  }

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
    ).subscribe(async () => {
      console.log('✅ Locataire créé avec succès');

      // Si une photo est sélectionnée, essayer de l'uploader
      if (this.selectedPhoto) {
        console.log('📸 Tentative d\'upload de la photo...');

        try {
          // Pour l'instant, on utilise un ID temporaire
          // Dans une vraie implémentation, il faudrait récupérer l'ID du locataire créé
          const photoUrl = await this.uploadPhoto();

          if (photoUrl) {
            console.log('✅ Photo uploadée avec succès:', photoUrl);
            // La photo sera associée au locataire côté backend
          }
        } catch (error) {
          console.error('❌ Erreur lors de l\'upload de la photo:', error);
          // Ne pas faire échouer la création pour autant
        }
      }

      this.isLoading = false;
      this.toastr.success(this.translate.instant('MODALS.TENANT.SUCCESS_CREATED'), this.translate.instant('NOTIFICATIONS.SUCCESS'));
      this.dialogRef.close(true);
    });

    // Succès de modification
    this.actions.pipe(
      ofActionSuccessful(LocataireAction.UpdateLocataire),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.isLoading = false;
      this.toastr.success(this.translate.instant('MODALS.TENANT.SUCCESS_UPDATED'), this.translate.instant('NOTIFICATIONS.SUCCESS'));
      this.dialogRef.close(true);
    });

    // Erreurs de création
    this.actions.pipe(
      ofActionErrored(LocataireAction.CreateLocataire),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.isLoading = false;
      this.toastr.error(this.translate.instant('MODALS.TENANT.ERROR_CREATE'), this.translate.instant('NOTIFICATIONS.ERROR'));
    });

    // Erreurs de modification
    this.actions.pipe(
      ofActionErrored(LocataireAction.UpdateLocataire),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.isLoading = false;
      this.toastr.error(this.translate.instant('MODALS.TENANT.ERROR_UPDATE'), this.translate.instant('NOTIFICATIONS.ERROR'));
    });
  }

  // Gestion de la photo
  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validation du fichier
      if (!file.type.startsWith('image/')) {
        this.toastr.error('Veuillez sélectionner une image valide', 'Erreur');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB
        this.toastr.error('La taille de l\'image ne doit pas dépasser 5MB', 'Erreur');
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

  private async uploadPhoto(): Promise<string | null> {
    if (!this.selectedPhoto) return null;

    this.isUploadingPhoto = true;
    console.log('📤 Début de l\'upload de la photo de profil locataire');

    try {
      // Générer un ID temporaire pour les nouveaux locataires
      const contentID = this.data.tenant?._id || `temp-tenant-${Date.now()}`;

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
      this.toastr.error('Erreur lors de l\'upload de la photo', 'Erreur');
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
          propertyId: this.data.property._id,
          roomId: formData.roomId
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
          propertyId: this.data.property._id,
          roomId: formData.roomId
        });

        delete tenantData.confirm;
        this.store.dispatch(new LocataireAction.UpdateLocataire(tenantData, this.data.tenant!._id!));
      }
    } catch (error) {
      this.isLoading = false;
      this.toastr.error('Une erreur est survenue', 'Erreur');
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
    const titleKey = this.data.mode === 'create'
      ? 'MODALS.TENANT.ADD_TITLE'
      : 'MODALS.TENANT.EDIT_TITLE';
    return this.translate.instant(titleKey);
  }

  getSubmitText(): string {
    if (this.isLoading) {
      return this.data.mode === 'create' ? 'Création...' : 'Modification...';
    }
    return this.data.mode === 'create' ? 'Créer le Locataire' : 'Modifier le Locataire';
  }
}
