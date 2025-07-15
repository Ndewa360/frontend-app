import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Services
import { ToastrService } from 'ngx-toastr';

// Store
import { UserProfileAction, UserProfileState } from '../../../../../shared/store';

@Component({
  selector: 'app-mobile-register-page',
  templateUrl: './mobile-register-page.component.html',
  styleUrls: ['./mobile-register-page.component.scss']
})
export class MobileRegisterPageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  registerForm!: FormGroup;
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialiser le formulaire
   */
  private initializeForm(): void {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]+$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  /**
   * Validateur pour vérifier que les mots de passe correspondent
   */
  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  /**
   * Configuration des souscriptions du formulaire
   */
  private setupFormSubscriptions(): void {
    // Écouter les changements d'état de l'authentification
    this.store.select(UserProfileState.selectStateLoading)
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
      });

    // Écouter les erreurs
    this.store.select(UserProfileState.selectStateLastError)
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        if (error) {
          this.toastr.error(error);
        }
      });
  }

  /**
   * Soumettre le formulaire d'inscription
   */
  async onSubmit(): Promise<void> {
    if (this.registerForm.valid && !this.isLoading) {
      const formData = this.registerForm.value;
      
      try {
        // Dispatcher l'action d'inscription
        this.store.dispatch(new UserProfileAction.SignupSimpleUserProfile(
          formData.email,
          formData.password,
          `${formData.firstName} ${formData.lastName}`,
          formData.phoneNumber
        ));

        // Rediriger vers la page de connexion
        this.router.navigate(['/mobile/auth/login']);
        this.toastr.success('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');

      } catch (error) {
        this.toastr.error('Erreur lors de la création du compte');
        console.error('Erreur inscription:', error);
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  /**
   * Marquer tous les champs comme touchés pour afficher les erreurs
   */
  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Basculer la visibilité du mot de passe
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Basculer la visibilité de la confirmation du mot de passe
   */
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  /**
   * Obtenir le message d'erreur pour un champ
   */
  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${this.getFieldLabel(fieldName)} est requis`;
      if (field.errors['email']) return 'Email invalide';
      if (field.errors['minlength']) return `${this.getFieldLabel(fieldName)} trop court`;
      if (field.errors['pattern']) return `${this.getFieldLabel(fieldName)} invalide`;
      if (field.errors['passwordMismatch']) return 'Les mots de passe ne correspondent pas';
    }
    
    return '';
  }

  /**
   * Obtenir le label d'un champ
   */
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      firstName: 'Prénom',
      lastName: 'Nom',
      email: 'Email',
      phoneNumber: 'Téléphone',
      password: 'Mot de passe',
      confirmPassword: 'Confirmation du mot de passe'
    };
    
    return labels[fieldName] || fieldName;
  }

  /**
   * Vérifier si un champ a une erreur
   */
  hasFieldError(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  /**
   * Naviguer vers la page de connexion
   */
  goToLogin(): void {
    this.router.navigate(['/mobile/auth/login']);
  }

  /**
   * Inscription avec Google
   */
  async registerWithGoogle(): Promise<void> {
    try {
      this.toastr.info('Inscription Google sera disponible prochainement');
      console.log('Inscription Google - à implémenter');

    } catch (error) {
      this.toastr.error('Erreur lors de l\'inscription Google');
      console.error('Erreur inscription Google:', error);
    }
  }

  /**
   * Inscription avec Facebook
   */
  async registerWithFacebook(): Promise<void> {
    try {
      this.toastr.info('Inscription Facebook sera disponible prochainement');
      console.log('Inscription Facebook - à implémenter');

    } catch (error) {
      this.toastr.error('Erreur lors de l\'inscription Facebook');
      console.error('Erreur inscription Facebook:', error);
    }
  }
}
