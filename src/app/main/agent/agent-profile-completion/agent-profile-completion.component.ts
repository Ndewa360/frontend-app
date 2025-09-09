import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Store } from '@ngxs/store';
import { UserProfileState } from 'src/app/shared/store/user-profile/user-profile.state';
import { UserProfileModel } from 'src/app/shared/store/user-profile/user-profile.model';
import { UserProfileAction } from 'src/app/shared/store/user-profile/user-profile.actions';

@Component({
  selector: 'app-agent-profile-completion',
  templateUrl: './agent-profile-completion.component.html',
  styleUrls: ['./agent-profile-completion.component.scss']
})
export class AgentProfileCompletionComponent implements OnInit {
  profileForm: FormGroup;
  isSubmitting = false;
  selectedFiles: { [key: string]: File } = {};
  uploadProgress: { [key: string]: number } = {};
  uploadedFiles: { [key: string]: string } = {};
  logoPreview: string | null = null;
  currentUser: UserProfileModel | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient,
    private store: Store
  ) {
    // Charger le profil utilisateur si pas encore chargé
    const userProfile = this.store.selectSnapshot(UserProfileState.selectStateUserProfile);
    if (!userProfile) {
      this.store.dispatch(new UserProfileAction.FetchUserProfile());
    }
  }

  ngOnInit(): void {
    // Initialiser le formulaire d'abord
    this.profileForm = this.fb.group({
      businessName: ['', [Validators.required, Validators.minLength(2)]],
      businessAddress: ['', [Validators.required, Validators.minLength(10)]],
      businessDescription: [''],
      verificationType: ['NATIONAL_ID', Validators.required],
      verificationNumber: ['', Validators.required],
      verificationDocument: [null],
      professionalCard: [null],
      businessLicense: [null],
      businessLogo: [null]
    });
    
    // Charger les données utilisateur
    this.loadUserData();
  }
  
  private loadUserData(): void {
    // Récupérer les données utilisateur depuis le store
    this.currentUser = this.store.selectSnapshot(UserProfileState.selectStateUserProfile);
    
    console.log('Current user data:', this.currentUser);
    
    if (this.currentUser?.businessName) {
      this.profileForm.patchValue({
        businessName: this.currentUser.businessName
      });
      console.log('Business name loaded:', this.currentUser.businessName);
    } else {
      // Si pas de données, essayer de les charger et réessayer
      this.store.dispatch(new UserProfileAction.FetchUserProfile());
      
      // S'abonner aux changements du profil utilisateur
      this.store.select(UserProfileState.selectStateUserProfile).subscribe(user => {
        if (user?.businessName && !this.profileForm.get('businessName')?.value) {
          this.profileForm.patchValue({
            businessName: user.businessName
          });
          console.log('Business name updated from store:', user.businessName);
        }
      });
    }
  }

  onFileSelect(event: any, documentType: string): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFiles[documentType] = file;
      // Reset upload progress and uploaded file for this type
      this.uploadProgress[documentType] = 0;
      delete this.uploadedFiles[documentType];
      
      // Prévisualisation pour le logo
      if (documentType === 'business-logo' && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.logoPreview = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      }
    }
  }

  async uploadFile(file: File, documentType: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const userId = this.currentUser?._id;
      if (!userId) {
        reject(new Error('Utilisateur non identifié'));
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('contentType', 'for_agent_document');
      formData.append('contentID', userId);
      
      const documentTypeMap = {
        'verification': 'verification_document',
        'professional-card': 'professional_card',
        'business-license': 'business_license',
        'business-logo': 'verification_document' // Utiliser un type valide pour le logo
      };
      
      formData.append('agentDocumentType', documentTypeMap[documentType]);

      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          this.uploadProgress[documentType] = Math.round((event.loaded / event.total) * 100);
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          console.log('📦 Réponse upload pour', documentType, ':', response);
          
          // Vérifier la structure de la réponse
          const fileUrl = response.data?.fileUrl || response.data?.generatedUrl || response.data;
          this.uploadedFiles[documentType] = fileUrl;
          
          console.log('📋 Fichier', documentType, 'uploadé vers:', fileUrl);
          console.log('📋 État uploadedFiles:', this.uploadedFiles);
          
          resolve(fileUrl);
        } else {
          console.error('❌ Erreur upload status:', xhr.status, xhr.responseText);
          reject(new Error('Upload failed'));
        }
      });
      
      xhr.addEventListener('error', () => {
        reject(new Error('Upload error'));
      });
      
      xhr.open('POST', `${environment.apiUrl}/upload/post`);
      xhr.send(formData);
    });
  }

  testClick(): void {
    console.log('🔥 Bouton cliqué !');
    this.onSubmit();
  }

  async onSubmit(): Promise<void> {
    console.log('🔥 onSubmit appelé!');
    console.log('📋 État du formulaire:', {
      valid: this.profileForm.valid,
      invalid: this.profileForm.invalid,
      errors: this.profileForm.errors,
      values: this.profileForm.value
    });
    
    // Vérifier les champs obligatoires manuellement
    const requiredFields = ['businessName', 'businessAddress', 'verificationNumber'];
    const missingFields = requiredFields.filter(field => !this.profileForm.get(field)?.value);
    
    if (missingFields.length > 0) {
      console.log('❌ Champs manquants:', missingFields);
      this.profileForm.markAllAsTouched();
      return;
    }
    
    // Vérifier qu'au moins le document de vérification est sélectionné
    if (!this.selectedFiles['verification']) {
      console.log('❌ Document de vérification manquant');
      alert('Veuillez sélectionner un document d\'identité');
      return;
    }

    this.isSubmitting = true;

    try {
      // Upload all selected files
      const uploadPromises = [];
      for (const [documentType, file] of Object.entries(this.selectedFiles)) {
        uploadPromises.push(this.uploadFile(file, documentType));
      }
      
      if (uploadPromises.length > 0) {
        console.log('📤 Upload de', uploadPromises.length, 'fichiers...');
        const uploadResults = await Promise.all(uploadPromises);
        console.log('✅ Résultats uploads:', uploadResults);
        console.log('✅ Tous les fichiers uploadés:', this.uploadedFiles);
      } else {
        console.log('⚠️ Aucun fichier à uploader');
      }

      const userId = this.currentUser?._id;
      if (!userId) {
        throw new Error('Utilisateur non identifié');
      }

      // Forcer l'appel API même sans fichiers pour tester
      const formData = {
        businessName: this.profileForm.value.businessName,
        businessAddress: this.profileForm.value.businessAddress,
        businessDescription: this.profileForm.value.businessDescription || '',
        verificationType: this.profileForm.value.verificationType,
        verificationNumber: this.profileForm.value.verificationNumber,
        verificationDocumentUrl: this.uploadedFiles['verification'] || 'https://example.com/test.pdf',
        professionalCardUrl: this.uploadedFiles['professional-card'] || '',
        businessLicenseUrl: this.uploadedFiles['business-license'] || '',
        businessLogoUrl: this.uploadedFiles['business-logo'] || ''
      };

      console.log('📤 Envoi des données de profil vers API:', formData);
      console.log('🎯 URL API:', `${environment.apiUrl}/agents/${userId}/complete-profile`);

      const response = await this.http.post(
        `${environment.apiUrl}/agents/${userId}/complete-profile`,
        formData
      ).toPromise();

      console.log('✅ Réponse API profil complété:', response);
      this.router.navigate(['/app/agent/pending-approval']);
    } catch (error) {
      console.error('❌ Erreur lors de la complétion du profil:', error);
      if (error.error) {
        console.error('❌ Détails de l\'erreur:', error.error);
      }
    } finally {
      this.isSubmitting = false;
    }
  }
}