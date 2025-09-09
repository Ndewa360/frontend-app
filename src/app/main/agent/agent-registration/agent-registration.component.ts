import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AgentService } from '../../../shared/services/agent.service';
import { CreateAgentRequest, AgentVerificationType } from '../../../shared/models/agent.model';

@Component({
  selector: 'app-agent-registration',
  templateUrl: './agent-registration.component.html',
  styleUrls: ['./agent-registration.component.scss']
})
export class AgentRegistrationComponent implements OnInit {
  registrationForm: FormGroup;
  currentStep = 1;
  totalSteps = 4;
  loading = false;
  selectedFile: File | null = null;

  // Options pour les selects
  verificationTypes = [
    { value: AgentVerificationType.CNI, label: 'Carte Nationale d\'Identité (CNI)' },
    { value: AgentVerificationType.PASSPORT, label: 'Passeport' },
    { value: AgentVerificationType.DRIVING_LICENSE, label: 'Permis de Conduire' },
    { value: AgentVerificationType.PROFESSIONAL_CARD, label: 'Carte Professionnelle' }
  ];

  specializationOptions = [
    'Résidentiel',
    'Commercial',
    'Industriel',
    'Terrain',
    'Location saisonnière',
    'Investissement',
    'Luxe'
  ];

  zoneOptions = [
    'Douala - Akwa',
    'Douala - Bonanjo',
    'Douala - Bonapriso',
    'Douala - Deido',
    'Douala - Makepe',
    'Douala - Logbaba',
    'Yaoundé - Centre-ville',
    'Yaoundé - Bastos',
    'Yaoundé - Melen',
    'Yaoundé - Emana',
    'Yaoundé - Essos'
  ];

  constructor(
    private fb: FormBuilder,
    private agentService: AgentService,
    private router: Router
  ) {
    this.createForm();
  }

  ngOnInit(): void {}

  createForm(): void {
    this.registrationForm = this.fb.group({
      // Étape 1: Informations personnelles
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],

      // Étape 2: Informations professionnelles
      businessName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      professionalPhone: ['', [Validators.required]],
      professionalEmail: ['', [Validators.email]],
      businessAddress: [''],
      businessDescription: ['', [Validators.maxLength(500)]],

      // Étape 3: Vérification d'identité
      verificationType: ['', [Validators.required]],
      verificationNumber: ['', [Validators.required]],

      // Étape 4: Spécialisations et zones
      commissionRate: ['5%'],
      specializations: [[]],
      operatingZones: [[]],

      // Conditions
      acceptTerms: [false, [Validators.requiredTrue]],
      acceptPrivacy: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  // Navigation entre les étapes
  nextStep(): void {
    if (this.isCurrentStepValid()) {
      this.currentStep++;
    } else {
      this.markCurrentStepAsTouched();
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number): void {
    if (step <= this.currentStep || this.isStepAccessible(step)) {
      this.currentStep = step;
    }
  }

  isCurrentStepValid(): boolean {
    const stepFields = this.getStepFields(this.currentStep);
    return stepFields.every(field => {
      const control = this.registrationForm.get(field);
      return control && control.valid;
    });
  }

  isStepAccessible(step: number): boolean {
    // Permet d'accéder aux étapes précédentes ou à l'étape suivante si l'actuelle est valide
    return step <= this.currentStep || (step === this.currentStep + 1 && this.isCurrentStepValid());
  }

  markCurrentStepAsTouched(): void {
    const stepFields = this.getStepFields(this.currentStep);
    stepFields.forEach(field => {
      const control = this.registrationForm.get(field);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  getStepFields(step: number): string[] {
    switch (step) {
      case 1:
        return ['name', 'email', 'password', 'confirmPassword'];
      case 2:
        return ['businessName', 'professionalPhone'];
      case 3:
        return ['verificationType', 'verificationNumber'];
      case 4:
        return ['acceptTerms', 'acceptPrivacy'];
      default:
        return [];
    }
  }

  // Gestion des fichiers
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validation du fichier
      if (this.validateFile(file)) {
        this.selectedFile = file;
      } else {
        console.error('Fichier invalide: Veuillez sélectionner un fichier image (JPG, PNG) de moins de 5MB');
      }
    }
  }

  validateFile(file: File): boolean {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    return allowedTypes.includes(file.type) && file.size <= maxSize;
  }

  // Gestion des spécialisations et zones
  onSpecializationChange(specialization: string, event: any): void {
    const checked = event.target.checked;
    const current = this.registrationForm.get('specializations')?.value || [];
    if (checked) {
      this.registrationForm.patchValue({
        specializations: [...current, specialization]
      });
    } else {
      this.registrationForm.patchValue({
        specializations: current.filter((s: string) => s !== specialization)
      });
    }
  }

  onZoneChange(zone: string, event: any): void {
    const checked = event.target.checked;
    const current = this.registrationForm.get('operatingZones')?.value || [];
    if (checked) {
      this.registrationForm.patchValue({
        operatingZones: [...current, zone]
      });
    } else {
      this.registrationForm.patchValue({
        operatingZones: current.filter((z: string) => z !== zone)
      });
    }
  }

  // Soumission du formulaire
  onSubmit(): void {
    if (this.registrationForm.valid && this.selectedFile) {
      this.loading = true;

      const formData: CreateAgentRequest = {
        name: this.registrationForm.value.name,
        email: this.registrationForm.value.email,
        password: this.registrationForm.value.password,
        businessName: this.registrationForm.value.businessName,
        professionalPhone: this.registrationForm.value.professionalPhone,
        professionalEmail: this.registrationForm.value.professionalEmail,
        businessAddress: this.registrationForm.value.businessAddress,
        businessDescription: this.registrationForm.value.businessDescription,
        verificationType: this.registrationForm.value.verificationType,
        verificationNumber: this.registrationForm.value.verificationNumber,
        commissionRate: this.registrationForm.value.commissionRate,
        specializations: this.registrationForm.value.specializations,
        operatingZones: this.registrationForm.value.operatingZones
      };

      this.agentService.registerAgent(formData, this.selectedFile).subscribe({
        next: (response) => {
          this.loading = false;
          console.log('Inscription réussie:', response);
          this.router.navigate(['/auth/login']);
        },
        error: (error) => {
          this.loading = false;
          console.error('Erreur d\'inscription:', error);
        }
      });
    } else {
      this.markCurrentStepAsTouched();
      if (!this.selectedFile) {
        console.error('Document manquant: Veuillez sélectionner votre document d\'identité');
      }
    }
  }

  // Helpers pour le template
  getFieldError(fieldName: string): string | null {
    const field = this.registrationForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) return 'Ce champ est obligatoire';
      if (field.errors['email']) return 'Email invalide';
      if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
      if (field.errors['maxlength']) return `Maximum ${field.errors['maxlength'].requiredLength} caractères`;
      if (field.errors['passwordMismatch']) return 'Les mots de passe ne correspondent pas';
    }
    return null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registrationForm.get(fieldName);
    return !!(field && field.errors && field.touched);
  }
}