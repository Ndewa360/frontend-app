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
  selector: 'app-mobile-forgot-password-page',
  templateUrl: './mobile-forgot-password-page.component.html',
  styleUrls: ['./mobile-forgot-password-page.component.scss']
})
export class MobileForgotPasswordPageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  forgotPasswordForm!: FormGroup;
  isLoading = false;
  emailSent = false;

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
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  /**
   * Configuration des souscriptions du formulaire
   */
  private setupFormSubscriptions(): void {
    // Écouter les changements d'état
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
   * Soumettre le formulaire de récupération
   */
  async onSubmit(): Promise<void> {
    if (this.forgotPasswordForm.valid && !this.isLoading) {
      const email = this.forgotPasswordForm.value.email;
      
      try {
        // Dispatcher l'action de récupération de mot de passe
        this.store.dispatch(new UserProfileAction.ForgotPasswordUserProfile(email));

        // Marquer l'email comme envoyé
        this.emailSent = true;

        this.toastr.success('Email de récupération envoyé !');

      } catch (error) {
        this.toastr.error('Erreur lors de l\'envoi de l\'email');
        console.error('Erreur récupération mot de passe:', error);
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  /**
   * Marquer tous les champs comme touchés
   */
  private markFormGroupTouched(): void {
    Object.keys(this.forgotPasswordForm.controls).forEach(key => {
      const control = this.forgotPasswordForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Obtenir le message d'erreur pour l'email
   */
  getEmailError(): string {
    const emailField = this.forgotPasswordForm.get('email');
    
    if (emailField?.errors && emailField.touched) {
      if (emailField.errors['required']) return 'Email requis';
      if (emailField.errors['email']) return 'Email invalide';
    }
    
    return '';
  }

  /**
   * Vérifier si l'email a une erreur
   */
  hasEmailError(): boolean {
    const emailField = this.forgotPasswordForm.get('email');
    return !!(emailField?.errors && emailField.touched);
  }

  /**
   * Renvoyer l'email
   */
  async resendEmail(): Promise<void> {
    if (this.forgotPasswordForm.valid) {
      this.emailSent = false;
      await this.onSubmit();
    }
  }

  /**
   * Retourner à la page de connexion
   */
  goToLogin(): void {
    this.router.navigate(['/mobile/auth/login']);
  }

  /**
   * Aller à la page d'inscription
   */
  goToRegister(): void {
    this.router.navigate(['/mobile/auth/register']);
  }
}
