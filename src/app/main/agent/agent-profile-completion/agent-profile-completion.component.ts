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
    
    if (this.currentUser?.businessName) {
      this.profileForm.patchValue({
        businessName: this.currentUser.businessName
      });
    } else {
      // Si pas de données, essayer de les charger et réessayer
      this.store.dispatch(new UserProfileAction.FetchUserProfile());
      
      // S'abonner aux changements du profil utilisateur
      this.store.select(UserProfileState.selectStateUserProfile).subscribe(user => {
        if (user?.businessName && !this.profileForm.get('businessName')?.value) {
          this.profileForm.patchValue({
            businessName: user.businessName
          });
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
          
          // Vérifier la structure de la réponse
          const fileUrl = response.data?.fileUrl || response.data?.generatedUrl || response.data;
          this.uploadedFiles[documentType] = fileUrl;
          
          resolve(fileUrl);
        } else {
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
    this.onSubmit();
  }

  async onSubmit(): Promise<void> {
    // Vérifier les champs obligatoires manuellement
    const requiredFields = ['businessName', 'businessAddress', 'verificationNumber'];
    const missingFields = requiredFields.filter(field => !this.profileForm.get(field)?.value);
    
    if (missingFields.length > 0) {
      this.profileForm.markAllAsTouched();
      return;
    }
    
    // Vérifier qu'au moins le document de vérification est sélectionné
    if (!this.selectedFiles['verification']) {
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
        const uploadResults = await Promise.all(uploadPromises);
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

      const response = await this.http.post(
        `${environment.apiUrl}/agents/${userId}/complete-profile`,
        formData
      ).toPromise();

      this.router.navigate(['/app/agent/pending-approval']);
    } catch (error) {
    } finally {
      this.isSubmitting = false;
    }
  }
}