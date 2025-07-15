import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Platform } from '@ionic/angular';

// Store
import { UserProfileAction, UserProfileState } from '../../../../../shared/store';
import { MobileNotificationService } from '../../../../shared/services/mobile-notification.service';
import { MobileSyncService } from '../../../../shared/services/mobile-sync.service';

@Component({
  selector: 'app-mobile-login-page',
  templateUrl: './mobile-login-page.component.html',
  styleUrls: ['./mobile-login-page.component.scss']
})
export class MobileLoginPageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  loginForm: FormGroup;
  isLoading = false;
  showPassword = false;
  rememberMe = false;

  // Observables du store
  userProfile$ = this.store.select(UserProfileState.selectStateUserProfile);
  authLoading$ = this.store.select(UserProfileState.selectStateLoading);

  constructor(
    private formBuilder: FormBuilder,
    private store: Store,
    private router: Router,
    private platform: Platform,
    private notificationService: MobileNotificationService,
    private syncService: MobileSyncService
  ) {
    this.loginForm = this.createLoginForm();
  }

  ngOnInit(): void {
    this.setupAuthSubscriptions();
    this.loadSavedCredentials();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Créer le formulaire de connexion
   */
  private createLoginForm(): FormGroup {
    return this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  /**
   * Configurer les abonnements d'authentification
   */
  private setupAuthSubscriptions(): void {
    // Écouter l'état d'authentification
    this.userProfile$
      .pipe(takeUntil(this.destroy$))
      .subscribe(userProfile => {
        if (userProfile && userProfile._id) {
          this.onLoginSuccess();
        }
      });

    // Écouter l'état de chargement
    this.authLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
      });
  }

  /**
   * Charger les identifiants sauvegardés
   */
  private async loadSavedCredentials(): Promise<void> {
    if (this.rememberMe) {
      // Charger depuis le stockage local si "Se souvenir de moi" était activé
      const savedEmail = localStorage.getItem('ndiye_saved_email');
      if (savedEmail) {
        this.loginForm.patchValue({ email: savedEmail });
        this.rememberMe = true;
      }
    }
  }

  /**
   * Connexion
   */
  async onLogin(): Promise<void> {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    const { email, password } = this.loginForm.value;

    try {
      await this.notificationService.showLoading('Connexion en cours...');

      // Dispatcher l'action de connexion
      this.store.dispatch(new UserProfileAction.LoginUserProfile(email, password));

      // Sauvegarder l'email si "Se souvenir de moi" est activé
      if (this.rememberMe) {
        localStorage.setItem('ndiye_saved_email', email);
      } else {
        localStorage.removeItem('ndiye_saved_email');
      }

    } catch (error) {
      await this.notificationService.hideLoading();
      await this.notificationService.showError('Erreur lors de la connexion');
      console.error('Erreur de connexion:', error);
    }
  }

  /**
   * Succès de la connexion
   */
  private async onLoginSuccess(): Promise<void> {
    await this.notificationService.hideLoading();
    await this.notificationService.showSuccess('Connexion réussie !');

    // Démarrer la synchronisation
    this.syncService.startAutoSync();

    // Rediriger vers la page d'accueil mobile
    this.router.navigate(['/mobile/search']);
  }

  /**
   * Aller à la page d'inscription
   */
  goToRegister(): void {
    this.router.navigate(['/mobile/auth/register']);
  }

  /**
   * Aller à la page de mot de passe oublié
   */
  goToForgotPassword(): void {
    this.router.navigate(['/mobile/auth/forgot-password']);
  }

  /**
   * Basculer la visibilité du mot de passe
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Basculer "Se souvenir de moi"
   */
  toggleRememberMe(): void {
    this.rememberMe = !this.rememberMe;
  }

  /**
   * Connexion avec Google
   */
  async loginWithGoogle(): Promise<void> {
    try {
      await this.notificationService.showLoading('Connexion avec Google...');
      
      // Dispatcher l'action de connexion Google
      // TODO: Implémenter l'action LoginWithGoogle
      // this.store.dispatch(new UserProfileAction.LoginWithGoogle());
      console.log('Connexion Google - à implémenter');
      
    } catch (error) {
      await this.notificationService.hideLoading();
      await this.notificationService.showError('Erreur lors de la connexion Google');
      console.error('Erreur connexion Google:', error);
    }
  }

  /**
   * Connexion avec Facebook
   */
  async loginWithFacebook(): Promise<void> {
    try {
      await this.notificationService.showLoading('Connexion avec Facebook...');
      
      // Dispatcher l'action de connexion Facebook
      // TODO: Implémenter l'action LoginWithFacebook
      // this.store.dispatch(new UserProfileAction.LoginWithFacebook());
      console.log('Connexion Facebook - à implémenter');
      
    } catch (error) {
      await this.notificationService.hideLoading();
      await this.notificationService.showError('Erreur lors de la connexion Facebook');
      console.error('Erreur connexion Facebook:', error);
    }
  }

  /**
   * Continuer sans connexion (mode invité)
   */
  continueAsGuest(): void {
    this.router.navigate(['/mobile/search']);
  }

  /**
   * Marquer tous les champs comme touchés pour afficher les erreurs
   */
  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Vérifier si un champ a une erreur
   */
  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.loginForm.get(fieldName);
    if (!field) return false;

    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }

    return field.invalid && (field.dirty || field.touched);
  }

  /**
   * Obtenir le message d'erreur pour un champ
   */
  getErrorMessage(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.hasError('required')) {
      return `${fieldName === 'email' ? 'L\'email' : 'Le mot de passe'} est requis`;
    }

    if (field.hasError('email')) {
      return 'Format d\'email invalide';
    }

    if (field.hasError('minlength')) {
      return 'Le mot de passe doit contenir au moins 6 caractères';
    }

    return 'Champ invalide';
  }
}
