import { Component, ViewEncapsulation, ViewChild, ElementRef, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store, Actions, ofActionSuccessful, ofActionCompleted, ofActionErrored, Select } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import {
  LocataireModel,
  UserProfileAction,
  UserProfileModel,
  UserProfileState
} from 'src/app/shared/store';
import {
  UploadFilesAction,
  UploadFilesState,
  FileUploadContentType,
  ContentUploadRoomType
} from 'src/app/shared/store/files-upload';
import { FormUtils } from 'src/app/shared/utils';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'user-profile-infos',
  templateUrl: './user-profile-infos.component.html',
  styleUrls: ['./user-profile-infos.component.css', './phone-input.scss'],
  encapsulation: ViewEncapsulation.None
})
export class UserProfileInfosComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  @Select(UserProfileState.selectStateUserProfile) userProfile$: Observable<UserProfileModel>;
  @Select(UserProfileState.selectStateSavedLoading) profileStateSavedLoading$: Observable<boolean>;
  @Select(UploadFilesState.selectStateUploadedFiles) uploadFiles$: Observable<{name:string,state:any}[]>;

  // Propriétés pour la navigation par sections
  @Input() activeSection?: string;
  @Output() sectionChange = new EventEmitter<string>();

  // Propriétés du composant
  userProfile: UserProfileModel = null;
  public formGroup: FormGroup;
  waittingResponse = false;

  // Propriétés pour l'upload de photo
  isUploadingPhoto = false;
  uploadProgress = 0;
  defaultAvatarUrl = 'assets/img/avatar/avatarinit.png';



  private destroy$ = new Subject<void>();
  
    constructor(
      protected formBuilder: FormBuilder,
      private _store: Store,
      private _ngxsAction: Actions,
      private _activatedRoute: ActivatedRoute,
      private toastr: ToastrService
    ) { }
  
  ngOnInit(): void {
    // Initialiser le formulaire d'abord
    this.initializeForm();
    
    // Charger le profil utilisateur
    this._store.dispatch(new UserProfileAction.FetchUserProfile());

    // S'abonner aux changements du profil
    this.userProfile$
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.userProfile = value;
        if (this.formGroup) {
          this.updateFormWithUserData();
        }
      });

    // Écouter les actions de mise à jour du profil
    this.setupActionListeners();

    // Écouter les uploads de fichiers
    this.setupUploadListeners();
  }

  ngOnDestroy(): void {
    // Avertir l'utilisateur s'il y a des changements non sauvegardés
    if (this.hasUnsavedChanges()) {
      // Note: Dans un vrai projet, on pourrait utiliser un guard pour empêcher la navigation
      console.warn('Changements non sauvegardés détectés');
    }
    
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.formGroup = this.formBuilder.group({
      // Informations personnelles
      name: [this.userProfile?.name || '', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      phoneNumber: [this.userProfile?.phoneNumber || ''],
      bio: [this.userProfile?.bio || '', [Validators.maxLength(500)]],

      // Localisation
      location: [this.userProfile?.location || ''],
      country: [this.userProfile?.country || 'Cameroun'],

      // Contacts supplémentaires
      whatsappContact: [this.userProfile?.whatsappContact || ''],
      skype: [this.userProfile?.skype || '', [Validators.maxLength(50)]],
      websiteLink: [this.userProfile?.websiteLink || '', [Validators.pattern('^https?:\\/\\/.+\\..+')]],

      // Préférences de localisation
      preferredLanguage: [this.userProfile?.preferredLanguage || 'fr'],
      preferredCurrency: [this.userProfile?.preferredCurrency || 'XAF'],
      timezone: [this.userProfile?.timezone || 'Africa/Douala'],
      dateFormat: [this.userProfile?.dateFormat || 'DD/MM/YYYY'],
      numberFormat: [this.userProfile?.numberFormat || 'fr-FR'],

      // Préférences d'affichage
      theme: [this.userProfile?.theme || 'light'],
      isEnglishTimeFormat: [Boolean(this.userProfile?.isEnglishTimeFormat)],
      
      // Codes pays pour les téléphones
      phoneCountryCode: ['+237'],
      whatsappCountryCode: ['+237']
    });
  }

  private updateFormWithUserData(): void {
    if (this.userProfile && this.formGroup) {
      // Séparer l'indicatif du numéro pour l'affichage
      const phoneData = this.parsePhoneNumber(this.userProfile.phoneNumber || '');
      const whatsappData = this.parsePhoneNumber(this.userProfile.whatsappContact || '');
      
      console.log('Phone original:', this.userProfile.phoneNumber);
      console.log('Phone parsed:', phoneData);
      console.log('WhatsApp original:', this.userProfile.whatsappContact);
      console.log('WhatsApp parsed:', whatsappData);
      
      // Pas besoin de selectedCountryCode, on utilise le FormGroup directement
      
      this.formGroup.patchValue({
        // Informations personnelles
        name: this.userProfile.name || '',
        phoneNumber: phoneData.number,
        bio: this.userProfile.bio || '',

        // Localisation
        location: this.userProfile.location || '',
        country: this.userProfile.country || 'Cameroun',

        // Contacts supplémentaires
        whatsappContact: whatsappData.number,
        skype: this.userProfile.skype || '',
        websiteLink: this.userProfile.websiteLink || '',

        // Préférences de localisation
        preferredLanguage: this.userProfile.preferredLanguage || 'fr',
        preferredCurrency: this.userProfile.preferredCurrency || 'XAF',
        timezone: this.userProfile.timezone || 'Africa/Douala',
        dateFormat: this.userProfile.dateFormat || 'DD/MM/YYYY',
        numberFormat: this.userProfile.numberFormat || 'fr-FR',

        // Préférences d'affichage
        theme: this.userProfile.theme || 'light',
        isEnglishTimeFormat: Boolean(this.userProfile.isEnglishTimeFormat)
      });
    }
  }

  private setupActionListeners(): void {
    this._ngxsAction
      .pipe(
        ofActionSuccessful(UserProfileAction.UpdateUserProfile),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.waittingResponse = false;
        this.toastr.success('Profil mis à jour avec succès', 'Succès');
      });

    this._ngxsAction
      .pipe(
        ofActionErrored(UserProfileAction.UpdateUserProfile),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.waittingResponse = false;
        this.toastr.error('Erreur lors de la mise à jour du profil', 'Erreur');
      });
  }

  private setupUploadListeners(): void {
    this.uploadFiles$
      .pipe(
        takeUntil(this.destroy$),
        filter(files => files && files.length > 0)
      )
      .subscribe(files => {
        // Chercher le fichier en cours d'upload pour cet utilisateur
        const userFile = files.find(f => f.state && f.state.data && f.state.data.data);
        if (userFile) {
          this.handleUploadProgress(userFile);
        }
      });
  }

  // Méthodes pour la gestion de l'upload de photos
  triggerPhotoUpload(): void {
    if (this.isUploadingPhoto) return;
    this.fileInput.nativeElement.click();
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.validateAndUploadPhoto(file);
    }
  }

  private validateAndUploadPhoto(file: File): void {
    // Validation du fichier
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

    if (!allowedTypes.includes(file.type)) {
      this.toastr.error('Format de fichier non supporté. Utilisez JPEG, PNG ou GIF.', 'Erreur');
      return;
    }

    if (file.size > maxSize) {
      this.toastr.error('Le fichier est trop volumineux. Maximum 5MB.', 'Erreur');
      return;
    }

    // Démarrer l'upload
    this.uploadPhoto(file);
  }

  private uploadPhoto(file: File): void {
    this.isUploadingPhoto = true;
    this.uploadProgress = 0;

    // Dispatch l'action d'upload avec le bon modèle
    this._store.dispatch(new UploadFilesAction.UploadFiles({
      file: file,
      contentID: this.userProfile._id,
      contentType: FileUploadContentType.FOR_USER_FILE,
      contentRoomType: ContentUploadRoomType.FOR_ROOM // Requis par le modèle même si pas utilisé pour les users
    }));
  }

  private handleUploadProgress(uploadFile: any): void {
    const state = uploadFile.state;

    if (state?.state === 'UPLOADING') {
      this.uploadProgress = state.progress || 0;
    } else if (state?.state === 'DONE' && state.data?.data) {
      this.uploadProgress = 100;
      this.isUploadingPhoto = false;

      // Le backend retourne l'utilisateur mis à jour avec la nouvelle photo
      const updatedUser = state.data.data;

      // Mettre à jour le store avec les nouvelles données utilisateur
      this._store.dispatch(new UserProfileAction.SetUserProfile(updatedUser));
      this.toastr.success('Photo de profil mise à jour avec succès', 'Succès');

      // Nettoyer les fichiers uploadés
      this._store.dispatch(new UploadFilesAction.ResetFileUploaded());
    } else if (state?.state === 'ERROR') {
      this.isUploadingPhoto = false;
      this.uploadProgress = 0;
      this.toastr.error('Erreur lors de l\'upload de la photo', 'Erreur');
    }
  }

  getProfilePhotoUrl(): string {
    if (this.userProfile?.profilePicture && this.userProfile.profilePicture.trim() !== '') {
      return this.userProfile.profilePicture;
    }
    return this.defaultAvatarUrl;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = this.defaultAvatarUrl;
  }

  // Méthodes pour la validation du formulaire
  isValid(name: string): boolean {
    const instance = this.formGroup.get(name);
    return instance ? instance.invalid && (instance.dirty || instance.touched) : false;
  }

  getFieldError(fieldName: string): string {
    const field = this.formGroup.get(fieldName);
    if (field?.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) return `${fieldName} est requis`;
      if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
      if (field.errors['maxlength']) return `Maximum ${field.errors['maxlength'].requiredLength} caractères`;
      if (field.errors['validatePhoneNumber']) {
        return 'Numéro de téléphone invalide';
      }
      if (field.errors['pattern']) {
        if (fieldName === 'websiteLink') {
          return 'URL invalide (doit commencer par http:// ou https://)';
        }
        return 'Format invalide';
      }
    }
    return '';
  }

  onSubmitUpdateUserInfos(): void {
    this.formGroup.markAllAsTouched();
    
    if (this.formGroup.invalid) {
      this.toastr.warning('Veuillez corriger les erreurs dans le formulaire', 'Formulaire invalide');
      this.scrollToFirstError();
      return;
    }

    this.waittingResponse = true;
    const formData = this.prepareFormData();
    this._store.dispatch(new UserProfileAction.UpdateUserProfile(formData, this.userProfile._id));
  }

  private prepareFormData(): any {
    const rawData = this.formGroup.value;
    
    // Séparer les données utilisateur des paramètres
    const userData = {
      // Informations personnelles
      name: rawData.name?.trim() || '',
      phoneNumber: rawData.phoneNumber ? `${rawData.phoneCountryCode}${rawData.phoneNumber.replace(/[\s\-\(\)]/g, '')}` : '',
      bio: rawData.bio?.trim() || '',
      location: rawData.location?.trim() || '',
      country: rawData.country?.trim() || '',
      whatsappContact: rawData.whatsappContact ? `${rawData.whatsappCountryCode}${rawData.whatsappContact.replace(/[\s\-\(\)]/g, '')}` : '',
      skype: rawData.skype?.trim() || '',
      websiteLink: rawData.websiteLink?.trim() || '',
      
      // Préférences de localisation (directement dans le user schema)
      preferredLanguage: rawData.preferredLanguage || 'fr',
      preferredCurrency: rawData.preferredCurrency || 'XAF',
      timezone: rawData.timezone || 'Africa/Douala',
      dateFormat: rawData.dateFormat || 'DD/MM/YYYY',
      numberFormat: rawData.numberFormat || 'fr-FR',
      theme: rawData.theme || 'light',
      isEnglishTimeFormat: rawData.isEnglishTimeFormat ? 'true' : 'false'
    };

    return FormUtils.removeNullAttribut(userData);
  }

  private scrollToFirstError(): void {
    const firstErrorField = document.querySelector('.field-input.error');
    if (firstErrorField) {
      firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (firstErrorField as HTMLElement).focus();
    }
  }

  // Méthode pour gérer les changements de localisation
  onLocalizationChange(changes: any): void {
    // Les changements sont déjà appliqués au formulaire par le composant enfant
    console.log('Changements de localisation:', changes);
  }

  // Méthode pour réinitialiser le formulaire
  resetForm(): void {
    if (this.userProfile) {
      this.updateFormWithUserData();
      this.formGroup.markAsUntouched();
      this.formGroup.markAsPristine();
      this.toastr.info('Formulaire réinitialisé', 'Information');
    }
  }

  // Méthode pour vérifier si le formulaire a été modifié
  hasUnsavedChanges(): boolean {
    return this.formGroup.dirty && !this.waittingResponse;
  }

  getPhonePlaceholder(): string {
    const placeholders: {[key: string]: string} = {
      '+237': '6 XX XX XX XX',
      '+33': '6 XX XX XX XX',
      '+1': '(XXX) XXX-XXXX',
      '+44': '7XXX XXXXXX',
      '+49': 'XXX XXXXXXX'
    };
    const countryCode = this.formGroup?.get('phoneCountryCode')?.value || '+237';
    return placeholders[countryCode] || 'Numéro de téléphone';
  }

  getWhatsappPlaceholder(): string {
    const placeholders: {[key: string]: string} = {
      '+237': '6 XX XX XX XX',
      '+33': '6 XX XX XX XX',
      '+1': '(XXX) XXX-XXXX',
      '+44': '7XXX XXXXXX',
      '+49': 'XXX XXXXXXX'
    };
    const countryCode = this.formGroup?.get('whatsappCountryCode')?.value || '+237';
    return placeholders[countryCode] || 'Numéro WhatsApp';
  }

  private parsePhoneNumber(fullNumber: string): {countryCode: string, number: string} {
    if (!fullNumber) return {countryCode: '+237', number: ''};
    
    // Nettoyer le numéro (supprimer espaces, tirets, etc.)
    const cleanNumber = fullNumber.replace(/[\s\-\(\)]/g, '');
    
    const countryCodes = ['+237', '+33', '+1', '+44', '+49'];
    
    for (const code of countryCodes) {
      if (cleanNumber.startsWith(code)) {
        return {
          countryCode: code,
          number: cleanNumber.substring(code.length)
        };
      }
    }
    
    // Si aucun indicatif trouvé, considérer comme numéro camerounais
    return {countryCode: '+237', number: cleanNumber};
  }

}
