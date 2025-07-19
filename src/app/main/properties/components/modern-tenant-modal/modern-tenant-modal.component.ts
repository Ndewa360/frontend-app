import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store, Actions, ofActionSuccessful, ofActionErrored } from '@ngxs/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
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
  ContentUploadRoomType 
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
        fullName: tenant.fullName || '',
        email: tenant.email || '',
        phoneNumber: tenant.phoneNumber || '',
        idCardNumber: '', // idCardNumber n'existe pas dans LocataireModel
        idCardType: 'CNI', // idCardType n'existe pas dans LocataireModel
        country: tenant.country || 'Cameroun',
        location: tenant.location || '',
        fullNameRef: tenant.fullNameRef || '',
        phoneNumberRef: tenant.phoneNumberRef || '',
        emailRef: tenant.emailRef || '',
        roomId: tenant.room || '',
        description: tenant.description || '',
        confirm: true
      });
      
      // Charger la photo existante
      if (tenant.photo) {
        this.photoPreview = tenant.photo;
      }
    }
  }

  private setupActionListeners(): void {
    // Succès de création/modification
    const successAction = this.data.mode === 'create' 
      ? LocataireAction.CreateLocataire 
      : LocataireAction.UpdateLocataire;
      
    this.actions.pipe(
      ofActionSuccessful(successAction),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.isLoading = false;
      const messageKey = this.data.mode === 'create'
        ? 'MODALS.TENANT.SUCCESS_CREATED'
        : 'MODALS.TENANT.SUCCESS_UPDATED';
      this.toastr.success(this.translate.instant(messageKey), this.translate.instant('NOTIFICATIONS.SUCCESS'));
      this.dialogRef.close(true);
    });

    // Erreur
    this.actions.pipe(
      ofActionErrored(successAction),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.isLoading = false;
      const errorKey = this.data.mode === 'create'
        ? 'MODALS.TENANT.ERROR_CREATE'
        : 'MODALS.TENANT.ERROR_UPDATE';
      this.toastr.error(this.translate.instant(errorKey), this.translate.instant('NOTIFICATIONS.ERROR'));
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
    
    try {
      // Utiliser le service d'upload existant
      const uploadAction = new UploadFilesAction.UploadFiles({
        file: this.selectedPhoto,
        contentID: this.data.tenant?._id || 'new-tenant',
        contentType: FileUploadContentType.FOR_ROOM_FILE,
        contentRoomType: ContentUploadRoomType.FOR_ROOM
      });
      
      // Dispatch l'action et attendre le résultat
      await this.store.dispatch(uploadAction).toPromise();
      
      // Récupérer l'URL de l'image uploadée
      // Note: Adapter selon la réponse de votre API
      return this.selectedPhoto.name; // Temporaire
      
    } catch (error) {
      console.error('Erreur lors de l\'upload de la photo:', error);
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
      // Upload de la photo si nécessaire
      let photoUrl = this.data.tenant?.photo || null;
      if (this.selectedPhoto) {
        photoUrl = await this.uploadPhoto();
      }

      const formData = this.formGroup.value;
      const tenantData: LocataireModel = {
        ...formData,
        photo: photoUrl,
        property: this.data.property._id,
        room: formData.roomId
      };

      if (this.data.mode === 'create') {
        this.store.dispatch(new LocataireAction.CreateLocataire(tenantData));
      } else {
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
