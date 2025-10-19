import {Component, OnInit, OnDestroy, ViewEncapsulation} from '@angular/core'
import {
  UntypedFormGroup,
  UntypedFormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators
} from "@angular/forms"
import {ActivatedRoute, ActivatedRouteSnapshot, Router} from '@angular/router'
import { Actions, ofActionCompleted, ofActionErrored, ofActionSuccessful, Store } from '@ngxs/store'
import { UserProfileAction, UserProfileState } from 'src/app/shared/store'
import { Subscription } from 'rxjs'
import { ToastrService } from 'ngx-toastr'
import { HttpClient } from '@angular/common/http'
import { environment } from 'src/environments/environment'
import { LanguageUrlService } from 'src/app/shared/services/language-url.service'
import { TranslateService } from '@ngx-translate/core'

@Component({
  selector: 'app-auth-login',
  templateUrl: './auth-login.component.html',
  styleUrls: ['./auth-login.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AuthLoginComponent implements OnInit, OnDestroy {

  public formGroup: UntypedFormGroup
  waittingResponse = false;
  showPassword = false;
  private subscriptions: Subscription[] = [];

  constructor(
    protected formBuilder: UntypedFormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private _store: Store,
    private _ngxsAction: Actions,
    private _toastrService: ToastrService,
    private http: HttpClient,
    private languageUrlService: LanguageUrlService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });

    // S'abonner aux actions réussies
    const successSub = this._ngxsAction.pipe(
      ofActionSuccessful(UserProfileAction.LoginUserProfile)
    ).subscribe((value) => {
      // Récupérer les paramètres de requête
      const returnUrl = this.route.snapshot.queryParams['returnUrl'];
      const reason = this.route.snapshot.queryParams['reason'];

      // Message spécifique selon la raison de la reconnexion
      if (reason === 'inactive') {
        this._toastrService.success(
          '✅ Reconnexion réussie ! Vous reprenez votre session là où vous l\'aviez laissée.',
          'Ndewa360° - Session restaurée',
          { timeOut: 6000, extendedTimeOut: 2000 }
        );
      } else if (reason === 'critical_inactive') {
        this._toastrService.success(
          '🔒 Reconnexion sécurisée réussie ! Vos données sont protégées.',
          'Ndewa360° - Sécurité',
          { timeOut: 6000, extendedTimeOut: 2000 }
        );
      } else if (reason === 'token_expired') {
        this._toastrService.success(
          '🔑 Session renouvelée avec succès ! Vous pouvez continuer.',
          'Ndewa360° - Authentification',
          { timeOut: 5000, extendedTimeOut: 2000 }
        );
      } else {
        this._toastrService.success(
          this.translate.instant('NOTIFICATIONS.WELCOME_LOGIN'),
          'Ndewa360°',
          { timeOut: 4000, extendedTimeOut: 1000 }
        );
      }

      // Redirection après connexion réussie
      if (returnUrl) {
        // Sécuriser la redirection pour éviter les attaques de redirection
        const decodedUrl = decodeURIComponent(returnUrl);
        if (this.isValidReturnUrl(decodedUrl)) {
          window.location.href = decodedUrl;
        } else {
          console.warn('URL de retour non sécurisée détectée:', decodedUrl);
          this.redirectBasedOnUserType();
        }
      } else {
        // Redirection intelligente selon le type d'utilisateur
        this.redirectBasedOnUserType();
      }
    });
    this.subscriptions.push(successSub);

    // S'abonner aux actions complétées (succès ou échec)
    const completedSub = this._ngxsAction.pipe(
      ofActionCompleted(UserProfileAction.LoginUserProfile)
    ).subscribe((value) => {
      this.waittingResponse = false;
      
      // Vérifier si c'est une erreur 406 (compte inactif)
      if (value?.result?.error?.['status'] == 406) {
        const currentLang = this.languageUrlService.getCurrentLanguage();
        this.router.navigate([`/${currentLang}/auth/confirmation`, this.formGroup.value.email]);
      }
    });
    this.subscriptions.push(completedSub);

    // S'abonner aux erreurs
    const errorSub = this._ngxsAction.pipe(
      ofActionErrored(UserProfileAction.LoginUserProfile)
    ).subscribe((value) => {
      this.waittingResponse = false;
      
      // Afficher un message d'erreur générique si aucun message spécifique n'est fourni
      // if (!value?.error?.message) {
      //   this._toastrService.error("Échec de la connexion. Veuillez vérifier vos identifiants.", "Ndewa360°");
      // }
    });
    this.subscriptions.push(errorSub);
  }

  ngOnDestroy(): void {
    // Se désabonner de tous les observables pour éviter les fuites de mémoire
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onSubmit() {
    // Ne soumettre que si le formulaire est valide
    if (this.formGroup.valid) {
      this.formGroup.markAllAsTouched();
      this.waittingResponse = true;
      
      // Trim des valeurs pour éviter les espaces
      const email = this.formGroup.value.email.trim();
      const password = this.formGroup.value.password;
      
      this._store.dispatch(new UserProfileAction.LoginUserProfile(email, password));
    } else {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      this.formGroup.markAllAsTouched();
      this._toastrService.warning(this.translate.instant('VALIDATION.REQUIRED'), "Ndewa360°");
    }
  }

  isValid(name) {
    const instance = this.formGroup.get(name);
    return instance.invalid && (instance.dirty || instance.touched);
  }

  goToSearchPage() {
    const currentLang = this.languageUrlService.getCurrentLanguage();
    this.router.navigateByUrl(`/${currentLang}/search/index?minPrice=0&maxPrix=100000&ville=Bangangté`);
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  private async redirectBasedOnUserType(): Promise<void> {
    try {
      // Attendre que le profil utilisateur soit chargé
      const user = this._store.selectSnapshot(UserProfileState.selectStateUserProfile);
      
      if (!user) {
        // Attendre un peu plus si l'utilisateur n'est pas encore chargé
        setTimeout(() => {
          const retryUser = this._store.selectSnapshot(UserProfileState.selectStateUserProfile);
          if (retryUser) {
            this.performRedirection(retryUser);
          } else {
            const currentLang = this.languageUrlService.getCurrentLanguage();
            window.location.href = `/${currentLang}/app/welcome`;
          }
        }, 1000);
        return;
      }

      this.performRedirection(user);
    } catch (error) {
      console.error('Erreur lors de la redirection:', error);
      const currentLang = this.languageUrlService.getCurrentLanguage();
      window.location.href = `/${currentLang}/app/welcome`;
    }
  }

  private async performRedirection(user: any): Promise<void> {
    // Vérifier si c'est un admin
    if (this.isAdmin(user)) {
      // Attendre plus longtemps pour que le profil soit bien chargé
      setTimeout(() => {
        const currentLang = this.languageUrlService.getCurrentLanguage();
        window.location.href = `/${currentLang}/app/properties/home`;
      }, 1500);
      return;
    }

    // Vérifier si c'est un agent
    if (user.userType === 'AGENT') {
      await this.redirectAgent(user);
      return;
    }

    // Utilisateur normal
    setTimeout(() => {
      const currentLang = this.languageUrlService.getCurrentLanguage();
      window.location.href = `/${currentLang}/app/properties/home`;
    }, 500);
  }

  private async redirectAgent(user: any): Promise<void> {
    try {
      const response: any = await this.http.get(`${environment.apiUrl}/agents/${user._id}`).toPromise();
      
      if (!response) {
        setTimeout(() => {
          const currentLang = this.languageUrlService.getCurrentLanguage();
          window.location.href = `/${currentLang}/app/agent/complete-profile`;
        }, 500);
        return;
      }
      
      const agentProfile = response.data || response;

      const currentLang = this.languageUrlService.getCurrentLanguage();
      if (!agentProfile || !agentProfile.isProfileCompleted) {
        setTimeout(() => window.location.href = `/${currentLang}/app/agent/complete-profile`, 500);
      } else if (agentProfile.status === 'PENDING' || agentProfile.status === 'ADMIN_REVIEW') {
        setTimeout(() => window.location.href = `/${currentLang}/app/agent/pending-approval`, 500);
      } else if (agentProfile.status === 'REJECTED') {
        setTimeout(() => window.location.href = `/${currentLang}/app/agent/pending-approval`, 500);
      } else if (agentProfile.status === 'APPROVED') {
        setTimeout(() => window.location.href = `/${currentLang}/app/properties/home`, 500);
      } else {
        setTimeout(() => window.location.href = `/${currentLang}/app/agent/complete-profile`, 500);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du profil agent:', error);
      setTimeout(() => {
        const currentLang = this.languageUrlService.getCurrentLanguage();
        window.location.href = `/${currentLang}/app/agent/complete-profile`;
      }, 500);
    }
  }

  private isAdmin(user: any): boolean {
    if (!user.roles || !Array.isArray(user.roles)) {
      return false;
    }

    return user.roles.some((role: any) => {
      const roleName = typeof role === 'string' ? role : role.name;
      return roleName === 'super-admin' || roleName === 'admin';
    });
  }

  /**
   * Vérifie si l'URL de retour est sécurisée (même domaine)
   */
  private isValidReturnUrl(url: string): boolean {
    try {
      // Vérifier si c'est une URL relative
      if (url.startsWith('/')) {
        return true;
      }
      
      // Vérifier si c'est une URL absolue du même domaine
      const urlObj = new URL(url);
      const currentOrigin = window.location.origin;
      
      return urlObj.origin === currentOrigin;
    } catch (error) {
      // En cas d'erreur de parsing, considérer comme non sécurisé
      console.warn('Erreur lors de la validation de l\'URL de retour:', error);
      return false;
    }
  }
}
