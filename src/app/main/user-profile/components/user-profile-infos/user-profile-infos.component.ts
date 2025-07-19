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
  styleUrls: ['./user-profile-infos.component.css'],
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
    // Charger le profil utilisateur
    this._store.dispatch(new UserProfileAction.FetchUserProfile());

    // S'abonner aux changements du profil
    this.userProfile$
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.userProfile = value;
        this.updateFormWithUserData();
      });

    // Initialiser le formulaire
    this.initializeForm();

    // Écouter les actions de mise à jour du profil
    this.setupActionListeners();

    // Écouter les uploads de fichiers
    this.setupUploadListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.formGroup = this.formBuilder.group({
      // Informations personnelles
      name: [this.userProfile?.name, [Validators.required, Validators.minLength(2)]],
      phoneNumber: [this.userProfile?.phoneNumber, [Validators.pattern('^(\\+\\d{1,3}\\s)?(\\d{2,3}[\\s.-]?){4}$')]],
      bio: [this.userProfile?.bio, [Validators.maxLength(500)]],

      // Localisation
      location: [this.userProfile?.location],
      country: [this.userProfile?.country],

      // Contacts supplémentaires
      whatsappContact: [this.userProfile?.whatsappContact, [Validators.pattern('^(\\+\\d{1,3}\\s)?(\\d{2,3}[\\s.-]?){4}$')]],
      skype: [this.userProfile?.skype],
      websiteLink: [this.userProfile?.websiteLink, [Validators.pattern('https?://.+')]],

      // Préférences de localisation
      preferredLanguage: [this.userProfile?.preferredLanguage || 'fr'],
      preferredCurrency: [this.userProfile?.preferredCurrency || 'XAF'],
      timezone: [this.userProfile?.timezone || 'Africa/Douala'],
      dateFormat: [this.userProfile?.dateFormat || 'DD/MM/YYYY'],
      numberFormat: [this.userProfile?.numberFormat || 'fr-FR'],

      // Préférences d'affichage
      theme: [this.userProfile?.theme || 'light'],
      isEnglishTimeFormat: [this.userProfile?.isEnglishTimeFormat || false]
    });
  }

  private updateFormWithUserData(): void {
    if (this.userProfile && this.formGroup) {
      this.formGroup.patchValue({
        // Informations personnelles
        name: this.userProfile.name,
        phoneNumber: this.userProfile.phoneNumber,
        bio: this.userProfile.bio,

        // Localisation
        location: this.userProfile.location,
        country: this.userProfile.country,

        // Contacts supplémentaires
        whatsappContact: this.userProfile.whatsappContact,
        skype: this.userProfile.skype,
        websiteLink: this.userProfile.websiteLink,

        // Préférences de localisation
        preferredLanguage: this.userProfile.preferredLanguage || 'fr',
        preferredCurrency: this.userProfile.preferredCurrency || 'XAF',
        timezone: this.userProfile.timezone || 'Africa/Douala',
        dateFormat: this.userProfile.dateFormat || 'DD/MM/YYYY',
        numberFormat: this.userProfile.numberFormat || 'fr-FR',

        // Préférences d'affichage
        theme: this.userProfile.theme || 'light',
        isEnglishTimeFormat: this.userProfile.isEnglishTimeFormat || false
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
    return this.userProfile?.profilePicture || this.userProfile?.photo || this.defaultAvatarUrl;
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

  onSubmitUpdateUserInfos(): void {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.invalid) return;

    this.waittingResponse = true;
    const formData = FormUtils.removeNullAttribut(this.formGroup.value);
    this._store.dispatch(new UserProfileAction.UpdateUserProfile(formData, this.userProfile._id));
  }

  // Méthode pour gérer les changements de localisation
  onLocalizationChange(changes: any): void {
    // Les changements sont déjà appliqués au formulaire par le composant enfant
    // On peut ajouter ici une logique supplémentaire si nécessaire
    console.log('Changements de localisation:', changes);
  }

}
